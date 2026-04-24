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
    actions: 5,
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
      id: "cp-2025-042",
      jurisdiction: "City",
      jurisdictionFull: "City of College Park",
      tags: ["ZONING", "AFFECTS YOUR BLOCK"],
      category: "zoning",
      categoryEmoji: "🏗️",
      meetingDate: "Apr 22, 2025",
      meetingType: "Regular Business",
      headline: "Knox Rd duplex conversion approved 6–2",
      summary: "Council voted to amend the R-55 overlay to allow up to two-unit conversions on lots over 6,000 sq ft within ½ mile of the Purple Line. Affects roughly 320 parcels, including most of your block on Knox Rd.",
      vote: { result: "passed", yes: 6, no: 2, no_voters: ["Stuart Adams", "Susan Whitney"] },
      dollarAmount: null,
      affectsScore: 9.2,
      affectsReason: "Your address sits inside the new overlay. Property tax assessments may shift in 12–18 months.",
      videoTimestamp: "1:24:08",
      videoUrl: "#",
      sourceUrl: "#",
      sourcePage: 14,
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
      meetingDate: "Apr 22, 2025",
      meetingType: "Regular Business",
      headline: "$2.4M for Hollywood corridor sidewalk repairs",
      summary: "Council approved a contract with KCI Technologies to rebuild ADA ramps and reset 1.8 miles of sidewalk along Rhode Island Ave between Edgewood and Cherokee. Work begins June 9.",
      vote: { result: "passed", yes: 8, no: 0, no_voters: [] },
      dollarAmount: "$2,412,000",
      affectsScore: 7.4,
      affectsReason: "Detours expected on your Sunday farmers' market route through July.",
      videoTimestamp: "0:47:22",
      videoUrl: "#",
      sourceUrl: "#",
      sourcePage: 6,
      isYours: false,
      heat: "🔥🔥"
    },
    {
      id: "pg-2025-CB-021",
      jurisdiction: "County",
      jurisdictionFull: "Prince George's County Council (sitting as District Council)",
      tags: ["ZONING", "DISTRICT 1"],
      category: "zoning",
      categoryEmoji: "🗺️",
      meetingDate: "Apr 15, 2025",
      meetingType: "District Council",
      headline: "CB-021: Student housing height cap raised to 8 stories",
      summary: "Tom Dernoga (your county rep) introduced and voted to advance an amendment lifting the height cap from 6 to 8 stories within the U-Md Regional Issues Subarea. Goes to public hearing May 6.",
      vote: { result: "introduced", yes: null, no: null, no_voters: [] },
      dollarAmount: null,
      affectsScore: 8.1,
      affectsReason: "Three parcels within ¼ mile of you become eligible for taller redevelopment.",
      videoTimestamp: "2:10:55",
      videoUrl: "#",
      sourceUrl: "#",
      sourcePage: 22,
      isYours: true,
      heat: "🔥🔥🔥"
    },
    {
      id: "pgcps-2025-bd-118",
      jurisdiction: "Schools",
      jurisdictionFull: "PGCPS Board of Education",
      tags: ["SCHOOLS"],
      category: "schools",
      categoryEmoji: "🎒",
      meetingDate: "Apr 17, 2025",
      meetingType: "Regular Meeting",
      headline: "Paint Branch Elementary boundary redrawn — 78 students reassigned",
      summary: "Board approved boundary adjustment moving students west of Rhode Island Ave from Paint Branch to Hollywood Elementary, effective Aug 2025. Transition transportation funded for one year.",
      vote: { result: "passed", yes: 9, no: 4, no_voters: ["Edward Burroughs", "Lupi Quinteros-Grady", "Pamela Boozer-Strother", "Kenneth Harris II"] },
      dollarAmount: "$184,000",
      affectsScore: 6.0,
      affectsReason: "If you have an elementary-age kid west of RI Ave, their school changes in fall.",
      videoTimestamp: "3:02:14",
      videoUrl: "#",
      sourceUrl: "#",
      sourcePage: 31,
      isYours: false,
      heat: "🔥"
    },
    {
      id: "cp-2025-044",
      jurisdiction: "City",
      jurisdictionFull: "City of College Park",
      tags: ["TRANSPO"],
      category: "transportation",
      categoryEmoji: "🚲",
      meetingDate: "Apr 15, 2025",
      meetingType: "Worksession",
      headline: "Trolley Trail night lighting pilot — staff to draft RFP",
      summary: "Council directed staff to draft an RFP for solar bollard lighting between Lakeland Rd and Berwyn Heights, after 3 separate residents (incl. one from your district) testified about safety after dusk. No vote — direction only.",
      vote: { result: "direction", yes: null, no: null, no_voters: [] },
      dollarAmount: null,
      affectsScore: 5.5,
      affectsReason: "The trail is 2 blocks from your address — your evening commute is on the candidate stretch.",
      videoTimestamp: "1:55:40",
      videoUrl: "#",
      sourceUrl: "#",
      sourcePage: 9,
      isYours: false,
      heat: "🔥"
    }
  ],

  upcoming: [
    {
      id: "next-001",
      jurisdiction: "City",
      meetingDate: "Apr 28, 2025",
      time: "7:30 PM",
      headline: "Public Hearing — short-term rental cap (Airbnb/VRBO)",
      blurb: "They'll decide whether to limit STRs to 90 nights/yr in single-family zones. Estimated 47 active listings affected.",
      category: "housing",
      categoryEmoji: "🏠",
      itemId: "PH-2025-04",
      hot: true,
      commentDeadline: "5:00 PM Tue Apr 28"
    },
    {
      id: "next-002",
      jurisdiction: "City",
      meetingDate: "Apr 28, 2025",
      time: "7:30 PM",
      headline: "FY26 budget — first reading",
      blurb: "$74.2M proposed. Property tax rate held flat at $0.3404. Public safety up 6%, parks up 14%.",
      category: "budget",
      categoryEmoji: "💰",
      itemId: "BUD-2025-01",
      hot: true,
      commentDeadline: "5:00 PM Tue Apr 28"
    },
    {
      id: "next-003",
      jurisdiction: "City",
      meetingDate: "Apr 28, 2025",
      time: "7:30 PM",
      headline: "Resolution — backyard chickens (yes really)",
      blurb: "Allows up to 4 hens, no roosters, 25-ft setback. Sponsored by Whitney (D2).",
      category: "rules_admin",
      categoryEmoji: "🐔",
      itemId: "RES-2025-12",
      hot: false,
      commentDeadline: "5:00 PM Tue Apr 28"
    },
    {
      id: "next-004",
      jurisdiction: "County",
      meetingDate: "May 6, 2025",
      time: "10:00 AM",
      headline: "CB-021 height-cap public hearing",
      blurb: "Your chance to weigh in on the 8-story student housing amendment before it gets a final vote.",
      category: "zoning",
      categoryEmoji: "🗺️",
      itemId: "CB-021",
      hot: true,
      commentDeadline: "9:00 AM Mon May 5"
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
