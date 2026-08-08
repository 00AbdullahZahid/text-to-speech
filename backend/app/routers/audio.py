"""Audio history endpoints: GET /audio, /audio/{filename}, /output.

Preserves the original DB-first behavior with filesystem metadata as a
fallback when PostgreSQL is unavailable or a row is missing.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.repositories import audio_repository
from file_manager import list_audio_metadata
from logger import logger

router = APIRouter(tags=["audio"])


@router.get("/audio")
def list_audio_generations() -> dict:
    # Prefer PostgreSQL when available.
    generations = audio_repository.list_generations()

    if generations is not None:
        return {"files": generations}

    # Fallback to the existing filesystem metadata system.
    logger.warning(
        "Using filesystem metadata fallback for /audio."
    )
    return {"files": list_audio_metadata()}


@router.get("/audio/{filename}")
def get_audio_generation(filename: str) -> dict:
    """Return metadata for one generation by filename."""

    # Prefer PostgreSQL when available.
    generation = audio_repository.get_generation(filename)

    if generation is not None:
        return generation

    # Fallback to the existing filesystem metadata system.
    for item in list_audio_metadata():
        if item.get("filename") == filename:
            return item

    raise HTTPException(
        status_code=404,
        detail="Generation not found",
    )


@router.get("/output")
def output_alias() -> dict:
    return list_audio_generations()
