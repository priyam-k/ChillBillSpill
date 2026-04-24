from __future__ import annotations
import re
from datetime import date, timedelta

from bs4 import BeautifulSoup

from .base import BaseScraper, classify_item_type

BASE_URL = "https://princegeorgescountymd.legistar.com"

BOILERPLATE = {
    "call to order", "pledge of allegiance", "approval of minutes",
    "adjournment", "invocation", "roll call", "public comment",
    "approval of agenda", "executive session", "closed session",
    "moment of silence", "recess",
}

# Bodies that are most relevant to College Park residents
RELEVANT_BODIES = {
    "county council",
    "district council",   # zoning — critical for CP residents
    "planning board",
    "budget committee",
    "planning, zoning and economic development",
}


class PGCountyScraper(BaseScraper):
    SOURCE = "pg_county"
    BASE_URL = BASE_URL

    async def fetch_meetings(self, client, days_back: int = 90, days_forward: int = 14) -> list[dict]:
        today = date.today()
        cutoff_past   = today - timedelta(days=days_back)
        cutoff_future = today + timedelta(days=days_forward)

        try:
            r = await client.get(f"{BASE_URL}/Calendar.aspx")
            r.raise_for_status()
        except Exception:
            return []

        soup = BeautifulSoup(r.text, "lxml")
        table = soup.select_one("table.rgMasterTable")
        if not table:
            return []

        meetings = []
        for row in table.select("tr.rgRow, tr.rgAltRow"):
            cells = row.select("td")
            if len(cells) < 4:
                continue

            # Body name
            name_a = cells[0].select_one("a")
            body_name = name_a.get_text(strip=True) if name_a else cells[0].get_text(strip=True)

            # Only scrape bodies relevant to CP residents (or general county council)
            body_lower = body_name.lower()
            if not any(k in body_lower for k in RELEVANT_BODIES):
                continue

            # Date — in td.rgSorted or td[1]
            date_td = row.select_one("td.rgSorted") or (cells[1] if len(cells) > 1 else None)
            if not date_td:
                continue
            date_text = date_td.get_text(strip=True)
            try:
                meeting_date = date(*[int(x) for x in reversed(date_text.split("/"))])
            except (ValueError, AttributeError):
                # Try M/D/YYYY format
                try:
                    parts = date_text.split("/")
                    meeting_date = date(int(parts[2]), int(parts[0]), int(parts[1]))
                except Exception:
                    continue

            if meeting_date < cutoff_past or meeting_date > cutoff_future:
                continue

            # Time and location
            meeting_time = cells[3].get_text(strip=True) if len(cells) > 3 else None
            location = cells[4].get_text(strip=True) if len(cells) > 4 else None

            # Links — scan all <a> tags in the row
            agenda_url = minutes_url = video_url = source_id = None
            for a in row.select("a"):
                href = a.get("href", "")
                text = a.get_text(strip=True).lower()
                if "meetingdetail.aspx" in href.lower():
                    m = re.search(r"ID=(\d+)", href, re.I)
                    if m:
                        source_id = m.group(1)
                elif href.lower().startswith("view.ashx?m=a"):
                    agenda_url = BASE_URL + "/" + href
                elif href.lower().startswith("view.ashx?m=m"):
                    minutes_url = BASE_URL + "/" + href
                elif "video" in text and href:
                    video_url = href

            if not source_id:
                # Derive from the meeting detail link
                det_a = row.select_one("a[href*='MeetingDetail']")
                if det_a:
                    m2 = re.search(r"ID=(\d+)", det_a.get("href", ""), re.I)
                    if m2:
                        source_id = m2.group(1)

            if not source_id:
                continue

            # Tag District Council (zoning) meetings
            is_district_council = "district council" in body_lower
            meetings.append({
                "source": "pg_county",
                "source_id": source_id,
                "body_name": body_name + (" [ZONING]" if is_district_council else ""),
                "meeting_date": meeting_date.isoformat(),
                "meeting_time": meeting_time,
                "location": location,
                "agenda_url": agenda_url,
                "minutes_url": minutes_url,
                "video_url": video_url,
                "scraped_at": date.today().isoformat(),
            })

        return meetings

    async def fetch_agenda_items(self, client, meeting: dict) -> list[dict]:
        if not meeting.get("agenda_url"):
            return []

        try:
            r = await client.get(meeting["agenda_url"])
            r.raise_for_status()
        except Exception:
            return []

        content_type = r.headers.get("content-type", "")

        # Legistar View.ashx returns PDFs (not HTML as previously assumed)
        import asyncio as _asyncio
        loop = _asyncio.get_event_loop()

        if "pdf" in content_type.lower() or r.content[:4] == b"%PDF":
            items = await loop.run_in_executor(
                None, _parse_legistar_pdf, r.content, meeting
            )
        else:
            # Fallback: try to parse as HTML
            soup = BeautifulSoup(r.text, "lxml")
            items = _parse_legistar_agenda_html(soup, meeting)

        # If minutes exist, fetch them for vote information
        if meeting.get("minutes_url") and items:
            try:
                mr = await client.get(meeting["minutes_url"])
                mr.raise_for_status()
                minutes_text = await loop.run_in_executor(
                    None, _extract_pdf_text, mr.content
                )
                if minutes_text and items:
                    items[0]["raw_text"] = (
                        (items[0].get("raw_text") or "") +
                        "\n\nMINUTES TEXT:\n" + minutes_text[:4000]
                    )
            except Exception:
                pass

        return items


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    try:
        import pdfplumber, io
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            return "\n".join(p.extract_text() or "" for p in pdf.pages)
    except Exception:
        return ""


