// Statement credits breakdown — 3 cards with durable callout

const CreditsPanel = ({ state, setState, period }) => {
  const scale = period === 'monthly' ? 1/12 : 1;

  const toggle = (brand, id) => {
    const cu = { ...state.creditsUsed, [brand]: { ...state.creditsUsed[brand], [id]: !state.creditsUsed[brand][id] } };
    setState({ ...state, creditsUsed: cu });
  };

  const renderList = (brand) => {
    const items = CREDITS[brand];
    const card = CARDS.find(c => c.id === brand);
    if (!items || items.length === 0) {
      return (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CardChip brand={brand} size="sm" />
              <div style={{ fontSize: 14, fontWeight: 500 }}>{card.name}</div>
            </div>
          </div>
          <div style={{ padding: '28px 24px', fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', fontFamily: 'var(--font-serif)', fontSize: 15, textAlign: 'center' }}>
            No statement credits — but <b style={{ fontFamily: 'var(--font-sans)', fontStyle: 'normal' }}>$0 annual fee</b> means all cashback is pure profit.
          </div>
        </div>
      );
    }
    const total = items.reduce((s,c) => s + (state.creditsUsed[brand][c.id] ? c.annual : 0), 0);
    const potential = items.reduce((s,c) => s + c.annual, 0);
    return (
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CardChip brand={brand} size="sm" />
            <div style={{ fontSize: 14, fontWeight: 500 }}>{card.name}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            <span style={{ color: 'var(--green)', fontWeight: 500 }}>{fmt$(total * scale)}</span>
            <span className="num-muted"> / {fmt$(potential * scale)}</span>
          </div>
        </div>

        {brand === 'csr' && (
          <DurableTravelCallout value={items.find(i => i.id === 'travel').annual * scale} period={period} />
        )}

        <div className="credits-wrap">
          {items.map(c => (
            <div key={c.id} className="credit-row">
              <div className="credit-label">
                <span className={"pip-small " + brand} />
                <div>
                  <div>{c.name}</div>
                  {c.note && <div style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 400, marginTop: 2 }}>{c.note}</div>}
                </div>
              </div>
              <div className="credit-cadence">{c.cadence}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="num" style={{ color: state.creditsUsed[brand][c.id] ? 'var(--green)' : 'var(--faint)' }}>
                  {state.creditsUsed[brand][c.id] ? '+' : ''}{fmt$(c.annual * scale)}
                </span>
                <Toggle on={state.creditsUsed[brand][c.id]} onChange={() => toggle(brand, c.id)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
      {renderList('gold')}
      {renderList('csr')}
      {renderList('savor')}
    </div>
  );
};

// The centerpiece of this turn's edit — Durable $300 Travel Credit callout
const DurableTravelCallout = ({ value, period }) => (
  <div className="durable-callout">
    <div className="icon-wrap"><Icon name="globe" size={18} /></div>
    <div>
      <span className="badge">Durable · works worldwide</span>
      <h5>The <em>$300 Travel Credit</em> is the most flexible benefit on this card.</h5>
      <p>
        Chase applies it automatically against <b>any transaction that codes as travel</b> — not just US domestic flights.
        If you rarely fly in the US, relocate abroad, or travel regionally, the credit still pays for itself several times over.
      </p>
      <div className="examples">
        <span className="chip-ex"><span className="globe"/>International trains (Eurail, Shinkansen)</span>
        <span className="chip-ex"><span className="globe"/>Tolls & parking (worldwide)</span>
        <span className="chip-ex"><span className="globe"/>Rideshare in Bengaluru, Jakarta, Mexico City</span>
        <span className="chip-ex"><span className="globe"/>Metro / subway passes</span>
        <span className="chip-ex"><span className="globe"/>Ferries & cruises</span>
        <span className="chip-ex"><span className="globe"/>Taxis, tuk-tuks, airport buses</span>
        <span className="chip-ex"><span className="globe"/>Hotels, hostels, Airbnb</span>
        <span className="chip-ex"><span className="globe"/>Car rentals & scooter rentals</span>
      </div>
      <p style={{ marginTop: 10, color: 'var(--ink-2)' }}>
        <b style={{ color: 'var(--csr)' }}>Bottom line:</b> even a user who takes zero US flights burns through {fmt$(value)}{period === 'monthly' ? '/mo' : '/yr'} almost without trying. Treat it as a near-guaranteed offset against the $795 fee.
      </p>
    </div>
  </div>
);

const Toggle = ({ on, onChange }) => (
  <button
    onClick={onChange}
    style={{
      width: 34, height: 20, borderRadius: 999,
      background: on ? 'var(--green)' : 'var(--hairline-2)',
      position: 'relative', transition: 'background .2s', padding: 0
    }}>
    <span style={{
      position: 'absolute', top: 2, left: on ? 16 : 2,
      width: 16, height: 16, background: 'white', borderRadius: '50%',
      transition: 'left .2s', boxShadow: '0 1px 2px rgba(0,0,0,.2)'
    }} />
  </button>
);

Object.assign(window, { CreditsPanel, DurableTravelCallout, Toggle });
