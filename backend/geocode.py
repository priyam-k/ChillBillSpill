import httpx

CENSUS_URL = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


async def geocode(address: str) -> dict | None:
    """Try Census geocoder first, fall back to Nominatim."""
    result = await _census(address)
    if result:
        return result
    return await _nominatim(address)


async def _census(address: str) -> dict | None:
    params = {
        "address": address,
        "benchmark": "Public_AR_Current",
        "format": "json",
    }
    async with httpx.AsyncClient(timeout=10) as c:
        try:
            r = await c.get(CENSUS_URL, params=params)
            r.raise_for_status()
            matches = r.json().get("result", {}).get("addressMatches", [])
            if not matches:
                return None
            m = matches[0]
            comps = m.get("addressComponents", {})
            return {
                "matched_address": m["matchedAddress"],
                "lat": float(m["coordinates"]["y"]),
                "lon": float(m["coordinates"]["x"]),
                "zip": comps.get("zip", ""),
                "state": comps.get("state", ""),
                "city": comps.get("city", ""),
            }
        except Exception:
            return None


async def _nominatim(address: str) -> dict | None:
    params = {
        "q": address,
        "format": "json",
        "limit": 1,
        "countrycodes": "us",
    }
    headers = {"User-Agent": "ChillBillSpill/1.0 (hackathon demo)"}
    async with httpx.AsyncClient(timeout=10) as c:
        try:
            r = await c.get(NOMINATIM_URL, params=params, headers=headers)
            r.raise_for_status()
            results = r.json()
            if not results:
                return None
            res = results[0]
            return {
                "matched_address": res.get("display_name", address),
                "lat": float(res["lat"]),
                "lon": float(res["lon"]),
                "zip": "",
                "state": "",
                "city": "",
            }
        except Exception:
            return None
