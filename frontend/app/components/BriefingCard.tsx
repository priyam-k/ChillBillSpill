"use client";

import { useState } from "react";
import CommentComposer from "./CommentComposer";

interface Item {
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

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  college_park: { label: "City", color: "bg-blue-900 text-blue-200" },
  pg_county:    { label: "County", color: "bg-purple-900 text-purple-200" },
  pgcps:        { label: "Schools", color: "bg-green-900 text-green-200" },
};

const TYPE_ICONS: Record<string, string> = {
  zoning:        "🏗️",
  budget:        "💰",
  ordinance:     "📜",
  resolution:    "✅",
  public_hearing:"🎙️",
  transportation:"🚗",
  housing:       "🏠",
  parks:         "🌳",
  environment:   "🌿",
  personnel:     "👤",
  contracts:     "📋",
  other:         "📌",
};

function VoteResult({ result }: { result: string }) {
  const lower = result.toLowerCase();
  const passed = lower.includes("pass") || lower.includes("approv") || lower.includes("adopt");
  const failed = lower.includes("fail") || lower.includes("deni") || lower.includes("reject");
  const color = passed ? "text-green-400" : failed ? "text-red-400" : "text-slate-400";
  return <span className={`font-semibold ${color}`}>{result}</span>;
}

export default function BriefingCard({ item }: { item: Item }) {
  const [showComment, setShowComment] = useState(false);
  const srcInfo = SOURCE_LABELS[item.source || ""] || { label: "Gov", color: "bg-slate-700 text-slate-200" };
  const icon = TYPE_ICONS[item.item_type || ""] || "📌";
  const isUpcoming = item.comment_payload != null;

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${srcInfo.color}`}>
            {srcInfo.label}
          </span>
          <span className="text-sm">{icon}</span>
          {item.tags?.slice(0, 2).map((t) => (
            <span key={t} className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              {t}
            </span>
          ))}
          {isUpcoming && (
            <span className="text-xs bg-amber-900 text-amber-200 px-2 py-0.5 rounded-full ml-auto">
              Upcoming
            </span>
          )}
        </div>

        {/* Headline */}
        <h3 className="text-white font-semibold text-base leading-snug">
          {item.plain_english?.split(".")[0] || item.title}
        </h3>

        {/* Summary */}
        {item.plain_english && (
          <p className="text-slate-400 text-sm leading-relaxed">{item.plain_english}</p>
        )}

        {/* Vote + Dollar */}
        <div className="flex flex-wrap gap-4 text-sm">
          {item.vote_result && (
            <div>
              <span className="text-slate-500 mr-1">Result:</span>
              <VoteResult result={item.vote_result} />
            </div>
          )}
          {item.dollar_amount && (
            <div>
              <span className="text-slate-500 mr-1">Amount:</span>
              <span className="text-white font-bold">{item.dollar_amount}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{item.meeting_date}</span>
            {item.agenda_url && item.agenda_url !== "#" && (
              <a
                href={item.agenda_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                📄 Source
              </a>
            )}
          </div>
          {isUpcoming && item.comment_payload && (
            <button
              onClick={() => setShowComment(true)}
              className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              💬 Submit a comment
            </button>
          )}
        </div>
      </div>

      {showComment && item.comment_payload && (
        <CommentComposer
          payload={item.comment_payload}
          onClose={() => setShowComment(false)}
        />
      )}
    </>
  );
}
