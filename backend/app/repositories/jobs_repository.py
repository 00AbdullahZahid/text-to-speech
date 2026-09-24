"""Repository layer wrapping database/queries.py for generation jobs."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from database import queries
from database.connection import build_connection


def ensure_schema() -> bool:
    """Best-effort create of the generation_jobs table. True on success."""
    conn = build_connection()
    if conn is None:
        return False
    try:
        queries.ensure_generation_jobs_table(conn)
        return True
    except Exception as exc:
        print(f"[repo] ensure_schema failed: {exc}")
        return False
    finally:
        conn.close()


def insert_job(
    *,
    job_id: str,
    user_id: str,
    kind: str,
    status: str,
    text: Optional[str] = None,
    payload: Optional[dict] = None,
) -> bool:
    conn = build_connection()
    if conn is None:
        return False
    try:
        queries.insert_job(
            conn,
            job_id=job_id,
            user_id=user_id,
            kind=kind,
            status=status,
            text=text,
            payload=payload or {},
        )
        return True
    except Exception as exc:
        print(f"[repo] insert_job failed: {exc}")
        return False
    finally:
        conn.close()


def update_job(
    *,
    job_id: str,
    status: str,
    results: Any = None,
    error: Optional[str] = None,
) -> bool:
    conn = build_connection()
    if conn is None:
        return False
    try:
        queries.update_job(
            conn,
            job_id=job_id,
            status=status,
            results=results,
            error=error,
        )
        return True
    except Exception as exc:
        print(f"[repo] update_job failed: {exc}")
        return False
    finally:
        conn.close()


def get_job(
    job_id: str,
    *,
    user_id: str,
) -> Optional[Dict[str, Any]]:
    conn = build_connection()
    if conn is None:
        return None
    try:
        return queries.get_job(conn, job_id=job_id, user_id=user_id)
    except Exception as exc:
        print(f"[repo] get_job failed: {exc}")
        return None
    finally:
        conn.close()


def list_jobs(
    *,
    user_id: str,
    limit: int = 50,
) -> Optional[List[Dict[str, Any]]]:
    conn = build_connection()
    if conn is None:
        return None
    try:
        return queries.list_jobs(conn, user_id=user_id, limit=limit)
    except Exception:
        return None
    finally:
        conn.close()


def reap_interrupted_jobs(error: str) -> bool:
    conn = build_connection()
    if conn is None:
        return False
    try:
        queries.reap_interrupted_jobs(conn, error=error)
        return True
    except Exception as exc:
        print(f"[repo] reap_interrupted_jobs failed: {exc}")
        return False
    finally:
        conn.close()