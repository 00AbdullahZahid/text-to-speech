"""GET /preview — synthesize a short sample for a voice so users can audition
voices without generating a full script. Returns a WAV file.
"""
from __future__ import annotations

import io

import soundfile as sf
from fastapi import APIRouter, HTTPException, Response

from config import (
    MAX_SPEED,
    MIN_SPEED,
    SAMPLE_RATE,
    VALID_VOICE_IDS,
    VOICE_DISPLAY,
)
from services.tts import generate_speech

router = APIRouter(tags=["tts"])

PREVIEW_TEXT = "Hi! This is the {name} voice. How does it sound?"


@router.get("/preview")
def preview_voice(voiceId: str, speed: float = 1.0) -> Response:
    if voiceId not in VALID_VOICE_IDS:
        raise HTTPException(status_code=404, detail="Unknown voice")

    if not (MIN_SPEED <= speed <= MAX_SPEED):
        raise HTTPException(status_code=400, detail="Speed out of range")

    name = VOICE_DISPLAY.get(voiceId, voiceId)
    text = PREVIEW_TEXT.format(name=name)

    audio = generate_speech(text, voiceId, speed)

    buffer = io.BytesIO()
    sf.write(buffer, audio, SAMPLE_RATE, format="wav")
    buffer.seek(0)

    return Response(content=buffer.read(), media_type="audio/wav")
