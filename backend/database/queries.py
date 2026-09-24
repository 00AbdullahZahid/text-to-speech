from typing import Any, Dict, List, Optional

import json

from psycopg2.extensions import connection as PgConnection


def _row_to_metadata(row: Dict[str, Any]) -> Dict[str, Any]:
    created_at = row.get("created_at")

    return {
        "filename": row["filename"],
        "voice": row["voice_name"],
        "voiceId": row["voice_id"],
        "speed": float(row["speed"]),
        "text": row["text"],
        "size": int(row["size_bytes"]),
        "created_at": created_at.isoformat() if created_at else "",
        "storage_path": row.get("storage_path") or None,
        "format": row.get("format") or "wav",
        "has_subtitles": bool(row.get("has_subtitles")),
    }


def insert_generation(
    conn: PgConnection,
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
) -> None:

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO audio_generations
            (filename, voice_id, voice_name, speed, text, size_bytes, storage_path, user_id, format, has_subtitles)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (filename) DO NOTHING
            """,
            (
                filename,
                voice_id,
                voice_name,
                speed,
                text,
                size_bytes,
                storage_path,
                user_id,
                audio_format,
                has_subtitles,
            ),
        )


def list_generations(
    conn: PgConnection,
    *,
    user_id: Optional[str] = None,
    limit: int = 200,
) -> List[Dict[str, Any]]:

    with conn.cursor() as cur:
        if user_id:
            cur.execute(
                """
                SELECT
                    filename,
                    voice_id,
                    voice_name,
                    speed,
                    text,
                    size_bytes,
                    created_at,
                    storage_path,
                    format,
                    has_subtitles
                FROM audio_generations
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (user_id, limit),
            )
        else:
            cur.execute(
                """
                SELECT
                    filename,
                    voice_id,
                    voice_name,
                    speed,
                    text,
                    size_bytes,
                    created_at,
                    storage_path,
                    format,
                    has_subtitles
                FROM audio_generations
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (limit,),
            )

        rows = cur.fetchall()

    return [_row_to_metadata(row) for row in rows]


def count_generations(
    conn: PgConnection,
    *,
    user_id: Optional[str] = None,
) -> int:

    with conn.cursor() as cur:
        if user_id:
            cur.execute(
                """
                SELECT COUNT(*) AS count
                FROM audio_generations
                WHERE user_id = %s
                """,
                (user_id,),
            )
        else:
            cur.execute(
                """
                SELECT COUNT(*) AS count
                FROM audio_generations
                """
            )

        row = cur.fetchone()

    return int(row["count"]) if row else 0


def get_generation(
    conn: PgConnection,
    filename: str,
    *,
    user_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:

    with conn.cursor() as cur:
        if user_id:
            cur.execute(
                """
                SELECT
                    filename,
                    voice_id,
                    voice_name,
                    speed,
                    text,
                    size_bytes,
                    created_at,
                    storage_path,
                    format,
                    has_subtitles
                FROM audio_generations
                WHERE filename = %s AND user_id = %s
                """,
                (filename, user_id),
            )
        else:
            cur.execute(
                """
                SELECT
                    filename,
                    voice_id,
                    voice_name,
                    speed,
                    text,
                    size_bytes,
                    created_at,
                    storage_path,
                    format,
                    has_subtitles
                FROM audio_generations
                WHERE filename = %s
                """,
                (filename,),
            )

        row = cur.fetchone()

    return _row_to_metadata(row) if row else None


def delete_generation(
    conn: PgConnection,
    filename: str,
    *,
    user_id: Optional[str] = None,
) -> None:

    with conn.cursor() as cur:
        if user_id:
            cur.execute(
                """
                DELETE FROM audio_generations
                WHERE filename = %s AND user_id = %s
                """,
                (filename, user_id),
            )
        else:
            cur.execute(
                """
                DELETE FROM audio_generations
                WHERE filename = %s
                """,
                (filename,),
            )


# ---------------------------------------------------------------------------
# Presets
# ---------------------------------------------------------------------------


def _row_to_preset(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": int(row["id"]),
        "name": row["name"],
        "voiceId": row["voice_id"],
        "speed": float(row["speed"]),
        "format": row.get("format") or "wav",
    }


def list_presets(
    conn: PgConnection,
    *,
    user_id: str,
) -> List[Dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, name, voice_id, speed, format
            FROM voice_presets
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
        rows = cur.fetchall()
    return [_row_to_preset(row) for row in rows]


def get_preset(
    conn: PgConnection,
    preset_id: int,
    *,
    user_id: str,
) -> Optional[Dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, name, voice_id, speed, format
            FROM voice_presets
            WHERE id = %s AND user_id = %s
            """,
            (preset_id, user_id),
        )
        row = cur.fetchone()
    return _row_to_preset(row) if row else None


