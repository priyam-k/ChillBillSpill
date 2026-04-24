// Mock briefing data for ChillBillSpill demo
// All names/jurisdictions reflect the real College Park, MD context per the prompt.
// Agenda items are demo content shaped to match real meeting patterns.

window.CBS_DATA = {
  user: {
    address: "4500 Knox Rd",
    city: "College Park, MD 20740",
    cityDistrict: 3,
    countyDistrict: 1,
    schoolDistrict: 3,
    coords: [38.9807, -76.9369]
  },

  meta: {
    days: 14,
    actions: 7,
    nextMeeting: {
      label: "Tuesday, Apr 28",
      time: "7:30 PM",
      where: "City Hall, 7401 Baltimore Ave",
      countdown: "4 days, 6 hours"
    },
    commentDeadline: "5:00 PM, Tue Apr 28",
    lastUpdated: "Apr 24, 11:42 AM"
  },

  councilmembers: [
    { name: "Fazlul Kabir", role: "Mayor", district: null, yours: false },
    { name: "Kate Kennedy", role: "Council", district: 1, yours: false },
    { name: "Jacob Hernandez", role: "Council", district: 1, yours: false },
    { name: "Llatetra B. Esters", role: "Council", district: 2, yours: false },
    { name: "Susan Whitney", role: "Council", district: 2, yours: false },
    { name: "Stuart Adams", role: "Council", district: 3, yours: true },
    { name: "Robert Day", role: "Council", district: 3, yours: true },
    { name: "Maria Mackie", role: "Council", district: 4, yours: false },
    { name: "Denise Mitchell", role: "Council", district: 4, yours: false }
  ],

  briefing: [
    {
      id: "cp-2026-042",
      jurisdiction: "City",
      jurisdictionFull: "City of College Park",
      tags: ["ZONING", "AFFECTS YOUR BLOCK"],
      category: "zoning",
      categoryEmoji: "🏗️",
      meetingDate: "Apr 22, 2026",
      meetingType: "Regular Business",
      headline: "Wellesley Dr sidewalk project — alignment selected",
      summary: "Council selected the preferred alignment for the Wellesley Drive Sidewalk Project (item 26-G-35), adding a new pedestrian connection through District 3. Construction RFP expected this summer.",
      vote: { result: "passed", yes: 7, no: 1, no_voters: ["Stuart Adams"] },
      dollarAmount: null,
      affectsScore: 9.1,
      affectsReason: "Wellesley Dr runs through District 3 — this sidewalk connects directly to your neighborhood.",
      videoTimestamp: "0:52:14",
      videoUrl: "https://www.collegeparkmd.gov/councilmeetings",
      videoWebsite: "https://www.collegeparkmd.gov/councilmeetings",
      sourceUrl: "https://www.collegeparkmd.gov/AgendaCenter/ViewFile/Agenda/_04222026-2248",
      sourceWebsite: "https://www.collegeparkmd.gov/agendacenter",
      sourcePage: 8,
      isYours: true,
      heat: "🔥🔥🔥"
    },
    {
      id: "cp-2025-043",
      jurisdiction: "City",
      jurisdictionFull: "City of College Park",
      tags: ["BUDGET"],
      category: "budget",
      categoryEmoji: "💰",
      meetingDate: "Apr 22, 2026",
      meetingType: "Regular Business",
      headline: "$2.4M for Hollywood corridor sidewalk repairs",
      summary: "Council approved a contract with KCI Technologies to rebuild ADA ramps and reset 1.8 miles of sidewalk along Rhode Island Ave between Edgewood and Cherokee. Work begins June 9.",
      vote: { result: "passed", yes: 8, no: 0, no_voters: [] },
      dollarAmount: "$2,412,000",
      affectsScore: 7.4,
      affectsReason: "Detours expected on your Sunday farmers' market route through July.",
      videoTimestamp: "0:47:22",
      videoUrl: "https://collegeparkmd.swagit.com/play/04222025",
      videoWebsite: "https://www.collegeparkmd.gov/councilmeetings",
      sourceUrl: "https://www.collegeparkmd.gov/AgendaCenter/ViewFile/Agenda/_04222026-2248",
      sourceWebsite: "https://www.collegeparkmd.gov/agendacenter",
      sourcePage: 6,
      isYours: false,
      heat: "🔥🔥"
    },
    {
      id: "pg-2026-CB-021",
      jurisdiction: "County",
      jurisdictionFull: "Prince George's County Council (sitting as District Council)",
      tags: ["ZONING", "DISTRICT 1", "AFFECTS YOUR BLOCK"],
      category: "zoning",
      categoryEmoji: "🗺️",
      meetingDate: "Apr 15, 2026",
      meetingType: "District Council",
      headline: "CB-021: Student housing height cap raised to 8 stories near UMD",
      summary: "Tom Dernoga (District 1 — your county rep) introduced CB-021, amending the U-Md Regional Issues Subarea height limit from 6 to 8 stories. Bill advances to public hearing May 6. Applies to parcels within the UMD Purple Line Transit District overlay.",
      vote: { result: "introduced", yes: null, no: null, no_voters: [] },
      dollarAmount: null,
      affectsScore: 8.3,
      affectsReason: "Three parcels within ¼ mile of Knox Rd become eligible for taller redevelopment if this passes.",
      videoTimestamp: "2:10:55",
      videoUrl: "https://princegeorgescountymd.granicus.com/ViewPublisher.php?view_id=2",
      videoWebsite: "https://princegeorgescountymd.granicus.com/ViewPublisher.php?view_id=2",
      sourceUrl: "https://princegeorgescountymd.legistar.com/Calendar.aspx",
      sourceWebsite: "https://princegeorgescountymd.legistar.com/Calendar.aspx",
      sourcePage: 22,
      isYours: true,
      heat: "🔥🔥🔥"
    },
    {
      id: "pg-2026-budget-pilot",
      jurisdiction: "County",
      jurisdictionFull: "Prince George's County Council",
      tags: ["BUDGET", "DISTRICT 1"],
      category: "budget",
      categoryEmoji: "💰",
      meetingDate: "Apr 8, 2026",
      meetingType: "Regular Session",
      headline: "$4.1M county pedestrian safety fund — CP gets 3 crossings",
      summary: "County Council approved a $4.1M pedestrian safety appropriation. College Park (District 1) is slated for upgraded crossings at Rt 1 & Paint Branch Pkwy, Rt 1 & Calvert Rd, and Knox Rd & Hartwick Rd.",
      vote: { result: "passed", yes: 8, no: 1, no_voters: ["Mel Franklin"] },
      dollarAmount: "$4,100,000",
      affectsScore: 7.6,
      affectsReason: "The Knox Rd & Hartwick Rd crossing is one block from your address.",
      videoTimestamp: "1:33:40",
      videoUrl: "https://princegeorgescountymd.granicus.com/ViewPublisher.php?view_id=2",
      videoWebsite: "https://princegeorgescountymd.granicus.com/ViewPublisher.php?view_id=2",
      sourceUrl: "https://princegeorgescountymd.legistar.com/Calendar.aspx",
      sourceWebsite: "https://princegeorgescountymd.legistar.com/Calendar.aspx",
      sourcePage: 11,
      isYours: true,
      heat: "🔥🔥"
    },
    {
      id: "pgcps-2026-bd-118",
      jurisdiction: "Schools",
      jurisdictionFull: "PGCPS Board of Education",
      tags: ["SCHOOLS"],
      category: "schools",
      categoryEmoji: "🎒",
      meetingDate: "Apr 17, 2026",
      meetingType: "Regular Meeting",
      headline: "Paint Branch Elementary boundary redrawn — 78 students reassigned",
      summary: "Board approved a boundary adjustment (9–4 vote) moving students west of Rhode Island Ave from Paint Branch to Hollywood Elementary, effective Aug 2026. One year of transition busing funded.",
      vote: { result: "passed", yes: 9, no: 4, no_voters: ["Edward Burroughs", "Lupi Quinteros-Grady", "Pamela Boozer-Strother", "Kenneth Harris II"] },
      dollarAmount: "$184,000",
      affectsScore: 6.2,
      affectsReason: "If you have an elementary-age kid west of RI Ave, their school assignment changes this fall.",
      videoTimestamp: "3:02:14",
      videoUrl: "https://go.boarddocs.com/mabe/pgcps/Board.nsf/Public",
      videoWebsite: "https://go.boarddocs.com/mabe/pgcps/Board.nsf/Public",
      sourceUrl: "https://go.boarddocs.com/mabe/pgcps/Board.nsf/Public",
      sourceWebsite: "https://go.boarddocs.com/mabe/pgcps/Board.nsf/Public",
      sourcePage: 31,
      isYours: false,
      heat: "🔥🔥"
    },
    {
      id: "pgcps-2026-fy27-budget",
      jurisdiction: "Schools",
      jurisdictionFull: "PGCPS Board of Education",
      tags: ["SCHOOLS", "BUDGET"],
      category: "budget",
      categoryEmoji: "💰",
      meetingDate: "Apr 10, 2026",
      meetingType: "Budget Work Session",
      headline: "PGCPS FY2027 budget — $3.1B proposed, 240 new teachers",
      summary: "Board of Education advanced the FY2027 operating budget request of $3.14B to the County Executive, including 240 new classroom positions and a 4% base salary increase for all staff.",
      vote: { result: "passed", yes: 12, no: 1, no_voters: ["Kenneth Harris II"] },
      dollarAmount: "$3,140,000,000",
      affectsScore: 5.8,
      affectsReason: "Parkdale High and Paint Branch Elementary (your zone) would each receive 6 additional teaching positions.",
      videoTimestamp: "0:44:10",
      videoUrl: "https://go.boarddocs.com/mabe/pgcps/Board.nsf/Public",
      videoWebsite: "https://go.boarddocs.com/mabe/pgcps/Board.nsf/Public",
      sourceUrl: "https://go.boarddocs.com/mabe/pgcps/Board.nsf/Public",
      sourceWebsite: "https://go.boarddocs.com/mabe/pgcps/Board.nsf/Public",
      sourcePage: 5,
      isYours: false,
      heat: "🔥🔥"
    },
    {
      id: "cp-2025-044",
      jurisdiction: "City",
      jurisdictionFull: "City of College Park",
      tags: ["TRANSPO"],
      category: "transportation",
      categoryEmoji: "🚲",
      meetingDate: "Apr 15, 2026",
      meetingType: "Worksession",
      headline: "Trolley Trail night lighting pilot — staff to draft RFP",
      summary: "Council directed staff to draft an RFP for solar bollard lighting between Lakeland Rd and Berwyn Heights, after 3 separate residents (incl. one from your district) testified about safety after dusk. No vote — direction only.",
      vote: { result: "direction", yes: null, no: null, no_voters: [] },
      dollarAmount: null,
      affectsScore: 5.5,
      affectsReason: "The trail is 2 blocks from your address — your evening commute is on the candidate stretch.",
      videoTimestamp: "1:55:40",
      videoUrl: "https://collegeparkmd.swagit.com/play/04152025",
      videoWebsite: "https://www.collegeparkmd.gov/councilmeetings",
      sourceUrl: "https://www.collegeparkmd.gov/AgendaCenter/ViewFile/Agenda/_04142026-2246",
      sourceWebsite: "https://www.collegeparkmd.gov/agendacenter",
      sourcePage: 9,
      isYours: false,
      heat: "🔥"
    }
  ],

  upcoming: [
    {
      id: "next-001",
      jurisdiction: "City",
      meetingDate: "Apr 28, 2026",
      time: "7:30 PM",
      headline: "FY2027 Operating Budget — introduction & public hearing",
      blurb: "Council introduces Ordinance 26-O-03 for the FY2027 Operating Budget and Capital Improvement Plan. Public hearing set for May 5, 2026 at 7:30 PM.",
      category: "budget",
      categoryEmoji: "💰",
      itemId: "26-O-03",
      hot: true,
      commentDeadline: "5:00 PM Tue Apr 28, 2026",
      agendaUrl: "https://www.collegeparkmd.gov/AgendaCenter/ViewFile/Agenda/_04282026-2252",
      sourceWebsite: "https://www.collegeparkmd.gov/agendacenter",
      videoWebsite: "https://www.collegeparkmd.gov/councilmeetings"
    },
    {
      id: "next-002",
      jurisdiction: "City",
      meetingDate: "Apr 28, 2026",
      time: "7:30 PM",
      headline: "Glassbox Padel Club — beer & wine license recommendation",
      blurb: "Council considers a letter to PG County supporting a Class D Beer & Wine license for Glassbox Padel Club at 4928 College Avenue. Requires a property use agreement.",
      category: "rules_admin",
      categoryEmoji: "🍺",
      itemId: "26-G-38",
      hot: false,
      commentDeadline: "5:00 PM Tue Apr 28, 2026",
      agendaUrl: "https://www.collegeparkmd.gov/AgendaCenter/ViewFile/Agenda/_04282026-2252",
      sourceWebsite: "https://www.collegeparkmd.gov/agendacenter",
      videoWebsite: "https://www.collegeparkmd.gov/councilmeetings"
    },
    {
      id: "next-003",
      jurisdiction: "City",
      meetingDate: "Apr 28, 2026",
      time: "7:30 PM",
      headline: "ADU Act response — letter to PG County Task Force",
      blurb: "Council votes on a letter to PG County's ADU Task Force outlining the city's position on the Maryland Accessory Dwelling Units Act of 2025 and how PG County should implement it.",
      category: "housing",
      categoryEmoji: "🏠",
      itemId: "26-G-37",
      hot: true,
      commentDeadline: "5:00 PM Tue Apr 28, 2026",
      agendaUrl: "https://www.collegeparkmd.gov/AgendaCenter/ViewFile/Agenda/_04282026-2252",
      sourceWebsite: "https://www.collegeparkmd.gov/agendacenter",
      videoWebsite: "https://www.collegeparkmd.gov/councilmeetings"
    },
    {
      id: "next-004",
      jurisdiction: "County",
      meetingDate: "May 6, 2026",
      time: "10:00 AM",
      headline: "CB-021 student housing height-cap — public hearing",
      blurb: "Your chance to weigh in on the 8-story student housing amendment before the final vote. Affects parcels near UMD within ¼ mile of your address.",
      category: "zoning",
      categoryEmoji: "🗺️",
      itemId: "CB-021",
      hot: true,
      commentDeadline: "9:00 AM Mon May 5, 2026",
      agendaUrl: "https://princegeorgescountymd.legistar.com/Calendar.aspx",
      sourceWebsite: "https://princegeorgescountymd.legistar.com/Calendar.aspx",
      videoWebsite: "https://princegeorgescountymd.granicus.com/ViewPublisher.php?view_id=2"
    }
  ],

  demoAddresses: [
    "4500 Knox Rd",
    "7401 Baltimore Ave",
    "7505 Yale Ave",
    "9200 Rhode Island Ave",
    "5010 Berwyn Rd",
    "4321 Hartwick Rd"
  ]
};

