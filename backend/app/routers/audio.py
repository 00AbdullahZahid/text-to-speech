"""Audio history endpoints: GET /audio, /audio/{filename}, /output, DELETE /audio/{filename}.

PostgreSQL is the single source of truth for generation metadata. Audio
files themselves are uploaded to Supabase Storage with a local copy kept in
outputs/ for now.  All endpoints are user-scoped — the JWT ``sub`` claim
is used to filter by ``user_id``.
"""
from __future__ import annotations

import os

from fastapi import APIRouter, HTTPException

from app.dependencies import UserId
from app.repositories import audio_repository
from config import OUTPUTS_DIR, STATIC_MOUNT_PATH
from logger import logger
from storage import supabase_storage

router = APIRouter(tags=["audio"])


def _with_audio_url(item: dict) -> dict:
    """Attach a playable URL to a generation.

    Prefers a signed Supabase Storage URL when a storage_path exists;
    otherwise falls back to the locally-mounted file URL.
    """
    storage_path = item.get("storage_path")
    if storage_path:
        url = supabase_storage.get_audio_url(storage_path)
        if url:
            item["audio_url"] = url
            return item
    item["audio_url"] = f"{STATIC_MOUNT_PATH}/{item['filename']}"
    return item


@router.get("/audio")
def list_audio_generations(user_id: UserId) -> dict:
    generations = audio_repository.list_generations(user_id=user_id)

    if generations is None:
        logger.warning(
            "Database unavailable; no generation metadata to return."
        )
        return {"files": [], "total": 0}

    total = audio_repository.count_generations(user_id=user_id)
    files = [_with_audio_url(item) for item in generations]
    return {
        "files": files,
        "total": total if total is not None else len(files),
    }


@router.get("/audio/{filename}")
def get_audio_generation(filename: str, user_id: UserId) -> dict:
    """Return metadata for one generation by filename (scoped to user)."""

    generation = audio_repository.get_generation(filename, user_id=user_id)

    if generation is not None:
        return _with_audio_url(generation)

    raise HTTPException(
        status_code=404,
        detail="Generation not found",
    )


@router.get("/output")
def output_alias(user_id: UserId) -> dict:
    return list_audio_generations(user_id)


@router.delete("/audio/{filename}")
def delete_audio_generation(filename: str, user_id: UserId) -> dict:
    """Permanently delete a generation's database row, cloud copy, and any
    local audio file. Only deletes if the row belongs to the requesting user.
    """

    filepath = os.path.join(OUTPUTS_DIR, filename)

    generation = audio_repository.get_generation(filename, user_id=user_id)

    if generation is None:
        raise HTTPException(
            status_code=404,
            detail="Generation not found",
        )

    storage_path = generation.get("storage_path")
    file_exists = os.path.isfile(filepath)

    # Remove the cloud copy first (best-effort).
    if storage_path:
        supabase_storage.delete_audio(storage_path)

    if file_exists:
        try:
            os.remove(filepath)
        except OSError as exc:
            logger.error("Failed to delete audio file %s: %s", filename, exc)
            raise HTTPException(
                status_code=500,
                detail="Failed to delete the audio file.",
            ) from exc

    deleted = audio_repository.delete_generation(filename, user_id=user_id)
    if not deleted:
        logger.warning(
            "Database unavailable; row for %s was not deleted from PostgreSQL.",
            filename,
        )

    return {
        "deleted": True,
        "filename": filename,
    }
