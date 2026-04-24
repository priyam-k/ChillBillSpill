// Landing screen + Loading screen + Out-of-area state
const { useState: useStateL, useEffect: useEffectL } = React;

const Landing = ({ onSubmit }) => {
  const [addr, setAddr] = useStateL("");
  const [focused, setFocused] = useStateL(false);

  const tickerItems = [
    "your gov is doing things while you sleep",
    "type your address. spill ensues.",
    "free public comment, hot & ready",
    "no signups. no email harvest. no cap.",
    "hyper-local. hyper-cute. hyper-NOW.",
  ];

  return (
    <div className="bg-grid" style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <Marquee items={tickerItems} color="var(--ink)" textColor="var(--lime)" />

      {/* Floating stickers */}
      <FloatySticker top={120} left={40} rotate={-12} size={110} color="var(--magenta)" kind="blob"><span style={{ color: "white" }}>FREE<br/>4 U ★</span></FloatySticker>
      <FloatySticker top={420} left={80} rotate={8} size={86} color="var(--cyan)" kind="blob">REAL<br/>VOTES</FloatySticker>
      <FloatySticker top={620} left={30} rotate={-18} size={94} color="var(--lime)" kind="blob">no cap<br/>only data</FloatySticker>
      <FloatySticker top={170} right={70} rotate={14} size={120} color="var(--tangerine)" kind="blob"><span style={{ color: "white" }}>HOT<br/>NEAR<br/>U</span></FloatySticker>
      <FloatySticker top={500} right={50} rotate={-10} size={90} color="var(--lilac)" kind="blob">3 min<br/>read</FloatySticker>
      <FloatySticker top={730} right={120} rotate={6} size={70} color="var(--lime)" kind="star">★</FloatySticker>
      <FloatySticker top={300} right={220} rotate={-22} size={62} color="var(--magenta)" kind="star">★</FloatySticker>

      <div style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", padding: "60px 24px 80px" }}>
        {/* Logo */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="spin-slow" style={{ fontSize: 48 }}>★</div>
            <div>
              <div style={{ fontFamily: "var(--font-bungee)", fontSize: 28, lineHeight: 1 }}>
                ChillBillSpill
              </div>
              <div className="mono" style={{ fontSize: 11, opacity: .65 }}>
                chill · bills · spill · since right now
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge bg="var(--lime)">v0.1 BETA</Badge>
            <Badge bg="var(--cyan)">★ HACKATHON ‘26</Badge>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center mb-10 relative">
          <div style={{ position: "absolute", top: -20, left: "8%", transform: "rotate(-6deg)", zIndex: 1 }}>
            <Sticker kind="tag" color="var(--lime)" size="auto"><span style={{ padding: "0 8px" }}>★ COLLEGE PARK, MD ★</span></Sticker>
          </div>

          <h1 className="h-display" style={{ fontSize: "clamp(56px, 8vw, 120px)", margin: "20px 0 8px", textWrap: "balance", lineHeight: .9 }}>
            <span>WHAT DID YOUR </span>
            <span style={{ color: "var(--magenta)" }}>GOVERNMENT</span>
            <span> DO </span>
            <span style={{ background: "var(--lime)", padding: "0 .15em", border: "3px solid var(--ink)", display: "inline-block", transform: "rotate(-2deg)" }}>WHILE U</span>
            <span> WERE </span>
            <span className="scribble" style={{ color: "var(--tangerine)" }}>VIBING?</span>
          </h1>

          <p style={{ fontSize: 22, fontWeight: 500, marginTop: 16, maxWidth: 760, marginInline: "auto", textWrap: "pretty" }}>
            Type your address. Get a 3-minute spill on every vote, dollar &amp; zoning shenanigan that hit your block in the last 14 days. <span style={{ background: "var(--cyan)", padding: "0 4px" }}>Then yell back ★</span>
          </p>
        </div>

        {/* The big input */}
        <form className="relative" onSubmit={e => { e.preventDefault(); if (addr.trim()) onSubmit(addr.trim()); }}>
          <div className="relative" style={{ maxWidth: 820, margin: "0 auto" }}>
            <div style={{ position: "absolute", top: -32, left: -28, zIndex: 3, transform: "rotate(-12deg)" }} className="wobble">
              <Sticker kind="blob" color="var(--magenta)" textColor="white" size={92}>
                <span>TYPE<br/>HERE↓</span>
              </Sticker>
            </div>
            <div style={{ position: "absolute", top: -20, right: -10, zIndex: 3, transform: "rotate(8deg)" }}>
              <Sticker kind="tag" color="var(--lime)" size="auto"><span style={{ padding: "0 6px" }}>1 STEP. THAT'S IT.</span></Sticker>
            </div>

            <div className="relative">
              <input
                className="input-big"
                placeholder="4500 Knox Rd, College Park, MD 20740"
                value={addr}
                onChange={e => setAddr(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{ paddingRight: 200 }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", padding: "16px 22px", fontSize: 17 }}
                disabled={!addr.trim()}
              >
                SPILL IT ★
              </button>
            </div>

            {/* Demo addresses */}
            <div className="flex items-center gap-2 mt-4 flex-wrap" style={{ paddingLeft: 12 }}>
              <span className="mono" style={{ fontSize: 12, opacity: .55 }}>or try →</span>
              {window.CBS_DATA.demoAddresses.slice(0, 4).map(a => (
                <button key={a} type="button" className="btn" style={{ padding: "8px 14px", fontSize: 13, fontFamily: "var(--font-mono)" }} onClick={() => onSubmit(a)}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* What you get */}
        <div className="grid mt-16" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, maxWidth: 1000, marginInline: "auto" }}>
          {[
            { e: "🏛️", t: "City. County. Schools.", b: "All 3 layers, one feed. Real meetings, real votes.", c: "var(--magenta)" },
            { e: "📺", t: "Jump to the moment", b: "Skip the 3-hour video. Land at the timestamp that matters.", c: "var(--cyan)" },
            { e: "💌", t: "1-click public comment", b: "Pre-filled email to the right clerk. You write 1 sentence. Done.", c: "var(--lime)" },
          ].map((f, i) => (
            <div key={i} className="card p-6 relative" style={{ background: f.c, transform: `rotate(${i % 2 ? 1 : -1}deg)` }}>
              <div style={{ fontSize: 44 }}>{f.e}</div>
              <div className="h-chunk mt-2" style={{ fontSize: 22 }}>{f.t}</div>
              <div className="mt-1" style={{ fontSize: 14, lineHeight: 1.45 }}>{f.b}</div>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="text-center mt-14 mono" style={{ fontSize: 12, opacity: .55 }}>
          ★ no logins · no tracking · no email harvest · just public records, made fun ★
        </div>
      </div>
    </div>
  );
};

const LoadingScreen = ({ address, onDone }) => {
  const stages = [
    "📍 Geocoding ur address...",
    "🏛️ Pinging City of College Park...",
    "🗺️ Cracking open PG County Legistar...",
    "🎒 Sneaking into PGCPS BoardDocs...",
    "📄 Scraping 14 PDFs (fast we promise)...",
    "🤖 Asking Claude what u care abt...",
    "✨ Sprinkling chaos. Final boss: ur briefing."
  ];
  const [step, setStep] = useStateL(0);
  useEffectL(() => {
    if (step >= stages.length) { setTimeout(onDone, 380); return; }
    const t = setTimeout(() => setStep(step + 1), 320 + Math.random() * 220);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div className="bg-grid" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <FloatySticker top={60} left={60} rotate={-12} size={100} color="var(--magenta)" kind="blob" animate="wobble"><span style={{ color: "white" }}>BRB<br/>SPILLING</span></FloatySticker>
      <FloatySticker bottom={60} right={60} rotate={12} size={100} color="var(--cyan)" kind="blob" animate="wobble">hold<br/>tight ★</FloatySticker>

      <div className="card p-10 text-center" style={{ maxWidth: 560, background: "white" }}>
        <div className="spin-med inline-block" style={{ fontSize: 80 }}>★</div>
        <div className="h-display mt-3" style={{ fontSize: 44, lineHeight: 1 }}>SPILLING THE TEA</div>
        <div className="mono mt-2" style={{ fontSize: 12, opacity: .6 }}>📍 {address}</div>

        <div className="mt-6 receipt p-4 text-left" style={{ borderRadius: 6 }}>
          {stages.slice(0, step + 1).map((s, i) => (
            <div key={i} className="mono" style={{ fontSize: 13, lineHeight: 1.7, color: i === step ? "var(--magenta)" : "var(--ink)" }}>
              {i === step && step < stages.length ? "▸ " : "✓ "}{s}
            </div>
          ))}
        </div>

        <div className="mt-5" style={{ height: 14, background: "var(--butter)", border: "2.5px solid var(--ink)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, (step / stages.length) * 100)}%`, height: "100%", background: "linear-gradient(90deg, var(--lime), var(--tangerine), var(--magenta))", transition: "width .25s ease" }}/>
        </div>
      </div>
    </div>
  );
};

const OutOfArea = ({ address, onBack }) => (
  <div className="bg-grid" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
    <FloatySticker top={80} left={80} rotate={-8} size={100} color="var(--lime)" kind="blob">soon<br/>★</FloatySticker>
    <FloatySticker bottom={80} right={80} rotate={10} size={120} color="var(--lilac)" kind="blob">hold<br/>plz</FloatySticker>
    <div className="card p-10 text-center" style={{ maxWidth: 560 }}>
      <div style={{ fontSize: 84 }}>🫠</div>
      <div className="h-display mt-2" style={{ fontSize: 44, lineHeight: 1, textWrap: "balance" }}>NOT IN UR ZONE YET BBY</div>
      <p className="mt-3" style={{ fontSize: 16 }}>
        ChillBillSpill is hyper-locked to <strong>College Park, MD</strong> for the demo. We see u typed: <span className="mono" style={{ background: "var(--butter)", padding: "2px 6px", border: "1px dashed var(--ink)" }}>{address}</span>
      </p>
      <p className="mt-2" style={{ fontSize: 14, opacity: .7 }}>Cambridge, MA is next on the spill list. Sign up via vibes (we don't collect emails, deal with it).</p>
      <button className="btn btn-primary mt-5" onClick={onBack}>← try a CP address</button>
    </div>
  </div>
);

Object.assign(window, { Landing, LoadingScreen, OutOfArea });
