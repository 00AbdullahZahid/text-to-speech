from config import (
    VALID_AUDIO_FORMATS,
    VALID_VOICE_IDS,
    MIN_SPEED,
    MAX_SPEED,
    MIN_TEXT_LENGTH,
    MAX_TEXT_WORDS,
    MAX_TEXT_CHARS,
)
from models import GenerateRequest


def count_words(text: str) -> int:
    """Return the number of whitespace-separated words in ``text``."""
    return len(text.split())


def validate_text_length(text: str) -> None:
    """Raise ValueError when the script is empty or over the word/character limit."""
    if len(text.strip()) < MIN_TEXT_LENGTH:
        raise ValueError("Text is too short")
    if len(text) > MAX_TEXT_CHARS:
        raise ValueError(f"Text exceeds the {MAX_TEXT_CHARS}-character limit")
    if count_words(text) > MAX_TEXT_WORDS:
        raise ValueError(f"Text exceeds the {MAX_TEXT_WORDS}-word limit")


def validate_generation_params(voice_id: str, speed: float, fmt: str) -> None:
    if voice_id not in VALID_VOICE_IDS:
        raise ValueError("Invalid voiceId")

    if not (MIN_SPEED <= speed <= MAX_SPEED):
        raise ValueError("Speed out of range")

    validate_format(fmt)


def validate_generate_request(request: GenerateRequest) -> None:
    validate_generation_params(request.voiceId, request.speed, request.format)
    validate_text_length(request.text)


def validate_format(fmt: str) -> None:
    if fmt not in VALID_AUDIO_FORMATS:
        raise ValueError(
            f"Unsupported format '{fmt}'. Must be one of: {', '.join(sorted(VALID_AUDIO_FORMATS))}"
        )