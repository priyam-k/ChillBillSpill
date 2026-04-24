// App root — orchestrates screens + modals
const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "magenta",
  "ornament": "loud",
  "showStickers": true,
  "marqueeOn": true,
  "demoAddressIndex": 0
}/*EDITMODE-END*/;

function applyPalette(p) {
  const root = document.documentElement;
  const palettes = {
    magenta: { magenta: "#FF2E93", tangerine: "#FF7A00", lime: "#C8FF2E", cyan: "#7FE7FF", lilac: "#C9A6FF" },
    cool:    { magenta: "#9D6BFF", tangerine: "#FF61C5", lime: "#A8F0FF", cyan: "#B5C4FF", lilac: "#FFE066" },
    civic:   { magenta: "#E63946", tangerine: "#1D3557", lime: "#F1C40F", cyan: "#A8DADC", lilac: "#E9C46A" },
    sour:    { magenta: "#FF3CAC", tangerine: "#FFD60A", lime: "#7CFFB2", cyan: "#52FFE6", lilac: "#FF9CDA" },
  };
  const c = palettes[p] || palettes.magenta;
  Object.entries(c).forEach(([k, v]) => root.style.setProperty(`--${k}`, v));
}

const App = () => {
  const tweaksApi = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}];
  const [tweaks, setTweak] = tweaksApi;

  const [screen, setScreen] = useState("landing"); // landing | loading | briefing | oos
  const [user, setUser] = useState(window.CBS_DATA.user);

  // API loading state
  const [pendingData, setPendingData] = useState(null);
  const [animDone, setAnimDone] = useState(false);
  const pendingAddr = useRef("");

  // modals
  const [commentItem, setCommentItem] = useState(null);
  const [commentMode, setCommentMode] = useState("past");
  const [watchItem, setWatchItem] = useState(null);
  const [sourceItem, setSourceItem] = useState(null);

  useEffect(() => { applyPalette(tweaks.palette); }, [tweaks.palette]);

  useEffect(() => {
    const sheet = document.getElementById("sticker-toggle-style") || (() => {
      const s = document.createElement("style"); s.id = "sticker-toggle-style"; document.head.appendChild(s); return s;
    })();
    sheet.textContent = tweaks.showStickers
      ? ""
      : `.sticker-blob, .sticker-star, .starburst, .wobble, .spin-slow:not([data-keep]) { display: none !important; }`;
  }, [tweaks.showStickers]);

  useEffect(() => {
    const sheet = document.getElementById("marquee-toggle-style") || (() => {
      const s = document.createElement("style"); s.id = "marquee-toggle-style"; document.head.appendChild(s); return s;
    })();
    sheet.textContent = tweaks.marqueeOn ? "" : ".marquee { display: none !important; }";
  }, [tweaks.marqueeOn]);

  // When both the loading animation finishes AND API data is ready, go to briefing
  useEffect(() => {
    if (animDone && pendingData !== null) {
      // Merge: use real briefing cards if we got them, otherwise keep mock
      // Always use mock upcoming — scraper data is unreliable for this section
      const merged = { ...window.CBS_DATA, ...pendingData };
      if (!pendingData.briefing || pendingData.briefing.length === 0) {
        merged.briefing = window.CBS_DATA.briefing;
      }
      merged.upcoming = window.CBS_DATA.upcoming;
      Object.assign(window.CBS_DATA, merged);
      setUser(merged.user || window.CBS_DATA.user);
      setPendingData(null);
      setAnimDone(false);
      setScreen("briefing");
    }
  }, [animDone, pendingData]);

  const fetchBriefing = async (addr) => {
    try {
      const resp = await fetch(`/api/briefing?address=${encodeURIComponent(addr)}`);
      if (resp.ok) {
        const data = await resp.json();
        setPendingData(data);
      } else {
        setPendingData(window.CBS_DATA);
      }
    } catch (e) {
      // Backend not available — use mock data so demo still works
      setPendingData(window.CBS_DATA);
    }
  };

  const handleSubmitAddress = (addr) => {
    const inCP = /college park|20740|20741|20742|knox|baltimore ave|yale|hartwick|berwyn|rhode island/i.test(addr);
    pendingAddr.current = addr;
    setUser({ ...window.CBS_DATA.user, address: addr });
    if (!inCP) {
      setScreen("oos");
      return;
    }
    setPendingData(null);
    setAnimDone(false);
    setScreen("loading");
    fetchBriefing(addr);
  };

  const onLoadingDone = () => {
    setAnimDone(true);
  };

  return (
    <div data-screen-label={
      screen === "landing" ? "01 Landing" :
      screen === "loading" ? "02 Loading" :
      screen === "briefing" ? "03 Briefing Results" :
      "04 Out of Area"
    }>
      {screen === "landing" && <Landing onSubmit={handleSubmitAddress} />}
      {screen === "loading" && <LoadingScreen address={pendingAddr.current || user.address} onDone={onLoadingDone} />}
      {screen === "briefing" && (
        <BriefingScreen
          user={user}
          onChangeAddress={() => setScreen("landing")}
          onComment={(item, mode) => { setCommentItem(item); setCommentMode(mode); }}
          onWatch={setWatchItem}
          onSource={setSourceItem}
        />
      )}
      {screen === "oos" && <OutOfArea address={user.address} onBack={() => setScreen("landing")} />}

      {/* Modals */}
      {commentItem && <CommentModal item={commentItem} mode={commentMode} user={user} onClose={() => setCommentItem(null)} />}
      {watchItem && <WatchModal item={watchItem} onClose={() => setWatchItem(null)} />}
      {sourceItem && <SourceModal item={sourceItem} onClose={() => setSourceItem(null)} />}

      {/* Tweaks panel */}
      {window.TweaksPanel && (
        <TweaksPanel>
          <TweakSection label="Palette" />
          <TweakRadio
            label="Theme"
            value={tweaks.palette}
            onChange={v => setTweak("palette", v)}
            options={["magenta", "cool", "civic", "sour"]}
          />
          <TweakSection label="Vibe" />
          <TweakToggle label="Stickers & blobs" value={tweaks.showStickers} onChange={v => setTweak("showStickers", v)} />
          <TweakToggle label="Marquee tickers" value={tweaks.marqueeOn} onChange={v => setTweak("marqueeOn", v)} />
          <TweakSection label="Demo screens" />
          <TweakButton label="↺ Landing" onClick={() => setScreen("landing")} />
          <TweakButton label="▸ Replay loading" onClick={() => { setPendingData(window.CBS_DATA); setAnimDone(false); setScreen("loading"); }} />
          <TweakButton label="▸ Jump to briefing" onClick={() => setScreen("briefing")} />
          <TweakButton label="▸ Out-of-area" onClick={() => { setUser({ ...user, address: "100 Brooklyn Bridge, NYC" }); setScreen("oos"); }} />
          <TweakSection label="Demo address" />
          <TweakSelect
            label="Address"
            value={String(tweaks.demoAddressIndex)}
            onChange={v => { const i = parseInt(v); setTweak("demoAddressIndex", i); handleSubmitAddress(window.CBS_DATA.demoAddresses[i]); }}
            options={window.CBS_DATA.demoAddresses.map((a, i) => ({ value: String(i), label: a }))}
          />
        </TweaksPanel>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
