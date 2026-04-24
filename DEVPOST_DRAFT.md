# ChillBillSpill Devpost Draft

## Tagline
ChillBillSpill turns messy local government records into a 3-minute, address-based civic briefing with receipts, timestamps, and one-click public comment.

## Elevator Pitch
Most people do not ignore local government because they do not care. They ignore it because the information is buried in agenda PDFs, board portals, meeting videos, and legalese spread across city, county, and school systems.

ChillBillSpill makes local government impossible to sleep through. You type your address, and in seconds you get a hyper-local briefing of what happened in the last 14 days across the City of College Park, Prince George's County, and PGCPS. Every item is summarized in plain English, scored for how much it affects you, linked back to the source, and paired with a fast path to act.

## What It Does
ChillBillSpill gives residents a personalized government "spill" based on their actual address.

When a user enters an address, the app:

1. Geocodes the address and checks whether it is inside the College Park demo area.
2. Resolves the user's city, county, and school context.
3. Scrapes recent public records from multiple local government systems.
4. Uses Claude to turn dense agenda/minutes text into structured, plain-English summaries.
5. Ranks items by an "Affects-U Score" so the most relevant issues rise to the top.
6. Shows source-backed briefing cards with meeting type, vote result, dollar amounts, timestamps, and why the item matters to that specific resident.
7. Lets the user jump to the relevant meeting moment, inspect the "receipt," and draft a public comment email fast.

Key user-facing features:

- Address-based civic briefing for the last 14 days
- Coverage across city, county, and school governance
- Plain-English summaries of votes, budgets, zoning, and school items
- Source receipts for every claim
- Meeting video jump points
- Prefilled public comment flow
- Upcoming agenda items so users can react before decisions happen

## Why We Built It
Local government decides housing, school boundaries, spending, safety, transit, and zoning. But the interfaces for understanding those decisions are terrible. Important information is fragmented across PDFs, meeting calendars, livestream archives, and committee pages that almost no normal person has time to monitor.

We built ChillBillSpill to reduce the cost of civic awareness to basically zero. Instead of asking residents to become amateur clerks, we bring the relevant public record to them in a format they can actually use.

Our belief is simple: low local participation is often an information problem before it is an apathy problem.

## How We Built It
The app is a lightweight full-stack prototype built around a real public-record ingestion pipeline.

Frontend:

- React-based single-page interface
- Bold editorial/Y2K visual system for making civic information feel approachable instead of bureaucratic
- Screens for landing, loading, personalized briefing, receipts, and public comment

Backend:

- FastAPI server
- Address geocoding with the U.S. Census geocoder and OpenStreetMap Nominatim fallback
- Jurisdiction resolver for the College Park demo area
- Parallel scraping across three government data sources
- SQLite caching layer for scraped records and LLM output
- Claude-powered structured summarization pipeline

Data sources used in the prototype:

- City of College Park Agenda Center
- City of College Park council meeting video pages
- Prince George's County Legistar calendar and legislation pages
- Prince George's County Granicus meeting video publisher
- PGCPS BoardDocs public agenda system

AI layer:

- Claude reads agenda and minutes text and converts it into structured JSON
- The prompt is constrained to avoid fabrication of vote tallies, dollar amounts, names, and positions
- We generate a short personalized intro plus per-item summaries and relevance scoring

Output model:

- Headline
- Plain-English summary
- Vote result and opposition details when available
- Dollar amount when present
- Category
- Why it matters to the user
- Video timestamp when available
- Source links

## Challenges We Ran Into
- Local government data is fragmented across completely different systems with wildly different HTML and document structures.
- Some information is in PDFs, some in calendar pages, some in legislation detail views, and some in video systems.
- Matching real agenda items to useful resident-facing explanations without hallucinating facts required tight prompting and explicit guardrails.
- District boundaries and address relevance are hard to do perfectly in a hackathon setting, so we had to balance speed with enough geographic accuracy for a compelling demo.
- We wanted the product to feel fun and culturally alive without sacrificing trust or source transparency.

