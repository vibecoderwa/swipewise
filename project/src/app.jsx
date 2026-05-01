// Main app — 3 cards

const DEFAULT_SPEND = CATEGORIES.reduce((acc, c) => ({ ...acc, [c.id]: c.monthly }), {});
const DEFAULT_CREDITS_USED = {
  gold:  CREDITS.gold.reduce((a,c) => ({ ...a, [c.id]: true }), {}),
  csr:   CREDITS.csr.reduce((a,c) => ({ ...a, [c.id]: true }), {}),
  savor: {},
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "warm-paper",
  "showTimeline": true,
  "showOptimized": true
}/*EDITMODE-END*/;

function App() {
  const [period, setPeriod] = React.useState(() => localStorage.getItem('period') || 'annual');
  const [state, setState] = React.useState({
    spend: DEFAULT_SPEND,
    fees: { ...DEFAULT_FEES },
    cpp:  { ...DEFAULT_CPP },
    creditsUsed: DEFAULT_CREDITS_USED,
  });
  const [tweaksOpen, setTweaksOpen] = React.useState(false);

  React.useEffect(() => { localStorage.setItem('period', period); }, [period]);

  React.useEffect(() => {
    const handler = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const result = React.useMemo(() => computeAll(state), [state]);

  return (
    <div className="shell">
      <div className="topbar">
        <div className="brand">
          <div className="brand-dot" />
          <span>Card Optimizer</span>
          <span className="brand-kicker">· Gold · Reserve · Savor</span>
        </div>
        <div className="topbar-right">
          <span><Icon name="calendar" size={13} /> May 2025 – Apr 2026</span>
          <span className="sep" />
          <button onClick={() => setTweaksOpen(v => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)' }}>
            <Icon name="settings" size={13} /> Tweaks
          </button>
          <span className="sep" />
          <span>balanced.user@mail.com</span>
          <span className="avatar">BU</span>
        </div>
      </div>

      <div className="section-head first">
        <div>
          <div className="eyebrow">Overview · 3 cards compared</div>
          <h2>Your year, <em>three cards</em>, one winner.</h2>
        </div>
        <Seg value={period} onChange={setPeriod}
          options={[{ value: 'monthly', label: 'Monthly avg' }, { value: 'annual', label: 'Annual' }]} />
      </div>

      <Hero result={result} period={period} />

      <div className="section-head">
        <div>
          <div className="eyebrow">Category breakdown · 15 categories</div>
          <h2>Where each card <em>wins</em>.</h2>
        </div>
        <div className="right">
          Sorted by spend. Savor uses cashback (%), others use points at your chosen cpp.
        </div>
      </div>

      <CategoryTable result={result} period={period} />

      <div className="section-head">
        <div>
          <div className="eyebrow">Agent recommendations</div>
          <h2>What to put <em>on which card</em>.</h2>
        </div>
        <div className="right"><Icon name="sparkle" size={12} /> Generated from 12 months of spending</div>
      </div>

      <Recommendations result={result} period={period} />

      <div className="section-head">
        <div>
          <div className="eyebrow">Seasonality · trailing 12 months</div>
          <h2>Rewards value <em>month by month</em>.</h2>
        </div>
        <div className="right">{result.ranking[0].name} leads most months.</div>
      </div>

      <Timeline state={state} />

      <div className="section-head">
        <div>
          <div className="eyebrow">Statement credits · annual</div>
          <h2>What you're <em>leaving on the table</em>.</h2>
        </div>
        <div className="right">Toggle to model partial redemption.</div>
      </div>

      <CreditsPanel state={state} setState={setState} period={period} />

      <div className="section-head">
        <div>
          <div className="eyebrow">Net value · reconciled</div>
          <h2>The math, <em>line by line</em>.</h2>
        </div>
      </div>

      <NetSummary result={result} period={period} />

      <TweaksPanel open={tweaksOpen} onClose={() => setTweaksOpen(false)} state={state} setState={setState} />
    </div>
  );
}

// Net-value reconciliation table — 3 columns
const NetSummary = ({ result, period }) => {
  const scale = period === 'monthly' ? 1/12 : 1;
  const cardCols = CARDS;

  const rows = [
    { label: 'Points / cashback earned', key: 'pts',     isPts: true },
    { label: 'Rewards value',            key: 'rewards' },
    { label: 'Statement credits',        key: 'credits' },
    { label: 'Annual fee',               key: 'fee', neg: true },
  ];

  const gridCols = '1.5fr repeat(3, 1fr)';

  return (
    <div className="card">
      <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--hairline)', display: 'grid', gridTemplateColumns: gridCols, gap: 16, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--faint)' }}>
        <div>Line item</div>
        {cardCols.map(c => <div key={c.id} style={{ textAlign: 'right' }}>{c.name}</div>)}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{
          padding: '16px 28px', display: 'grid',
          gridTemplateColumns: gridCols, gap: 16,
          borderBottom: '1px solid var(--hairline)', alignItems: 'center'
        }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{r.label}</div>
          {cardCols.map(c => {
            const val = result.cards[c.id][r.key] * scale;
            const showVal = r.isPts
              ? (c.isCashback ? fmt$(result.cards[c.id].rewards * scale) : fmtPts(val) + ' pts')
              : (r.neg ? '-' : '') + fmt$(Math.abs(val));
            return (
              <div key={c.id} className="num num-lg" style={{ textAlign: 'right', color: r.neg ? 'var(--red)' : 'var(--ink)' }}>
                {showVal}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{
        padding: '22px 28px', display: 'grid',
        gridTemplateColumns: gridCols, gap: 16,
        background: 'var(--ink)', color: 'var(--paper)', alignItems: 'center',
        borderRadius: '0 0 var(--radius-lg) var(--radius-lg)'
      }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22 }}>Net {period === 'monthly' ? 'monthly' : 'annual'} value</div>
        {cardCols.map((c, i) => {
          const isTop = result.ranking[0].id === c.id;
          return (
            <div key={c.id} className="num" style={{ textAlign: 'right', fontSize: 22, fontFamily: 'var(--font-serif)', color: isTop ? '#9be3b6' : 'var(--paper)' }}>
              {fmt$(result.cards[c.id].net * scale)}
              {isTop && <span style={{ fontSize: 10, marginLeft: 6, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>winner</span>}
            </div>
          );
        })}
      </div>
      <div style={{ padding: '14px 28px', color: 'var(--faint)', fontSize: 12, fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
        Net value = rewards at your cpp + statement credits captured − annual fee. Savor has no annual fee and earns pure cashback; its rewards value equals its dollar return.
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
