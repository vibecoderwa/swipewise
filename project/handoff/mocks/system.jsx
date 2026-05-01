// ──────────────────────────────────────────────────────────────
// Card Optimizer v2 — "Playful & Bright" Design System
// Witty copy, color-forward, illustrated. No gradients.
// ──────────────────────────────────────────────────────────────

const T = {
  // Editorial palette — muted, warm, magazine-like. No neons.
  ink:     '#1A1814',    // warm near-black
  paper:   '#F7F2E9',    // soft bone
  cream:   '#EFE7D7',    // light surface
  lemon:   '#D4B254',    // muted ochre (was neon yellow)
  lemonDk: '#A88A36',
  mint:    '#9CB49A',    // sage (was mint candy)
  mintDk:  '#6B8A74',
  coral:   '#C26B5A',    // terracotta (was tomato red)
  coralDk: '#9A4F3F',
  sky:     '#8BA5B8',    // dusty blue (was bright cyan)
  skyDk:   '#5A7A8E',
  plum:    '#8C7A9E',    // muted mauve (was loud purple)
  plumDk:  '#5F5070',

  // Neutrals
  smoke:  '#EDE7DA',
  haze:   '#D9D0BD',
  graphite: '#3A362F',
  dim:    '#8C8578',
  line:   '#2A261F',      // softer than pure black
  hairline: '#DCD4C1',

  // Issuer colors — subdued
  amex:    '#AE8B3B',   amexWash: '#F0E8D3',
  chase:   '#2B4468',   chaseWash: '#DCE2ED',
  savor:   '#7A3848',   savorWash: '#EBDAE0',

  // Fonts
  display: '"Fraunces", "Times New Roman", Georgia, serif',  // expressive serif for numbers/titles
  body:    '"Inter Tight", "Inter", -apple-system, system-ui, sans-serif',
  mono:    '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace',
};

// Tokens to inject in <style>
const SYSTEM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800;9..144,900&family=Inter+Tight:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  body { margin: 0; font-family: ${T.body}; color: ${T.ink}; }
  .display { font-family: ${T.display}; font-weight: 800; letter-spacing: -0.02em; }
  .mono { font-family: ${T.mono}; }
