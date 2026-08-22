"""Supabase Storage — the only module in the backend that knows how to talk
to Supabase Storage.

Everything else (routers, services, repositories) treats audio files as
opaque objects with an optional `storage_path`. This module owns the bucket
name, client creation, uploads, deletes, and URL generation, so switching
to a different object store later only requires changing this file.
"""
from __future__ import annotations

import os
from typing import Optional

from dotenv import load_dotenv
from logger import logger

load_dotenv()

BUCKET = "voxa-audio"
SIGNED_URL_TTL = 3600  # seconds


def _service_key() -> Optional[str]:
    """Return the service-role key. Supports both the common
    SUPABASE_SERVICE_KEY name and the existing SUPABASE_SECRET_KEY name.
    """
    return os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SECRET_KEY")


def is_configured() -> bool:
    """True when the Supabase URL and service-role key are both present."""
    return bool(os.getenv("SUPABASE_URL") and _service_key())


def _client():
    if not is_configured():
        return None
    from supabase import create_client

    return create_client(os.environ["SUPABASE_URL"], _service_key())


def upload_audio(storage_path: str, local_path: str) -> bool:
    """Upload a local file to the bucket under `storage_path`.

    Returns True on success. On failure (or when Supabase is not configured)
    the caller should fall back to serving the local file.
    """
    client = _client()
    if client is None:
        logger.warning(
            "Supabase Storage not configured; skipping upload of %s", storage_path
        )
        return False
    try:
        with open(local_path, "rb") as audio_file:
            client.storage.from_(BUCKET).upload(
                storage_path,
                audio_file,
                {"content-type": "audio/wav"},
            )
        logger.info("Uploaded %s to bucket %s", storage_path, BUCKET)
        return True
    except Exception as exc:
        logger.error("Supabase upload failed for %s: %s", storage_path, exc)
        return False


def delete_audio(storage_path: str) -> bool:
    """Remove one object from the bucket. Returns True on success."""
    client = _client()
    if client is None:
        return False
    try:
        client.storage.from_(BUCKET).remove([storage_path])
        logger.info("Deleted %s from bucket %s", storage_path, BUCKET)
        return True
    except Exception as exc:
        logger.error("Supabase delete failed for %s: %s", storage_path, exc)
        return False


def get_audio_url(storage_path: str) -> Optional[str]:
    """Return a short-lived signed URL for a stored object.

    Returns None when Supabase is unconfigured, the object is missing, or
    a signed URL cannot be generated. Callers should then fall back to the
    locally-mounted file URL.
    """
    client = _client()
    if client is None:
        return None
    try:
        result = client.storage.from_(BUCKET).create_signed_url(
            storage_path,
            SIGNED_URL_TTL,
        )
        url = (
            result.get("signedURL")
            if isinstance(result, dict)
            else getattr(result, "get", lambda key: None)("signedURL")
        )
        if not url:
            raise ValueError("empty signed URL")
        return url
    except Exception as exc:
        logger.warning(
            "Failed to build signed URL for %s: %s", storage_path, exc
        )
        return None
