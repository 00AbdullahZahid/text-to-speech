from config import (
    VALID_AUDIO_FORMATS,
    VALID_VOICE_IDS,
    MIN_SPEED,
    MAX_SPEED,
    MIN_TEXT_LENGTH,
    MAX_TEXT_LENGTH,
)
from models import GenerateRequest


def validate_generate_request(request: GenerateRequest) -> None:
    if request.voiceId not in VALID_VOICE_IDS:
        raise ValueError("Invalid voiceId")

    if not (MIN_SPEED <= request.speed <= MAX_SPEED):
        raise ValueError("Speed out of range")

    validate_format(request.format)

    text_length = len(request.text.strip())
    if text_length < MIN_TEXT_LENGTH or len(request.text) > MAX_TEXT_LENGTH:
        raise ValueError("Text length out of range")


def validate_format(fmt: str) -> None:
    if fmt not in VALID_AUDIO_FORMATS:
        raise ValueError(
            f"Unsupported format '{fmt}'. Must be one of: {', '.join(sorted(VALID_AUDIO_FORMATS))}"
        )
