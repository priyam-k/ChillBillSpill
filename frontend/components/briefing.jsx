// Briefing results screen — assembles header + cards + upcoming + footer
const { useState: useStateR, useMemo: useMemoR } = React;

const BriefingScreen = ({ user, onChangeAddress, onComment, onWatch, onSource }) => {
  const data = window.CBS_DATA;
  const [filter, setFilter] = useStateR("all");

  const visible = useMemoR(() => {
    if (filter === "all") return data.briefing;
    if (filter === "yours") return data.briefing.filter(b => b.isYours);
    return data.briefing.filter(b => b.jurisdiction.toLowerCase() === filter);
  }, [filter]);

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <Marquee items={[
        `★ ${data.meta.actions} new actions in last ${data.meta.days} days`,
        `next chance to talk back: ${data.meta.nextMeeting.label} ${data.meta.nextMeeting.time}`,
        "comment deadline: 5pm day-of",
        "your address loaded ✓",
        "everything below is real public record",
      ]} color="var(--magenta)" textColor="white" speed={50} />

      {/* Header */}
      <div style={{ borderBottom: "2.5px solid var(--ink)", background: "white" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div className="flex items-center gap-3">
            <div className="spin-slow" style={{ fontSize: 30 }}>★</div>
            <div style={{ fontFamily: "var(--font-bungee)", fontSize: 22 }}>ChillBillSpill</div>
          </div>
          <button className="btn" onClick={onChangeAddress} style={{ padding: "10px 16px", fontSize: 13 }}>
            📍 {user.address} <span className="mono" style={{ opacity: .5 }}>· change</span>
          </button>
        </div>
      </div>

      {/* HERO BRIEFING */}
      <div className="bg-stripes-soft" style={{ borderBottom: "2.5px solid var(--ink)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "44px 28px 56px", position: "relative" }}>
          <div style={{ position: "absolute", top: 24, right: 28, transform: "rotate(8deg)" }} className="wobble">
            <StarBurst color="var(--lime)" size={140} rotate={-6}>
              <span style={{ display: "block", fontSize: 24, fontFamily: "var(--font-bungee)" }}>FRESH</span>
              <span style={{ display: "block", fontSize: 11 }}>updated {data.meta.lastUpdated}</span>
            </StarBurst>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <Badge bg="var(--magenta)" color="white">YOUR BRIEFING</Badge>
            <Badge bg="var(--cyan)">DISTRICT {user.cityDistrict}</Badge>
            <Badge bg="var(--butter)">{data.meta.days} DAY SPILL</Badge>
          </div>

          <h1 className="h-display" style={{ fontSize: "clamp(40px, 6vw, 80px)", lineHeight: .95, margin: 0, maxWidth: 900, textWrap: "balance" }}>
            in the last {data.meta.days} days, ur gov took{" "}
            <span style={{ color: "var(--magenta)" }}>{data.meta.actions} actions</span>{" "}
            that{" "}
            <span style={{ background: "var(--lime)", padding: "0 .12em", border: "3px solid var(--ink)", display: "inline-block", transform: "rotate(-1deg)" }}>hit ur block</span>.
          </h1>

          <p style={{ fontSize: 20, marginTop: 16, fontWeight: 500, maxWidth: 720, textWrap: "pretty" }}>
            Next chance to weigh in: <strong>{data.meta.nextMeeting.label} @ {data.meta.nextMeeting.time}</strong>{" "}
            <span style={{ background: "var(--cyan)", padding: "0 4px", fontFamily: "var(--font-mono)", fontSize: 14 }}>⏰ in {data.meta.nextMeeting.countdown}</span>
          </p>

          {/* Quick stats */}
          <div className="grid mt-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, maxWidth: 880 }}>
            {[
              { v: "5", l: "actions affecting u", c: "var(--magenta)", tc: "white" },
              { v: "$2.6M", l: "spent / committed", c: "var(--lime)" },
              { v: "1", l: "vote against ur district", c: "var(--tangerine)", tc: "white" },
              { v: "4", l: "items up next Tue", c: "var(--cyan)" },
            ].map((s, i) => (
              <div key={i} className="card p-4" style={{ background: s.c, color: s.tc || "var(--ink)", transform: `rotate(${(i-1.5)*0.6}deg)` }}>
                <div style={{ fontFamily: "var(--font-bungee)", fontSize: 36, lineHeight: 1 }}>{s.v}</div>
                <div className="mono mt-1" style={{ fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", opacity: .85 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 28px 0", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, letterSpacing: ".06em", textTransform: "uppercase", opacity: .6, marginRight: 4 }}>spill type ↓</span>
        {[
          { id: "all", label: "everything ★", c: "var(--ink)", tc: "var(--lime)" },
          { id: "yours", label: "★ ur block", c: "var(--magenta)", tc: "white" },
          { id: "city", label: "🏛️ city", c: "white" },
          { id: "county", label: "🗺️ county", c: "white" },
          { id: "schools", label: "🎒 schools", c: "white" },
        ].map(f => {
          const active = filter === f.id;
          return (
            <button key={f.id} className="btn" style={{
              padding: "10px 16px", fontSize: 13,
              background: active ? f.c : "white",
              color: active ? (f.tc || "var(--ink)") : "var(--ink)",
              transform: active ? "translate(-1px, -1px)" : "none",
            }} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 28px 0" }}>
        {visible.map((item, i) => (
          <BriefingCard key={item.id} item={item} idx={i} onComment={onComment} onWatch={onWatch} onSource={onSource} />
        ))}
        {visible.length === 0 && (
          <div className="card p-10 text-center mb-10" style={{ background: "var(--butter)" }}>
            <div style={{ fontSize: 60 }}>😴</div>
            <div className="h-chunk mt-2" style={{ fontSize: 24 }}>nothing in this filter rn</div>
            <div className="mt-1" style={{ opacity: .65 }}>switch the spill type ↑</div>
          </div>
        )}
      </div>

      {/* COMING UP */}
      <div className="bg-checker" style={{ borderTop: "3px solid var(--ink)", borderBottom: "3px solid var(--ink)", padding: "10px 0", marginTop: 32 }} />
      <div style={{ background: "var(--ink)", color: "white", padding: "44px 28px 56px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge bg="var(--lime)">UPCOMING ★</Badge>
                <span className="mono" style={{ fontSize: 13, color: "var(--cyan)" }}>before u sleep on it</span>
              </div>
              <h2 className="h-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: 0, color: "white", lineHeight: .95 }}>
                COMING UP <span style={{ color: "var(--lime)" }}>NEXT TUE</span> ↓
              </h2>
              <p className="mt-2" style={{ fontSize: 17, color: "rgba(255,255,255,.8)" }}>
                Yell now while it still matters. Comment by 5PM the day-of.
              </p>
            </div>

            <div className="card p-4" style={{ background: "var(--lime)", color: "var(--ink)", minWidth: 240 }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: ".06em" }}>NEXT MEETING</div>
              <div style={{ fontFamily: "var(--font-bungee)", fontSize: 24, lineHeight: 1.05, marginTop: 4 }}>
                {data.meta.nextMeeting.label}
              </div>
              <div className="mono" style={{ fontSize: 13, marginTop: 4 }}>
                ⏰ {data.meta.nextMeeting.time}<br/>
                📍 {data.meta.nextMeeting.where}
              </div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 22 }}>
            {data.upcoming.map(item => (
              <UpcomingCard key={item.id} item={item} onComment={onComment} />
            ))}
          </div>
        </div>
      </div>

      {/* Civic vitals strip */}
      <div style={{ background: "var(--butter)", borderBottom: "2.5px solid var(--ink)", padding: "32px 28px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div className="flex items-center gap-3 mb-4">
            <Badge bg="var(--magenta)" color="white">UR REPS</Badge>
            <span className="mono" style={{ fontSize: 12, opacity: .6 }}>tap to email · all info verified Apr 24</span>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {data.councilmembers.filter(c => c.yours || c.role === "Mayor").slice(0, 4).map((c, i) => (
              <div key={c.name} className="card p-4" style={{ background: "white", transform: `rotate(${(i-1.5)*0.5}deg)` }}>
                <div className="bg-stripes" style={{ height: 68, border: "2px solid var(--ink)", borderRadius: 10, marginBottom: 10, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: "rgba(255,251,242,.5)" }}/>
                  <div className="mono absolute" style={{ left: 8, bottom: 6, fontSize: 9, background: "white", padding: "2px 6px", border: "1px solid var(--ink)", position: "absolute" }}>
                    [photo placeholder]
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16 }}>{c.name}</div>
                <div className="mono" style={{ fontSize: 11, opacity: .65 }}>
                  {c.role}{c.district ? ` · District ${c.district}` : ""}
                </div>
                {c.yours && <div className="mt-2"><Badge bg="var(--lime)">★ REPS U</Badge></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "var(--ink)", color: "white", padding: "40px 28px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 18, alignItems: "flex-end" }}>
          <div>
            <div className="flex items-center gap-3">
              <div className="spin-slow" style={{ fontSize: 32, color: "var(--lime)" }}>★</div>
              <div style={{ fontFamily: "var(--font-bungee)", fontSize: 28 }}>ChillBillSpill</div>
            </div>
            <p className="mt-3" style={{ fontSize: 14, color: "rgba(255,255,255,.7)", maxWidth: 460 }}>
              15% turnout in local elections isn't apathy. It's information cost. We just dropped it to zero ★
            </p>
          </div>
          <div className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,.5)", textAlign: "right", lineHeight: 1.7 }}>
            sources: collegeparkmd.gov · princegeorgescountymd.legistar.com · go.boarddocs.com/mabe/pgcps<br/>
            no fabrication policy · every claim links a real PDF<br/>
            built in 24h · powered by Anthropic
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { BriefingScreen });
