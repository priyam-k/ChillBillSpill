from typing import Optional

# Approximate College Park city boundary polygon (lon, lat)
# Based on MD iMap / City GIS — tighter than a simple bounding box to
# exclude Riverdale Park / Hyattsville on the east side.
# College Park's eastern edge is roughly Baltimore Ave / Kenilworth corridor.
COLLEGE_PARK_POLYGON = [
    (-76.9490, 38.9715),  # SW (Route 1 / Berwyn Heights border)
    (-76.9490, 39.0040),  # NW (Greenbelt north border)
    (-76.9090, 39.0040),  # NE (expanded east to capture Greenbelt Rd corridor)
    (-76.9090, 38.9870),  # East-central
    (-76.9170, 38.9715),  # SE (Baltimore Ave / Kenilworth Ave area)
]

# CP council districts — rough bounding boxes (hackathon accuracy)
# Source: https://www.collegeparkmd.gov/360/Mayor-Council
CP_DISTRICTS: dict[str, dict] = {
    "1": {"lat": (38.9715, 38.9800), "lon": (-76.9490, -76.9060)},  # South
    "2": {"lat": (38.9800, 38.9880), "lon": (-76.9490, -76.9275)},  # SW mid
    "3": {"lat": (38.9800, 38.9880), "lon": (-76.9275, -76.9060)},  # SE mid
    "4": {"lat": (38.9880, 38.9955), "lon": (-76.9490, -76.9060)},  # North
}

# District 2 representatives run a useful public digest
DISTRICT_DIGEST_URL = "https://cpdistrict2digest.com/"

# PG County Council: all of College Park is in District 1 (Tom Dernoga)
PG_COUNTY_DISTRICT = "1"


def _point_in_polygon(lon: float, lat: float, polygon: list[tuple]) -> bool:
    """Ray-casting algorithm for point-in-polygon test."""
    n = len(polygon)
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i]
        xj, yj = polygon[j]
        if ((yi > lat) != (yj > lat)) and (
            lon < (xj - xi) * (lat - yi) / (yj - yi) + xi
        ):
            inside = not inside
        j = i
    return inside


def is_in_college_park(lat: float, lon: float) -> bool:
    return _point_in_polygon(lon, lat, COLLEGE_PARK_POLYGON)


def get_cp_district(lat: float, lon: float) -> Optional[str]:
    for district, bounds in CP_DISTRICTS.items():
        lat_min, lat_max = bounds["lat"]
        lon_min, lon_max = bounds["lon"]
        if lat_min <= lat <= lat_max and lon_min <= lon <= lon_max:
            return district
    return None


def determine_jurisdictions(geo: Optional[dict]) -> list[str]:
    """
    Always returns pg_county and pgcps (entire PG County).
    Prepends college_park if the geocoded point is inside the CP boundary.
    """
    base = ["pg_county", "pgcps"]
    if not geo:
        return base
    if is_in_college_park(geo["lat"], geo["lon"]):
        return ["college_park"] + base
    return base


def normalize_address(address: str) -> str:
    return " ".join(address.strip().upper().split())
