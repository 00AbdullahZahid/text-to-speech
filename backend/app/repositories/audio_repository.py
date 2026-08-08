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
) -> bool:
    """Persist one generation row. Returns True on success, False if DB
    is unavailable or the insert failed. Caller should not treat False
    as a hard error — the filesystem metadata sidecar is the fallback.
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
        )
        return True
    except Exception:
        return False
    finally:
        conn.close()


def list_generations() -> Optional[List[Dict[str, Any]]]:
    """Return rows from PostgreSQL, or None if the DB is unavailable."""
    conn = build_connection()
    if conn is None:
        return None
    try:
        return queries.list_generations(conn)
    except Exception:
        return None
    finally:
        conn.close()


def get_generation(filename: str) -> Optional[Dict[str, Any]]:
    """Return one row by filename, or None if unavailable/missing."""
    conn = build_connection()
    if conn is None:
        return None
    try:
        return queries.get_generation(conn, filename)
    except Exception:
        return None
    finally:
        conn.close()
