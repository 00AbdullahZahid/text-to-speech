from datetime import datetime, timezone
from typing import Dict, Any

from config import VOICE_DISPLAY


def build_metadata(
    filename: str,
    voice_id: str,
    speed: float,
    text: str,
    size_bytes: int,
) -> Dict[str, Any]:
    return {
        "filename": filename,
        "voice": VOICE_DISPLAY.get(voice_id, voice_id),
        "voiceId": voice_id,
        "speed": speed,
        "text": text,
        "size_bytes": size_bytes,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