## What We're Proud Of
- We built a working end-to-end pipeline from address input to source-backed civic briefing.
- The app does not just summarize government activity; it personalizes it to a resident's block and district.
- We made public-record verification a first-class part of the UX through the receipts flow.
- We connected "what happened" to "what can I do now?" with video jump links and public comment drafting.
- We turned a boring civic workflow into something people might actually want to open.

## What We Learned
- Civic engagement tools need to be emotionally legible, not just technically correct.
- Trust comes from showing work, not just sounding authoritative.
- Hyperlocal relevance matters a lot. The difference between "city news" and "your block" changes whether someone cares.
- Government transparency products can borrow interaction patterns from media, shopping, and creator tools without becoming unserious.

## What's Next
- Expand beyond College Park into more municipalities
- Replace simplified district logic with parcel-grade mapping
- Improve timestamp extraction for county and school meeting videos
- Add stronger source linking for receipts and downloadable records
- Support text/email notifications for new agenda items that affect a user's address
- Add better public comment routing for multiple agencies and clerks
- Let users follow topics like housing, schools, transit, or zoning across time

## Built With
- FastAPI
- React
- Python
- Anthropic Claude
- httpx
- selectolax
- pdfplumber
- SQLite
- U.S. Census Geocoder
- OpenStreetMap Nominatim
- Legistar
- BoardDocs

## 30-Second Demo Script
Start on the landing page and say:

"Most people have no idea what local government did near them this week. ChillBillSpill fixes that in one step."

Then:

1. Enter a College Park address.
2. Show the loading pipeline scanning city, county, and school systems.
3. Land on the personalized briefing and highlight the total actions and next chance to comment.
4. Open one card and call out the plain-English summary plus the "Why U Care" explanation.
5. Open the receipt modal to show that claims map back to public records.
6. Open the comment flow and show how quickly someone can respond before the meeting.

Close with:

"We are not asking residents to read 200 pages of agenda PDFs. We are translating local government into something actionable, personal, and impossible to ignore."

## Suggested Submission Answers

### Inspiration
We were inspired by how important local government is and how inaccessible it still feels. Housing, school changes, spending, and zoning decisions shape daily life, but the information is trapped in fragmented public-record systems. We wanted to build something that makes civic awareness instant, local, and genuinely usable.

### What It Does
ChillBillSpill turns real local government records into a personalized, source-backed briefing. A resident enters their address and gets a fast summary of recent city, county, and school decisions that affect them, plus receipts, video jump points, and a quick path to submit public comment.

### How We Built It
We built a React frontend on top of a FastAPI backend that geocodes a user's address, resolves local jurisdiction, scrapes multiple government public-record systems, and uses Claude to summarize agenda and minutes text into structured civic briefings. We cache results in SQLite and present them in a playful but source-first interface.

### Challenges
The biggest challenge was normalizing messy public data across multiple government systems with different formats and levels of detail. We also had to keep the LLM grounded in source material and make the UX feel fun without weakening trust.

### Accomplishments
We shipped an end-to-end working prototype that connects real public records, address-level relevance, plain-English summaries, and civic action. We are especially proud of the receipts flow and the way the interface makes local government feel understandable instead of overwhelming.

### What We Learned
We learned that transparency alone is not enough. People need relevance, clarity, and timing. We also learned that trust improves when every summary is paired with a path back to the underlying source.

### What's Next
Next we want to expand geography, improve district precision, deepen meeting-video timestamping, and add recurring alerts for issues affecting a resident's address or favorite topics.

## Good Screenshot Order
1. Landing page hero
2. Personalized briefing hero with stats
3. Individual card with "Why U Care"
4. Receipts modal
5. Public comment modal

## Short One-Liners You Can Reuse
- Your government did something while you were vibing. We made sure you saw it.
- ChillBillSpill is a civic briefing app for people who do not have time to become policy analysts.
- We turn local public records into plain-English, address-based action.
- Hyperlocal civic transparency, with receipts.

## Honest Notes / Caveats
- The current demo is hyper-focused on College Park, Maryland.
- Some geographic logic is intentionally simplified for hackathon speed.
- County/school video deep-linking is less complete than the city flow.
- The prototype includes fallback demo data so the UI remains reliable during demos.
