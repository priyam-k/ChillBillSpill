"""
Determine College Park city district and other jurisdictions from coordinates.

College Park city districts (approximate polygon boundaries).
Source: https://www.collegeparkmd.gov/360/Mayor-Council

District boundaries are simplified rectangles for hackathon speed.
All of College Park is in PG County District 1 (Tom Dernoga) — hardcoded.
"""

# Approximate bounding box for each city council district
# Format: (lat_min, lat_max, lon_min, lon_max)
# Based on College Park city maps; rough but good enough for the demo.
CITY_DISTRICTS = {
    1: (38.9970, 39.0120, -76.9580, -76.9250),  # North College Park
    2: (38.9820, 38.9970, -76.9450, -76.9100),  # NE / Paint Branch
    3: (38.9650, 38.9820, -76.9550, -76.9250),  # Central / UMD area
    4: (38.9500, 38.9650, -76.9600, -76.9300),  # South College Park
}

# College Park bounding box
CP_BOUNDS = (38.9500, 39.0120, -76.9600, -76.9100)

# ZIP codes that are mostly or partly College Park
CP_ZIPS = {"20740", "20741", "20742"}

# PGCPS board district (coarse north-south split within CP)
PGCPS_DISTRICT_SPLIT_LAT = 38.985


def is_in_college_park(lat: float, lon: float, zip_code: str = "") -> bool:
    if zip_code and zip_code in CP_ZIPS:
        return True
    lat_min, lat_max, lon_min, lon_max = CP_BOUNDS
    return lat_min <= lat <= lat_max and lon_min <= lon <= lon_max


def get_city_district(lat: float, lon: float) -> int:
    """Return city council district 1-4, defaulting to 3 if unknown."""
    for district, (lat_min, lat_max, lon_min, lon_max) in CITY_DISTRICTS.items():
        if lat_min <= lat <= lat_max and lon_min <= lon <= lon_max:
            return district
    return 3


def get_county_district(_lat: float, _lon: float) -> int:
    # All of College Park is in PG County District 1
    return 1


def get_county_rep(_lat: float, _lon: float) -> str:
    return "Tom Dernoga"


def get_pgcps_district(lat: float, _lon: float) -> int:
    # Coarse north-south split
    return 1 if lat >= PGCPS_DISTRICT_SPLIT_LAT else 3


def resolve(lat: float, lon: float, zip_code: str = "") -> dict:
    return {
        "in_college_park": is_in_college_park(lat, lon, zip_code),
        "city_district": get_city_district(lat, lon),
        "county_district": get_county_district(lat, lon),
        "county_rep": get_county_rep(lat, lon),
        "pgcps_district": get_pgcps_district(lat, lon),
    }
