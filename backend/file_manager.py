import os
import json
from typing import Any, Dict, List

from config import OUTPUTS_DIR, AUDIO_EXTENSIONS


def list_audio_metadata() -> List[Dict[str, Any]]:
    generations: List[Dict[str, Any]] = []

    for filename in sorted(os.listdir(OUTPUTS_DIR)):
        filepath = os.path.join(OUTPUTS_DIR, filename)
        if not os.path.isfile(filepath):
            continue

        _, extension = os.path.splitext(filename)
        if extension.lower() not in AUDIO_EXTENSIONS:
            continue

        meta_path = f"{filepath}.json"
        if not os.path.exists(meta_path):
            continue

        with open(meta_path, "r", encoding="utf-8") as meta_file:
            metadata = json.load(meta_file)

        metadata["size"] = os.path.getsize(filepath)
        generations.append(metadata)

    generations.sort(key=lambda item: item.get("created_at", ""), reverse=True)
    return generations
