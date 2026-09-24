from __future__ import annotations

# Directories
OUTPUTS_DIR = "outputs"
STATIC_MOUNT_PATH = "/outputs"

# API
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://voxa-speech.vercel.app",
    "https://text-to-speech-ivory-mu.vercel.app",
]

# Allow any Vercel deployment/preview (e.g. voxa-speech-*.vercel.app) to reach the API.
ALLOWED_ORIGIN_REGEX = r"https://.*\.vercel\.app"

# Audio
SAMPLE_RATE = 24_000
AUDIO_EXTENSIONS = {
    ".wav",
    ".mp3",
    ".ogg",
    ".flac",
}

# Supported output formats: id -> (extension, soundfile format, mime type).
# soundfile infers the container from the extension, so the "format" argument
# passed to sf.write is only needed for unambiguous cases (e.g. raw).
AUDIO_FORMATS = {
    "wav": {"ext": ".wav", "mime": "audio/wav"},
    "mp3": {"ext": ".mp3", "mime": "audio/mpeg"},
    "ogg": {"ext": ".ogg", "mime": "audio/ogg"},
    "flac": {"ext": ".flac", "mime": "audio/flac"},
}
DEFAULT_AUDIO_FORMAT = "wav"
VALID_AUDIO_FORMATS = set(AUDIO_FORMATS.keys())

SUBTITLE_EXT = ".srt"
SUBTITLE_MIME = "application/x-subrip"

# Batch generation
MAX_BATCH_ITEMS = 20

# Presets
PRESET_NAME_MAX_LENGTH = 60
MAX_PRESETS_PER_USER = 50

# Voices
VOICES = {
    "af_alloy": "Alloy",
    "af_bella": "Bella",
    "af_heart": "Heart",
    "af_nova": "Nova",
    "am_adam": "Adam",
    "am_michael": "Michael",
    "am_echo": "Echo",
    "am_onyx": "Onyx",
    "bm_daniel": "Daniel",
}

VOICE_OPTIONS = [
    {"id": voice_id, "name": name}
    for voice_id, name in VOICES.items()
]

VOICE_DISPLAY = VOICES
VALID_VOICE_IDS = set(VOICES.keys())

# Limits
MIN_TEXT_LENGTH = 1
MAX_TEXT_WORDS = 800
# Hard character cap — catches no-space input that a word count never sees.
MAX_TEXT_CHARS = 4000

MIN_SPEED = 0.5
MAX_SPEED = 1.5