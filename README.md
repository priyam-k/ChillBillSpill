# ChillBillSpill

**Your government did something while you were vibing. We made sure you saw it.**

ChillBillSpill turns messy local government records into a 3-minute, address-based civic briefing — with receipts, vote results, timestamps, and one-click public comment.

<img width="2940" height="1466" alt="image" src="https://github.com/user-attachments/assets/da14bbba-bdc1-4874-8360-bc158c3a6d8b" />

### 

<img width="2940" height="1464" alt="image" src="https://github.com/user-attachments/assets/4c32cdab-55bd-4f8f-a81c-236833d094ee" />


---

## What It Does

Most people don't ignore local government because they don't care. They ignore it because the information is buried in agenda PDFs, board portals, meeting videos, and legalese fragmented across city, county, and school systems.

ChillBillSpill makes local government impossible to sleep through.

You type your address. In seconds you get a hyper-local briefing of what happened in the last 14 days across the City of College Park, Prince George's County, and PGCPS. Every item is summarized in plain English, scored for how much it affects *you*, linked back to the source, and paired with a fast path to act.

**Key features:**
- Address-based civic briefing covering the last 14 days
- Coverage across city, county, and school governance — personalized to your district
- Plain-English summaries of votes, budgets, zoning, and school board decisions
- Source receipts for every claim — no unverifiable summaries
- Meeting video jump points (straight to the relevant moment)
- Pre-filled public comment email with one click
- Upcoming agenda preview so you can react *before* decisions happen

---

## Demo

> Enter a College Park, MD address → see what your city, county, and school board did this week → read receipts → comment in 30 seconds.

**Try these addresses:**
- `4500 Knox Rd` — District 3
- `7401 Baltimore Ave` — District 4 (City Hall block)
- `9200 Rhode Island Ave` — District 1
- `5010 Berwyn Rd` — District 2

---

## How It Works

```
Address input
    → U.S. Census Geocoder + Nominatim fallback
    → Jurisdiction resolver (city district, county district, school cluster)
    → Parallel scrapers (City AgendaCenter PDFs, County Legistar, PGCPS BoardDocs)
    → Claude: agenda text → structured JSON (headline, summary, vote, dollar amount, why it matters)
    → Ranked briefing cards sorted by Affects-U Score
    → Source receipts + video jump links + public comment flow
```

### Frontend
- React 18 + Babel (no build step) — vanilla HTML, zero bundler overhead
- Y2K-inspired editorial design system — civic info that feels alive, not bureaucratic
- Address variants: different neighborhoods surface genuinely different cards

### Backend
- FastAPI serving both the API and static frontend
- Parallel async scrapers with SQLite caching (6hr TTL)
- `pdfplumber` for agenda/minutes PDF extraction
- `selectolax` for HTML parsing
- Claude with prompt caching for structured summarization

### AI Layer
Claude reads raw agenda and minutes text and returns structured JSON:

```json
{
  "headline": "...",
  "plain_summary": "...",
  "why_it_matters": "...",
  "vote": { "result": "Passed 7-2", "no_voters": ["Adams", "Day"] },
  "dollar_amount": "$2.4M",
  "category": "budget",
  "is_relevant_to_college_park": true
}
```

The prompt explicitly forbids fabricating vote tallies, dollar amounts, names, or positions not present in the source document.

### Data Sources
| Source | What We Scrape |
|--------|---------------|
| City of College Park AgendaCenter | Agenda + minutes PDFs, meeting calendar |
| City of College Park council video pages | Swagit chapter timestamps |
| Prince George's County Legistar | Legislation calendar and detail pages |
| Prince George's County Granicus | Meeting video publisher |
| PGCPS BoardDocs | Public agenda system |

---

## Running Locally

**Prerequisites:** Python 3.11+, an Anthropic API key

```bash
# Clone and set up
git clone https://github.com/priyam-k/ChillBillSpill.git
cd ChillBillSpill

# Add your API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# Start everything
./run.sh
```

Open `http://localhost:8000` — no build step, no npm.

`run.sh` creates a venv, installs deps from `requirements.txt`, loads `.env`, and starts the FastAPI server with hot reload.

---

## Project Structure

```
.
├── frontend/
│   ├── index.html          # Entry point — loads React/Babel/Tailwind from CDN
│   ├── data.js             # Mock data + address variants + CBS_DATA shape
│   ├── app.jsx             # App root — screen router + address submit flow
│   ├── styles.css          # Y2K design tokens + layout
│   └── components/
│       ├── cards.jsx       # Briefing cards, modals (comment, watch, source)
│       ├── landing.jsx     # Hero + address input
│       ├── loading.jsx     # Animated loading screen
│       ├── briefing.jsx    # Main briefing layout + stats
│       └── upcoming.jsx    # Upcoming agenda items
├── backend/
│   ├── main.py             # FastAPI app
│   ├── pipeline.py         # address → geocode → scrape → LLM → response
│   ├── llm.py              # Claude summarization + prompt caching
│   ├── geocode.py          # Census geocoder + Nominatim fallback
│   ├── jurisdictions.py    # District resolver
│   ├── cache.py            # SQLite TTL cache
│   └── scrapers/
│       ├── college_park.py # CivicEngage AgendaCenter + Swagit
│       ├── pg_county.py    # Legistar + Granicus
│       └── pgcps.py        # BoardDocs
├── run.sh
└── requirements.txt
```

---

## Challenges

- **Data fragmentation** — City, county, and school systems each use different platforms (CivicEngage, Legistar, BoardDocs) with wildly different HTML and document structures.
- **PDF parsing at scale** — Real agenda PDFs vary in formatting. We wrote custom item splitters keyed to CivicEngage item codes (`26-G-38`, `26-O-03`, etc.).
- **Keeping LLM outputs grounded** — Explicit hallucination guardrails in the prompt + source-linking in every card so users can verify every claim.
- **Geographic precision vs. speed** — District resolution in a hackathon required balancing bounding-box accuracy with real geocoding reliability.

---

## What's Next

- Expand beyond College Park to any municipality using CivicEngage, Legistar, or BoardDocs
- Parcel-grade address matching instead of bounding-box district resolution
- Recurring alerts: "something affecting your address just got added to the agenda"
- Topic following: housing, schools, transit, zoning — across time
- Deeper video timestamping for county and school board meetings
- Public comment routing to multiple agencies with one submission

---

## Built With

`FastAPI` · `React` · `Python` · `Anthropic Claude` · `httpx` · `selectolax` · `pdfplumber` · `SQLite` · `U.S. Census Geocoder` · `OpenStreetMap Nominatim`

---

*Hyperlocal civic transparency, with receipts.*
