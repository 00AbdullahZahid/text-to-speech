"""Repository layer wrapping database/queries.py.

This module does not change SQL or schema. It only re-exposes the query
functions in a single import location so routers don't reach into the
database package directly.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from database import queries
from database.connection import build_connection


def insert_generation(
    *,
    filename: str,
    voice_id: str,
    voice_name: str,
    speed: float,
    text: str,
    size_bytes: int,
    storage_path: Optional[str] = None,
    user_id: Optional[str] = None,
    audio_format: str = "wav",
    has_subtitles: bool = False,
) -> bool:
    """Persist one generation row. Returns True on success, False if DB
    is unavailable or the insert failed.
    """
    conn = build_connection()
    if conn is None:
        return False
    try:
        queries.insert_generation(
            conn,
            filename=filename,
            voice_id=voice_id,
            voice_name=voice_name,
            speed=speed,
            text=text,
            size_bytes=size_bytes,
            storage_path=storage_path,
            user_id=user_id,
            audio_format=audio_format,
            has_subtitles=has_subtitles,
        )
        return True
    except Exception as exc:
        print(f"[repo] insert_generation failed: {exc}")
        return False
    finally:
        conn.close()


def list_generations(
    *,
    user_id: Optional[str] = None,
) -> Optional[List[Dict[str, Any]]]:
    """Return rows from PostgreSQL, or None if the DB is unavailable."""
    conn = build_connection()
    if conn is None:
        return None
    try:
        return queries.list_generations(conn, user_id=user_id)
    except Exception:
        return None
    finally:
        conn.close()


def count_generations(
    *,
    user_id: Optional[str] = None,
) -> Optional[int]:
    """Return the total row count from PostgreSQL, or None if unavailable."""
    conn = build_connection()
    if conn is None:
        return None
    try:
        return queries.count_generations(conn, user_id=user_id)
    except Exception:
        return None
    finally:
        conn.close()


def get_generation(
    filename: str,
    *,
    user_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Return one row by filename, or None if unavailable/missing."""
    conn = build_connection()
    if conn is None:
        return None
    try:
        return queries.get_generation(conn, filename, user_id=user_id)
    except Exception:
        return None
    finally:
        conn.close()


def delete_generation(
    filename: str,
    *,
    user_id: Optional[str] = None,
) -> bool:
    """Remove one row by filename. Returns True on success, False if the
    DB is unavailable or the delete failed.
    """
    conn = build_connection()
    if conn is None:
        return False
    try:
        queries.delete_generation(conn, filename, user_id=user_id)
        return True
    except Exception:
        return False
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Presets
# ---------------------------------------------------------------------------


def list_presets(
    *,
    user_id: str,
) -> Optional[List[Dict[str, Any]]]:
    conn = build_connection()
    if conn is None:
        return None
    try:
        return queries.list_presets(conn, user_id=user_id)
    except Exception:
        return None
    finally:
        conn.close()


def get_preset(
    preset_id: int,
    *,
    user_id: str,
) -> Optional[Dict[str, Any]]:
    conn = build_connection()
    if conn is None:
        return None
    try:
        return queries.get_preset(conn, preset_id, user_id=user_id)
    except Exception:
        return None
    finally:
        conn.close()


def insert_preset(
    *,
    user_id: str,
    name: str,
    voice_id: str,
    speed: float,
    audio_format: str = "wav",
) -> Optional[int]:
    conn = build_connection()
    if conn is None:
        return None
    try:
        return queries.insert_preset(
            conn,
            user_id=user_id,
            name=name,
            voice_id=voice_id,
            speed=speed,
            audio_format=audio_format,
        )
    except Exception:
        return None
    finally:
        conn.close()


def update_preset(
    preset_id: int,
    *,
    user_id: str,
    name: Optional[str] = None,
    voice_id: Optional[str] = None,
    speed: Optional[float] = None,
    audio_format: Optional[str] = None,
) -> bool:
    conn = build_connection()
    if conn is None:
        return False
    try:
        return queries.update_preset(
            conn,
            preset_id,
            user_id=user_id,
            name=name,
            voice_id=voice_id,
            speed=speed,
            audio_format=audio_format,
        )
    except Exception:
        return False
    finally:
        conn.close()


def delete_preset(
    preset_id: int,
    *,
    user_id: str,
) -> bool:
    conn = build_connection()
    if conn is None:
        return False
    try:
        return queries.delete_preset(conn, preset_id, user_id=user_id)
    except Exception:
        return False
    finally:
        conn.close()


def count_presets(
    *,
    user_id: str,
) -> Optional[int]:
    conn = build_connection()
    if conn is None:
        return None
    try:
        return queries.count_presets(conn, user_id=user_id)
    except Exception:
        return None
    finally:
        conn.close()
