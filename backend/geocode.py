import httpx
from typing import Optional

CENSUS_GEOCODER_URL = (
    "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
)

HTTP_HEADERS = {
    "User-Agent": "Hearing/1.0 civic-research (contact: savartoteja@gmail.com)"
}


async def geocode_address(address: str) -> Optional[dict]:
    """
    Returns {"lat": float, "lon": float, "matched": str} or None.
    Uses the Census Geocoder — no API key required.
    """
    try:
        async with httpx.AsyncClient(
            timeout=20.0,
            headers=HTTP_HEADERS,
        ) as client:
            r = await client.get(
                CENSUS_GEOCODER_URL,
                params={"address": address, "benchmark": "2020", "format": "json"},
            )
        r.raise_for_status()
        matches = r.json().get("result", {}).get("addressMatches", [])
        if not matches:
            return None
        best = matches[0]
        coords = best["coordinates"]
        return {
            "lat": float(coords["y"]),
            "lon": float(coords["x"]),
            "matched": best.get("matchedAddress", address),
        }
    except Exception:
        return None
