"""
LLM pipeline using Anthropic Claude with prompt caching.

Two passes:
1. Per-item: agenda text → structured JSON summary
2. Briefing: top items → personalized intro paragraph
"""
import json
import os
import re
from typing import Any
import anthropic

import cache

MODEL = "claude-sonnet-4-6"
_client: anthropic.AsyncAnthropic | None = None


def get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not set")
        _client = anthropic.AsyncAnthropic(api_key=api_key)
    return _client


ITEM_SYSTEM = """You are a civic data analyst assistant for ChillBillSpill, a local government transparency tool.
Your job is to read raw agenda and minutes text from government meetings and return a structured JSON summary.

STRICT RULES:
- Never invent vote tallies, dollar amounts, councilmember names, or positions.
- If a fact isn't present in the provided text, use "unknown" or null.
- Keep all language plain English — no jargon, no legalese.
- Return ONLY valid JSON, no markdown fences, no extra text.

JSON schema to return:
{
  "headline": "<8-12 word plain English headline>",
  "summary": "<2-3 sentences plain English, no jargon>",
  "vote_result": "passed | failed | tabled | introduced | direction | unknown",
  "yes_votes": <number or null>,
  "no_votes": <number or null>,
  "no_voters": ["Last Name"],
  "dollar_amount": "<formatted string or null>",
  "affects_user_score": <0.0-10.0>,
  "affects_user_reason": "<1 sentence why this matters to a local resident>",
  "category": "zoning | budget | public_safety | transportation | housing | schools | parks_rec | rules_admin | other",
  "video_timestamp": "<HH:MM:SS or null>",
  "is_relevant_to_college_park": <true or false>
}"""


BRIEFING_SYSTEM = """You are the voice of ChillBillSpill — a civic transparency tool with Y2K mall-kiosk energy.
Write a short punchy intro for a personalized government briefing. Keep it under 40 words.
Return ONLY the intro sentence — no markdown, no extra text."""


async def summarize_item(item: dict, user_address: str, city_district: int) -> dict | None:
    """
    Call Claude to summarize one agenda item.
    Returns parsed JSON dict or None on failure.
    """
    cache_key = f"llm_item_{hash(item['raw_id'] + item['agendaText'][:100])}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    agenda_text = item.get("agendaText", "")[:3000]
    minutes_text = item.get("minutesText", "")[:2000]

    if not agenda_text.strip():
        return None

    user_context = (
        f"The user lives at {user_address}, City Council District {city_district}. "
        "Score affects_user_score higher if the item directly touches their neighborhood, district, or daily life."
    )

    prompt = f"""<user_context>{user_context}</user_context>

<agenda_text>
{agenda_text}
</agenda_text>

<minutes_text>
{minutes_text if minutes_text else "(minutes not yet available)"}
</minutes_text>

Summarize this agenda item following the JSON schema exactly."""

    try:
        client = get_client()
        msg = await client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=[
                {
                    "type": "text",
                    "text": ITEM_SYSTEM,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": prompt}],
        )
        text = msg.content[0].text.strip()
        # Strip any accidental markdown fences
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        result = json.loads(text)
        cache.set(cache_key, result, ttl=3600)
        return result
    except Exception as e:
        print(f"[llm] item summary error: {e}")
        return None


async def generate_briefing_intro(
    n_actions: int,
    days: int,
    next_meeting_label: str,
    items: list[dict],
) -> str:
    """Generate the hero intro sentence for the briefing page."""
    cache_key = f"llm_intro_{n_actions}_{days}_{next_meeting_label}"
    cached = cache.get(cache_key)
    if cached:
        return cached.get("text", "")

    headlines = "\n".join(f"- {it.get('headline', '')}" for it in items[:5])
    prompt = (
        f"Write the intro. Stats: {n_actions} government actions in {days} days. "
        f"Next meeting: {next_meeting_label}. "
        f"Top headlines:\n{headlines}"
    )

    try:
        client = get_client()
        msg = await client.messages.create(
            model=MODEL,
            max_tokens=80,
            system=[
                {
                    "type": "text",
                    "text": BRIEFING_SYSTEM,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": prompt}],
        )
        text = msg.content[0].text.strip()
        cache.set(cache_key, {"text": text}, ttl=3600)
        return text
    except Exception as e:
        print(f"[llm] briefing intro error: {e}")
        return f"In the last {days} days, your government took {n_actions} actions that affect you."


def item_to_card(raw_item: dict, summary: dict, source_url: str = "", video_chapters: list = []) -> dict:
    """Convert raw scraped item + LLM summary into a CBS_DATA briefing card."""
    vote_result = summary.get("vote_result", "unknown")
    yes_v = summary.get("yes_votes")
    no_v = summary.get("no_votes")

    # Find matching video chapter if available
    video_ts = summary.get("video_timestamp")
    video_url = raw_item.get("videoUrl", "#")
    if video_chapters and not video_ts:
        headline_lower = summary.get("headline", "").lower()
        for ch in video_chapters:
            if any(w in ch.get("title", "").lower() for w in headline_lower.split()[:4]):
                video_ts = ch.get("timestamp", "")
                if ch.get("url"):
                    video_url = ch["url"]
                break

    category = summary.get("category", "other")
    category_emoji = {
        "zoning": "🏗️",
        "budget": "💰",
        "transportation": "🚲",
        "housing": "🏠",
        "schools": "🎒",
        "public_safety": "🚨",
        "parks_rec": "🌳",
        "rules_admin": "📋",
        "other": "📍",
    }.get(category, "📍")

    affects_score = float(summary.get("affects_user_score", 5.0))
    heat = "🔥🔥🔥" if affects_score >= 8 else "🔥🔥" if affects_score >= 6 else "🔥"

    tags = list(raw_item.get("tags", []))
    jurisdiction = raw_item.get("jurisdiction", "City")
    if summary.get("category") == "zoning" and "ZONING" not in tags:
        tags.insert(0, "ZONING")

    # Determine deadline for comment
    comment_deadline = _next_meeting_deadline(raw_item.get("meetingDate", ""))

    return {
        "id": raw_item.get("raw_id", ""),
        "jurisdiction": jurisdiction,
        "jurisdictionFull": raw_item.get("jurisdictionFull", ""),
        "tags": tags,
        "category": category,
        "categoryEmoji": category_emoji,
        "meetingDate": _format_date(raw_item.get("meetingDate", "")),
        "meetingType": raw_item.get("meetingType", ""),
        "headline": summary.get("headline", ""),
        "summary": summary.get("summary", ""),
        "vote": {
            "result": vote_result,
            "yes": yes_v,
            "no": no_v,
            "no_voters": summary.get("no_voters", []),
        },
        "dollarAmount": summary.get("dollar_amount"),
        "affectsScore": affects_score,
        "affectsReason": summary.get("affects_user_reason", ""),
        "videoTimestamp": video_ts or "",
        "videoUrl": video_url or "#",
        "sourceUrl": source_url or raw_item.get("agendaUrl", "#"),
        "sourcePage": raw_item.get("sourcePage", 1),
        "isYours": affects_score >= 7.0,
        "heat": heat,
        "commentDeadline": comment_deadline,
    }


def _format_date(iso: str) -> str:
    try:
        from datetime import datetime
        d = datetime.fromisoformat(iso)
        return d.strftime("%b %-d, %Y")
    except Exception:
        return iso


def _next_meeting_deadline(meeting_date: str) -> str:
    return f"5:00 PM, {_format_date(meeting_date)}"
