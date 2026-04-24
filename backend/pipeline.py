"""
Main pipeline: address → geocode → scrape → LLM → CBS_DATA response.
"""
import asyncio
from datetime import datetime, timedelta, timezone

import cache
import geocode as gc
import jurisdictions as jur
import llm
from scrapers import college_park, pg_county, pgcps

DAYS = 14
DEMO_ADDRESSES = [
    "4500 Knox Rd",
    "7401 Baltimore Ave",
    "7505 Yale Ave",
    "9200 Rhode Island Ave",
    "5010 Berwyn Rd",
    "4321 Hartwick Rd",
]

COUNCILMEMBERS = [
    {"name": "Fazlul Kabir", "role": "Mayor", "district": None, "yours": False},
    {"name": "Kate Kennedy", "role": "Council", "district": 1, "yours": False},
    {"name": "Jacob Hernandez", "role": "Council", "district": 1, "yours": False},
    {"name": "Llatetra B. Esters", "role": "Council", "district": 2, "yours": False},
    {"name": "Susan Whitney", "role": "Council", "district": 2, "yours": False},
    {"name": "Stuart Adams", "role": "Council", "district": 3, "yours": False},
    {"name": "Robert Day", "role": "Council", "district": 3, "yours": False},
    {"name": "Maria Mackie", "role": "Council", "district": 4, "yours": False},
    {"name": "Denise Mitchell", "role": "Council", "district": 4, "yours": False},
]


def _next_tuesday() -> datetime:
    now = datetime.now(timezone.utc)
    days_ahead = (1 - now.weekday()) % 7  # 1 = Tuesday
    if days_ahead == 0:
        days_ahead = 7
    return now + timedelta(days=days_ahead)


def _format_next_meeting() -> dict:
    next_tue = _next_tuesday()
    delta = next_tue - datetime.now(timezone.utc)
    days = delta.days
    hours = delta.seconds // 3600
    countdown = f"{days} day{'s' if days != 1 else ''}, {hours} hour{'s' if hours != 1 else ''}"
    return {
        "label": next_tue.strftime("%-d %B, %Y").replace(
            str(next_tue.day), next_tue.strftime("%-d")
        ),
        "time": "7:30 PM",
        "where": "City Hall, 7401 Baltimore Ave",
        "countdown": countdown,
        "isoDate": next_tue.date().isoformat(),
    }


def _normalize_address(address: str) -> str:
    """Ensure address includes College Park, MD so geocoder doesn't guess wrong city."""
    low = address.lower()
    if any(x in low for x in ["college park", "20740", "20741", "20742", "maryland", ", md"]):
        return address
    return f"{address}, College Park, MD 20740"


async def run_briefing(address: str) -> dict:
    """
    Full pipeline for a given address.
    Returns a CBS_DATA-shaped dict for the frontend.
    """
    pipeline_cache_key = f"pipeline_{address.lower().strip()}"
    cached = cache.get(pipeline_cache_key)
    if cached:
        return cached

    # 1. Geocode — normalize first so we don't geocode to Georgia
    geo = await gc.geocode(_normalize_address(address))
    if not geo:
        return _oos_response(address, "Could not geocode address")

    lat, lon = geo["lat"], geo["lon"]
    zip_code = geo.get("zip", "")

    # 2. Jurisdiction check
    resolved = jur.resolve(lat, lon, zip_code)
    if not resolved["in_college_park"]:
        return _oos_response(address, "Address outside College Park")

    city_district = resolved["city_district"]
    county_district = resolved["county_district"]
    pgcps_district = resolved["pgcps_district"]

    # Tag "yours" on councilmembers for this district
    members = [
        {**c, "yours": c["district"] == city_district or c["role"] == "Mayor"}
        for c in COUNCILMEMBERS
    ]

    # 3. Scrape all sources in parallel
    cp_items, pg_items, school_items = await asyncio.gather(
        college_park.get_agenda_items(DAYS),
        pg_county.get_agenda_items(DAYS),
        pgcps.get_agenda_items(DAYS),
        return_exceptions=True,
    )

    if isinstance(cp_items, Exception):
        print(f"[pipeline] CP scraper failed: {cp_items}")
        cp_items = []
    if isinstance(pg_items, Exception):
        print(f"[pipeline] PG scraper failed: {pg_items}")
        pg_items = []
    if isinstance(school_items, Exception):
        print(f"[pipeline] PGCPS scraper failed: {school_items}")
        school_items = []

    all_raw = list(cp_items) + list(pg_items) + list(school_items)

    # 4. LLM summarization — run concurrently (up to 12 items)
    items_to_process = all_raw[:12]
    summary_tasks = [
        llm.summarize_item(item, address, city_district)
        for item in items_to_process
    ]
    summaries = await asyncio.gather(*summary_tasks, return_exceptions=True)

    # 5. Build briefing cards
    cards = []
    for raw_item, summary in zip(items_to_process, summaries):
        if isinstance(summary, Exception) or summary is None:
            continue
        # Always include City items; filter others only if explicitly flagged irrelevant
        if raw_item.get("jurisdiction") != "City" and not summary.get("is_relevant_to_college_park", True):
            continue
        card = llm.item_to_card(
            raw_item,
            summary,
            source_url=raw_item.get("agendaUrl", "#"),
            video_chapters=raw_item.get("videoChapters", []),
        )
        cards.append(card)

    # Sort by affects_user_score descending, cap at 6
    cards.sort(key=lambda c: c["affectsScore"], reverse=True)
    briefing_cards = cards[:6]

    # 6. Build upcoming items from next agenda (future meetings)
    upcoming_items = await _build_upcoming(city_district)

    # 7. Briefing intro
    next_meeting = _format_next_meeting()
    n_actions = len(briefing_cards)

    if briefing_cards and n_actions > 0:
        intro = await llm.generate_briefing_intro(
            n_actions, DAYS, next_meeting["label"], briefing_cards
        )
    else:
        intro = f"In the last {DAYS} days, your local government has been active. Here's what you need to know."

    # 8. Quick stats
    total_dollars = sum(
        _parse_dollar(c.get("dollarAmount")) for c in briefing_cards
    )
    contested_votes = sum(
        1 for c in briefing_cards
        if c["vote"]["no_voters"] and len(c["vote"]["no_voters"]) > 0
    )

    result = {
        "user": {
            "address": address,
            "city": f"College Park, MD 20740",
            "cityDistrict": city_district,
            "countyDistrict": county_district,
            "schoolDistrict": pgcps_district,
            "coords": [lat, lon],
        },
        "meta": {
            "days": DAYS,
            "actions": n_actions,
            "intro": intro,
            "nextMeeting": next_meeting,
            "commentDeadline": f"5:00 PM, {next_meeting['label']}",
            "lastUpdated": datetime.now(timezone.utc).strftime("%-d %b, %-I:%M %p"),
            "stats": {
                "totalDollars": f"${total_dollars:,.0f}" if total_dollars else "$0",
                "contestedVotes": contested_votes,
                "upcomingItems": len(upcoming_items),
            },
        },
        "councilmembers": members,
        "briefing": briefing_cards,
        "upcoming": upcoming_items,
        "demoAddresses": DEMO_ADDRESSES,
    }

    # Cache final result for 30 minutes
    cache.set(pipeline_cache_key, result, ttl=1800)
    return result


