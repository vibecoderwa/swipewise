// Tweaks panel — 3 cards

const TweaksPanel = ({ open, onClose, state, setState }) => {
  if (!open) return null;

  const setFee = (brand, val) => setState({ ...state, fees: { ...state.fees, [brand]: Number(val) || 0 } });
  const setCpp = (brand, val) => setState({ ...state, cpp: { ...state.cpp, [brand]: Number(val) || 0 } });
  const setSpend = (id, val) => setState({ ...state, spend: { ...state.spend, [id]: Number(val) || 0 } });

  const persona = (p) => {
    const profiles = {
      foodie:   { dining: 900, groceries: 950, flights: 180, hotels: 120, travel: 100, rideshare: 180, gas: 80,  transit: 120, streaming: 68, online: 400, shopping: 280, utilities: 380, health: 150, entertainment: 200, other: 180 },
      traveler: { dining: 500, groceries: 380, flights: 700, hotels: 620, travel: 380, rideshare: 200, gas: 140, transit: 80,  streaming: 68, online: 440, shopping: 280, utilities: 380, health: 140, entertainment: 180, other: 200 },
      balanced: { dining: 640, groceries: 720, flights: 310, hotels: 240, travel: 180, rideshare: 140, gas: 180, transit: 95,  streaming: 68, online: 540, shopping: 320, utilities: 420, health: 180, entertainment: 160, other: 220 },
      abroad:   { dining: 550, groceries: 600, flights: 0,   hotels: 180, travel: 420, rideshare: 260, gas: 40,  transit: 180, streaming: 68, online: 480, shopping: 280, utilities: 320, health: 140, entertainment: 180, other: 200 },
    };
    setState({ ...state, spend: profiles[p] });
  };

  return (
    <div className="tweaks-panel">
      <div className="tweaks-head">
        <h4>Tweaks</h4>
        <button className="close" onClick={onClose}>×</button>
      </div>
      <div className="tweaks-body">
        <div className="tweak-group">
          <div className="tweak-group-title">Persona preset</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[['balanced','Balanced'],['foodie','Foodie'],['traveler','Traveler'],['abroad','Expat (no US flights)']].map(([k,l]) => (
              <button key={k} onClick={() => persona(k)} style={{
                padding: '7px 8px', border: '1px solid var(--hairline-2)',
                borderRadius: 8, background: 'var(--paper)', fontSize: 12
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div className="tweak-group">
          <div className="tweak-group-title">Annual fees</div>
          {CARDS.map(c => (
            <div key={c.id} className="tweak-row">
              <span>{c.name}</span>
              <input type="number" className="tweak-input" value={state.fees[c.id]}
                onChange={e => setFee(c.id, e.target.value)} />
            </div>
          ))}
        </div>

        <div className="tweak-group">
          <div className="tweak-group-title">Point valuation (¢ per pt)</div>
          {CARDS.map(c => (
            <div key={c.id}>
              <div className="tweak-row" style={{ marginBottom: 2 }}>
                <span>{c.name} · {state.cpp[c.id].toFixed(2)}¢</span>
                <span className="val">{state.cpp[c.id].toFixed(2)}</span>
              </div>
              <input type="range" min={c.isCashback ? 1 : 1} max={c.isCashback ? 1 : 2.5} step="0.05"
                value={state.cpp[c.id]} disabled={c.isCashback}
                onChange={e => setCpp(c.id, e.target.value)} />
            </div>
          ))}
        </div>

        <div className="tweak-group">
          <div className="tweak-group-title">Monthly spend ($)</div>
          {CATEGORIES.map(cat => (
            <div key={cat.id} style={{ marginBottom: 6 }}>
              <div className="tweak-row" style={{ marginBottom: 2 }}>
                <span style={{ fontSize: 12 }}>{cat.name}</span>
                <span className="val">{fmt$(state.spend[cat.id])}</span>
              </div>
              <input type="range" min="0" max="1500" step="10"
                value={state.spend[cat.id]}
                onChange={e => setSpend(cat.id, e.target.value)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { TweaksPanel });
