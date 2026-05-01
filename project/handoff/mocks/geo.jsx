// Geo-suggest — in-app banner / list screen — 2 variations

function GeoA_List() {
  const places = [
    { name: 'Whole Foods', sub: 'Market · 220 ft', card: 'Amex Gold', brand: 'amex', mult: '4×', reward: '+$2.40' },
    { name: 'Shell', sub: 'Gas station · 0.2 mi', card: 'Savor', brand: 'savor', mult: '3%', reward: '+$1.80' },
    { name: 'Blue Bottle', sub: 'Coffee · 0.3 mi', card: 'Amex Gold', brand: 'amex', mult: '4×', reward: '+$0.40' },
    { name: 'Delta Counter (SFO)', sub: 'Airline · 0.7 mi', card: 'Sapphire Reserve', brand: 'chase', mult: '5×', reward: '+$12.00' },
  ];
  return (
    <div style={{
      width: 402, height: 874, background: T.paper, color: T.ink,
      fontFamily: T.body, position: 'relative', overflow: 'hidden',
    }}>
      <FakeStatus />

      {/* Header */}
      <div style={{ padding: '10px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: T.dim, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: T.mintDk }} />
          Near you · San Francisco
        </div>
        <h1 className="display" style={{ fontSize: 40, lineHeight: 0.98, margin: '10px 0 6px', fontWeight: 900, letterSpacing: -0.03 }}>
          Four places.<br/>Four smart swipes.
        </h1>
        <p style={{ fontSize: 14, color: T.graphite, margin: 0 }}>Tap a place to see why.</p>
      </div>

      {/* Map peek */}
      <div style={{
        margin: '18px 24px 0', height: 120, borderRadius: 18,
        background: T.cream, border: `2.5px solid ${T.ink}`,
        boxShadow: `4px 4px 0 0 ${T.ink}`, position: 'relative', overflow: 'hidden',
      }}>
        {/* streets */}
        <svg viewBox="0 0 340 120" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <path d="M0 40 Q 120 60 220 30 T 340 70" stroke={T.haze} strokeWidth="14" fill="none" />
          <path d="M60 0 Q 80 70 120 120" stroke={T.haze} strokeWidth="10" fill="none" />
          <path d="M200 0 L 240 120" stroke={T.haze} strokeWidth="10" fill="none" />
          <circle cx="80" cy="60" r="8" fill={T.amex} stroke={T.ink} strokeWidth="2" />
          <circle cx="170" cy="40" r="8" fill={T.savor} stroke={T.ink} strokeWidth="2" />
          <circle cx="250" cy="55" r="8" fill={T.amex} stroke={T.ink} strokeWidth="2" />
          <circle cx="300" cy="90" r="8" fill={T.chase} stroke={T.ink} strokeWidth="2" />
          {/* user */}
          <circle cx="150" cy="80" r="14" fill={T.sky} stroke={T.ink} strokeWidth="2.5" />
          <circle cx="150" cy="80" r="5" fill={T.ink} />
        </svg>
      </div>

      {/* List */}
      <div style={{ margin: '18px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {places.map((p, i) => (
          <div key={i} style={{
            padding: 12, background: i === 0 ? T.lemon : T.paper,
            border: `2.5px solid ${T.ink}`, borderRadius: 14,
            boxShadow: i === 0 ? `4px 4px 0 0 ${T.ink}` : `2px 2px 0 0 ${T.ink}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 42, height: 42, background: T.paper, border: `2px solid ${T.ink}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              {['🛒','⛽','☕','✈︎'][i]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: T.graphite, marginTop: 1 }}>{p.sub}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                <CardSwatch brand={p.brand} size={22} />
                <span style={{ fontSize: 12, fontWeight: 800 }}>{p.mult}</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.mintDk, marginTop: 2 }}>{p.reward}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <GeoBottomNav active="geo" />
    </div>
  );
}

function GeoB_Banner() {
  return (
    <div style={{
      width: 402, height: 874, background: T.paper, color: T.ink,
      fontFamily: T.body, position: 'relative', overflow: 'hidden',
    }}>
      <FakeStatus />

      {/* Live banner — top */}
      <div style={{
        margin: '10px 16px 0', padding: '14px 16px',
        background: T.mint, border: `2.5px solid ${T.ink}`, borderRadius: 18,
        boxShadow: `4px 4px 0 0 ${T.ink}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: T.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          position: 'relative',
        }}>
          📍
          <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: T.coral, border: `2px solid ${T.ink}` }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: T.graphite, textTransform: 'uppercase' }}>You're at</div>
          <div style={{ fontSize: 17, fontWeight: 800, marginTop: 1 }}>Whole Foods Market</div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.graphite }}>220 ft</div>
      </div>

      {/* Big recommendation */}
      <div style={{ padding: '28px 24px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: T.dim }}>Swipe this one</div>
        <div style={{ margin: '14px 0 0', position: 'relative', display: 'inline-block' }}>
          <CardSticker brand="amex" name="Amex Gold" last4="••04" rotate={-3} />
          <div style={{
            position: 'absolute', top: -12, right: -16,
            width: 64, height: 64, borderRadius: '50%', background: T.lemon,
            border: `2.5px solid ${T.ink}`, boxShadow: `3px 3px 0 0 ${T.ink}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.display, fontWeight: 900,
            transform: 'rotate(12deg)',
          }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>4×</span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>PTS</span>
          </div>
        </div>
        <div style={{ marginTop: 24, fontSize: 22, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 }}>
          Groceries earn <span style={{ background: T.lemon, padding: '0 6px', borderRadius: 6 }}>4× points</span> on Gold.
        </div>
        <div style={{ marginTop: 6, fontSize: 14, color: T.graphite }}>
          Based on your usual basket (~$120), that's roughly <b>+$9.60</b> in rewards today.
        </div>
      </div>

      {/* Alternatives */}
      <div style={{ margin: '28px 24px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: T.dim, marginBottom: 10 }}>Not Gold? Next best:</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, padding: 12, background: T.paper, border: `2px solid ${T.ink}`, borderRadius: 12 }}>
            <CardSwatch brand="savor" size={24} />
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>Savor</div>
            <div style={{ fontSize: 11, color: T.mintDk, fontWeight: 800 }}>3% cash</div>
          </div>
          <div style={{ flex: 1, padding: 12, background: T.paper, border: `2px solid ${T.ink}`, borderRadius: 12 }}>
            <CardSwatch brand="chase" size={24} />
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>Reserve</div>
            <div style={{ fontSize: 11, color: T.dim, fontWeight: 800 }}>1× pts</div>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <GeoBottomNav active="home" />
    </div>
  );
}

function GeoBottomNav({ active }) {
  const items = [
    { id: 'home', l: 'Home', i: '⌂' },
    { id: 'cards', l: 'Cards', i: '▭' },
    { id: 'insights', l: 'Insights', i: '◎' },
    { id: 'settings', l: 'Settings', i: '⚙︎' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: T.paper, borderTop: `2px solid ${T.ink}`,
      display: 'flex', padding: '10px 0 24px',
    }}>
      {items.map(x => (
        <div key={x.id} style={{ flex: 1, textAlign: 'center', color: x.id === active ? T.ink : T.dim, fontWeight: x.id === active ? 800 : 600 }}>
          <div style={{ fontSize: 20 }}>{x.i}</div>
          <div style={{ fontSize: 11, marginTop: 2 }}>{x.l}</div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { GeoA_List, GeoB_Banner, GeoBottomNav });
