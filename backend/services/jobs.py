"""Background generation jobs.

Synthesis runs on the CPU worker thread pool, so long scripts and batches
must not block an HTTP request — the Cloudflare tunnel (and any edge proxy)
would kill a multi-minute request. Instead, ``/generate`` and
``/generate/batch`` create a job, return its id immediately, and a background
worker thread synthesizes/updates the job.

Always-on in-memory registry is the source of truth while the process runs,
so a client that reloads the page can resume polling its job. Every state
change is mirrored to PostgreSQL best-effort so in-progress jobs can also
survive a backend restart (they are reaped as 'failed' on startup rather than
left hanging forever).
"""
from __future__ import annotations

import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from logger import logger
from app.repositories import jobs_repository

# Kokoro (and the torch graph it runs on) is not safe to run concurrently,
# and CPU inference is serial anyway — never synthesize in parallel.
_generation_lock = threading.Lock()

_jobs: Dict[str, Dict[str, Any]] = {}
_store_lock = threading.Lock()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def create_job(
    user_id: str,
    kind: str,
    text: Optional[str],
    payload: Dict[str, Any],
) -> str:
    """Register a new job (status 'queued') and return its id."""
    job_id = uuid.uuid4().hex
    job: Dict[str, Any] = {
        "id": job_id,
        "userId": user_id,
        "kind": kind,
        "status": "queued",
        "text": text,
        "payload": payload,
        "results": None,
        "error": None,
        "createdAt": _now_iso(),
        "updatedAt": _now_iso(),
    }
    with _store_lock:
        _jobs[job_id] = job
    jobs_repository.insert_job(
        job_id=job_id,
        user_id=user_id,
        kind=kind,
        status="queued",
        text=text,
        payload=payload,
    )
    return job_id


def _set_status(
    job_id: str,
    status: str,
    *,
    results: Any = None,
    error: Optional[str] = None,
) -> None:
    with _store_lock:
        job = _jobs.get(job_id)
        if job:
            job["status"] = status
            job["results"] = results
            job["error"] = error
            job["updatedAt"] = _now_iso()
    jobs_repository.update_job(
        job_id=job_id,
        status=status,
        results=results,
        error=error,
    )


def run(job_id: str, fn: Callable[[], Any]) -> None:
    """Execute ``fn`` on a background thread, updating the job around it."""

    def worker() -> None:
        with _generation_lock:
            _set_status(job_id, "running")
            try:
                results = fn()
            except Exception as exc:  # noqa: BLE001 - surfaced via the job
                logger.error("Job %s failed: %s", job_id, exc)
                _set_status(job_id, "failed", error=str(exc) or "Generation failed")
            else:
                _set_status(job_id, "completed", results=results)

    threading.Thread(target=worker, daemon=True, name=f"job-{job_id[:8]}").start()


def get_job(job_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Return a job scoped to ``user_id``. Prefers the live in-memory job
    (authoritative for this process); falls back to PostgreSQL.
    """
    with _store_lock:
        job = _jobs.get(job_id)
    if job is not None and job.get("userId") == user_id:
        return dict(job)
    return jobs_repository.get_job(job_id, user_id=user_id)


def list_jobs(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Return the user's jobs, newest first. In-memory jobs are merged with
    any rows persisted to PostgreSQL only seen after a restart.
    """
    with _store_lock:
        mem = [dict(j) for j in _jobs.values() if j.get("userId") == user_id]
    db = jobs_repository.list_jobs(user_id=user_id, limit=limit) or []

    by_id: Dict[str, Dict[str, Any]] = {}
    for job in db:
        by_id[job["id"]] = job
    for job in mem:
        by_id[job["id"]] = job  # live memory wins over the mirror

    jobs = list(by_id.values())
    jobs.sort(key=lambda j: j.get("createdAt") or "", reverse=True)
    return jobs[:limit]


def startup_recovery() -> None:
    """Best-effort: ensure the table exists and mark any queued/running jobs
    from a previous process as failed instead of leaving them hanging.
    """
    jobs_repository.ensure_schema()
    jobs_repository.reap_interrupted_jobs("Generation interrupted by backend restart")