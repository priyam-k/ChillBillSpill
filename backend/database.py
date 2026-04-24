from __future__ import annotations
import sqlite3
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

DB_PATH = Path(os.getenv("DATABASE_PATH", "hearing.db"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS meetings (
    id           TEXT PRIMARY KEY,
    source       TEXT NOT NULL,
    source_id    TEXT NOT NULL,
    body_name    TEXT NOT NULL,
    meeting_date TEXT NOT NULL,
    meeting_time TEXT,
    location     TEXT,
    agenda_url   TEXT,
    minutes_url  TEXT,
    video_url    TEXT,
    scraped_at   TEXT NOT NULL,
    UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_meetings_date   ON meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_source ON meetings(source);

CREATE TABLE IF NOT EXISTS agenda_items (
    id           TEXT PRIMARY KEY,
    meeting_id   TEXT NOT NULL REFERENCES meetings(id),
    seq          INTEGER NOT NULL,
    item_number  TEXT,
    title        TEXT NOT NULL,
    description  TEXT,
    item_type    TEXT,
    document_url TEXT,
    raw_text     TEXT,
    UNIQUE(meeting_id, seq)
);

CREATE INDEX IF NOT EXISTS idx_items_meeting ON agenda_items(meeting_id);

CREATE TABLE IF NOT EXISTS summaries (
    id              TEXT PRIMARY KEY,
    meeting_id      TEXT NOT NULL,
    plain_english   TEXT NOT NULL,
    tags            TEXT NOT NULL,
    relevance_map   TEXT NOT NULL,
    dollar_amount   TEXT,
    vote_result     TEXT,
    model_used      TEXT NOT NULL,
    summarized_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS briefings (
    id                  TEXT PRIMARY KEY,
    address_raw         TEXT NOT NULL,
    address_normalized  TEXT NOT NULL,
    lat                 REAL,
    lon                 REAL,
    cp_district         TEXT,
    jurisdictions       TEXT NOT NULL,
    briefing_html       TEXT NOT NULL,
    items_json          TEXT NOT NULL,
    generated_at        TEXT NOT NULL,
    expires_at          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_briefings_addr ON briefings(address_normalized);

CREATE TABLE IF NOT EXISTS scrape_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    source          TEXT NOT NULL,
    run_at          TEXT NOT NULL,
    status          TEXT NOT NULL,
    meetings_found  INTEGER DEFAULT 0,
    items_found     INTEGER DEFAULT 0,
    error_msg       TEXT
);
"""

BOILERPLATE_TITLES = {
    "call to order",
    "pledge of allegiance",
    "approval of minutes",
    "adjournment",
    "invocation",
    "roll call",
    "open forum",
    "public comment",
    "approval of agenda",
    "executive session",
    "closed session",
    "recess",
}


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_connection()
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()


def upsert_meeting(conn: sqlite3.Connection, m: dict) -> str:
    mid = f"{m['source']}_{m['source_id']}"
    conn.execute(
        """
        INSERT INTO meetings (id, source, source_id, body_name, meeting_date,
            meeting_time, location, agenda_url, minutes_url, video_url, scraped_at)
        VALUES (:id, :source, :source_id, :body_name, :meeting_date,
            :meeting_time, :location, :agenda_url, :minutes_url, :video_url, :scraped_at)
        ON CONFLICT(source, source_id) DO UPDATE SET
            body_name   = excluded.body_name,
            meeting_date= excluded.meeting_date,
            agenda_url  = excluded.agenda_url,
            minutes_url = excluded.minutes_url,
            video_url   = excluded.video_url,
            scraped_at  = excluded.scraped_at
        """,
        {**m, "id": mid},
    )
    return mid


def upsert_agenda_item(conn: sqlite3.Connection, item: dict) -> str:
    iid = f"{item['meeting_id']}_item_{item['seq']}"
    conn.execute(
        """
        INSERT INTO agenda_items (id, meeting_id, seq, item_number, title,
            description, item_type, document_url, raw_text)
        VALUES (:id, :meeting_id, :seq, :item_number, :title,
            :description, :item_type, :document_url, :raw_text)
        ON CONFLICT(meeting_id, seq) DO UPDATE SET
            title        = excluded.title,
            description  = excluded.description,
            item_type    = excluded.item_type,
            raw_text     = excluded.raw_text
        """,
        {**item, "id": iid},
    )
    return iid


def log_scrape(conn: sqlite3.Connection, source: str, status: str,
               meetings_found: int = 0, items_found: int = 0, error_msg: str = None):
    from datetime import datetime, timezone
    conn.execute(
        """
        INSERT INTO scrape_log (source, run_at, status, meetings_found, items_found, error_msg)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (source, datetime.now(timezone.utc).isoformat(), status, meetings_found, items_found, error_msg),
    )
    conn.commit()


def get_items_for_briefing(conn: sqlite3.Connection, sources: list[str],
                           days_back: int = 90, days_forward: int = 14) -> list[dict]:
    from datetime import date, timedelta
    date_from = (date.today() - timedelta(days=days_back)).isoformat()
    date_to   = (date.today() + timedelta(days=days_forward)).isoformat()
    placeholders = ",".join("?" * len(sources))
    rows = conn.execute(
        f"""
        SELECT
            ai.id, ai.meeting_id, ai.seq, ai.item_number, ai.title,
            ai.description, ai.item_type, ai.document_url, ai.raw_text,
            m.source, m.body_name, m.meeting_date, m.meeting_time,
            m.agenda_url, m.minutes_url, m.video_url,
            s.plain_english, s.tags, s.relevance_map,
            s.dollar_amount, s.vote_result
        FROM agenda_items ai
        JOIN meetings m ON m.id = ai.meeting_id
        LEFT JOIN summaries s ON s.id = ai.id
        WHERE m.source IN ({placeholders})
          AND m.meeting_date BETWEEN ? AND ?
          AND LOWER(ai.title) NOT IN ({",".join("?" * len(BOILERPLATE_TITLES))})
        ORDER BY m.meeting_date DESC, ai.seq
        """,
        [*sources, date_from, date_to, *BOILERPLATE_TITLES],
    ).fetchall()
    return [dict(r) for r in rows]


def get_last_scrape_times(conn: sqlite3.Connection) -> dict:
    rows = conn.execute(
        """
        SELECT source, MAX(run_at) as last_run, status
        FROM scrape_log
        WHERE status != 'error'
        GROUP BY source
        """
    ).fetchall()
    return {r["source"]: {"last_run": r["last_run"], "status": r["status"]} for r in rows}


def get_meeting_counts(conn: sqlite3.Connection) -> dict:
    rows = conn.execute(
        "SELECT source, COUNT(*) as cnt FROM meetings GROUP BY source"
    ).fetchall()
    return {r["source"]: r["cnt"] for r in rows}


def get_cached_briefing(conn: sqlite3.Connection, cache_id: str) -> Optional[dict]:
    from datetime import datetime, timezone
    row = conn.execute(
        "SELECT * FROM briefings WHERE id = ? AND expires_at > ?",
        (cache_id, datetime.now(timezone.utc).isoformat()),
    ).fetchone()
    return dict(row) if row else None


def write_briefing_cache(conn: sqlite3.Connection, cache_id: str, address_raw: str,
                         address_normalized: str, lat: float | None, lon: float | None,
                         cp_district: str | None, jurisdictions: list[str],
                         briefing_html: str, items_json: str, ttl_hours: int = 6):
    import json
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    expires = now + timedelta(hours=ttl_hours)
    conn.execute(
        """
        INSERT OR REPLACE INTO briefings
        (id, address_raw, address_normalized, lat, lon, cp_district,
         jurisdictions, briefing_html, items_json, generated_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (cache_id, address_raw, address_normalized, lat, lon, cp_district,
         json.dumps(jurisdictions), briefing_html, items_json,
         now.isoformat(), expires.isoformat()),
    )
    conn.commit()
