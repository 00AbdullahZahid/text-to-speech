"""TTS endpoints: POST /generate, POST /generate/batch, jobs, and subtitles.

Generation runs in the background (see services/jobs.py) so long scripts and
batches never hit the ~100s edge-proxy timeout. The core synthesis lives in
:func:`_run_generation` so single and batch requests share one code path.
"""
from __future__ import annotations

import os
import uuid

from fastapi import APIRouter, HTTPException, Response

from app.dependencies import UserId
from app.repositories import audio_repository
from config import (
    MAX_BATCH_ITEMS,
    OUTPUTS_DIR,
    SUBTITLE_EXT,
    VOICE_DISPLAY,
)
from logger import logger
from models import BatchGenerateRequest, GenerateRequest
from services import jobs
from services.tts import build_srt, generate_speech, save_audio
from storage import supabase_storage
from validators import validate_format, validate_generation_params, validate_text_length

router = APIRouter(tags=["tts"])


def _run_generation(
    *,
    text: str,
    voice_id: str,
    speed: float,
    fmt: str,
    user_id: str,
) -> dict:
    validate_format(fmt)

    audio, segments = generate_speech(text, voice_id, speed)

    ext = f".{fmt}"
    filename = f"audio_{uuid.uuid4()}{ext}"
    filepath = os.path.join(OUTPUTS_DIR, filename)

    save_audio(audio, filepath, fmt=fmt)

    file_size = os.path.getsize(filepath)

    voice_name = VOICE_DISPLAY.get(voice_id, voice_id)

    # Word-timestamp subtitle file (best-effort).
    srt_name = f"{os.path.splitext(filename)[0]}{SUBTITLE_EXT}"
    if segments:
        try:
            with open(os.path.join(OUTPUTS_DIR, srt_name), "w", encoding="utf-8") as fh:
                fh.write(build_srt(segments))
        except OSError as exc:
            logger.error("Failed to write subtitle file %s: %s", srt_name, exc)

    storage_path = filename
    if not supabase_storage.upload_audio(storage_path, filepath):
        storage_path = None

    inserted = audio_repository.insert_generation(
        filename=filename,
        voice_id=voice_id,
        voice_name=voice_name,
        speed=speed,
        text=text,
        size_bytes=file_size,
        storage_path=storage_path,
        user_id=user_id,
        audio_format=fmt,
        has_subtitles=len(segments) > 0,
    )

    if not inserted:
        logger.warning(
            "Database unavailable; generation %s was not saved to PostgreSQL.",
            filename,
        )

    return {
        "filename": filename,
        "format": fmt,
        "hasSubtitles": len(segments) > 0,
    }


@router.post("/generate")
def generate(request: GenerateRequest, user_id: UserId) -> dict:
    try:
        validate_generation_params(request.voiceId, request.speed, request.format)
        validate_text_length(request.text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    payload = {
        "text": request.text,
        "voiceId": request.voiceId,
        "speed": request.speed,
        "format": request.format,
    }
    job_id = jobs.create_job(
        user_id=user_id,
        kind="single",
        text=request.text,
        payload=payload,
    )
    jobs.run(
        job_id,
        lambda: _run_generation(
            text=payload["text"],
            voice_id=payload["voiceId"],
            speed=payload["speed"],
            fmt=payload["format"],
            user_id=user_id,
        ),
    )
    return {"jobId": job_id}


@router.post("/generate/batch")
def generate_batch(request: BatchGenerateRequest, user_id: UserId) -> dict:
    items = request.items
    if not items:
        raise HTTPException(status_code=400, detail="No items provided")

    if len(items) > MAX_BATCH_ITEMS:
        raise HTTPException(
            status_code=400,
            detail=f"Too many items. Maximum is {MAX_BATCH_ITEMS}.",
        )

    payload = {
        "items": [
            {
                "text": item.text,
                "voiceId": item.voiceId,
                "speed": item.speed,
                "format": item.format,
            }
            for item in items
        ]
    }
    job_id = jobs.create_job(
        user_id=user_id,
        kind="batch",
        text=None,
        payload=payload,
    )

    def _run_batch() -> dict:
        results = []
        for index, item in enumerate(payload["items"]):
            try:
                validate_generation_params(
                    item["voiceId"], item["speed"], item["format"]
                )
                validate_text_length(item["text"])
            except ValueError as exc:
                results.append(
                    {
                        "index": index,
                        "filename": "",
                        "format": item["format"],
                        "success": False,
                        "error": str(exc),
                    }
                )
                continue
            try:
                result = _run_generation(
                    text=item["text"],
                    voice_id=item["voiceId"],
                    speed=item["speed"],
                    fmt=item["format"],
                    user_id=user_id,
                )
                results.append(
                    {
                        "index": index,
                        **result,
                        "success": True,
                        "error": "",
                    }
                )
            except (ValueError, OSError) as exc:
                logger.error("Batch item %s failed: %s", index, exc)
                results.append(
                    {
                        "index": index,
                        "filename": "",
                        "format": item["format"],
                        "success": False,
                        "error": str(exc),
                    }
                )
        return {"results": results, "total": len(results)}

    jobs.run(job_id, _run_batch)
    return {"jobId": job_id}


@router.get("/jobs")
def list_jobs(user_id: UserId) -> dict:
    return {"jobs": jobs.list_jobs(user_id)}


@router.get("/jobs/{job_id}")
def get_job(job_id: str, user_id: UserId) -> dict:
    job = jobs.get_job(job_id, user_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/generate/{filename}/subtitles")
def get_subtitles(filename: str, user_id: UserId) -> Response:
    """Return the word-timestamp SRT for a generation owned by the user."""
    base, _ = os.path.splitext(filename)
    srt_name = f"{base}{SUBTITLE_EXT}"
    srt_path = os.path.join(OUTPUTS_DIR, srt_name)

    if not os.path.isfile(srt_path):
        raise HTTPException(status_code=404, detail="Subtitles not found")

    # The audio router enforces ownership; we mirror the check cheaply here
    # by verifying the matching audio generation exists for this user.
    generation = audio_repository.get_generation(filename, user_id=user_id)
    if generation is None:
        raise HTTPException(status_code=404, detail="Generation not found")

    try:
        with open(srt_path, "r", encoding="utf-8") as fh:
            content = fh.read()
    except OSError as exc:
        logger.error("Failed to read subtitle file %s: %s", srt_path, exc)
        raise HTTPException(status_code=500, detail="Failed to read subtitles") from exc

    return Response(
        content=content,
        media_type="application/x-subrip",
        headers={"Content-Disposition": f'attachment; filename="{srt_name}"'},
    )