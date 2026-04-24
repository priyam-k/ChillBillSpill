"""
Scraper for PGCPS Board of Education (BoardDocs).

Source: https://go.boarddocs.com/mabe/pgcps/Board.nsf/Public
"""
import re
from datetime import datetime, timedelta, timezone
import httpx
from selectolax.parser import HTMLParser

import cache

BOARDDOCS_BASE = "https://go.boarddocs.com/mabe/pgcps/Board.nsf"
BOARDDOCS_PUBLIC = f"{BOARDDOCS_BASE}/Public"
HEADERS = {
    "User-Agent": "ChillBillSpill/1.0 (hackathon research tool, public records)",
    "Accept": "text/html,application/xhtml+xml",
}


async def get_agenda_items(days: int = 21) -> list[dict]:
    """Return recent PGCPS board agenda items."""
    cache_key = f"pgcps_items_{days}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    items = []
    try:
        meetings = await _fetch_meetings(days)
        for meeting in meetings[:2]:
            meeting_items = await _fetch_meeting_items(meeting)
            items.extend(meeting_items)
    except Exception as e:
        print(f"[pgcps] error: {e}")

    cache.set(cache_key, items, ttl=3600)
    return items


async def _fetch_meetings(days: int) -> list[dict]:
    """Fetch the BoardDocs meeting list."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    meetings = []

    async with httpx.AsyncClient(timeout=15, headers=HEADERS, follow_redirects=True) as client:
        try:
            # BoardDocs has a JSON API for meeting list
            r = await client.get(
                f"{BOARDDOCS_BASE}/getMeetings?open",
                headers={**HEADERS, "Accept": "application/json"},
            )
            if r.status_code == 200 and "application/json" in r.headers.get("content-type", ""):
                data = r.json()
                for m in data:
                    date = _parse_boarddocs_date(m.get("date", ""))
                    if date and date >= cutoff:
                        meetings.append({
                            "date": date.date().isoformat(),
                            "unique": m.get("unique", ""),
                            "name": m.get("name", "Regular Meeting"),
                        })
                return meetings
        except Exception:
            pass

        # Fall back to scraping the public page
        try:
            r = await client.get(BOARDDOCS_PUBLIC)
            r.raise_for_status()
            meetings = _parse_boarddocs_html(r.text, cutoff)
        except Exception as e:
            print(f"[pgcps] HTML fallback error: {e}")

    return meetings


def _parse_boarddocs_html(html: str, cutoff: datetime) -> list[dict]:
    meetings = []
    tree = HTMLParser(html)
    for a in tree.css("a[href]"):
        href = a.attributes.get("href", "")
        text = a.text(strip=True)
        if "meeting" not in text.lower() and "board" not in text.lower():
            continue
        date = _extract_date_from_text(text)
        if date and date >= cutoff:
            meetings.append({
                "date": date.date().isoformat(),
                "unique": "",
                "name": text,
                "url": href,
            })
    return meetings[:3]


async def _fetch_meeting_items(meeting: dict) -> list[dict]:
    """Fetch agenda items for a specific BoardDocs meeting."""
    items = []
    if not meeting.get("unique"):
        return items

    try:
        async with httpx.AsyncClient(timeout=15, headers=HEADERS, follow_redirects=True) as client:
            r = await client.get(
                f"{BOARDDOCS_BASE}/getAgenda?open&meeting={meeting['unique']}",
                headers={**HEADERS, "Accept": "application/json"},
            )
            if r.status_code != 200:
                return items

            agenda_data = r.json() if "application/json" in r.headers.get("content-type", "") else []

            for i, section in enumerate(agenda_data):
                for j, item in enumerate(section.get("items", [])):
                    title = item.get("title", item.get("name", ""))
                    if not title:
                        continue
                    items.append({
                        "raw_id": f"pgcps-{meeting['date'].replace('-', '')}-{i:02d}{j:02d}",
                        "jurisdiction": "Schools",
                        "jurisdictionFull": "PGCPS Board of Education",
                        "meetingDate": meeting["date"],
                        "meetingType": meeting.get("name", "Regular Meeting"),
                        "agendaText": title + "\n\n" + item.get("description", ""),
                        "minutesText": "",
                        "agendaUrl": f"{BOARDDOCS_PUBLIC}#%21agenda/meeting/{meeting['unique']}/item/{item.get('unique', '')}",
                        "minutesUrl": "",
                        "videoUrl": "",
                        "tags": ["SCHOOLS"],
                        "sourcePage": i + 1,
                    })
    except Exception as e:
        print(f"[pgcps] items error: {e}")

    return items


def _parse_boarddocs_date(text: str) -> datetime | None:
    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%B %d, %Y"):
        try:
            return datetime.strptime(text.strip(), fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def _extract_date_from_text(text: str) -> datetime | None:
    m = re.search(r"(\w+ \d{1,2},?\s*\d{4}|\d{1,2}/\d{1,2}/\d{4})", text)
    if m:
        return _parse_boarddocs_date(m.group(1))
    return None
