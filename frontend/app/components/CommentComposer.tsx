"use client";

import { useState } from "react";

interface CommentPayload {
  to: string;
  subject_template: string;
  body_template: string;
  deadline_note: string;
  meeting_date: string;
  item_number: string;
  item_title: string;
}

export default function CommentComposer({
  payload,
  onClose,
}: {
  payload: CommentPayload;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);

  const body = payload.body_template
    .replace(/\[Your Name\]/g, name || "[Your Name]");

  const mailtoUrl =
    `mailto:${payload.to}` +
    `?subject=${encodeURIComponent(payload.subject_template)}` +
    `&body=${encodeURIComponent(body)}`;

  const handleCopy = async () => {
    const text = `To: ${payload.to}\nSubject: ${payload.subject_template}\n\n${body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">Submit a Public Comment</h2>
              <p className="text-amber-400 text-xs mt-1">⚠ {payload.deadline_note}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white text-xl leading-none ml-4"
            >
              ×
            </button>
          </div>

          {/* Name field */}
          <div>
            <label className="block text-slate-400 text-xs mb-1">Your name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Email fields */}
          <div className="bg-slate-800 rounded-xl p-4 font-mono text-xs space-y-2">
            <div>
              <span className="text-slate-500">To: </span>
              <span className="text-white">{payload.to}</span>
            </div>
            <div>
              <span className="text-slate-500">Subject: </span>
              <span className="text-white break-all">{payload.subject_template}</span>
            </div>
            <hr className="border-slate-700" />
            <pre className="text-slate-300 whitespace-pre-wrap font-mono text-xs leading-relaxed">
              {body}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <a
              href={mailtoUrl}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg text-center transition-colors"
            >
              Open in Mail
            </a>
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {copied ? "✓ Copied!" : "Copy to Clipboard"}
            </button>
          </div>

          <p className="text-slate-600 text-xs text-center">
            Sending to <strong className="text-slate-500">{payload.to}</strong> enters your comment into the official public record.
          </p>
        </div>
      </div>
    </div>
  );
}
