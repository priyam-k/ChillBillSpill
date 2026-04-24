from __future__ import annotations
import re
from datetime import date, timedelta

from .base import BaseScraper, classify_item_type, ScrapeSummary

BOARDDOCS_BASE = "https://go.boarddocs.com/mabe/pgcps/Board.nsf"

BOILERPLATE = {
    "call to order", "pledge of allegiance", "approval of minutes",
    "adjournment", "invocation", "roll call", "recognition",
    "approval of agenda", "executive session", "closed session",
    "public comment", "comments from the public",
}


class PGCPSScraper(BaseScraper):
    SOURCE = "pgcps"
    BASE_URL = BOARDDOCS_BASE

    async def fetch_meetings(self, client, days_back: int = 90, days_forward: int = 14) -> list[dict]:
        today = date.today()
        cutoff_past   = today - timedelta(days=days_back)
        cutoff_future = today + timedelta(days=days_forward)

        try:
            r = await client.post(
                f"{BOARDDOCS_BASE}/BD-GetMeetingsList",
                content="current=1",
                headers={
                    **self.HTTP_HEADERS,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Referer": f"{BOARDDOCS_BASE}/Public",
                },
            )
            if r.status_code != 200:
                return []
            data = r.json()
        except Exception:
            return []

        if not isinstance(data, list):
            return []

        meetings = []
        for item in data:
            raw_date = str(item.get("numberdate", ""))[:8]
            try:
                meeting_date = date(int(raw_date[:4]), int(raw_date[4:6]), int(raw_date[6:8]))
            except (ValueError, IndexError):
                continue

            if meeting_date < cutoff_past or meeting_date > cutoff_future:
                continue

            unique_id = item.get("unique_id", "")
            if not unique_id:
                continue

            meetings.append({
                "source": "pgcps",
                "source_id": unique_id,
                "body_name": item.get("name", "PGCPS Board of Education"),
                "meeting_date": meeting_date.isoformat(),
                "meeting_time": None,
                "location": None,
                "agenda_url": f"{BOARDDOCS_BASE}/Public#{unique_id}",
                "minutes_url": None,
                "video_url": None,
                "scraped_at": date.today().isoformat(),
            })

        return meetings

    async def fetch_agenda_items(self, client, meeting: dict) -> list[dict]:
        source_id = meeting.get("source_id", "")
        if not source_id:
            return []

        try:
            r = await client.post(
                f"{BOARDDOCS_BASE}/BD-GetAgenda",
                content=f"id={source_id}&current=1",
                headers={
                    **self.HTTP_HEADERS,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Referer": f"{BOARDDOCS_BASE}/Public",
                },
            )
            if r.status_code != 200:
                return []
            data = r.json()
        except Exception:
            return []

        agenda_items = data.get("agenda", []) if isinstance(data, dict) else []
        if not agenda_items and isinstance(data, list):
            agenda_items = data

        items = []
        seq = 0
        for entry in agenda_items:
            title = (entry.get("title") or entry.get("name") or "").strip()
            if not title or title.lower() in BOILERPLATE:
                continue

            description = (entry.get("description_text") or entry.get("description") or "").strip()
            entry_type  = (entry.get("type") or "").strip()
            number      = (entry.get("number") or "").strip()

            seq += 1
            raw_text = f"{number} {title} {entry_type} {description}".strip()

            items.append({
                "seq": seq,
                "item_number": number,
                "title": title[:500],
                "description": description[:2000],
                "item_type": classify_item_type(f"{entry_type} {title}"),
                "document_url": None,
                "raw_text": raw_text[:3000],
            })

        return items

    async def run(self, conn, days_back: int = 90, days_forward: int = 14) -> ScrapeSummary:
        """Override to gracefully handle BoardDocs API being unavailable."""
        summary = await super().run(conn, days_back, days_forward)
        if summary.status == "error" or summary.meetings_found == 0:
            # Mark as partial rather than full error — other sources still work
            summary.status = "partial"
            from backend.database import log_scrape
            log_scrape(conn, self.SOURCE, "partial",
                       meetings_found=0, items_found=0,
                       error_msg="BoardDocs API unavailable or returned no data")
        return summary
