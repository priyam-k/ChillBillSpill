"""
Scraper for City of College Park, MD.

Data sources:
- Agendas/minutes: https://www.collegeparkmd.gov/agendacenter (CivicEngage)
- Video chapters: https://www.collegeparkmd.gov/councilmeetings (Swagit player)
- Public comment email: cpmc@collegeparkmd.gov
"""
import re
import io
from datetime import datetime, timedelta, timezone
from typing import Optional
import httpx
from selectolax.parser import HTMLParser

try:
    import pdfplumber
    HAS_PDF = True
except ImportError:
    HAS_PDF = False

import cache

BASE = "https://www.collegeparkmd.gov"
AGENDA_CENTER = f"{BASE}/agendacenter"
COUNCIL_MEETINGS = f"{BASE}/councilmeetings"
HEADERS = {"User-Agent": "ChillBillSpill/1.0 (hackathon research tool, public records)"}


async def fetch_recent_meetings(days: int = 21) -> list[dict]:
    """Return meetings from last `days` days, newest first."""
    cache_key = f"cp_meetings_{days}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    meetings = []
    try:
        async with httpx.AsyncClient(timeout=15, headers=HEADERS, follow_redirects=True) as client:
            r = await client.get(AGENDA_CENTER)
            r.raise_for_status()
            meetings = _parse_agenda_center(r.text, days)

            # Try to get video chapter data for each meeting
            for m in meetings:
                if m.get("videoPageUrl"):
                    chapters = await _fetch_video_chapters(client, m["videoPageUrl"])
                    m["videoChapters"] = chapters
    except Exception as e:
        print(f"[college_park] fetch error: {e}")

    cache.set(cache_key, meetings, ttl=3600)
    return meetings


def _parse_agenda_center(html: str, days: int) -> list[dict]:
    """Parse CivicEngage AgendaCenter HTML for recent meetings."""
    tree = HTMLParser(html)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    meetings = []

    # CivicEngage lists meetings in a table or repeating divs.
    # Look for links containing "ViewFile/Agenda" or "ViewFile/Minutes"
    for node in tree.css("a[href]"):
        href = node.attributes.get("href") or ""
        text = node.text(strip=True)

        # Match agenda or minutes PDF links
        if not re.search(r"/AgendaCenter/ViewFile/(Agenda|Minutes)/", href, re.I):
            continue

        # Try to extract a date from nearby text or the href itself
        date = _extract_date_from_href(href) or _extract_date_from_text(text)
        if not date:
            continue
        if date < cutoff:
            continue

        meeting_type = _guess_meeting_type(text + href)
        full_url = href if href.startswith("http") else BASE + href
        file_type = "minutes" if "minutes" in href.lower() else "agenda"

        # Group by date
        existing = next((m for m in meetings if m["date"] == date.date().isoformat()), None)
        if existing:
            existing[f"{file_type}Url"] = full_url
        else:
            meetings.append({
                "date": date.date().isoformat(),
                "meetingType": meeting_type,
                "jurisdiction": "City",
                "jurisdictionFull": "City of College Park",
                f"{file_type}Url": full_url,
                "videoPageUrl": None,
            })

    meetings.sort(key=lambda m: m["date"], reverse=True)
    return meetings[:4]  # last 2–4 meetings


def _extract_date_from_href(href: str) -> Optional[datetime]:
    """CivicEngage hrefs contain dates like _04222025."""
    m = re.search(r"_(\d{2})(\d{2})(\d{4})", href)
    if m:
        try:
            return datetime(int(m.group(3)), int(m.group(1)), int(m.group(2)), tzinfo=timezone.utc)
        except ValueError:
            pass
    return None


def _extract_date_from_text(text: str) -> Optional[datetime]:
    patterns = [
        r"(\w+ \d{1,2},?\s*\d{4})",
        r"(\d{1,2}/\d{1,2}/\d{4})",
    ]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            for fmt in ("%B %d, %Y", "%B %d %Y", "%m/%d/%Y"):
                try:
                    return datetime.strptime(m.group(1), fmt).replace(tzinfo=timezone.utc)
                except ValueError:
                    continue
    return None


def _guess_meeting_type(text: str) -> str:
    text_lower = text.lower()
    if "public hearing" in text_lower or "ph-" in text_lower:
        return "Public Hearing"
    if "worksession" in text_lower or "work session" in text_lower:
        return "Worksession"
    return "Regular Business"


async def _fetch_video_chapters(client: httpx.AsyncClient, url: str) -> list[dict]:
    """Try to extract chapter timestamps from the council meeting video page."""
    try:
        r = await client.get(url)
        r.raise_for_status()
        # Look for Swagit JSON manifest or chapter list
        chapters = _parse_swagit_chapters(r.text)
        return chapters
    except Exception:
        return []