// Stash base data so address variants can reset cleanly
window._CBS_BASE_BRIEFING = window.CBS_DATA.briefing.slice();
window._CBS_BASE_USER = Object.assign({}, window.CBS_DATA.user);

// ── Address-specific overrides ──────────────────────────────────────────────
// Keyed by lowercase keyword. Applied by CBS_pickVariant() in app.jsx.
window.CBS_VARIANTS = {

  // 7401 Baltimore Ave — City Hall area, District 4
  "baltimore": {
    user: { address: "7401 Baltimore Ave", city: "College Park, MD 20740", cityDistrict: 4, countyDistrict: 1, schoolDistrict: 1 },
    extraBriefing: [
      {
        id: "cp-2026-downtown-parking",
        jurisdiction: "City", jurisdictionFull: "City of College Park",
        tags: ["AFFECTS YOUR BLOCK", "BUDGET"], category: "budget", categoryEmoji: "🅿️",
        meetingDate: "Apr 22, 2026", meetingType: "Regular Business",
        headline: "Downtown parking garage rate hike approved 7–1",
        summary: "Council approved raising Yale Ave garage rates from $1 to $2/hr peak, projecting $180K in annual new revenue toward downtown streetscape improvements.",
        vote: { result: "passed", yes: 7, no: 1, no_voters: ["Denise Mitchell"] },
        dollarAmount: "$180,000", affectsScore: 9.4,
        affectsReason: "Yale Ave garage is your closest parking — rates double starting June 1.",
        videoTimestamp: "1:08:22", videoUrl: "https://www.collegeparkmd.gov/councilmeetings",
        videoWebsite: "https://www.collegeparkmd.gov/councilmeetings",
        sourceUrl: "https://www.collegeparkmd.gov/AgendaCenter/ViewFile/Agenda/_04222026-2248",
        sourceWebsite: "https://www.collegeparkmd.gov/agendacenter",
        sourcePage: 18, isYours: true, heat: "🔥🔥🔥"
      },
      {
        id: "cp-2026-city-hall-annex",
        jurisdiction: "City", jurisdictionFull: "City of College Park",
        tags: ["AFFECTS YOUR BLOCK"], category: "budget", categoryEmoji: "🏛️",
        meetingDate: "Apr 7, 2026", meetingType: "Worksession",
        headline: "City Hall annex lease — $2.1M over 5 years authorized",
        summary: "Council authorized a 5-year lease for 4302 Baltimore Ave as an annex for permits and public works offices, consolidating services currently spread across 3 buildings.",
        vote: { result: "passed", yes: 8, no: 0, no_voters: [] },
        dollarAmount: "$2,100,000", affectsScore: 7.8,
        affectsReason: "New annex is 1 block from your address — expect increased foot traffic and parking demand.",
        videoTimestamp: "2:14:05", videoUrl: "https://www.collegeparkmd.gov/councilmeetings",
        videoWebsite: "https://www.collegeparkmd.gov/councilmeetings",
        sourceUrl: "https://www.collegeparkmd.gov/AgendaCenter/ViewFile/Agenda/_04072026-2235",
        sourceWebsite: "https://www.collegeparkmd.gov/agendacenter",
        sourcePage: 12, isYours: true, heat: "🔥🔥"
      }
    ]
  },

  // 7505 Yale Ave — District 4, near downtown
  "yale": {
    user: { address: "7505 Yale Ave", city: "College Park, MD 20740", cityDistrict: 4, countyDistrict: 1, schoolDistrict: 1 },
    extraBriefing: [
      {
        id: "cp-2026-yale-streetscape",
        jurisdiction: "City", jurisdictionFull: "City of College Park",
        tags: ["AFFECTS YOUR BLOCK", "TRANSPO"], category: "transportation", categoryEmoji: "🚶",
        meetingDate: "Apr 22, 2026", meetingType: "Regular Business",
        headline: "Yale Ave streetscape redesign — $890K contract awarded",
        summary: "Council awarded a contract to Greenman-Pedersen Inc for Yale Ave streetscape improvements including new lighting, benches, and ADA-compliant curb cuts between Guilford and Knox Rd.",
        vote: { result: "passed", yes: 8, no: 0, no_voters: [] },
        dollarAmount: "$890,000", affectsScore: 9.6,
        affectsReason: "Your block of Yale Ave is in the project scope — expect construction disruption starting July.",
        videoTimestamp: "1:41:30", videoUrl: "https://www.collegeparkmd.gov/councilmeetings",
        videoWebsite: "https://www.collegeparkmd.gov/councilmeetings",
        sourceUrl: "https://www.collegeparkmd.gov/AgendaCenter/ViewFile/Agenda/_04222026-2248",
        sourceWebsite: "https://www.collegeparkmd.gov/agendacenter",
        sourcePage: 21, isYours: true, heat: "🔥🔥🔥"
      }
    ]
  },

  // 9200 Rhode Island Ave — District 1, north CP
  "rhode island": {
    user: { address: "9200 Rhode Island Ave", city: "College Park, MD 20740", cityDistrict: 1, countyDistrict: 1, schoolDistrict: 1 },
    extraBriefing: [
      {
        id: "cp-2026-ri-ave-sidewalk",
        jurisdiction: "City", jurisdictionFull: "City of College Park",
        tags: ["AFFECTS YOUR BLOCK", "TRANSPO"], category: "transportation", categoryEmoji: "🚲",
        meetingDate: "Apr 22, 2026", meetingType: "Regular Business",
        headline: "$2.4M Hollywood corridor sidewalk rebuild approved",
        summary: "Council approved a contract with KCI Technologies to rebuild ADA ramps and reset 1.8 miles of sidewalk along Rhode Island Ave between Edgewood and Cherokee. Work begins June 9.",
        vote: { result: "passed", yes: 8, no: 0, no_voters: [] },
        dollarAmount: "$2,412,000", affectsScore: 9.7,
        affectsReason: "Construction runs directly in front of your block on Rhode Island Ave — expect June–August disruption.",
        videoTimestamp: "0:47:22", videoUrl: "https://www.collegeparkmd.gov/councilmeetings",
        videoWebsite: "https://www.collegeparkmd.gov/councilmeetings",
        sourceUrl: "https://www.collegeparkmd.gov/AgendaCenter/ViewFile/Agenda/_04222026-2248",
        sourceWebsite: "https://www.collegeparkmd.gov/agendacenter",
        sourcePage: 6, isYours: true, heat: "🔥🔥🔥"
      },
      {
        id: "pgcps-2026-cp-hs-rezoning",
        jurisdiction: "Schools", jurisdictionFull: "PGCPS Board of Education",
        tags: ["SCHOOLS", "AFFECTS YOUR BLOCK"], category: "schools", categoryEmoji: "🎒",
        meetingDate: "Apr 10, 2026", meetingType: "Budget Work Session",
        headline: "Parkdale HS capacity plan — 200-seat addition approved",
        summary: "Board approved a $14.8M design-build contract for a 200-seat addition at Parkdale High School, addressing enrollment that has exceeded capacity for 3 consecutive years.",
        vote: { result: "passed", yes: 11, no: 2, no_voters: ["Kenneth Harris II", "Edward Burroughs"] },
        dollarAmount: "$14,800,000", affectsScore: 7.9,
        affectsReason: "Parkdale High is the zoned school for your address — more seats means smaller classes.",
        videoTimestamp: "1:22:18", videoUrl: "https://go.boarddocs.com/mabe/pgcps/Board.nsf/Public",
        videoWebsite: "https://go.boarddocs.com/mabe/pgcps/Board.nsf/Public",
        sourceUrl: "https://go.boarddocs.com/mabe/pgcps/Board.nsf/Public",
        sourceWebsite: "https://go.boarddocs.com/mabe/pgcps/Board.nsf/Public",
        sourcePage: 9, isYours: true, heat: "🔥🔥"
      }
    ]
  },

  // 5010 Berwyn Rd / 4321 Hartwick Rd — District 2
  "berwyn": {
    user: { address: "5010 Berwyn Rd", city: "College Park, MD 20740", cityDistrict: 2, countyDistrict: 1, schoolDistrict: 3 },
    extraBriefing: [
      {
        id: "cp-2026-berwyn-trail",
        jurisdiction: "City", jurisdictionFull: "City of College Park",
        tags: ["AFFECTS YOUR BLOCK", "TRANSPO"], category: "transportation", categoryEmoji: "🚲",
        meetingDate: "Apr 15, 2026", meetingType: "Worksession",
        headline: "Trolley Trail solar lighting — Berwyn segment funded",
        summary: "Council directed staff to issue an RFP for solar bollard lighting on the Trolley Trail from Lakeland Rd to Berwyn Heights. District 2 reps Esters and Whitney co-sponsored after resident petitions.",
        vote: { result: "direction", yes: null, no: null, no_voters: [] },
        dollarAmount: null, affectsScore: 9.3,
        affectsReason: "The trail runs 2 blocks from your address — lighting covers your exact commute stretch.",
        videoTimestamp: "1:55:40", videoUrl: "https://www.collegeparkmd.gov/councilmeetings",
        videoWebsite: "https://www.collegeparkmd.gov/councilmeetings",
        sourceUrl: "https://www.collegeparkmd.gov/AgendaCenter/ViewFile/Agenda/_04142026-2246",
        sourceWebsite: "https://www.collegeparkmd.gov/agendacenter",
        sourcePage: 9, isYours: true, heat: "🔥🔥🔥"
      }
    ]
  },

  "hartwick": {
    user: { address: "4321 Hartwick Rd", city: "College Park, MD 20740", cityDistrict: 2, countyDistrict: 1, schoolDistrict: 3 },
    extraBriefing: [
      {
        id: "cp-2026-hartwick-parking",
        jurisdiction: "City", jurisdictionFull: "City of College Park",
        tags: ["AFFECTS YOUR BLOCK"], category: "zoning", categoryEmoji: "🏘️",
        meetingDate: "Apr 7, 2026", meetingType: "Regular Business",
        headline: "Hartwick Rd permit parking zone — petition approved",
        summary: "Council approved creation of a Residential Permit Parking zone on Hartwick Rd between Knox and Guilford in response to overflow parking from the Rt 1 corridor. Permits free for residents, $30/yr for guests.",
        vote: { result: "passed", yes: 7, no: 1, no_voters: ["Jacob Hernandez"] },
        dollarAmount: null, affectsScore: 9.5,
        affectsReason: "Your block is in the new permit zone — you'll need a sticker starting July 1.",
        videoTimestamp: "0:38:50", videoUrl: "https://www.collegeparkmd.gov/councilmeetings",
        videoWebsite: "https://www.collegeparkmd.gov/councilmeetings",
        sourceUrl: "https://www.collegeparkmd.gov/AgendaCenter/ViewFile/Agenda/_04072026-2235",
        sourceWebsite: "https://www.collegeparkmd.gov/agendacenter",
        sourcePage: 7, isYours: true, heat: "🔥🔥🔥"
      }
    ]
  }
};

// Call this with the submitted address to get a merged CBS_DATA
window.CBS_pickVariant = function(address) {
  const low = address.toLowerCase();
  const key = Object.keys(window.CBS_VARIANTS).find(k => low.includes(k));
  if (!key) return;
  const v = window.CBS_VARIANTS[key];
  if (v.user) Object.assign(window.CBS_DATA.user, v.user);
  if (v.extraBriefing) {
    // Prepend address-specific items, keep existing ones, cap at 7
    window.CBS_DATA.briefing = [...v.extraBriefing, ...window.CBS_DATA.briefing].slice(0, 7);
  }
};
