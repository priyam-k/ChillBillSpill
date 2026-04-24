"""
Pre-warm script: scrape all sources, summarize all items, pre-generate
briefings for sample College Park addresses.

Run with: python -m backend.prewarm
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv()

import anthropic

from backend.database import init_db, get_connection, get_items_for_briefing, BOILERPLATE_TITLES
from backend.scrapers.college_park import CollegeParkScraper
from backend.scrapers.pg_county import PGCountyScraper
from backend.scrapers.pgcps import PGCPSScraper
from backend.llm.summarize import summarize_item, generate_briefing
from backend.geocode import geocode_address
from backend.jurisdictions import determine_jurisdictions, get_cp_district, normalize_address
from backend.pipeline import _score_items, _make_cache_key
from backend.database import write_briefing_cache
from backend.composer import build_comment_payload

SAMPLE_ADDRESSES = [
    "7401 Baltimore Ave, College Park, MD 20740",      # City Hall — safe demo default
    "4500 Knox Rd, College Park, MD 20740",            # Knox Road / District 2
    "9200 Cherry Hill Rd, College Park, MD 20740",     # Cherry Hill
    "4706 College Ave, College Park, MD 20740",        # College Park town center
    "6001 Greenbelt Rd, College Park, MD 20740",       # Greenbelt Rd corridor
    "4400 Metzerott Rd, College Park, MD 20740",       # North CP
    "7100 Riverdale Rd, College Park, MD 20740",       # South CP
    "8001 Kenilworth Ave, Riverdale Park, MD 20737",   # Just outside CP boundary
    "9300 Lanham Severn Rd, Seabrook, MD 20706",       # PG County only
    "301 Largo Rd, Upper Marlboro, MD 20774",          # County seat
]


async def main():
    init_db()
    conn = get_connection()

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set. Skipping LLM steps.")
        llm = None
    else:
        llm = anthropic.AsyncAnthropic(api_key=api_key)

    # ── Phase 1: Scrape all sources ─────────────────────────────────────────
    print("\n═══ Phase 1: Scraping data sources ═══")
    scrapers = [CollegeParkScraper(), PGCountyScraper(), PGCPSScraper()]
    for scraper in scrapers:
        print(f"\n[{scraper.SOURCE}] Scraping...")
        try:
            summary = await scraper.run(conn, days_back=90)
            print(f"[{scraper.SOURCE}] {summary.meetings_found} meetings, "
                  f"{summary.items_found} items — status: {summary.status}")
            if summary.error:
                print(f"[{scraper.SOURCE}] Error: {summary.error}")
            if summary.skipped_sources:
                print(f"[{scraper.SOURCE}] Skipped: {summary.skipped_sources[:3]}")
        except Exception as e:
            print(f"[{scraper.SOURCE}] FAILED: {e}")

    # ── Phase 2: Summarize all unsummarized items ───────────────────────────
    if llm:
        print("\n═══ Phase 2: Summarizing agenda items ═══")
        rows = conn.execute(
            """
            SELECT ai.*, m.source, m.body_name, m.meeting_date
            FROM agenda_items ai
            JOIN meetings m ON m.id = ai.meeting_id
            LEFT JOIN summaries s ON s.id = ai.id
            WHERE s.id IS NULL
              AND LENGTH(ai.title) > 5
            ORDER BY m.meeting_date DESC
            """
        ).fetchall()

        items = [dict(r) for r in rows]
        # Filter boilerplate
        items = [i for i in items if i["title"].lower().strip() not in BOILERPLATE_TITLES]

        print(f"Found {len(items)} items to summarize")
        for idx, item in enumerate(items):
            try:
                await summarize_item(llm, conn, item, item)
                if (idx + 1) % 10 == 0:
                    print(f"  {idx + 1}/{len(items)} summarized...")
                await asyncio.sleep(0.05)  # gentle rate limiting
            except Exception as e:
                print(f"  [item {item.get('id')}] FAILED: {e}")
        print(f"  Done — {len(items)} items processed")
    else:
        print("\n[Phase 2 skipped — no ANTHROPIC_API_KEY]")

    # ── Phase 3: Pre-generate briefings for sample addresses ───────────────
    if llm:
        print("\n═══ Phase 3: Pre-warming briefings ═══")
        from datetime import date
        today = date.today().isoformat()

        for address in SAMPLE_ADDRESSES:
            print(f"\n  Pre-warming: {address}")
            try:
                geo = await geocode_address(address)
                if geo:
                    print(f"    Geocoded: ({geo['lat']:.4f}, {geo['lon']:.4f})")
                else:
                    print(f"    Geocode failed — using default jurisdictions")

                jurisdictions = determine_jurisdictions(geo)
                cp_district = get_cp_district(geo["lat"], geo["lon"]) if geo and "college_park" in jurisdictions else None
                print(f"    Jurisdictions: {jurisdictions}, CP district: {cp_district}")

                raw_items = get_items_for_briefing(conn, jurisdictions, 90, 14)
                print(f"    {len(raw_items)} items in date window")

                scored = _score_items(raw_items, jurisdictions)
                top_items = [i for i in scored if i.get("relevance_score", 0) >= 0.2][:20]

                # Add comment payloads for upcoming CP items
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

                briefing_html = await generate_briefing(llm, address, cp_district, jurisdictions, top_items)

                import json
                items_json = json.dumps(top_items, default=str)
                cache_key = _make_cache_key(normalize_address(address), 90, 14)
                write_briefing_cache(
                    conn, cache_key, address, normalize_address(address),
                    geo["lat"] if geo else None,
                    geo["lon"] if geo else None,
                    cp_district, jurisdictions, briefing_html, items_json,
                    ttl_hours=24,
                )
                print(f"    ✓ Briefing cached (key: {cache_key})")

            except Exception as e:
                print(f"    FAILED: {e}")
                import traceback
                traceback.print_exc()
    else:
        print("\n[Phase 3 skipped — no ANTHROPIC_API_KEY]")

    conn.close()
    print("\n═══ Pre-warm complete ═══\n")


if __name__ == "__main__":
    asyncio.run(main())
