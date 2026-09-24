"""Kokoro TTS service — speech synthesis, format-aware saving, and word-
timestamp subtitle generation.

``generate_speech`` returns a tuple (audio, segments) where ``segments`` is a
list of dicts {text, start, end} in seconds derived from Kokoro's
word-level token timestamps.
"""
from kokoro import KPipeline
import soundfile as sf
import numpy as np
import re

from config import SAMPLE_RATE, VOICES
from logger import logger

pipeline = KPipeline(lang_code="a")

# A cue made only of punctuation should fold into the preceding word.
_PUNCT_ONLY = re.compile(r"^[.,!?;:'\"()\u2019\u201C\u201D]+$")


def warmup_voices() -> None:
    """Pre-download and load every configured voice into the pipeline cache.

    Kokoro downloads each ``voices/<id>.pt`` file lazily on first use, which
    would stall the first generation of a voice (observed at ~34 kB/s). Running
    this in a background thread at startup makes every voice instant to use.
    """
    for voice_id in VOICES:
        try:
            pipeline.load_voice(voice_id)
        except Exception as exc:  # noqa: BLE001 - warmup must never crash
            logger.warning("Voice warmup failed for %s: %s", voice_id, exc)


def generate_speech(text: str, voiceId: str, speed: float):
    """Synthesize speech.

    Returns ``(audio_array, segments)``. ``audio_array`` is the concatenated
    float32 PCM at SAMPLE_RATE; ``segments`` is a list of word-level
    {text, start, end} times used to build subtitle files.
    """
    audio_chunks = []
    word_chunks = []

    generator = pipeline(text, voice=voiceId, speed=speed)

    for _i, result in enumerate(generator):
        if result.audio is not None:
            audio_chunks.append(result.audio)
        for seg in _tokens_to_segments(result.tokens):
            word_chunks.append(seg)

    if audio_chunks:
        audio = np.concatenate(audio_chunks)
    else:
        audio = np.array([], dtype=np.float32)

    segments = _merge_and_clip(word_chunks)
    return audio, segments


def _tokens_to_segments(tokens):
    """Convert Kokoro MToken objects to word-level {text, start, end} dicts.

    Each MToken carries ``text`` plus ``start_ts``/``end_ts`` (seconds) set
    by ``join_timestamps``. Whitespace-only tokens are dropped.
    """
    segments = []
    if not tokens:
        return segments
    for t in tokens:
        text = getattr(t, "text", None)
        start = getattr(t, "start_ts", None)
        end = getattr(t, "end_ts", None)
        if text is None or start is None or end is None:
            continue
        if not str(text).strip():
            continue
        segments.append({"text": str(text), "start": start, "end": end})
    return segments


def _merge_and_clip(segments):
    """Sort word segments, fold punctuation-only tokens into the preceding
    word, then enforce a small gap so SRT cues don't overlap."""
    segments.sort(key=lambda s: s["start"])

    merged = []
    for seg in segments:
        text = seg["text"]
        if merged and _PUNCT_ONLY.match(text):
            # Attach punctuation to the word that came before it.
            merged[-1]["text"] += text
            merged[-1]["end"] = max(merged[-1]["end"], seg["end"])
            continue
        merged.append(dict(seg))
    segments = merged

    min_gap = 0.01
    for i in range(1, len(segments)):
        prev_end = segments[i - 1]["end"]
        if segments[i]["start"] < prev_end + min_gap:
            segments[i]["start"] = prev_end + min_gap
            if segments[i]["start"] > segments[i]["end"]:
                segments[i]["end"] = segments[i]["start"] + max(0.05, min_gap)
    return segments


def save_audio(audio, filename, fmt: str = "wav"):
    """Write the float32 audio to ``filename`` using ``soundfile``.

    The container format is inferred from the file extension. ``fmt`` is only
    used to pass an explicit soundfile container for MP3, which some builds
    cannot infer from the extension alone.
    """
    sf.write(
        filename,
        audio,
        SAMPLE_RATE,
        format=fmt.upper() if fmt == "mp3" else None,
    )
    return filename


def build_srt(segments) -> str:
    """Render word segments as an SRT subtitle string."""
    lines = []
    for idx, seg in enumerate(segments, start=1):
        lines.append(str(idx))
        lines.append(
            f"{_srt_ts(seg['start'])} --> {_srt_ts(seg['end'])}"
        )
        lines.append(seg["text"])
        lines.append("")
    return "\n".join(lines)


def _srt_ts(seconds: float) -> str:
    total_ms = int(round(seconds * 1000))
    hours = total_ms // 3_600_000
    minutes = (total_ms // 60_000) % 60
    secs = (total_ms // 1000) % 60
    millis = total_ms % 1000
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"