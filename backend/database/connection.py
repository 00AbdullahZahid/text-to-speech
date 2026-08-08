"""Postgres connection helpers for the Voxa backend.

The DB layer is *optional*: callers should check ``is_database_enabled()``
before touching the connection. This keeps the API working even when the
DB is unreachable (e.g. local dev without Postgres) — the existing
filesystem-based metadata walker in ``file_manager.py`` is the fallback.
"""

from __future__ import annotations

import os
from typing import Optional

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor

load_dotenv()


def _has_db_env() -> bool:
    return all(
        os.getenv(key)
        for key in ("DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD")
    )


def is_database_enabled() -> bool:
    """Return True when the four required env vars are present."""
    return _has_db_env()


def build_connection() -> Optional[psycopg2.extensions.connection]:
    """Open a Postgres connection with autocommit and RealDictCursor.

    Returns None on any failure rather than raising — callers decide how
    to handle a missing DB. Log a single warning; do not spam.
    """
    if not _has_db_env():
        return None
    try:
        connection = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT") or 5432,
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            cursor_factory=RealDictCursor,
        )
        connection.autocommit = True
        return connection
    except Exception as exc:  # noqa: BLE001 - intentional soft-fail
        print(f"[db] error connecting to Postgres: {exc}")
        return None


def healthcheck() -> bool:
    """Run SELECT 1 and return True on success, False otherwise."""
    conn = build_connection()
    if conn is None:
        return False
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[db] healthcheck failed: {exc}")
        return False
    finally:
        conn.close()
