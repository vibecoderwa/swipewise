// Home-screen widgets (Small, Medium, Large) — 2 variations each
// Plus lock-screen (rectangular + circular)
// Each widget is self-contained; we render them on a mocked home-screen background for context.

// ─────────────────────────────────────────────────
// Small (2x2) — 170x170 in canvas units
// ─────────────────────────────────────────────────
function SmallA() {
  return (
    <div style={widgetBase(170, 170, T.lemon)}>
      <div style={widgetLabel}>NEAREST</div>
      <div style={{ fontSize: 14, fontWeight: 800, marginTop: 6 }}>Whole Foods</div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        <CardSwatch brand="amex" size={30} />
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.graphite }}>Use Gold</div>
          <div className="display" style={{ fontSize: 26, fontWeight: 900, lineHeight: 1 }}>4×</div>
        </div>
      </div>
    </div>
  );
}

function SmallB() {
  return (
    <div style={widgetBase(170, 170, T.ink, '#fff')}>
      <div style={{ ...widgetLabel, color: 'rgba(255,255,255,0.6)' }}>THIS MONTH</div>
      <div className="display" style={{ fontSize: 44, fontWeight: 900, lineHeight: 0.95, marginTop: 6 }}>+$83</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>vs using one card</div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ width: 14, height: 9, borderRadius: 2, background: T.amex }} />
        <div style={{ width: 14, height: 9, borderRadius: 2, background: T.chase }} />
        <div style={{ width: 14, height: 9, borderRadius: 2, background: T.savor }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Medium (4x2) — 360x170
// ─────────────────────────────────────────────────
function MediumA() {
  const rows = [
    { icon: '🛒', name: 'Whole Foods', sub: '220 ft', brand: 'amex', mult: '4×' },
    { icon: '⛽', name: 'Shell', sub: '0.2 mi', brand: 'savor', mult: '3%' },
    { icon: '☕', name: 'Blue Bottle', sub: '0.3 mi', brand: 'amex', mult: '4×' },
  ];
  return (
    <div style={widgetBase(360, 170, T.paper)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={widgetLabel}>TOP 3 NEAR YOU</div>
        <div style={{ fontSize: 10, color: T.dim }}>updated just now</div>
      </div>
      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: T.cream, border: `1.5px solid ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{r.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
              <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>{r.sub}</div>
            </div>
            <CardSwatch brand={r.brand} size={18} />
            <div className="display" style={{ fontSize: 16, fontWeight: 900 }}>{r.mult}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MediumB() {
  return (
    <div style={widgetBase(360, 170, T.mint)}>
      <div style={widgetLabel}>YOU'RE AT</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: T.paper, border: `2px solid ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🛒</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>Whole Foods</div>
          <div style={{ fontSize: 12, color: T.graphite, marginTop: 2 }}>Market · 220 ft</div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: T.paper, border: `2px solid ${T.ink}`, borderRadius: 12 }}>
        <CardSwatch brand="amex" size={26} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800 }}>Swipe Gold</div>
          <div style={{ fontSize: 10, color: T.dim }}>4× on groceries · +$9.60</div>
        </div>
        <div className="display" style={{ fontSize: 22, fontWeight: 900 }}>4×</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Large (4x4) — 360x360
// ─────────────────────────────────────────────────
function LargeA() {
  const rows = [
    { icon: '🛒', name: 'Whole Foods', sub: '220 ft · groceries', brand: 'amex', mult: '4×', card: 'Gold' },
    { icon: '⛽', name: 'Shell', sub: '0.2 mi · gas', brand: 'savor', mult: '3%', card: 'Savor' },
    { icon: '☕', name: 'Blue Bottle', sub: '0.3 mi · dining', brand: 'amex', mult: '4×', card: 'Gold' },
    { icon: '✈︎', name: 'SFO · Delta', sub: '0.7 mi · flights', brand: 'chase', mult: '5×', card: 'Reserve' },
  ];
  return (
    <div style={widgetBase(360, 360, T.paper)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={widgetLabel}>NEAREST PLACES</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>Downtown SF · 4 nearby</div>
        </div>
        <Pill bg={T.lemon} bordered>LIVE</Pill>
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', background: T.cream, border: `1.5px solid ${T.ink}`, borderRadius: 10,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: T.paper, border: `1.5px solid ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{r.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{r.name}</div>
              <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>{r.sub}</div>
            </div>
            <CardSwatch brand={r.brand} size={22} />
            <div style={{ minWidth: 54, textAlign: 'right' }}>
              <div className="display" style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{r.mult}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.dim, textTransform: 'uppercase' }}>{r.card}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 10, color: T.dim, textAlign: 'right', marginTop: 6 }}>tap to open</div>
    </div>
  );
}

