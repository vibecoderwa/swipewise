// LeftOnTable — drill-down from the home "$N missed" alert. Shows each
// suboptimal swipe with the strike-through used-card → better-card delta,
// and a tonal "we don't nag on small swipes" footer.
import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import Folio from '../components/Folio.jsx';

export default function LeftOnTable({ go }) {
  const [data, setData] = useState(null);
  const [prefs, setPrefs] = useState(null);

  useEffect(() => {
    api.log().then(setData).catch(() => {});
    api.prefs().then(setPrefs).catch(() => {});
  }, []);

  if (!data) {
    return <div className="screen"><div className="loading">Loading…</div></div>;
  }

  const missed = data.items.filter(it => !it.optimal && it.missed > 0);
  const total = +missed.reduce((s, x) => s + x.missed, 0).toFixed(2);
  const monthName = new Date().toLocaleString('en-US', { month: 'long' }).toLowerCase();
  const nagThreshold = prefs?.nag_under_amount ?? 20;
  const smallCount = missed.filter(m => m.basket < nagThreshold).length;

  return (
    <div className="screen lot-screen">
      <div className="screen-header" style={{ position: 'relative' }}>
        <span className="pill-chip" style={{ background: 'var(--coral)', color: '#fff', borderColor: 'var(--ink)' }}>
          left on the table · {monthName}
        </span>
        <h1 style={{ fontSize: 56, lineHeight: 0.95, marginTop: 10 }}>
          ${Math.round(total)} missed.
        </h1>
        <p className="hero-q-sub" style={{ fontSize: 14 }}>
          {missed.length} swipes on the wrong card this month. Tone, not blame —
          here's what would've earned more.
        </p>
        <div className="topright"><Folio n={13} /></div>
      </div>

      <div className="lot-head-row">
        <span>Swipe</span><span>Better card</span>
      </div>

      <div className="lot-list">
        {missed.length === 0 ? (
          <div className="result-empty">
            ❋ nothing missed this month ❋<br/>
            <span style={{ fontSize: 11 }}>your wallet behaved itself</span>
          </div>
        ) : missed.slice(0, 8).map(it => {
          const used  = `${it.card_name?.split(' ').slice(-2).join(' ')} · ${it.rate}×`;
          const want  = `${it.best_card_id ? cardShort(it.best_card_id) : 'Better'} · ${it.best_rate ?? '—'}×`;
          return (
            <div key={it.id} className="lot-row">
              <div className="top">
                <span className="date">{new Date(it.ts).toLocaleString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span className="merch">{it.merchant || 'Unknown'}</span>
                <span className="amt">${it.basket?.toFixed(2)}</span>
              </div>
              <div className="bot">
                <span className="used">{used}</span>
                <span className="arr">→</span>
                <span className="want">{want}</span>
                <span className="delta">+${it.missed.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {smallCount > 0 && (
        <div className="lot-foot">
          <b>Heads up:</b> {smallCount} of these were under ${nagThreshold}. We don't nag on
          those by default — toggle in Settings.
        </div>
      )}
    </div>
  );
}

function cardShort(id) {
  if (id?.startsWith('amex_gold')) return 'Gold';
  if (id?.startsWith('amex_plat')) return 'Platinum';
  if (id?.startsWith('chase_sapphire_reserve')) return 'Reserve';
  if (id?.startsWith('chase_sapphire_preferred')) return 'Sapphire';
  if (id?.startsWith('chase_freedom')) return 'Freedom';
  if (id?.startsWith('capone_savor')) return 'Savor';
  if (id?.startsWith('capone_venture')) return 'Venture';
  return 'Other';
}