`;

// ──────────────────────────────────────────────────────────────
// Atoms
// ──────────────────────────────────────────────────────────────

// "Chunky" button — refined, softer shadow, thinner border
function ChunkyBtn({ children, bg = T.ink, fg = T.paper, w, onClick, style = {}, size = 'md' }) {
  const pad = size === 'lg' ? '18px 28px' : size === 'sm' ? '10px 16px' : '14px 22px';
  const fs = size === 'lg' ? 18 : size === 'sm' ? 14 : 16;
  return (
    <button onClick={onClick} style={{
      background: bg, color: fg, border: `1.5px solid ${T.ink}`,
      borderRadius: 12, padding: pad, fontSize: fs, fontWeight: 600,
      fontFamily: T.body, cursor: 'pointer',
      boxShadow: `2px 2px 0 0 ${T.ink}`,
      width: w, letterSpacing: -0.2,
      transition: 'all 120ms',
      ...style,
    }}>{children}</button>
  );
}

// Card brand swatch — mini rectangle with issuer color
function CardSwatch({ brand = 'amex', size = 28, label }) {
  const bg = brand === 'amex' ? T.amex : brand === 'chase' ? T.chase : T.savor;
  return (
    <div style={{
      width: size, height: size * 0.65, borderRadius: 4, background: bg,
      border: `1.5px solid ${T.ink}`, flexShrink: 0,
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 2, right: 3, width: 6, height: 4,
        borderRadius: 1, background: 'rgba(255,255,255,0.7)',
      }} />
    </div>
  );
}

// Pill tag — refined
function Pill({ children, bg = T.lemon, fg = T.ink, bordered = true }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: bg, color: fg,
      border: bordered ? `1px solid ${T.ink}` : 'none',
      borderRadius: 999, padding: '3px 10px',
      fontSize: 10.5, fontWeight: 600, letterSpacing: 0.4,
      textTransform: 'uppercase',
    }}>{children}</span>
  );
}

// Wallet sticker — fun illustrated "card" badge
function CardSticker({ brand = 'amex', name, last4 = '••34', rotate = 0, style = {} }) {
  const bg = brand === 'amex' ? T.amex : brand === 'chase' ? T.chase : T.savor;
  const fg = brand === 'amex' ? T.ink : '#fff';
  return (
    <div style={{
      width: 220, height: 138, borderRadius: 14, background: bg,
      border: `1.5px solid ${T.ink}`, color: fg,
      boxShadow: `3px 3px 0 0 ${T.ink}`,
      padding: '14px 16px', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', fontFamily: T.body,
      transform: `rotate(${rotate}deg)`,
      position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        position: 'absolute', top: 14, right: 14,
        width: 34, height: 26, borderRadius: 4,
        background: brand === 'amex' ? '#fff' : 'rgba(255,255,255,0.3)',
        border: '1.5px solid rgba(0,0,0,0.2)',
      }} />
      <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.9 }}>
        {brand === 'amex' ? 'American Express' : brand === 'chase' ? 'Chase' : 'Capital One'}
      </div>
      <div>
        <div className="mono" style={{ fontSize: 13, letterSpacing: 2, fontWeight: 500, opacity: 0.85 }}>
          •••• •••• •••• {last4.replace('••','')}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4, letterSpacing: -0.3 }}>{name}</div>
      </div>
    </div>
  );
}

// Big dollar display (Fraunces)
function BigDollar({ value, size = 72, color = T.ink, sign = false }) {
  const pos = value >= 0;
  return (
    <span className="display" style={{
      fontSize: size, color, lineHeight: 0.95,
      fontWeight: 900, letterSpacing: -0.03,
      display: 'inline-flex', alignItems: 'baseline',
    }}>
      {sign && <span style={{ fontSize: size * 0.55, marginRight: 2 }}>{pos ? '+' : '−'}</span>}
      <span style={{ fontSize: size * 0.55, fontWeight: 700 }}>$</span>
      {Math.abs(value).toLocaleString()}
    </span>
  );
}

// iOS status-bar-style time/batt pill (for mockups)
function FakeStatus({ time = '9:41', dark = false }) {
  const c = dark ? '#fff' : T.ink;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '18px 28px 6px', color: c, fontSize: 15, fontWeight: 600,
      fontFamily: '-apple-system, system-ui',
    }}>
      <span>{time}</span>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="0.5" fill={c}/><rect x="4.5" y="5" width="3" height="6" rx="0.5" fill={c}/><rect x="9" y="2.5" width="3" height="8.5" rx="0.5" fill={c}/><rect x="13.5" y="0" width="3" height="11" rx="0.5" fill={c}/></svg>
        <svg width="16" height="11" viewBox="0 0 16 11"><path d="M8 3C10 3 11.5 3.7 13 5L14 4C12.5 2.5 10.5 1.5 8 1.5C5.5 1.5 3.5 2.5 2 4L3 5C4.5 3.7 6 3 8 3Z" fill={c}/><circle cx="8" cy="9" r="1.5" fill={c}/></svg>
        <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke={c} fill="none"/><rect x="2" y="2" width="16" height="8" rx="1.5" fill={c}/></svg>
      </span>
    </div>
  );
}

// Illustrated "spot" background — blob pattern, not gradient
function BlobBG({ children, tone = T.lemon, style = {} }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: T.paper, ...style,
    }}>
      <svg viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
      }}>
        <circle cx="320" cy="120" r="140" fill={tone} opacity="0.35"/>
        <circle cx="60" cy="420" r="100" fill={T.mint} opacity="0.28"/>
        <circle cx="280" cy="520" r="80" fill={T.coral} opacity="0.22"/>
      </svg>
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</div>
    </div>
  );
}

Object.assign(window, { T, SYSTEM_CSS, ChunkyBtn, CardSwatch, Pill, CardSticker, BigDollar, FakeStatus, BlobBG });
