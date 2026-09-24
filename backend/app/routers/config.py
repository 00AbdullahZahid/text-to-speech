"""GET /config — exposes frontend-safe configuration."""
from __future__ import annotations

from fastapi import APIRouter

from config import (
    AUDIO_FORMATS,
    MAX_BATCH_ITEMS,
    MAX_SPEED,
    MAX_TEXT_CHARS,
    MAX_TEXT_WORDS,
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
        "maxTextWords": MAX_TEXT_WORDS,
        "maxTextChars": MAX_TEXT_CHARS,
        "minSpeed": MIN_SPEED,
        "maxSpeed": MAX_SPEED,
        "outputsPath": STATIC_MOUNT_PATH,
        "formats": [
            {"id": fmt_id, "label": fmt_id.upper(), "ext": cfg["ext"], "mime": cfg["mime"]}
            for fmt_id, cfg in AUDIO_FORMATS.items()
        ],
        "maxBatchItems": MAX_BATCH_ITEMS,
    }
