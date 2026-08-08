"""POST /generate — runs Kokoro TTS, persists the file, and stores metadata."""
from __future__ import annotations

import os
import uuid

from fastapi import APIRouter

from app.repositories import audio_repository
from config import OUTPUTS_DIR, VOICE_DISPLAY
from logger import logger
from models import GenerateRequest
from services.tts import generate_speech, save_audio
from validators import validate_generate_request

router = APIRouter(tags=["tts"])


@router.post("/generate")
def generate(request: GenerateRequest) -> dict:
    # Validate the request using the existing validation layer.
    validate_generate_request(request)

    # Generate the audio with Kokoro.
    audio = generate_speech(
        request.text,
        request.voiceId,
        request.speed,
    )

    # Give every generated file a unique name.
    filename = f"audio_{uuid.uuid4()}.wav"
    filepath = os.path.join(OUTPUTS_DIR, filename)

    # Save the generated audio.
    save_audio(audio, filepath)

    # Get the actual file size after saving.
    file_size = os.path.getsize(filepath)

    # Convert the voice ID into the friendly display name.
    voice_name = VOICE_DISPLAY.get(
        request.voiceId,
        request.voiceId,
    )

    # Save metadata to PostgreSQL when the database is available.
    inserted = audio_repository.insert_generation(
        filename=filename,
        voice_id=request.voiceId,
        voice_name=voice_name,
        speed=request.speed,
        text=request.text,
        size_bytes=file_size,
    )

    if not inserted:
        logger.warning(
            "Database unavailable; generation %s was not saved to PostgreSQL.",
            filename,
        )

    return {
        "filename": filename,
    }