def _parse_swagit_chapters(html: str) -> list[dict]:
    """Extract chapter markers from Swagit player HTML or embedded JSON."""
    chapters = []

    # Swagit embeds chapter data in a script tag as JSON
    json_match = re.search(r"chapters\s*[:=]\s*(\[.*?\])", html, re.S)
    if json_match:
        import json
        try:
            raw = json.loads(json_match.group(1))
            for ch in raw:
                chapters.append({
                    "title": ch.get("title", ""),
                    "timestamp": ch.get("time", ch.get("starttime", "")),
                    "url": ch.get("url", ""),
                })
            return chapters
        except Exception:
            pass

    # Fall back: look for timestamp-style links
    tree = HTMLParser(html)
    for a in tree.css("a.chapter, a[data-time], .agenda-item a"):
        title = a.text(strip=True)
        ts = a.attributes.get("data-time", "")
        href = a.attributes.get("href", "")
        if title and (ts or href):
            chapters.append({"title": title, "timestamp": ts, "url": href})

    return chapters


async def fetch_pdf_text(url: str) -> str:
    """Download a PDF and extract its text. Returns empty string on failure."""
    cache_key = f"pdf_{url}"
    cached = cache.get(cache_key)
    if cached:
        return cached.get("text", "")

    if not HAS_PDF:
        return ""

    try:
        async with httpx.AsyncClient(timeout=30, headers=HEADERS, follow_redirects=True) as client:
            r = await client.get(url)
            r.raise_for_status()
            pdf_bytes = r.content

        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            pages = []
            for page in pdf.pages[:30]:  # cap at 30 pages
                text = page.extract_text()
                if text:
                    pages.append(text)
            text = "\n\n".join(pages)

        cache.set(cache_key, {"text": text}, ttl=86400)
        return text
    except Exception as e:
        print(f"[college_park] PDF fetch error {url}: {e}")
        return ""


async def get_agenda_items(days: int = 21) -> list[dict]:
    """
    Return structured agenda items from recent meetings.
    Each item has: id, jurisdiction, meetingDate, meetingType, agendaText, minutesText,
    agendaUrl, minutesUrl, videoChapters.
    """
    meetings = await fetch_recent_meetings(days)
    items = []

    for meeting in meetings:
        agenda_text = ""
        minutes_text = ""

        if meeting.get("agendaUrl"):
            agenda_text = await fetch_pdf_text(meeting["agendaUrl"])
        if meeting.get("minutesUrl"):
            minutes_text = await fetch_pdf_text(meeting["minutesUrl"])

        # Parse agenda items from text
        raw_items = _split_agenda_items(agenda_text)
        for i, raw in enumerate(raw_items):
            items.append({
                "raw_id": f"cp-{meeting['date'].replace('-', '')}-{i+1:02d}",
                "jurisdiction": "City",
                "jurisdictionFull": "City of College Park",
                "meetingDate": meeting["date"],
                "meetingType": meeting["meetingType"],
                "agendaText": raw,
                "minutesText": _find_minutes_for_item(raw, minutes_text),
                "agendaUrl": meeting.get("agendaUrl", ""),
                "minutesUrl": meeting.get("minutesUrl", ""),
                "videoChapters": meeting.get("videoChapters", []),
                "sourcePage": i + 1,
            })

    return items


def _split_agenda_items(text: str) -> list[str]:
    """
    Split College Park agenda into substantive items.
    Looks for CivicEngage item codes like 26-G-38, 26-O-03, etc.
    """
    if not text:
        return []

    items = []

    # Primary: find items by CivicEngage code pattern (YY-LETTER-NUM)
    # e.g. "26-G-38 Approval of...", "26-O-03 Introduction of..."
    civic_pattern = re.compile(
        r"(\d{2}-[A-Z]+-\d+)\s+(.+?)(?=\n\d{2}-[A-Z]+-\d+|\Z)",
        re.S
    )
    for m in civic_pattern.finditer(text):
        item_id = m.group(1)
        body = m.group(2).strip()
        # Clean up body — remove trailing page numbers and footnotes
        body = re.sub(r"\s+\d{3}\s*$", "", body, flags=re.M).strip()
        body = re.sub(r"\n(Motion By:|2nd:|Vote:|Yeas:|Nays:).*", "", body, flags=re.S).strip()
        if len(body) > 30:
            items.append(f"{item_id} {body}")

    # If we got any civic-coded items, return those
    if items:
        return items[:15]

    # Fallback: split by ACTION ITEMS section headings
    action_match = re.search(r"(?:ACTION ITEMS?|CONSENT AGENDA)[:\s]*\n(.+?)(?=\n\d{1,2}\.|$)", text, re.S | re.I)
    if action_match:
        section = action_match.group(1)
        parts = re.split(r"(?:^|\n)\s*\d+\.", section, flags=re.M)
        items = [p.strip() for p in parts if len(p.strip()) > 60][:12]
        if items:
            return items

    # Last resort: numbered items
    pattern = r"(?:^|\n)\s*(?:\d+|[IVX]+)\s*[.):]\s+"
    parts = re.split(pattern, text, flags=re.MULTILINE)
    return [p.strip() for p in parts if len(p.strip()) > 80][:12]


def _find_minutes_for_item(item_text: str, minutes_text: str) -> str:
    """Try to find the relevant minutes passage for an agenda item."""
    if not minutes_text or not item_text:
        return ""

    # Extract a keyword from the item title (first 60 chars)
    keyword = re.sub(r"\s+", " ", item_text[:60]).strip()
    # Search for that block in minutes
    idx = minutes_text.lower().find(keyword[:30].lower())
    if idx == -1:
        return ""
    return minutes_text[max(0, idx - 50): idx + 600].strip()
