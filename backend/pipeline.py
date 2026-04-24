"""
Orchestrates the full briefing pipeline:
  address → geocode → jurisdictions → DB items → summarize → briefing HTML
"""
from __future__ import annotations
import hashlib
import json
from typing import Optional

import anthropic

from backend.database import (
    get_connection,
    get_cached_briefing,
    get_items_for_briefing,
    write_briefing_cache,
    get_last_scrape_times,
)
from backend.geocode import geocode_address
from backend.jurisdictions import determine_jurisdictions, get_cp_district, normalize_address
from backend.llm.summarize import summarize_item, generate_briefing
from backend.composer import build_comment_payload


def _make_cache_key(address_normalized: str, days_back: int, days_forward: int) -> str:
    key = f"{address_normalized}_{days_back}_{days_forward}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]


def _score_items(items: list[dict], jurisdictions: list[str]) -> list[dict]:
    """
    Attach a relevance_score to each item based on the jurisdictions the
    user belongs to, then sort descending.
    """
    scored = []
    for item in items:
        rel_map = {}
        if item.get("relevance_map"):
            try:
                rel_map = json.loads(item["relevance_map"]) if isinstance(item["relevance_map"], str) else item["relevance_map"]
            except (json.JSONDecodeError, TypeError):
                rel_map = {}

        # Take the max relevance across jurisdictions the user is in
        # Default to 0.5 when no summary exists yet (unsummarized items pass through)
        scores = [rel_map.get(j, 0.0) for j in jurisdictions]
        score = max(scores) if any(s > 0 for s in scores) else 0.5
        scored.append({**item, "relevance_score": score})

    return sorted(scored, key=lambda x: x["relevance_score"], reverse=True)


async def run_briefing(
    address: str,
    days_back: int = 90,
    days_forward: int = 14,
    force_refresh: bool = False,
    llm_client: Optional[anthropic.AsyncAnthropic] = None,
) -> dict:
    """
    Main pipeline entry point. Returns a dict suitable for JSON serialization.
    """
    conn = get_connection()
    address_norm = normalize_address(address)
    cache_key = _make_cache_key(address_norm, days_back, days_forward)

    # 1. Cache check
    if not force_refresh:
        cached = get_cached_briefing(conn, cache_key)
        if cached:
            freshness = get_last_scrape_times(conn)
            cached_jurisdictions = json.loads(cached["jurisdictions"])
            conn.close()
            return {
                "from_cache": True,
                "in_college_park": "college_park" in cached_jurisdictions,
                "address_normalized": cached["address_normalized"],
                "lat": cached["lat"],
                "lon": cached["lon"],
                "cp_district": cached["cp_district"],
                "jurisdictions": cached_jurisdictions,
                "briefing_html": cached["briefing_html"],
                "items": json.loads(cached["items_json"]),
                "generated_at": cached["generated_at"],
                "data_freshness": freshness,
                "geocode_warning": None,
            }

    # 2. Geocode
    geo = await geocode_address(address)
    geocode_warning = None
    if not geo:
        geocode_warning = "Could not geolocate address; showing all jurisdictions."

    # 3. Jurisdiction + district
    jurisdictions = determine_jurisdictions(geo)
    cp_district = get_cp_district(geo["lat"], geo["lon"]) if geo and "college_park" in jurisdictions else None

    # Not in College Park at all?
    if "college_park" not in jurisdictions and not any(j in jurisdictions for j in ["pg_county", "pgcps"]):
        conn.close()
        return {
            "in_college_park": False,
            "address_normalized": address_norm,
            "message": "Hearing currently supports College Park, MD and Prince George's County.",
        }

    # 4. Pull items from DB
    raw_items = get_items_for_briefing(conn, jurisdictions, days_back, days_forward)

    # 5. Summarize any items missing summaries
    if llm_client and raw_items:
        unsummarized = [i for i in raw_items if not i.get("plain_english")]
        for item in unsummarized[:50]:  # cap to avoid runaway cost
            await summarize_item(llm_client, conn, item, item)
        # Re-fetch with summaries now populated
        raw_items = get_items_for_briefing(conn, jurisdictions, days_back, days_forward)

    # 6. Score + filter
    scored = _score_items(raw_items, jurisdictions)
    top_items = [i for i in scored if i.get("relevance_score", 0) >= 0.2][:20]

    # 7. Add comment payloads for items in the future (upcoming)
    from datetime import date
    today = date.today().isoformat()
    for item in top_items:
        if item.get("meeting_date", "") > today and item.get("source") == "college_park":
            item["comment_payload"] = build_comment_payload(
                meeting_id=item.get("meeting_id", ""),
                meeting_date=item.get("meeting_date", ""),
                item_number=item.get("item_number") or "",
                item_title=item.get("title", ""),
                cp_district=cp_district or "",
            )
        else:
            item["comment_payload"] = None

    # 8. Generate briefing HTML
    briefing_html = ""
    if llm_client:
        briefing_html = await generate_briefing(
            llm_client, address, cp_district, jurisdictions, top_items
        )
    else:
        briefing_html = _fallback_html(top_items)

    # 9. Cache
    items_json = json.dumps(top_items, default=str)
    write_briefing_cache(
        conn, cache_key, address, address_norm,
        geo["lat"] if geo else None,
        geo["lon"] if geo else None,
        cp_district, jurisdictions, briefing_html, items_json,
        ttl_hours=6,
    )

    freshness = get_last_scrape_times(conn)
    result = {
        "from_cache": False,
        "in_college_park": "college_park" in jurisdictions,
        "address_normalized": address_norm,
        "lat": geo["lat"] if geo else None,
        "lon": geo["lon"] if geo else None,
        "cp_district": cp_district,
        "jurisdictions": jurisdictions,
        "briefing_html": briefing_html,
        "items": top_items,
        "generated_at": None,
        "data_freshness": freshness,
        "geocode_warning": geocode_warning,
    }

    conn.close()
    return result


def _fallback_html(items: list[dict]) -> str:
    lines = ["<p class='overview'>Here is your local government briefing.</p>"]
    for item in items[:8]:
        source_label = {"college_park": "City", "pg_county": "County", "pgcps": "Schools"}.get(
            item.get("source", ""), "Gov"
        )
        summary = item.get("plain_english") or item.get("title", "")
        lines.append(
            f"<div class='item-card'>"
            f"<div class='item-badge'>{source_label}</div>"
            f"<h3 class='item-headline'>{item.get('title','')}</h3>"
            f"<p class='item-summary'>{summary}</p>"
            f"<p class='item-meta'>{item.get('meeting_date','')}"
            f" <a href='{item.get('agenda_url') or '#'}' class='source-link'>📄 Source</a></p>"
            f"</div>"
        )
    return "\n".join(lines)
