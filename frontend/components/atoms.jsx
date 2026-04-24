// Reusable y2k bits: stickers, marquee, badges
const { useEffect, useRef, useState } = React;

const Sticker = ({ kind = "blob", color = "var(--magenta)", textColor, rotate = 0, size = 88, children, style = {}, className = "" }) => {
  const base = {
    background: color,
    color: textColor || "var(--ink)",
    width: size,
    height: kind === "pill" || kind === "tag" ? "auto" : size,
    transform: `rotate(${rotate}deg)`,
    fontSize: typeof size === "number" ? Math.max(11, size * 0.18) : 14,
    ...style,
  };
  return <div className={`sticker gloss sticker-${kind} ${className}`} style={base}>{children}</div>;
};

const StarBurst = ({ color = "var(--lime)", size = 120, rotate = -8, children, style = {}, className = "" }) => (
  <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size, transform: `rotate(${rotate}deg)`, ...style }}>
    <span className="starburst" style={{ background: color, width: size, height: size, position: "absolute", inset: 0 }} />
    <div className="relative z-10 text-center font-extrabold leading-tight" style={{ fontFamily: "var(--font-display)", fontSize: size * 0.13, padding: size * 0.18 }}>
      {children}
    </div>
  </div>
);

const Marquee = ({ items, color = "var(--ink)", textColor = "var(--lime)", speed = 40 }) => (
  <div className="marquee" style={{ background: color, color: textColor }}>
    <div className="marquee-track" style={{ animationDuration: `${speed}s` }}>
      {[...items, ...items].map((it, i) => <span key={i}>{it}</span>)}
    </div>
  </div>
);

const Badge = ({ children, bg = "white", color = "var(--ink)", style = {} }) => (
  <span className="badge" style={{ background: bg, color, ...style }}>{children}</span>
);

const HeatMeter = ({ score }) => {
  // Score 0-10 → render fire emojis + bar
  const filled = Math.round(score);
  return (
    <div className="flex items-center gap-2">
      <div className="flex" style={{ width: 90, height: 14, border: "2px solid var(--ink)", borderRadius: 8, overflow: "hidden", background: "white" }}>
        <div style={{
          width: `${score * 10}%`,
          height: "100%",
          background: `linear-gradient(90deg, var(--lime), var(--tangerine), var(--magenta))`
        }}/>
      </div>
      <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{score.toFixed(1)}</span>
    </div>
  );
};

const VoteChip = ({ vote }) => {
  if (vote.result === "passed") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--lime)", border: "2.5px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)" }}>
        <span style={{ fontFamily: "var(--font-bungee)", fontSize: 14 }}>PASSED</span>
        <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{vote.yes}–{vote.no}</span>
      </div>
    );
  }
  if (vote.result === "failed") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--magenta)", color: "white", border: "2.5px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)" }}>
        <span style={{ fontFamily: "var(--font-bungee)", fontSize: 14 }}>FAILED</span>
        <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{vote.yes}–{vote.no}</span>
      </div>
    );
  }
  if (vote.result === "introduced") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--cyan)", border: "2.5px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)" }}>
        <span style={{ fontFamily: "var(--font-bungee)", fontSize: 14 }}>INTRO'D</span>
        <span className="mono" style={{ fontWeight: 700, fontSize: 12 }}>NO VOTE YET</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--butter)", border: "2.5px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)" }}>
      <span style={{ fontFamily: "var(--font-bungee)", fontSize: 14 }}>DIRECTION</span>
    </div>
  );
};

const JurisdictionPill = ({ j }) => {
  const map = {
    City: { bg: "var(--magenta)", color: "white", emoji: "🏛️" },
    County: { bg: "var(--tangerine)", color: "white", emoji: "🗺️" },
    Schools: { bg: "var(--cyan)", color: "var(--ink)", emoji: "🎒" },
  };
  const m = map[j] || { bg: "white", color: "var(--ink)", emoji: "📍" };
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: m.bg, color: m.color, border: "2.5px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12, letterSpacing: ".05em" }}>
      <span>{m.emoji}</span>
      <span>{j.toUpperCase()}</span>
    </div>
  );
};

// Floaty corner stickers for whole-page chrome
const FloatySticker = ({ children, top, left, right, bottom, rotate = 0, size = 80, color = "var(--lime)", kind = "blob", animate }) => (
  <div style={{ position: "absolute", top, left, right, bottom, zIndex: 5, pointerEvents: "none" }} className={animate || ""}>
    <Sticker kind={kind} color={color} rotate={rotate} size={size}>{children}</Sticker>
  </div>
);

Object.assign(window, { Sticker, StarBurst, Marquee, Badge, HeatMeter, VoteChip, JurisdictionPill, FloatySticker });
