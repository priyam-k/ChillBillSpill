"""
Scraper for Prince George's County Council (Legistar + Granicus).

Sources:
- Calendar: https://princegeorgescountymd.legistar.com/Calendar.aspx
- Meeting detail: https://princegeorgescountymd.legistar.com/MeetingDetail.aspx?ID=...
- Legislation: https://princegeorgescountymd.legistar.com/LegislationDetail.aspx?ID=...
- Video: https://princegeorgescountymd.granicus.com/ViewPublisher.php?view_id=2
"""
import re
from datetime import datetime, timedelta, timezone
from typing import Optional
import httpx
from selectolax.parser import HTMLParser

import cache

LEGISTAR_BASE = "https://princegeorgescountymd.legistar.com"
GRANICUS_BASE = "https://princegeorgescountymd.granicus.com"
HEADERS = {"User-Agent": "ChillBillSpill/1.0 (hackathon research tool, public records)"}


async def get_agenda_items(days: int = 21) -> list[dict]:
    """Return recent County Council agenda items."""
    cache_key = f"pg_county_items_{days}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    items = []
    try:
        meetings = await _fetch_calendar(days)
        for meeting in meetings[:3]:
            meeting_items = await _fetch_meeting_items(meeting)
            items.extend(meeting_items)
    except Exception as e:
        print(f"[pg_county] error: {e}")

    cache.set(cache_key, items, ttl=3600)
    return items


async def _fetch_calendar(days: int) -> list[dict]:
    """Parse Legistar calendar for recent meetings."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    meetings = []

    async with httpx.AsyncClient(timeout=15, headers=HEADERS, follow_redirects=True) as client:
        r = await client.get(f"{LEGISTAR_BASE}/Calendar.aspx")
        r.raise_for_status()

    tree = HTMLParser(r.text)
    for row in tree.css("table tr"):
        cells = row.css("td")
        if len(cells) < 3:
            continue

        date_text = cells[0].text(strip=True) if cells else ""
        meeting_date = _parse_legistar_date(date_text)
        if not meeting_date or meeting_date < cutoff:
            continue

        # Look for meeting detail link
        detail_link = ""
        for a in row.css("a[href]"):
            href = a.attributes.get("href", "")
            if "MeetingDetail" in href:
                detail_link = href if href.startswith("http") else LEGISTAR_BASE + "/" + href.lstrip("/")
                break

        body = cells[1].text(strip=True) if len(cells) > 1 else ""
        is_district_council = "district council" in body.lower()

        meetings.append({
            "date": meeting_date.date().isoformat(),
            "body": body,
            "isDistrictCouncil": is_district_council,
            "detailUrl": detail_link,
        })

    return meetings


async def _fetch_meeting_items(meeting: dict) -> list[dict]:
    """Fetch agenda items for a specific meeting from Legistar."""
    if not meeting.get("detailUrl"):
        return []

    items = []
    try:
        async with httpx.AsyncClient(timeout=15, headers=HEADERS, follow_redirects=True) as client:
            r = await client.get(meeting["detailUrl"])
            r.raise_for_status()

        tree = HTMLParser(r.text)
        tags = ["ZONING"] if meeting["isDistrictCouncil"] else []

        for row in tree.css("table#ctl00_ContentPlaceHolder1_gridMain tr"):
            cells = row.css("td")
            if len(cells) < 3:
                continue

            item_id_text = cells[0].text(strip=True)
            title = cells[2].text(strip=True) if len(cells) > 2 else ""
            if not title or not item_id_text:
                continue

            # Get legislation detail link
            leg_url = ""
            for a in row.css("a[href]"):
                href = a.attributes.get("href", "")
                if "LegislationDetail" in href:
                    leg_url = href if href.startswith("http") else LEGISTAR_BASE + "/" + href.lstrip("/")
                    break

            leg_text = ""
            if leg_url:
                leg_text = await _fetch_legislation_text(leg_url)

            granicus_url = await _find_granicus_timestamp(meeting["date"], item_id_text)

            item_tags = list(tags)
            if "district 1" in title.lower() or "college park" in title.lower():
                item_tags.append("DISTRICT 1")

            items.append({
                "raw_id": f"pg-{meeting['date'].replace('-', '')}-{item_id_text}",
                "jurisdiction": "County",
                "jurisdictionFull": "Prince George's County Council"
                    + (" (sitting as District Council)" if meeting["isDistrictCouncil"] else ""),
                "meetingDate": meeting["date"],
                "meetingType": "District Council" if meeting["isDistrictCouncil"] else "Regular Session",
                "agendaText": f"{item_id_text}: {title}\n\n{leg_text}",
                "minutesText": "",
                "agendaUrl": meeting.get("detailUrl", ""),
                "minutesUrl": "",
                "videoUrl": granicus_url,
                "videoChapters": [],
                "tags": item_tags,
                "sourcePage": 1,
            })

    except Exception as e:
        print(f"[pg_county] meeting items error: {e}")

    return items


async def _fetch_legislation_text(url: str) -> str:
    cache_key = f"leg_{url}"
    cached = cache.get(cache_key)
    if cached:
        return cached.get("text", "")

    try:
        async with httpx.AsyncClient(timeout=10, headers=HEADERS, follow_redirects=True) as client:
            r = await client.get(url)
            r.raise_for_status()

        tree = HTMLParser(r.text)
        # Legistar legislation text is in a div or table
        text_parts = []
        for el in tree.css("div.LegistarColumnDisplay, td.LegistarColumnDisplay, .LegiText"):
            text_parts.append(el.text(strip=True))

        text = "\n".join(text_parts)[:2000]
        cache.set(cache_key, {"text": text}, ttl=86400)
        return text
    except Exception:
        return ""


async def _find_granicus_timestamp(meeting_date: str, item_id: str) -> str:
    """Try to find Granicus deep-link URL for an agenda item."""
    # Granicus viewer: ?starttime=<seconds>
    # For a real implementation we'd parse the viewer JSON manifest
    # For the hackathon, return the publisher listing URL
    return f"{GRANICUS_BASE}/ViewPublisher.php?view_id=2"


def _parse_legistar_date(text: str) -> Optional[datetime]:
    for fmt in ("%m/%d/%Y", "%B %d, %Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(text.strip(), fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None
