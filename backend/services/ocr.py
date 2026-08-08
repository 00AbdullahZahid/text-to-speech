import base64
import io
from typing import List

import easyocr
import numpy as np
from PIL import Image

reader = easyocr.Reader(["en"], gpu=False)


def extract_text_from_base64(image_data: str) -> str:
    if not image_data.startswith("data:"):
        raise ValueError("Invalid image data format")

    try:
        _, encoded = image_data.split(",", 1)
        image_bytes = base64.b64decode(encoded)
    except Exception as exc:
        raise ValueError("Unable to decode image data") from exc

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_array = np.array(image)
    results: List[tuple] = reader.readtext(image_array)
    extracted_text = " ".join([text for _, text, _ in results])
    return extracted_text