def insert_preset(
    conn: PgConnection,
    *,
    user_id: str,
    name: str,
    voice_id: str,
    speed: float,
    audio_format: str = "wav",
) -> Optional[int]:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO voice_presets (user_id, name, voice_id, speed, format)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
            """,
            (user_id, name, voice_id, speed, audio_format),
        )
        row = cur.fetchone()
    return int(row["id"]) if row else None


def update_preset(
    conn: PgConnection,
    preset_id: int,
    *,
    user_id: str,
    name: str = None,
    voice_id: str = None,
    speed: float = None,
    audio_format: str = None,
) -> bool:
    fields = []
    values = []
    if name is not None:
        fields.append("name = %s")
        values.append(name)
    if voice_id is not None:
        fields.append("voice_id = %s")
        values.append(voice_id)
    if speed is not None:
        fields.append("speed = %s")
        values.append(speed)
    if audio_format is not None:
        fields.append("format = %s")
        values.append(audio_format)

    if not fields:
        return False

    values.extend([preset_id, user_id])
    with conn.cursor() as cur:
        cur.execute(
            f"""
            UPDATE voice_presets
            SET {', '.join(fields)}
            WHERE id = %s AND user_id = %s
            """,
            values,
        )
        return cur.rowcount > 0


def delete_preset(
    conn: PgConnection,
    preset_id: int,
    *,
    user_id: str,
) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            DELETE FROM voice_presets
            WHERE id = %s AND user_id = %s
            """,
            (preset_id, user_id),
        )
        return cur.rowcount > 0


def count_presets(
    conn: PgConnection,
    *,
    user_id: str,
) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*) AS count
            FROM voice_presets
            WHERE user_id = %s
            """,
            (user_id,),
        )
        row = cur.fetchone()
    return int(row["count"]) if row else 0


# ---------------------------------------------------------------------------
# Generation jobs
# ---------------------------------------------------------------------------


def ensure_generation_jobs_table(conn: PgConnection) -> None:
    """Create the generation_jobs table if it does not exist yet."""
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS generation_jobs (
                id         TEXT PRIMARY KEY,
                user_id    TEXT NOT NULL,
                kind       TEXT NOT NULL,
                status     TEXT NOT NULL,
                text       TEXT,
                payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
                results    JSONB,
                error      TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )


def _row_to_job(row: Dict[str, Any]) -> Dict[str, Any]:
    def _load(value: Any) -> Any:
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (TypeError, ValueError):
                return None
        return value

    return {
        "id": row["id"],
        "userId": row["user_id"],
        "kind": row["kind"],
        "status": row["status"],
        "text": row.get("text"),
        "payload": _load(row.get("payload")),
        "results": _load(row.get("results")),
        "error": row.get("error"),
        "createdAt": row["created_at"].isoformat() if row.get("created_at") else "",
        "updatedAt": row["updated_at"].isoformat() if row.get("updated_at") else "",
    }


def insert_job(
    conn: PgConnection,
    *,
    job_id: str,
    user_id: str,
    kind: str,
    status: str,
    text: Optional[str],
    payload: dict,
) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO generation_jobs (id, user_id, kind, status, text, payload)
            VALUES (%s, %s, %s, %s, %s, %s::jsonb)
            ON CONFLICT (id) DO NOTHING
            """,
            (job_id, user_id, kind, status, text, json.dumps(payload)),
        )


def update_job(
    conn: PgConnection,
    *,
    job_id: str,
    status: str,
    results: Any = None,
    error: Optional[str] = None,
) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE generation_jobs
            SET status = %s,
                results = %s::jsonb,
                error = %s,
                updated_at = now()
            WHERE id = %s
            """,
            (
                status,
                json.dumps(results) if results is not None else None,
                error,
                job_id,
            ),
        )


def get_job(
    conn: PgConnection,
    *,
    job_id: str,
    user_id: str,
) -> Optional[Dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, user_id, kind, status, text, payload, results, error,
                   created_at, updated_at
            FROM generation_jobs
            WHERE id = %s AND user_id = %s
            """,
            (job_id, user_id),
        )
        row = cur.fetchone()
    return _row_to_job(row) if row else None


def list_jobs(
    conn: PgConnection,
    *,
    user_id: str,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, user_id, kind, status, text, payload, results, error,
                   created_at, updated_at
            FROM generation_jobs
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (user_id, limit),
        )
        rows = cur.fetchall()
    return [_row_to_job(row) for row in rows]


def reap_interrupted_jobs(
    conn: PgConnection,
    *,
    error: str,
) -> int:
    """Mark queued/running jobs as failed (e.g. after a backend restart)."""
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE generation_jobs
            SET status = 'failed',
                error = %s,
                updated_at = now()
            WHERE status IN ('queued', 'running')
            """,
            (error,),
        )
        return cur.rowcount
