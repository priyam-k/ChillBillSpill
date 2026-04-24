#!/usr/bin/env python3
"""
Pre-warm the cache for demo addresses.
Run the night before the demo:
    python scripts/prefetch_demo.py
"""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from pipeline import run_briefing, DEMO_ADDRESSES

EXTRA_ADDRESSES = [
    "7401 Baltimore Ave, College Park, MD 20740",  # City Hall (safe demo address)
    "4500 Knox Rd, College Park, MD 20740",
    "7505 Yale Ave, College Park, MD 20740",
    "9200 Rhode Island Ave, College Park, MD 20740",
]

ALL = list(dict.fromkeys(DEMO_ADDRESSES + EXTRA_ADDRESSES))


async def prefetch():
    print(f"Pre-warming cache for {len(ALL)} addresses...\n")
    for addr in ALL:
        print(f"  → {addr}")
        try:
            result = await run_briefing(addr)
            n = len(result.get("briefing", []))
            print(f"     ✓ {n} briefing cards\n")
        except Exception as e:
            print(f"     ✗ error: {e}\n")


if __name__ == "__main__":
    asyncio.run(prefetch())
