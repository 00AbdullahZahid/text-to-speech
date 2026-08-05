from pydantic import BaseModel, Field
from typing import Literal


class GenerateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    voiceId: str
    speed: float


class GenerateResponse(BaseModel):
    filename: str


class ConfigResponse(BaseModel):
    voices: list[dict[str, str]]
    minTextLength: int
    maxTextLength: int
    minSpeed: float
    maxSpeed: float
    outputsPath: str


class AudioMetadata(BaseModel):
    filename: str
    voice: str
    voiceId: str
    speed: float
    text: str
    created_at: str
    size: int
