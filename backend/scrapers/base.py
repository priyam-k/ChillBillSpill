import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


ITEM_TYPE_KEYWORDS = {
    "zoning":        ["zoning", "zone", "land use", "subdivision", "variance", "special exception", "pfa"],
    "budget":        ["budget", "appropriation", "fiscal", "revenue", "expenditure", "grant", "fee"],
    "ordinance":     ["ordinance", "ord."],
    "resolution":    ["resolution", "res."],
    "public_hearing":["public hearing", "hearing"],
    "transportation":["traffic", "road", "street", "highway", "transit", "parking", "bike", "pedestrian"],
    "housing":       ["affordable housing", "rental", "housing", "cdbg", "hud"],
    "parks":         ["park", "recreation", "trail", "open space", "playground"],
    "environment":   ["environment", "stormwater", "tree", "sustainability", "climate", "green"],
    "personnel":     ["personnel", "employment", "compensation", "salary", "hire", "appointment"],
    "contracts":     ["contract", "agreement", "bid", "procurement", "award"],
    "consent":       ["consent agenda", "consent calendar"],
    "presentation":  ["presentation", "report", "update", "briefing", "overview"],
}


def classify_item_type(text: str) -> str:
    t = text.lower()
    for item_type, keywords in ITEM_TYPE_KEYWORDS.items():
        if any(k in t for k in keywords):
            return item_type
    return "other"


@dataclass
class ScrapeSummary:
    source: str
    meetings_found: int = 0
    items_found: int = 0
    status: str = "ok"
    error: Optional[str] = None
    skipped_sources: list = field(default_factory=list)


class BaseScraper(ABC):
    SOURCE: str = ""
    BASE_URL: str = ""

    HTTP_HEADERS = {
        "User-Agent": "Hearing/1.0 civic-research (contact: savartoteja@gmail.com)",
        "Accept": "text/html,application/xhtml+xml,application/json,*/*",
    }

    @abstractmethod
    async def fetch_meetings(self, client, days_back: int = 90, days_forward: int = 14) -> list[dict]:
        ...

    @abstractmethod
    async def fetch_agenda_items(self, client, meeting: dict) -> list[dict]:
        ...

    async def run(self, conn, days_back: int = 90, days_forward: int = 14) -> ScrapeSummary:
        import httpx
        from backend.database import upsert_meeting, upsert_agenda_item, log_scrape

        summary = ScrapeSummary(source=self.SOURCE)
        try:
            async with httpx.AsyncClient(
                timeout=60.0,
                headers=self.HTTP_HEADERS,
                follow_redirects=True,
            ) as client:
                meetings = await self.fetch_meetings(client, days_back, days_forward)
                summary.meetings_found = len(meetings)

                for meeting in meetings:
                    mid = upsert_meeting(conn, meeting)
                    meeting["id"] = mid
                    try:
                        items = await self.fetch_agenda_items(client, meeting)
                        for item in items:
                            item["meeting_id"] = mid
                            upsert_agenda_item(conn, item)
                        summary.items_found += len(items)
                    except Exception as e:
                        summary.skipped_sources.append(f"{mid}: {e}")

                conn.commit()
            log_scrape(conn, self.SOURCE, "ok", summary.meetings_found, summary.items_found)

        except Exception as e:
            summary.status = "error"
            summary.error = str(e)[:300]
            log_scrape(conn, self.SOURCE, "error", error_msg=summary.error)

        return summary
