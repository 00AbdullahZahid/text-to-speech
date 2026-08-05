from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uuid
import os
import json
from services.tts import generate_speech, save_audio
from services.metadata import build_metadata
from file_manager import list_audio_metadata
from config import (
    ALLOWED_ORIGINS,
    MAX_SPEED,
    MAX_TEXT_LENGTH,
    MIN_SPEED,
    MIN_TEXT_LENGTH,
    OUTPUTS_DIR,
    STATIC_MOUNT_PATH,
    VOICE_OPTIONS,
)
from exception_handlers import validation_exception_handler, http_exception_handler
from logger import logger
from models import GenerateRequest, GenerateResponse
from validators import validate_generate_request

# Ensure the outputs directory exists
os.makedirs(OUTPUTS_DIR, exist_ok=True)

app = FastAPI()
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, http_exception_handler)
app.mount(STATIC_MOUNT_PATH, StaticFiles(directory=OUTPUTS_DIR), name="outputs")

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

@app.post("/generate", response_model=GenerateResponse)
def generate(request: GenerateRequest):
    validate_generate_request(request)

    audio = generate_speech(
        request.text,
        request.voiceId,
        request.speed,
    )
    filename = f"audio_{uuid.uuid4()}.wav"
    filepath = os.path.join(OUTPUTS_DIR, filename)
    save_audio(audio, filepath)

    meta = build_metadata(filename, request.voiceId, request.speed, request.text)

    with open(os.path.join(OUTPUTS_DIR, f"{filename}.json"), "w", encoding="utf-8") as meta_file:
        json.dump(meta, meta_file)

    logger.info("Generated audio %s for voice %s", filename, request.voiceId)
    return {"filename": filename}

@app.get("/audio")
def list_audio_generations():
    return {"files": list_audio_metadata()}

@app.get("/output")
def output_alias():
    return list_audio_generations()