function LargeB() {
  return (
    <div style={widgetBase(360, 360, T.cream)}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={widgetLabel}>APRIL SO FAR</div>
        <Pill bg={T.mint}>on track</Pill>
      </div>
      <div className="display" style={{ fontSize: 68, fontWeight: 900, lineHeight: 0.95, marginTop: 6 }}>+$132</div>
      <div style={{ fontSize: 12, color: T.graphite, marginTop: 4 }}>earned beyond your best single card</div>

      {/* Stacked bar */}
      <div style={{ display: 'flex', marginTop: 14, height: 10, border: `1.5px solid ${T.ink}`, borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ flex: 48, background: T.amex }} />
        <div style={{ flex: 30, background: T.chase }} />
        <div style={{ flex: 22, background: T.savor }} />
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, background: T.amex, borderRadius: 2 }} />Gold $63</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, background: T.chase, borderRadius: 2 }} />Reserve $40</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, background: T.savor, borderRadius: 2 }} />Savor $29</span>
      </div>

      {/* Alert */}
      <div style={{ flex: 1 }} />
      <div style={{
        padding: '10px 12px', background: T.coral, color: '#fff',
        border: `2px solid ${T.ink}`, borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: `3px 3px 0 0 ${T.ink}`,
      }}>
        <div style={{ fontSize: 18 }}>⏰</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800 }}>Uber Cash expires Sunday</div>
          <div style={{ fontSize: 10, opacity: 0.9 }}>$15 — don't leave it</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Lock-screen — rectangular + circular
// ─────────────────────────────────────────────────
function LockRectA() {
  return (
    <div style={{
      width: 290, height: 72, borderRadius: 14, padding: '8px 12px',
      background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.18)', color: '#fff',
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: '-apple-system, system-ui',
    }}>
      <div style={{ width: 44, height: 28, borderRadius: 4, background: T.amex, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900 }}>AMEX</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.65, textTransform: 'uppercase', letterSpacing: 0.6 }}>At Whole Foods · use</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Gold · 4× groceries</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#ffd93d' }}>+$9.60</div>
    </div>
  );
}

function LockCircleA() {
  return (
    <div style={{
      width: 76, height: 76, borderRadius: 38,
      background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.18)', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, system-ui',
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase' }}>USE</div>
      <div className="display" style={{ fontSize: 24, fontWeight: 900, lineHeight: 1 }}>4×</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#ffd93d' }}>GOLD</div>
    </div>
  );
}

function LockCircleB() {
  return (
    <div style={{
      width: 76, height: 76, borderRadius: 38,
      background: 'rgba(255,107,91,0.85)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.3)', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, system-ui',
    }}>
      <div style={{ fontSize: 16 }}>⏰</div>
      <div className="display" style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>$15</div>
      <div style={{ fontSize: 8, fontWeight: 800 }}>UBER · 2d</div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────────
const widgetLabel = {
  fontSize: 10, fontWeight: 800, letterSpacing: 1.2,
  color: T.dim, textTransform: 'uppercase',
};

function widgetBase(w, h, bg, fg = T.ink) {
  return {
    width: w, height: h, padding: 14,
    background: bg, color: fg,
    border: `2.5px solid ${T.ink}`, borderRadius: 24,
    boxShadow: `4px 4px 0 0 ${T.ink}`,
    display: 'flex', flexDirection: 'column',
    fontFamily: T.body, overflow: 'hidden',
  };
}

Object.assign(window, {
  SmallA, SmallB, MediumA, MediumB, LargeA, LargeB,
  LockRectA, LockCircleA, LockCircleB,
});