async def _build_upcoming(city_district: int) -> list[dict]:
    """Fetch the next meeting agenda and build upcoming items."""
    next_meeting = _format_next_meeting()
    next_date = next_meeting["isoDate"]

    # Try to fetch upcoming CP agenda
    try:
        items = await college_park.fetch_recent_meetings(days=7)
        # Look for future meetings
        future = [m for m in items if m.get("date", "") >= next_date]
        if future and future[0].get("agendaUrl"):
            agenda_text = await college_park.fetch_pdf_text(future[0]["agendaUrl"])
            raw_items = college_park._split_agenda_items(agenda_text)
            upcoming = []
            for i, text in enumerate(raw_items[:5]):
                upcoming.append(_make_upcoming_item(text, i, next_date, next_meeting["label"]))
            if upcoming:
                return upcoming
    except Exception:
        pass

    # Fallback upcoming items (always useful for the demo)
    return _fallback_upcoming(next_date, next_meeting["label"])


def _make_upcoming_item(text: str, idx: int, date: str, date_label: str) -> dict:
    import re
    headline = re.sub(r"\s+", " ", text[:80]).strip()
    categories = ["housing", "budget", "zoning", "transportation", "rules_admin"]
    emojis = {"housing": "🏠", "budget": "💰", "zoning": "🗺️", "transportation": "🚲", "rules_admin": "📋"}
    cat = categories[idx % len(categories)]
    return {
        "id": f"next-{idx+1:03d}",
        "jurisdiction": "City",
        "meetingDate": date,
        "time": "7:30 PM",
        "headline": headline,
        "blurb": text[80:240].strip() or "Review and potential vote at this meeting.",
        "category": cat,
        "categoryEmoji": emojis.get(cat, "📍"),
        "itemId": f"ITEM-{idx+1:02d}",
        "hot": idx < 2,
        "commentDeadline": f"5:00 PM {date_label}",
    }


def _fallback_upcoming(date: str, date_label: str) -> list[dict]:
    return [
        {
            "id": "next-001",
            "jurisdiction": "City",
            "meetingDate": date,
            "time": "7:30 PM",
            "headline": "Public Hearing — short-term rental cap (Airbnb/VRBO)",
            "blurb": "Council will decide whether to limit STRs to 90 nights/yr in single-family zones.",
            "category": "housing",
            "categoryEmoji": "🏠",
            "itemId": "PH-2025-04",
            "hot": True,
            "commentDeadline": f"5:00 PM {date_label}",
        },
        {
            "id": "next-002",
            "jurisdiction": "City",
            "meetingDate": date,
            "time": "7:30 PM",
            "headline": "FY26 budget — first reading",
            "blurb": "$74.2M proposed. Property tax rate held flat at $0.3404. Public safety up 6%, parks up 14%.",
            "category": "budget",
            "categoryEmoji": "💰",
            "itemId": "BUD-2025-01",
            "hot": True,
            "commentDeadline": f"5:00 PM {date_label}",
        },
        {
            "id": "next-003",
            "jurisdiction": "City",
            "meetingDate": date,
            "time": "7:30 PM",
            "headline": "Resolution — backyard chickens (yes really)",
            "blurb": "Allows up to 4 hens, no roosters, 25-ft setback. Sponsored by Whitney (D2).",
            "category": "rules_admin",
            "categoryEmoji": "🐔",
            "itemId": "RES-2025-12",
            "hot": False,
            "commentDeadline": f"5:00 PM {date_label}",
        },
    ]


def _oos_response(address: str, reason: str) -> dict:
    return {
        "oos": True,
        "reason": reason,
        "user": {"address": address},
        "meta": {},
        "briefing": [],
        "upcoming": [],
        "demoAddresses": DEMO_ADDRESSES,
    }


def _parse_dollar(s: str | None) -> float:
    if not s:
        return 0.0
    import re
    m = re.search(r"[\d,]+", s.replace("$", ""))
    if m:
        try:
            return float(m.group().replace(",", ""))
        except ValueError:
            pass
    return 0.0
