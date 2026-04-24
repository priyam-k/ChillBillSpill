from __future__ import annotations
import asyncio
import io
import re
from datetime import date, timedelta

from bs4 import BeautifulSoup

from .base import BaseScraper, classify_item_type, ScrapeSummary

BASE_URL = "https://www.collegeparkmd.gov"

BOILERPLATE = {
    "call to order", "pledge of allegiance", "approval of minutes",
    "adjournment", "invocation", "roll call", "open forum",
    "public comment", "approval of agenda", "executive session",
    "closed session", "recess", "new business", "old business",
    "council comments", "city manager comments", "mayor comments",
}


class CollegeParkScraper(BaseScraper):
    SOURCE = "college_park"
    BASE_URL = BASE_URL

    async def fetch_meetings(self, client, days_back: int = 90, days_forward: int = 14) -> list[dict]:
        today = date.today()
        cutoff_past   = today - timedelta(days=days_back)
        cutoff_future = today + timedelta(days=days_forward)

        meetings = {}
        for year in {today.year, today.year - 1, today.year + 1}:
            try:
                r = await client.get(f"{BASE_URL}/agendacenter", params={"term": str(year)})
                r.raise_for_status()
            except Exception:
                continue

            soup = BeautifulSoup(r.text, "lxml")
            for row in soup.select("tr.catAgendaRow"):
                # Find agenda link — href contains _MMDDYYYY-ID pattern
                a_tag = row.select_one("a[href*='ViewFile/Agenda']")
                if not a_tag:
                    continue
                href = a_tag.get("href", "")
                m = re.search(r"_(\d{8})-(\d+)", href)
                if not m:
                    continue
                date_str, source_id = m.group(1), m.group(2)
                try:
                    meeting_date = date(int(date_str[4:8]), int(date_str[:2]), int(date_str[2:4]))
                except ValueError:
                    continue

                if meeting_date < cutoff_past or meeting_date > cutoff_future:
                    continue

                # Title of the meeting
                title_text = a_tag.get_text(strip=True)

                # Minutes link
                min_tag = row.select_one("a[href*='ViewFile/Minutes']")
                minutes_url = (BASE_URL + min_tag["href"]) if min_tag else None

                key = (source_id, meeting_date.isoformat())
                if key not in meetings:
                    meetings[key] = {
                        "source": "college_park",
                        "source_id": source_id,
                        "body_name": title_text or "Mayor and Council",
                        "meeting_date": meeting_date.isoformat(),
                        "meeting_time": "7:30 PM",
                        "location": "City Hall Council Chambers",
                        "agenda_url": BASE_URL + href,
                        "minutes_url": minutes_url,
                        "video_url": None,
                        "scraped_at": date.today().isoformat(),
                    }

        return list(meetings.values())

    async def fetch_agenda_items(self, client, meeting: dict) -> list[dict]:
        if not meeting.get("agenda_url"):
            return []

        try:
            r = await client.get(meeting["agenda_url"])
            r.raise_for_status()
        except Exception:
            return []

        # Run PDF parsing in a thread to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        items = await loop.run_in_executor(None, _parse_cp_pdf, r.content, meeting.get("meeting_date", ""))

        # If minutes exist, merge in the text for vote-result extraction
        if meeting.get("minutes_url") and items:
            try:
                mr = await client.get(meeting["minutes_url"])
                mr.raise_for_status()
                minutes_text = await loop.run_in_executor(None, _extract_pdf_text, mr.content)
                # Attach minutes text to the last item so LLM can see votes
                items[-1]["raw_text"] = (items[-1].get("raw_text") or "") + "\n\nMINUTES EXCERPT:\n" + minutes_text[:4000]
            except Exception:
                pass

        return items


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            return "\n".join(p.extract_text() or "" for p in pdf.pages)
    except Exception:
        return ""


def _parse_cp_pdf(pdf_bytes: bytes, meeting_date: str) -> list[dict]:
    """
    Parse a College Park city council agenda PDF into agenda items.
    Agendas follow a Roman-numeral-then-alpha-subitem structure:
      I. CALL TO ORDER
      II. APPROVAL OF MINUTES
      III. PUBLIC HEARINGS
         A. Some Hearing Topic
      IV. NEW BUSINESS
         B. Some Budget Item
    """
    try:
        import pdfplumber
    except ImportError:
        return []

    try:
        full_text = _extract_pdf_text(pdf_bytes)
    except Exception:
        return []

    if not full_text.strip():
        return []

    lines = full_text.split("\n")
    items = []
    seq = 0
    current: dict | None = None

    # Patterns that start a new item
    ITEM_PAT = re.compile(r"^([IVX]+\.|[A-Z]\.|[0-9]+\.)\s+(.+)")
    # Section headers to skip entirely
    SKIP_PAT = re.compile(r"^(AGENDA|CITY OF COLLEGE PARK|MAYOR AND COUNCIL|MEETING DATE|PAGE)", re.I)

    for line in lines:
        line = line.strip()
        if not line or SKIP_PAT.match(line):
            if current:
                current["description"] = (current.get("description") or "") + " " + line
            continue

        m = ITEM_PAT.match(line)
        if m:
            if current and current["title"].lower() not in BOILERPLATE:
                items.append(current)
            seq += 1
            number = m.group(1).rstrip(".")
            title  = m.group(2).strip()
            current = {
                "seq": seq,
                "item_number": number,
                "title": title,
                "description": "",
                "item_type": classify_item_type(title),
                "document_url": None,
                "raw_text": line,
            }
        elif current:
            current["description"] = (current.get("description") or "") + " " + line
            current["raw_text"] = (current.get("raw_text") or "") + "\n" + line

    if current and current["title"].lower() not in BOILERPLATE:
        items.append(current)

    # Filter out boilerplate items
    return [
        i for i in items
        if i["title"].lower().strip() not in BOILERPLATE and len(i["title"]) > 3
    ]
