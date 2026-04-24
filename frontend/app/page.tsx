"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    router.push(`/briefing/${encodeURIComponent(address.trim())}`);
  };

  const tryAddress = (addr: string) => {
    setAddress(addr);
    setLoading(true);
    router.push(`/briefing/${encodeURIComponent(addr)}`);
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white tracking-tight mb-3">
            Hearing
          </h1>
          <p className="text-slate-400 text-lg">
            What your local government did this week — and what's coming next.
          </p>
          <p className="text-slate-500 text-sm mt-2">
            College Park, MD · Prince George's County
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="7401 Baltimore Ave, College Park, MD 20740"
            className="flex-1 px-4 py-3 rounded-lg bg-slate-800 text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !address.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            {loading ? "Loading…" : "Get Briefing →"}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          <span className="text-slate-600 text-xs self-center">Try:</span>
          {["7401 Baltimore Ave, College Park, MD 20740", "4500 Knox Rd, College Park, MD 20740"].map((a) => (
            <button
              key={a}
              onClick={() => tryAddress(a)}
              className="text-xs text-blue-500 hover:text-blue-400 underline"
            >
              {a.split(",")[0]}
            </button>
          ))}
        </div>

        <p className="text-slate-600 text-xs text-center mt-4">
          Your address is used only to identify your council district. It is never stored.
        </p>

        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: "🏛️", label: "Real meetings", desc: "Actual agenda items, real votes" },
            { icon: "📄", label: "Source links", desc: "Every claim links to the official PDF" },
            { icon: "✉️", label: "1-click comment", desc: "Pre-drafted email to your clerk" },
          ].map((f) => (
            <div key={f.label} className="p-4 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-white text-sm font-medium">{f.label}</div>
              <div className="text-slate-500 text-xs mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
