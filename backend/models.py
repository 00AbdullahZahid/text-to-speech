from pydantic import BaseModel, Field
from typing import Literal

AudioFormat = Literal["wav", "mp3", "ogg", "flac"]


class GenerateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    voiceId: str
    speed: float
    format: AudioFormat = "wav"


class GenerateResponse(BaseModel):
    filename: str
    format: str = "wav"


class BatchItem(BaseModel):
    text: str = Field(..., min_length=1)
    voiceId: str
    speed: float
    format: AudioFormat = "wav"


class BatchGenerateRequest(BaseModel):
    items: list[BatchItem]


class BatchItemResult(BaseModel):
    index: int
    filename: str
    format: str
    success: bool
    error: str = ""


class Preset(BaseModel):
    id: int
    name: str
    voiceId: str
    speed: float
    format: AudioFormat


class PresetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=60)
    voiceId: str
    speed: float
    format: AudioFormat = "wav"


class PresetUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=60)
    voiceId: str | None = None
    speed: float | None = None
    format: AudioFormat | None = None


class ConfigResponse(BaseModel):
    voices: list[dict[str, str]]
    minTextLength: int
    maxTextLength: int
    minSpeed: float
    maxSpeed: float
    outputsPath: str
    formats: list[dict[str, str]]
    maxBatchItems: int


class AudioMetadata(BaseModel):
    filename: str
    voice: str
    voiceId: str
    speed: float
    text: str
    created_at: str
    size: int
