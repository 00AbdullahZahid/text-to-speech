from typing import Any, Dict, List, Optional

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
) -> None:

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO audio_generations
            (filename, voice_id, voice_name, speed, text, size_bytes, storage_path, user_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
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
                    storage_path
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
                    storage_path
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
                    storage_path
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
                    storage_path
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
