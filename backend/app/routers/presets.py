"""Preset endpoints: GET/POST /presets, PATCH/DELETE /presets/{id}.

Saved voice presets let a user store a (voice, speed, format) combination
under a friendly name and re-apply it with one click. Endpoints are
user-scoped via the JWT ``sub`` claim.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.dependencies import UserId
from app.repositories import audio_repository
from config import (
    MAX_PRESETS_PER_USER,
    MIN_SPEED,
    MAX_SPEED,
    VALID_VOICE_IDS,
)
from logger import logger
from models import PresetCreate, PresetUpdate
from validators import validate_format

router = APIRouter(tags=["presets"])


@router.get("/presets")
def list_presets(user_id: UserId) -> dict:
    presets = audio_repository.list_presets(user_id=user_id)
    if presets is None:
        return {"presets": [], "total": 0}
    return {"presets": presets, "total": len(presets)}


@router.post("/presets")
def create_preset(request: PresetCreate, user_id: UserId) -> dict:
    _validate_preset_fields(request.voiceId, request.speed, request.format)

    count = audio_repository.count_presets(user_id=user_id)
    if count is not None and count >= MAX_PRESETS_PER_USER:
        raise HTTPException(
            status_code=400,
            detail=f"Preset limit of {MAX_PRESETS_PER_USER} reached.",
        )

    preset_id = audio_repository.insert_preset(
        user_id=user_id,
        name=request.name,
        voice_id=request.voiceId,
        speed=request.speed,
        audio_format=request.format,
    )

    if preset_id is None:
        raise HTTPException(
            status_code=503,
            detail="Preset storage is unavailable.",
        )

    return {
        "id": preset_id,
        "name": request.name,
        "voiceId": request.voiceId,
        "speed": request.speed,
        "format": request.format,
    }


@router.patch("/presets/{preset_id}")
def update_preset(preset_id: int, request: PresetUpdate, user_id: UserId) -> dict:
    existing = audio_repository.get_preset(preset_id, user_id=user_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    voice_id = request.voiceId if request.voiceId is not None else existing["voiceId"]
    speed = request.speed if request.speed is not None else existing["speed"]
    fmt = request.format if request.format is not None else existing["format"]
    _validate_preset_fields(voice_id, speed, fmt)

    ok = audio_repository.update_preset(
        preset_id,
        user_id=user_id,
        name=request.name,
        voice_id=request.voiceId,
        speed=request.speed,
        audio_format=request.format,
    )
    if not ok:
        raise HTTPException(
            status_code=503,
            detail="Failed to update preset.",
        )

    return {
        "id": preset_id,
        "name": request.name if request.name is not None else existing["name"],
        "voiceId": voice_id,
        "speed": speed,
        "format": fmt,
    }


@router.delete("/presets/{preset_id}")
def delete_preset(preset_id: int, user_id: UserId) -> dict:
    if audio_repository.get_preset(preset_id, user_id=user_id) is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    ok = audio_repository.delete_preset(preset_id, user_id=user_id)
    if not ok:
        logger.warning("Preset %s delete reported failure", preset_id)

    return {"deleted": True, "id": preset_id}


def _validate_preset_fields(voice_id: str, speed: float, fmt: str) -> None:
    if voice_id not in VALID_VOICE_IDS:
        raise HTTPException(status_code=400, detail="Invalid voiceId")
    if not (MIN_SPEED <= speed <= MAX_SPEED):
        raise HTTPException(status_code=400, detail="Speed out of range")
    try:
        validate_format(fmt)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
