"""FastAPI application factory for the Voxa TTS backend.

Composition:
- Mounts /outputs for static audio serving.
- Registers the existing exception handlers.
- Adds CORS with the configured allowed origins.
- Includes the routers (tts, audio, ocr, config).
"""
from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import audio as audio_router
from app.routers import config as config_router
from app.routers import ocr as ocr_router
from app.routers import presets as presets_router
from app.routers import preview as preview_router
from app.routers import tts as tts_router
from config import (
    ALLOWED_ORIGIN_REGEX,
    ALLOWED_ORIGINS,
    OUTPUTS_DIR,
    STATIC_MOUNT_PATH,
)
from exception_handlers import (
    http_exception_handler,
    validation_exception_handler,
)

# Ensure the outputs directory exists
os.makedirs(OUTPUTS_DIR, exist_ok=True)


def create_app() -> FastAPI:
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
        allow_origin_regex=ALLOWED_ORIGIN_REGEX,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(config_router.router)
    app.include_router(tts_router.router)
    app.include_router(preview_router.router)
    app.include_router(audio_router.router)
    app.include_router(ocr_router.router)
    app.include_router(presets_router.router)

    @app.get("/")
    def root() -> dict:
        return {"message": "Backend is running."}

    return app


app = create_app()
