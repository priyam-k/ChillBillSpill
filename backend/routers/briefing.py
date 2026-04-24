import asyncio
import os

import anthropic
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from backend.pipeline import run_briefing
from backend.database import get_connection, get_last_scrape_times, get_meeting_counts
from backend.scrapers.college_park import CollegeParkScraper
from backend.scrapers.pg_county import PGCountyScraper
from backend.scrapers.pgcps import PGCPSScraper

router = APIRouter()


def _get_llm_client():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    return anthropic.AsyncAnthropic(api_key=api_key)


class BriefingRequest(BaseModel):
    address: str
    days_back: int = 90
    days_forward: int = 14
    force_refresh: bool = False


@router.post("/briefing")
async def get_briefing(req: BriefingRequest):
    if not req.address or len(req.address.strip()) < 5:
        raise HTTPException(status_code=400, detail="Address is required.")

    llm = _get_llm_client()
    result = await run_briefing(
        address=req.address,
        days_back=req.days_back,
        days_forward=req.days_forward,
        force_refresh=req.force_refresh,
        llm_client=llm,
    )
    return result


@router.get("/meetings")
async def list_meetings(source: str = None, days_back: int = 30):
    from datetime import date, timedelta
    conn = get_connection()
    cutoff = (date.today() - timedelta(days=days_back)).isoformat()
    query = "SELECT * FROM meetings WHERE meeting_date >= ?"
    params = [cutoff]
    if source:
        query += " AND source = ?"
        params.append(source)
    query += " ORDER BY meeting_date DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.get("/health")
async def health():
    conn = get_connection()
    scrape_status = get_last_scrape_times(conn)
    meeting_counts = get_meeting_counts(conn)
    conn.close()
    return {
        "status": "ok",
        "scrape_status": scrape_status,
        "meeting_counts": meeting_counts,
        "anthropic_key_set": bool(os.getenv("ANTHROPIC_API_KEY")),
    }


async def _run_scrapers_bg(source: str = None, days_back: int = 90):
    conn = get_connection()
    scrapers = []
    if source is None or source == "college_park":
        scrapers.append(CollegeParkScraper())
    if source is None or source == "pg_county":
        scrapers.append(PGCountyScraper())
    if source is None or source == "pgcps":
        scrapers.append(PGCPSScraper())

    for scraper in scrapers:
        try:
            await scraper.run(conn, days_back=days_back)
        except Exception as e:
            print(f"[refresh] {scraper.SOURCE} failed: {e}")
    conn.close()


@router.post("/refresh")
async def refresh_data(
    background_tasks: BackgroundTasks,
    source: str = None,
    days_back: int = 90,
):
    background_tasks.add_task(_run_scrapers_bg, source, days_back)
    return {
        "status": "scrape_started",
        "source": source or "all",
        "note": "Check /api/health for scrape status.",
    }
