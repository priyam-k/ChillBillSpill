"""SQLite cache for scraped agendas and LLM summaries."""
import json
import sqlite3
import time
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "cache.db"
DEFAULT_TTL = 6 * 3600  # 6 hours


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS cache (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            expires_at REAL NOT NULL
        )
    """)
    conn.commit()
    return conn


def get(key: str) -> dict | list | None:
    with _conn() as conn:
        row = conn.execute(
            "SELECT value, expires_at FROM cache WHERE key = ?", (key,)
        ).fetchone()
        if not row:
            return None
        value, expires_at = row
        if time.time() > expires_at:
            conn.execute("DELETE FROM cache WHERE key = ?", (key,))
            return None
        return json.loads(value)


def set(key: str, value: dict | list, ttl: int = DEFAULT_TTL) -> None:
    serialized = json.dumps(value)
    expires_at = time.time() + ttl
    with _conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)",
            (key, serialized, expires_at),
        )
        conn.commit()


def clear_expired() -> None:
    with _conn() as conn:
        conn.execute("DELETE FROM cache WHERE expires_at < ?", (time.time(),))
        conn.commit()
