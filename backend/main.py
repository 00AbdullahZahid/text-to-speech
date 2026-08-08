from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import uuid

from services.tts import generate_speech, save_audio
from file_manager import list_audio_metadata
from config import (
    ALLOWED_ORIGINS,
    MAX_SPEED,
    MAX_TEXT_LENGTH,
    MIN_SPEED,
    MIN_TEXT_LENGTH,
    OUTPUTS_DIR,
    STATIC_MOUNT_PATH,
    VOICE_DISPLAY,
    VOICE_OPTIONS,
)
from exception_handlers import (
    validation_exception_handler,
    http_exception_handler,
)
from logger import logger
from models import GenerateRequest, GenerateResponse
from validators import validate_generate_request

# Database layer
from database.connection import build_connection
from database.queries import (
    get_generation,
    insert_generation,
    list_generations,
)

# Ensure the outputs directory exists
os.makedirs(OUTPUTS_DIR, exist_ok=True)

app = FastAPI()

app.add_exception_handler(
    RequestValidationError,
    validation_exception_handler,
)
app.add_exception_handler(
    Exception,
    http_exception_handler,
)

app.mount(
    STATIC_MOUNT_PATH,
    StaticFiles(directory=OUTPUTS_DIR),
    name="outputs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Backend is running."}


@app.get("/config")
def get_config():
    return {
        "voices": VOICE_OPTIONS,
        "minTextLength": MIN_TEXT_LENGTH,
        "maxTextLength": MAX_TEXT_LENGTH,
        "minSpeed": MIN_SPEED,
        "maxSpeed": MAX_SPEED,
        "outputsPath": STATIC_MOUNT_PATH,
    }


@app.post("/generate")
def generate(request: GenerateRequest):
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
    conn = build_connection()

    if conn is not None:
        try:
            insert_generation(
                conn,
                filename=filename,
                voice_id=request.voiceId,
                voice_name=voice_name,
                speed=request.speed,
                text=request.text,
                size_bytes=file_size,
            )
        except Exception as exc:
            logger.exception(
                "Failed to save generation metadata for %s: %s",
                filename,
                exc,
            )
        finally:
            conn.close()
    else:
        logger.warning(
            "Database unavailable; generation %s was not saved to PostgreSQL.",
            filename,
        )

    return {
        "filename": filename,
    }


@app.get("/audio")
def list_audio_generations():
    # Prefer PostgreSQL when available.
    conn = build_connection()

    if conn is not None:
        try:
            generations = list_generations(conn)
            return {"files": generations}
        except Exception as exc:
            logger.exception(
                "Failed to list generations from PostgreSQL: %s",
                exc,
            )
        finally:
            conn.close()

    # Fallback to the existing filesystem metadata system.
    logger.warning(
        "Using filesystem metadata fallback for /audio."
    )
    return {"files": list_audio_metadata()}


@app.get("/audio/{filename}")
def get_audio_generation(filename: str):
    """Return metadata for one generation by filename."""

    # Prefer PostgreSQL when available.
    conn = build_connection()

    if conn is not None:
        try:
            generation = get_generation(conn, filename)

            if generation is not None:
                return generation

        except Exception as exc:
            logger.exception(
                "Failed to get generation %s from PostgreSQL: %s",
                filename,
                exc,
            )
        finally:
            conn.close()

    # Fallback to the existing filesystem metadata system.
    for item in list_audio_metadata():
        if item.get("filename") == filename:
            return item

    raise HTTPException(
        status_code=404,
        detail="Generation not found",
    )


@app.get("/output")
def output_alias():
    return list_audio_generations()