def _parse_legistar_pdf(pdf_bytes: bytes, meeting: dict) -> list[dict]:
    """
    Parse a Legistar agenda PDF.
    PG County agendas use numbered items like:
      1. CB-001-2026 - Some County Bill Title
      2. CR-010-2026 - Some Resolution
    """
    text = _extract_pdf_text(pdf_bytes)
    if not text.strip():
        return []

    body_name = meeting.get("body_name", "")
    is_district_council = "[ZONING]" in body_name

    items = []
    seq = 0
    lines = text.split("\n")

    # Pattern: numbered items, lettered sections, or "File #:" lines
    ITEM_PAT = re.compile(
        r"^(\d+\.|[A-Z]\.|[IVX]+\.|\(?[0-9]+\))"
        r"\s+(.{5,})"
    )
    # Also match PG County bill/resolution patterns
    BILL_PAT = re.compile(
        r"\b(CB|CR|PFA|DR|TR|PR|AP|RR|ZA|AN\s+ORDINANCE|AN\s+RESOLUTION|BILL)\b",
        re.I
    )
    SKIP_LINES = {
        "call to order", "pledge of allegiance", "invocation",
        "roll call", "approval of minutes", "adjournment",
        "public comment", "open forum", "recess",
        "county council", "prince george's county",
        "district council", "sitting as",
    }

    current: dict | None = None
    for line in lines:
        line = line.strip()
        if not line or len(line) < 4:
            if current:
                current["description"] = (current.get("description") or "") + " " + line
            continue

        if line.lower() in SKIP_LINES:
            continue

        m = ITEM_PAT.match(line)
        if m:
            if current and current["title"].lower() not in BOILERPLATE:
                items.append(current)
            seq += 1
            number = m.group(1).rstrip(".")
            title = m.group(2).strip()
            if title.lower() in BOILERPLATE:
                current = None
                continue
            item_type = "zoning" if is_district_council else classify_item_type(title)
            # Detect bill/resolution type from title
            if BILL_PAT.search(title) and item_type == "other":
                item_type = "ordinance"
            current = {
                "seq": seq,
                "item_number": number,
                "title": title[:500],
                "description": "",
                "item_type": item_type,
                "document_url": None,
                "raw_text": line,
            }
        elif current:
            current["description"] = (current.get("description") or "") + " " + line
            current["raw_text"] = (current.get("raw_text") or "") + "\n" + line
        elif BILL_PAT.search(line) and len(line) > 20:
            # Standalone bill reference line — create new item
            seq += 1
            current = {
                "seq": seq,
                "item_number": str(seq),
                "title": line[:500],
                "description": "",
                "item_type": "zoning" if is_district_council else classify_item_type(line),
                "document_url": None,
                "raw_text": line,
            }

    if current and current["title"].lower() not in BOILERPLATE:
        items.append(current)

    return [i for i in items if i["title"].lower().strip() not in BOILERPLATE and len(i["title"]) > 5]


def _parse_legistar_agenda_html(soup: BeautifulSoup, meeting: dict) -> list[dict]:
    """Fallback HTML parser for Legistar agendas."""
    items = []
    seq = 0
    body_name = meeting.get("body_name", "")
    is_district_council = "[ZONING]" in body_name

    rows = soup.select("tr.rgRow, tr.rgAltRow") or soup.select("table tr")

    for row in rows:
        cells = row.select("td")
        if len(cells) < 2:
            continue
        raw_texts = [c.get_text(" ", strip=True) for c in cells]
        if any(t.lower() in {"#", "file", "action", "result"} for t in raw_texts[:3]):
            continue
        title = max(raw_texts, key=len, default="").strip()
        if not title or len(title) < 4 or title.lower() in BOILERPLATE:
            continue
        item_number = raw_texts[0] if raw_texts and len(raw_texts[0]) < 15 else ""
        seq += 1
        full_text = " | ".join(raw_texts)
        item_type = "zoning" if is_district_council else classify_item_type(title + " " + full_text)
        items.append({
            "seq": seq,
            "item_number": item_number,
            "title": title[:500],
            "description": full_text[:2000],
            "item_type": item_type,
            "document_url": None,
            "raw_text": full_text[:3000],
        })

    return items
