"""OCR service — extracts text from images using EasyOCR.

EasyOCR runs a CRAFT text detector plus a CNN recognizer. On CPU it is an
order of magnitude faster than the previous Qwen2.5-VL-3B captioning model
while staying accurate for printed text. The reader is loaded once at import
time so each request is just detection + recognition passes.

Languages can be changed via the OCR_LANGUAGES env var (comma-separated
EasyOCR language codes, default "en").
"""
from __future__ import annotations

import base64
import os
from io import BytesIO

import numpy as np
from PIL import Image

import easyocr

_LANGS = [
    lang.strip()
    for lang in os.getenv("OCR_LANGUAGES", "en").split(",")
    if lang.strip()
]
_reader = easyocr.Reader(_LANGS, gpu=False, verbose=False)

# Cap the longest edge so very large photos don't slow down detection.
_MAX_EDGE = 1600

# Drop detections we are not confident in; EasyOCR's scores are 0..1.
_MIN_CONFIDENCE = 0.4


def extract_text_from_base64(image_data: str) -> str:
    if not image_data.startswith("data:"):
        raise ValueError("Invalid image data format")

    try:
        _, encoded = image_data.split(",", 1)
        image_bytes = base64.b64decode(encoded)
    except Exception as exc:
        raise ValueError("Unable to decode image data") from exc

    try:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise ValueError("Unable to process image") from exc

    if max(image.size) > _MAX_EDGE:
        scale = _MAX_EDGE / max(image.size)
        image = image.resize(
            (
                max(1, int(round(image.width * scale))),
                max(1, int(round(image.height * scale))),
            ),
            Image.LANCZOS,
        )

    result = _reader.readtext(np.array(image), detail=1, paragraph=False)

    boxes = []
    for box, text, confidence in result:
        if not text or not text.strip():
            continue
        if confidence < _MIN_CONFIDENCE:
            continue
        ys = [point[1] for point in box]
        xs = [point[0] for point in box]
        boxes.append(
            {
                "y": sum(ys) / len(ys),
                "x": sum(xs) / len(xs),
                "height": max(ys) - min(ys),
                "text": text.strip(),
            }
        )

    # Reading order: top-to-bottom, then left-to-right within a line.
    boxes.sort(key=lambda b: (b["y"], b["x"]))
    return "\n".join(_group_into_lines(boxes))


def _group_into_lines(boxes) -> list[str]:
    """Group sorted word boxes into visual lines using a running line height."""
    lines: list[list[dict]] = []
    current: list[dict] = []
    line_y = None

    for box in boxes:
        tolerance = max(12.0, box["height"] * 0.6)
        if line_y is None or abs(box["y"] - line_y) <= tolerance:
            current.append(box)
            line_y = box["y"] if line_y is None else (line_y * 0.7 + box["y"] * 0.3)
        else:
            lines.append(current)
            current = [box]
            line_y = box["y"]

    if current:
        lines.append(current)

    output = []
    for line in lines:
        line.sort(key=lambda b: b["x"])
        output.append(" ".join(b["text"] for b in line))
    return output