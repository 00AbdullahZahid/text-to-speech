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
) -> None:

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO audio_generations
            (filename, voice_id, voice_name, speed, text, size_bytes)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (filename) DO NOTHING
            """,
            (
                filename,
                voice_id,
                voice_name,
                speed,
                text,
                size_bytes,
            ),
        )


def list_generations(
    conn: PgConnection,
    limit: int = 200,
) -> List[Dict[str, Any]]:

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                filename,
                voice_id,
                voice_name,
                speed,
                text,
                size_bytes,
                created_at
            FROM audio_generations
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (limit,),
        )

        rows = cur.fetchall()

    return [_row_to_metadata(row) for row in rows]


def get_generation(
    conn: PgConnection,
    filename: str,
) -> Optional[Dict[str, Any]]:

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                filename,
                voice_id,
                voice_name,
                speed,
                text,
                size_bytes,
                created_at
            FROM audio_generations
            WHERE filename = %s
            """,
            (filename,),
        )

        row = cur.fetchone()

    return _row_to_metadata(row) if row else None