from __future__ import annotations

# Directories
OUTPUTS_DIR = "outputs"
STATIC_MOUNT_PATH = "/outputs"

# API
ALLOWED_ORIGINS = [
    "http://localhost:3000",
]

# Audio
SAMPLE_RATE = 24_000
AUDIO_EXTENSIONS = {
    ".wav",
    ".mp3",
    ".ogg",
    ".flac",
}

# Voices
VOICES = {
    "af_alloy": "Alloy",
    "af_bella": "Bella",
    "am_adam": "Adam",
    "am_michael": "Michael",
}

VOICE_OPTIONS = [
    {"id": voice_id, "name": name}
    for voice_id, name in VOICES.items()
]

VOICE_DISPLAY = VOICES
VALID_VOICE_IDS = set(VOICES.keys())

#LimitationsMIN_TEXT_LENGTH = 1

MIN_TEXT_LENGTH = 1
MAX_TEXT_LENGTH = 800

MIN_SPEED = 0.5
MAX_SPEED = 1.5