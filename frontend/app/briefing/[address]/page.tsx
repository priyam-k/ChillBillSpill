"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import BriefingCard from "../../components/BriefingCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface BriefingItem {
  id: string;
  title: string;
  plain_english?: string;
  tags?: string[];
  relevance_score?: number;
  dollar_amount?: string;
  vote_result?: string;
  meeting_date?: string;
  body_name?: string;
  source?: string;
  agenda_url?: string;
  item_number?: string;
  item_type?: string;
  comment_payload?: {
    to: string;
    subject_template: string;
    body_template: string;
    deadline_note: string;
    meeting_date: string;
    item_number: string;
    item_title: string;
  } | null;
}

interface BriefingData {
  from_cache?: boolean;
  address_normalized?: string;
  cp_district?: string | null;
  jurisdictions?: string[];
  briefing_html?: string;
  items?: BriefingItem[];
  generated_at?: string;
  geocode_warning?: string | null;
  in_college_park?: boolean;
  message?: string;
  data_freshness?: Record<string, { last_run: string; status: string }>;
}

const JURISDICTION_LINKS = {
  college_park: { name: "City of College Park", url: "https://www.collegeparkmd.gov/agendacenter" },
  pg_county:    { name: "PG County Council", url: "https://princegeorgescountymd.legistar.com/Calendar.aspx" },
  pgcps:        { name: "PGCPS Board", url: "https://go.boarddocs.com/mabe/pgcps/Board.nsf/Public" },
};

function SkeletonCard() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-14 bg-slate-800 rounded-full" />
        <div className="h-5 w-10 bg-slate-800 rounded-full" />
      </div>
      <div className="h-5 bg-slate-800 rounded mb-2 w-3/4" />
      <div className="h-4 bg-slate-800 rounded mb-1" />
      <div className="h-4 bg-slate-800 rounded w-5/6" />
    </div>
  );
}

export default function BriefingPage() {
  const params = useParams();
  const router = useRouter();
  const address = decodeURIComponent(params.address as string);

  const [data, setData] = useState<BriefingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchBriefing = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/briefing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, days_back: 90, days_forward: 14 }),
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load briefing");
      } finally {
        setLoading(false);
      }
    };

    fetchBriefing();
  }, [address]);

  const today = new Date().toISOString().split("T")[0];
  const pastItems  = data?.items?.filter((i) => (i.meeting_date || "") <= today) || [];
  const futureItems = data?.items?.filter((i) => (i.meeting_date || "") > today) || [];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.push("/")} className="text-slate-400 hover:text-white text-sm">
          ← Back
        </button>
        <div className="flex-1 truncate">
          <span className="text-slate-400 text-sm">{address}</span>
          {data?.cp_district && (
            <span className="ml-2 text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded-full">
              District {data.cp_district}
            </span>
          )}
        </div>
        {data?.from_cache && (
          <span className="text-xs text-slate-600">cached</span>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* County-only notice (address is in PG County but not College Park city) */}
        {data && data.in_college_park === false && !data.message && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl">📍</span>
            <p className="text-slate-400 text-sm">
              This address is in Prince George's County but outside College Park city limits.
              Showing county and school board data only.
            </p>
          </div>
        )}

        {/* Completely outside service area */}
        {data?.message && (
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">📍</div>
            <h2 className="text-white font-bold text-lg mb-2">Outside service area</h2>
            <p className="text-slate-400 text-sm">{data.message}</p>
            <p className="text-slate-500 text-xs mt-4">Hearing currently supports College Park, MD and Prince George's County.</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-950 border border-red-800 rounded-2xl p-6">
            <h2 className="text-red-300 font-bold mb-2">Could not load briefing</h2>
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <p className="text-slate-500 text-sm">Browse the source sites directly:</p>
            <ul className="mt-2 space-y-1">
              {Object.values(JURISDICTION_LINKS).map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">
                    {l.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <>
            <div className="h-6 bg-slate-800 rounded w-3/4 animate-pulse" />
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </>
        )}

        {/* Geocode warning */}
        {data?.geocode_warning && (
          <div className="text-amber-400 text-xs bg-amber-950 border border-amber-800 rounded-lg px-3 py-2">
            ⚠ {data.geocode_warning}
          </div>
        )}

        {/* Stale data warning */}
        {data?.data_freshness && Object.entries(data.data_freshness).some(([, v]) => {
          if (!v.last_run) return true;
          const age = Date.now() - new Date(v.last_run).getTime();
          return age > 24 * 60 * 60 * 1000;
        }) && (
          <div className="text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
            ⏱ Some data sources may be outdated. Run <code className="text-slate-400">POST /api/refresh</code> to update.
          </div>
        )}

        {/* LLM briefing overview (parsed from HTML) */}
        {data?.briefing_html && (
          <div
            className="text-slate-300 text-base leading-relaxed [&_.overview]:text-lg [&_.overview]:text-white [&_.overview]:font-medium [&_.data-note]:text-slate-600 [&_.data-note]:text-xs [&_.item-card]:hidden"
            dangerouslySetInnerHTML={{ __html: extractOverviewParagraph(data.briefing_html) }}
          />
        )}

        {/* Recent items */}
        {pastItems.length > 0 && (
          <section>
            <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Recent — Last 90 days
            </h2>
            <div className="flex flex-col gap-3">
              {pastItems.map((item) => (
                <BriefingCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming items */}
        {futureItems.length > 0 && (
          <section>
            <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Coming Up — Next 14 days
            </h2>
            <div className="flex flex-col gap-3">
              {futureItems.map((item) => (
                <BriefingCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loading && !error && data && data.in_college_park !== false &&
          pastItems.length === 0 && futureItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-slate-400">No recent agenda items found for this address.</p>
            <p className="text-slate-600 text-sm mt-2">
              Try running <code className="text-slate-500">POST /api/refresh</code> to fetch fresh data.
            </p>
          </div>
        )}

        {/* Data note */}
        {data && (
          <p className="text-slate-700 text-xs text-center">
            Data sourced from official government websites.{" "}
            {data.generated_at && <>Last updated: {data.generated_at}.</>}
          </p>
        )}
      </div>
    </main>
  );
}

function extractOverviewParagraph(html: string): string {
  const match = html.match(/<p[^>]*class="overview"[^>]*>([\s\S]*?)<\/p>/i);
  return match ? match[0] : "";
}
