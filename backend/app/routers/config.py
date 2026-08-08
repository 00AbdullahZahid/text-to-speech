"""GET /config — exposes frontend-safe configuration."""
from __future__ import annotations

from fastapi import APIRouter

from config import (
    MAX_SPEED,
    MAX_TEXT_LENGTH,
    MIN_SPEED,
    MIN_TEXT_LENGTH,
    STATIC_MOUNT_PATH,
    VOICE_OPTIONS,
)

router = APIRouter(tags=["config"])


@router.get("/config")
def get_config() -> dict:
    return {
        "voices": VOICE_OPTIONS,
        "minTextLength": MIN_TEXT_LENGTH,
        "maxTextLength": MAX_TEXT_LENGTH,
        "minSpeed": MIN_SPEED,
        "maxSpeed": MAX_SPEED,
        "outputsPath": STATIC_MOUNT_PATH,
    }
