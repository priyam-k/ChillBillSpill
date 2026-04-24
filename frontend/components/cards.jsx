// Briefing card + upcoming card + modals
const { useState: useStateB, useEffect: useEffectB } = React;

const BriefingCard = ({ item, idx, onWatch, onComment, onSource }) => {
  const tilt = idx % 2 === 0 ? -0.6 : 0.6;
  const accents = ["var(--magenta)", "var(--tangerine)", "var(--lime)", "var(--cyan)", "var(--lilac)"];
  const accent = accents[idx % accents.length];

  return (
    <div className="card" style={{ padding: 0, transform: `rotate(${tilt}deg)`, overflow: "hidden", marginBottom: 36 }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3" style={{ background: accent, borderBottom: "2.5px solid var(--ink)" }}>
        <div className="flex items-center gap-3 flex-wrap">
          <JurisdictionPill j={item.jurisdiction} />
          {item.tags.map(t => (
            <Badge key={t} bg="white">{t}</Badge>
          ))}
          {item.isYours && (
            <Badge bg="var(--ink)" color="var(--lime)" style={{ borderColor: "var(--ink)" }}>★ YOUR BLOCK</Badge>
          )}
        </div>
        <div className="mono" style={{ fontSize: 12, fontWeight: 700, opacity: .85 }}>
          {item.meetingDate} · {item.meetingType}
        </div>
      </div>

      {/* Body */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 220px", gap: 0 }}>
        <div style={{ padding: "28px 32px 28px 32px" }}>
          <div className="flex items-start gap-4 mb-4">
            <div style={{ fontSize: 44, lineHeight: 1, marginTop: 2 }}>{item.categoryEmoji}</div>
            <h2 className="h-chunk" style={{ fontSize: 36, lineHeight: 1.05, margin: 0, textWrap: "balance" }}>
              {item.headline}
            </h2>
          </div>

          <p style={{ fontSize: 17, lineHeight: 1.55, color: "var(--ink)", margin: "0 0 20px 0", maxWidth: 640 }}>
            {item.summary}
          </p>

          {/* "Why u care" callout */}
          <div className="flex gap-3 items-start p-4 rounded-2xl mb-5" style={{ background: "var(--butter)", border: "2.5px dashed var(--ink)" }}>
            <div style={{ fontSize: 24 }}>👀</div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>
                Why u care {item.heat}
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.45 }}>{item.affectsReason}</div>
            </div>
          </div>

          {/* Vote + dollar */}
          <div className="flex items-center gap-4 flex-wrap mb-5">
            <VoteChip vote={item.vote} />
            {item.vote.no_voters && item.vote.no_voters.length > 0 && (
              <div className="flex items-center gap-2" style={{ fontSize: 13 }}>
                <span className="mono" style={{ fontWeight: 700, color: "var(--magenta)" }}>NO →</span>
                <span style={{ fontWeight: 600 }}>{item.vote.no_voters.join(", ")}</span>
              </div>
            )}
            {item.dollarAmount && (
              <div className="px-4 py-2 rounded-xl" style={{ background: "var(--ink)", color: "var(--lime)", fontFamily: "var(--font-bungee)", fontSize: 22, border: "2.5px solid var(--ink)", boxShadow: "3px 3px 0 var(--magenta)" }}>
                {item.dollarAmount}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap">
            <button className="btn btn-chrome" onClick={() => onWatch(item)}>
              ▶ Watch this moment <span className="mono" style={{ fontSize: 13, opacity: .8 }}>{item.videoTimestamp}</span>
            </button>
            <button className="btn" onClick={() => onSource(item)}>
              📄 See receipt
            </button>
            <button className="btn btn-primary" onClick={() => onComment(item, "past")}>
              💬 React to this
            </button>
          </div>
        </div>

        {/* Right rail */}
        <div style={{ borderLeft: "2.5px solid var(--ink)", padding: "24px 20px", background: "#fffdf5", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>
              Affects-U Score
            </div>
            <div style={{ fontFamily: "var(--font-bungee)", fontSize: 56, lineHeight: 1, color: "var(--magenta)" }}>
              {item.affectsScore.toFixed(1)}
            </div>
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", opacity: .6 }}>OUT OF 10.0</div>
            <div className="mt-3"><HeatMeter score={item.affectsScore} /></div>
          </div>

          <div style={{ width: "100%", height: 2, background: "var(--ink)" }} />

          <div style={{ textAlign: "center", fontSize: 11, fontFamily: "var(--font-mono)", lineHeight: 1.5 }}>
            <div style={{ opacity: .6 }}>ITEM ID</div>
            <div style={{ fontWeight: 700 }}>{item.id}</div>
          </div>

          <Sticker kind="star" color={accent} size={70}>
            <span style={{ fontSize: 10, fontFamily: "var(--font-display)", fontWeight: 800, padding: "0 8px" }}>SPILLED ★ FRESH</span>
          </Sticker>
        </div>
      </div>
    </div>
  );
};

const UpcomingCard = ({ item, onComment }) => {
  const tilt = (Math.random() - 0.5) * 1.4;
  return (
    <div className="card relative" style={{ padding: "22px 24px", transform: `rotate(${tilt}deg)` }}>
      {item.hot && (
        <div style={{ position: "absolute", top: -16, right: -10, transform: "rotate(8deg)", zIndex: 2 }}>
          <Sticker kind="tag" color="var(--magenta)" textColor="white" size="auto">HOT TICKET ★</Sticker>
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <JurisdictionPill j={item.jurisdiction} />
        <Badge bg="var(--butter)">{item.itemId}</Badge>
      </div>
      <div className="flex items-start gap-3 mb-2">
        <div style={{ fontSize: 32 }}>{item.categoryEmoji}</div>
        <h3 className="h-chunk" style={{ fontSize: 22, lineHeight: 1.15, margin: 0 }}>{item.headline}</h3>
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 14, color: "var(--ink)" }}>{item.blurb}</p>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="mono" style={{ fontSize: 12 }}>
          <div style={{ opacity: .6 }}>COMMENT BY</div>
          <div style={{ fontWeight: 700, color: "var(--magenta)" }}>⏰ {item.commentDeadline}</div>
        </div>
        <button className="btn btn-primary" onClick={() => onComment(item, "upcoming")}>
          💬 Submit a comment
        </button>
      </div>
    </div>
  );
};

// ───── Comment composer modal ─────
const CommentModal = ({ item, mode, user, onClose }) => {
  const [name, setName] = useStateB("");
  const [body, setBody] = useStateB("");
  const [copied, setCopied] = useStateB(false);

  if (!item) return null;
  const meetingDate = mode === "upcoming" ? item.meetingDate : item.meetingDate;
  const itemId = mode === "upcoming" ? item.itemId : item.id;
  const subject = `Public Comment — ${meetingDate} — Agenda Item ${itemId}: ${item.headline}`;
  const to = "cpmc@collegeparkmd.gov";
  const district = user.cityDistrict;

  const template =
`Dear Mayor and Council,

My name is ${name || "[YOUR NAME]"} and I live at ${user.address} in District ${district}.

I am writing regarding ${item.headline}.

${body || "[ — write your comment here — ]"}

Thank you for entering this into the record.

Sincerely,
${name || "[YOUR NAME]"}`;

  const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(template)}`;

  const copy = () => {
    navigator.clipboard.writeText(`To: ${to}\nSubject: ${subject}\n\n${template}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "2.5px solid var(--ink)", background: "var(--magenta)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "20px 20px 0 0" }}>
          <div className="flex items-center gap-3">
            <div style={{ fontSize: 32 }}>💌</div>
            <div>
              <div style={{ fontFamily: "var(--font-bungee)", fontSize: 22 }}>SPILL YOUR COMMENT</div>
              <div className="mono" style={{ fontSize: 11, opacity: .9 }}>goes straight to the record. for real.</div>
            </div>
          </div>
          <button className="btn" style={{ padding: "8px 14px" }} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
          <div className="receipt p-4 mb-5" style={{ borderRadius: 8 }}>
            <div className="grid gap-2" style={{ fontSize: 13 }}>
              <div><span style={{ opacity: .55 }}>TO:</span>{" "}<span style={{ fontWeight: 700 }}>{to}</span> <Badge bg="var(--lime)" style={{ marginLeft: 6, fontSize: 9 }}>VERIFIED CLERK</Badge></div>
              <div><span style={{ opacity: .55 }}>SUBJECT:</span>{" "}<span style={{ fontWeight: 700 }}>{subject}</span></div>
              <div><span style={{ opacity: .55 }}>DEADLINE:</span>{" "}<span style={{ fontWeight: 700, color: "var(--magenta)" }}>5:00 PM, day of meeting</span></div>
            </div>
          </div>

          <label style={{ display: "block", marginBottom: 14 }}>
            <div className="mb-1" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase" }}>
              Your name (required for record)
            </div>
            <input className="field" placeholder="e.g. Jamie Park" value={name} onChange={e => setName(e.target.value)} />
          </label>

          <label style={{ display: "block", marginBottom: 16 }}>
            <div className="mb-1" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase" }}>
              Your take ★ (this is the only part you write)
            </div>
            <textarea className="field" rows={5} placeholder="I support / oppose this because..." value={body} onChange={e => setBody(e.target.value)} />
          </label>

          <div className="mb-4 p-4 rounded-xl" style={{ background: "var(--butter)", border: "2px dashed var(--ink)", maxHeight: 200, overflow: "auto", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", fontFamily: "var(--font-body)" }}>
            <div className="mono mb-2" style={{ fontSize: 10, opacity: .6, letterSpacing: ".08em" }}>PREVIEW ↓</div>
            {template}
          </div>

          <div className="flex gap-3 flex-wrap">
            <a className="btn btn-primary btn-xl" href={mailto}>
              ✉️ Open in Mail
            </a>
            <button className="btn btn-chrome btn-xl" onClick={copy}>
              {copied ? "✓ COPIED!" : "📋 Copy to clipboard"}
            </button>
          </div>

          <div className="mt-4 mono" style={{ fontSize: 11, opacity: .55, textAlign: "center" }}>
            ★ submit by 5:00 PM the day of meeting to make the official record ★
          </div>
        </div>
      </div>
    </div>
  );
};

// ───── Watch-this-moment modal ─────
const WatchModal = ({ item, onClose }) => {
  if (!item) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
        <div style={{ padding: "20px 24px", background: "var(--ink)", color: "var(--lime)", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "20px 20px 0 0" }}>
          <div className="flex items-center gap-3">
            <div style={{ fontSize: 28 }}>📺</div>
            <div>
              <div style={{ fontFamily: "var(--font-bungee)", fontSize: 20 }}>JUMP TO THE GOOD PART</div>
              <div className="mono" style={{ fontSize: 11, color: "white", opacity: .7 }}>
                {item.meetingDate} · {item.meetingType} · {item.videoTimestamp}
              </div>
            </div>
          </div>
          <button className="btn" style={{ padding: "8px 14px", background: "var(--magenta)", color: "white" }} onClick={onClose}>✕</button>
        </div>

        <div style={{ aspectRatio: "16/9", background: "var(--ink)", position: "relative", borderBottom: "2.5px solid var(--ink)" }}>
          <div className="bg-checker" style={{ position: "absolute", inset: 0, opacity: .15 }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", textAlign: "center", padding: 24 }}>
            <div className="pulse-glow" style={{ fontSize: 92 }}>▶</div>
            <div style={{ fontFamily: "var(--font-bungee)", fontSize: 26, marginTop: 12 }}>{item.headline}</div>
            <div className="mono mt-2" style={{ fontSize: 13, color: "var(--cyan)" }}>
              ⏱ jump → {item.videoTimestamp} of meeting recording
            </div>
            <div className="mt-4 px-4 py-2 rounded-full mono" style={{ background: "var(--magenta)", fontSize: 11 }}>
              Swagit player · College Park council livestream
            </div>
          </div>

          {/* fake scrubber */}
          <div style={{ position: "absolute", left: 16, right: 16, bottom: 16, background: "rgba(255,255,255,.15)", height: 8, borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: "32%", height: "100%", background: "var(--magenta)" }} />
            <div style={{ position: "absolute", left: "32%", top: -6, width: 20, height: 20, background: "var(--lime)", border: "2px solid var(--ink)", borderRadius: "50%" }} />
          </div>
        </div>

        <div style={{ padding: "20px 24px", background: "var(--butter)" }}>
          <div className="flex items-start gap-3 mb-3">
            <div style={{ fontSize: 24 }}>💭</div>
            <div style={{ fontSize: 15, lineHeight: 1.5 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>The bit you're skipping to:</span> {" "}
              {item.summary}
            </div>
          </div>
          <div className="mono" style={{ fontSize: 11, opacity: .6 }}>
            ★ source: collegeparkmd.gov/councilmeetings · timestamp pulled from chapter manifest
          </div>
        </div>
      </div>
    </div>
  );
};

// ───── Source receipt modal ─────
const SourceModal = ({ item, onClose }) => {
  if (!item) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div style={{ padding: "20px 24px", borderBottom: "2.5px solid var(--ink)", background: "var(--lime)", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "20px 20px 0 0" }}>
          <div className="flex items-center gap-3">
            <div style={{ fontSize: 28 }}>🧾</div>
            <div>
              <div style={{ fontFamily: "var(--font-bungee)", fontSize: 20 }}>RECEIPTS, BBY</div>
              <div className="mono" style={{ fontSize: 11, opacity: .7 }}>every claim, sourced. zero vibes.</div>
            </div>
          </div>
          <button className="btn" style={{ padding: "8px 14px" }} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Fake PDF preview */}
          <div className="receipt p-5 mb-4" style={{ borderRadius: 6 }}>
            <div className="mono" style={{ fontSize: 11, opacity: .6, marginBottom: 8 }}>
              📄 {item.jurisdictionFull} · {item.meetingType} · {item.meetingDate} · p.{item.sourcePage}
            </div>
            <div style={{ borderTop: "1px dashed var(--ink)", paddingTop: 12, fontSize: 13, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700 }}>AGENDA ITEM {item.id.toUpperCase()}</div>
              <div className="mt-2">{item.headline}.</div>
              <div className="mt-2" style={{ background: "var(--lime)", padding: "2px 4px", display: "inline" }}>
                {item.summary}
              </div>
              <div className="mt-3" style={{ opacity: .7 }}>
                Motion by Councilmember {item.vote.no_voters[0] || "Hernandez"}, second by Councilmember Day.
                Roll call: {item.vote.result === "passed" ? `Yea—${item.vote.yes}, Nay—${item.vote.no}` : item.vote.result}.
                {item.dollarAmount && ` Appropriation: ${item.dollarAmount}.`}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-4" style={{ fontSize: 13 }}>
            <div className="flex items-center gap-2">
              <span style={{ width: 18 }}>✅</span>
              <span><strong>Vote tally</strong> matches minutes p.{item.sourcePage}</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ width: 18 }}>✅</span>
              <span><strong>Dollar amount</strong> from approved contract exhibit A</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ width: 18 }}>✅</span>
              <span><strong>Councilmember names</strong> verified against current roster</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ width: 18 }}>✅</span>
              <span><strong>Affects-U score</strong> derived from your address parcel data</span>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <a className="btn btn-chrome" href="#" onClick={e => e.preventDefault()}>📥 Download agenda PDF</a>
            <a className="btn" href="#" onClick={e => e.preventDefault()}>📥 Download minutes PDF</a>
            <a className="btn btn-secondary" href="#" onClick={e => e.preventDefault()}>🔗 Open on collegeparkmd.gov</a>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { BriefingCard, UpcomingCard, CommentModal, WatchModal, SourceModal });
