from __future__ import annotations
import asyncio
import json
import re
import sqlite3
from datetime import datetime, timezone
from typing import Optional

import anthropic

from .prompts import (
    ITEM_SUMMARY_SYSTEM,
    ITEM_SUMMARY_USER,
    BRIEFING_SYSTEM,
    BRIEFING_USER,
)

MODEL = "claude-sonnet-4-5"


def _strip_fences(text: str) -> str:
    return re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)


async def summarize_item(
    client: anthropic.AsyncAnthropic,
    conn: sqlite3.Connection,
    item: dict,
    meeting: dict,
) -> dict:
    """
    Summarize a single agenda item. Checks DB cache first.
    Returns the summary dict (with keys: plain_english, tags, relevance_map, dollar_amount, vote_result).
    Writes result to summaries table.
    Falls back to using item title as plain_english if LLM fails.
    """
    item_id = item.get("id") or f"{item.get('meeting_id')}_item_{item.get('seq')}"

    # Cache check
    cached = conn.execute("SELECT * FROM summaries WHERE id = ?", (item_id,)).fetchone()
    if cached:
        return dict(cached)

    raw_text = (item.get("raw_text") or item.get("title") or "")[:3500]
    user_msg = ITEM_SUMMARY_USER.format(
        source=meeting.get("source", ""),
        body_name=meeting.get("body_name", ""),
        meeting_date=meeting.get("meeting_date", ""),
        item_number=item.get("item_number") or "",
        title=item.get("title", ""),
        raw_text=raw_text,
    )

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=512,
            system=[
                {
                    "type": "text",
                    "text": ITEM_SUMMARY_SYSTEM,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = _strip_fences(response.content[0].text)
        parsed = json.loads(raw)
    except (json.JSONDecodeError, Exception):
        # Graceful fallback: use item title as summary
        parsed = {
            "plain_english": item.get("title", "")[:500],
            "tags": [item.get("item_type", "other")],
            "relevance_map": {"college_park": 0.5, "pg_county": 0.4, "pgcps": 0.2},
            "dollar_amount": None,
            "vote_result": None,
        }

    tags = parsed.get("tags", [])
    if isinstance(tags, str):
        tags = [tags]

    conn.execute(
        """
        INSERT OR REPLACE INTO summaries
        (id, meeting_id, plain_english, tags, relevance_map,
         dollar_amount, vote_result, model_used, summarized_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            item_id,
            item.get("meeting_id", ""),
            parsed.get("plain_english", item.get("title", "")),
            json.dumps(tags),
            json.dumps(parsed.get("relevance_map", {})),
            parsed.get("dollar_amount"),
            parsed.get("vote_result"),
            MODEL,
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    conn.commit()
    return parsed


async def generate_briefing(
    client: anthropic.AsyncAnthropic,
    address: str,
    cp_district: Optional[str],
    jurisdictions: list[str],
    top_items: list[dict],
) -> str:
    """
    Generate the personalized HTML briefing. Returns HTML string.
    """
    items_for_prompt = []
    for item in top_items[:20]:
        items_for_prompt.append({
            "title": item.get("title", ""),
            "plain_english": item.get("plain_english") or item.get("title", ""),
            "tags": json.loads(item.get("tags") or "[]") if isinstance(item.get("tags"), str) else (item.get("tags") or []),
            "relevance_score": item.get("relevance_score", 0.5),
            "dollar_amount": item.get("dollar_amount"),
            "vote_result": item.get("vote_result"),
            "meeting_date": item.get("meeting_date", ""),
            "body_name": item.get("body_name", ""),
            "source": item.get("source", ""),
            "agenda_url": item.get("agenda_url") or item.get("minutes_url") or "#",
            "item_number": item.get("item_number") or "",
            "item_type": item.get("item_type", "other"),
        })

    items_json = json.dumps(items_for_prompt, indent=2)[:12000]
    generated_at = datetime.now(timezone.utc).strftime("%B %d, %Y at %I:%M %p UTC")

    user_msg = BRIEFING_USER.format(
        address=address,
        cp_district=cp_district or "unknown",
        jurisdictions=", ".join(jurisdictions),
        items_json=items_json,
        generated_at=generated_at,
    )

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=[
                {
                    "type": "text",
                    "text": BRIEFING_SYSTEM,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user_msg}],
        )
        return response.content[0].text.strip()
    except Exception:
        # Fallback: generate simple HTML from items without LLM
        lines = [f"<p class='overview'>Here is your local government briefing.</p>"]
        for item in items_for_prompt[:8]:
            if not item.get("plain_english"):
                continue
            source_label = {"college_park": "City", "pg_county": "County", "pgcps": "Schools"}.get(
                item.get("source", ""), "Gov"
            )
            lines.append(
                f"<div class='item-card'>"
                f"<div class='item-badge'>{source_label}</div>"
                f"<h3 class='item-headline'>{item['title']}</h3>"
                f"<p class='item-summary'>{item['plain_english']}</p>"
                f"<p class='item-meta'>{item['meeting_date']}"
                f" <a href='{item['agenda_url']}' class='source-link'>📄 Source</a></p>"
                f"</div>"
            )
        lines.append(f"<p class='data-note'>Data sourced from official government websites. Last updated: {generated_at}.</p>")
        return "\n".join(lines)
