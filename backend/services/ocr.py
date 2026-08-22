"""OCR service — extracts text from images using Qwen2.5-VL.

The model and processor are loaded once at import time so each request
is just an inference pass, not a cold-load.  Pixel count is capped to
keep memory usage manageable on CPU.
"""
from __future__ import annotations

import base64
from io import BytesIO

import torch
from PIL import Image
from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor
from qwen_vl_utils import process_vision_info

_MODEL_NAME = "Qwen/Qwen2.5-VL-3B-Instruct"

model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
    _MODEL_NAME,
    torch_dtype=torch.float16,
    device_map="cpu",
)
processor = AutoProcessor.from_pretrained(
    _MODEL_NAME,
    min_pixels=256 * 28 * 28,
    max_pixels=640 * 28 * 28,
)


def extract_text_from_base64(image_data: str) -> str:
    if not image_data.startswith("data:"):
        raise ValueError("Invalid image data format")

    try:
        _, encoded = image_data.split(",", 1)
        image_bytes = base64.b64decode(encoded)
    except Exception as exc:
        raise ValueError("Unable to decode image data") from exc

    try:
        image = Image.open(BytesIO(image_bytes))
    except Exception as exc:
        raise ValueError("Unable to process image") from exc

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image", "image": image},
                {
                    "type": "text",
                    "text": (
                        "Extract all text from this image exactly as it appears. "
                        "Output only the extracted text with no commentary."
                    ),
                },
            ],
        }
    ]

    text = processor.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    image_inputs, video_inputs = process_vision_info(messages)
    inputs = processor(
        text=[text],
        images=image_inputs,
        videos=video_inputs,
        padding=True,
        return_tensors="pt",
    )

    with torch.no_grad():
        generated_ids = model.generate(**inputs, max_new_tokens=512)

    generated_ids_trimmed = [
        out_ids[len(in_ids):]
        for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
    ]
    output_text = processor.batch_decode(
        generated_ids_trimmed,
        skip_special_tokens=True,
        clean_up_tokenization_spaces=False,
    )

    return output_text[0].strip()
