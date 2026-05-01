import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';

function brandKey(cardId, issuer) {
  if (!cardId) return 'default';
  if (cardId.startsWith('amex_')) return 'amex';
  if (cardId.startsWith('chase_')) return 'chase';
  if (cardId.startsWith('capone_')) return 'capone';
  if (cardId.startsWith('citi_')) return 'citi';
  if (cardId.startsWith('discover_')) return 'discover';
  return 'default';
}

const DURABLE_EXAMPLES = [
  'Delta flight', 'Marriott stay', 'Uber ride', 'Toll booth', 'NYC subway',
];

export default function Credits({ userCards }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const r = await api.credits();
      setData(r);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh, userCards.length]);

  if (!data || data.cards.length === 0) {
    if (!userCards.length) return null;
    return (
      <div className="card">
        <div className="muted small">
          None of your matched cards have tracked credits in our catalog yet.
        </div>
      </div>
    );
  }

  // Find Sapphire Reserve durable callout if present
  const csrCard = data.cards.find(c => c.card_id === 'chase_sapphire_reserve');
  const csrTravel = csrCard?.credits.find(c => c.id === 'csr_travel');

  async function toggle(card_id, credit_id, current) {
    const key = `${card_id}::${credit_id}`;
    setBusy(key);
    try {
      await api.toggleCredit(card_id, credit_id, !current);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card">
      <div className="metric-eyebrow">Realized vs. potential · this year</div>
      <div className="metric-big">
        <span className="sign">${Math.round(data.total_realized)}</span>
        <span style={{ fontSize: 28, color: 'var(--faint)', fontFamily: 'var(--font-serif)' }}>
          / ${Math.round(data.total_potential)}
        </span>
      </div>
      <div className="metric-sub" style={{ marginBottom: 18 }}>
        {data.net_after_fees >= 0
          ? <>After <b>${Math.round(data.total_fees)}</b> in annual fees, you're <b>+${Math.round(data.net_after_fees)}</b> ahead.</>
          : <>Annual fees of <b>${Math.round(data.total_fees)}</b> have you <b>${Math.round(Math.abs(data.net_after_fees))}</b> behind. Capture the credits below.</>}
      </div>

      {csrTravel && (
        <div className="durable-callout">
          <span className="badge">Most underrated</span>
          <h5>The Durable <em>$300</em></h5>
          <p>
            Unlike most premium-card credits that require a specific portal or partner, the Sapphire Reserve's $300 travel credit is effectively cash. It applies automatically to any travel purchase — anywhere.
          </p>
          <div className="examples">
            {DURABLE_EXAMPLES.map(ex => (
              <span key={ex} className="chip-ex"><span className="dot" />{ex}</span>
            ))}
          </div>
        </div>
      )}

      {data.cards.map(c => {
        const realized = c.credits.filter(cr => cr.captured).reduce((s, cr) => s + cr.value, 0);
        const total = c.credits.reduce((s, cr) => s + cr.value, 0);
        return (
          <div key={c.card_id}>
            <div className="credit-card-head">
              <span className={`chip chip-sm ${brandKey(c.card_id, c.issuer)}`}>
                {c.card_name.split(' ')[0].toUpperCase().slice(0, 5)}
              </span>
              <span className="credit-card-name">{c.card_name}</span>
              <span className="credit-card-totals">${realized} / ${total}</span>
              <span className="credit-card-fee">${c.annual_fee}/yr</span>
            </div>
            {c.credits.map(cr => {
              const key = `${c.card_id}::${cr.id}`;
              return (
                <div className="credit" key={cr.id}>
                  <div>
                    <div className="credit-name">{cr.name}</div>
                    <div className="credit-meta">{cr.cadence} · ${cr.value}/yr</div>
                  </div>
                  <div className="muted small" style={{ fontSize: 12, lineHeight: 1.5 }}>
                    {cr.description}
                  </div>
                  <button
                    className={`toggle ${cr.captured ? 'on' : ''}`}
                    onClick={() => toggle(c.card_id, cr.id, cr.captured)}
                    disabled={busy === key}
                    aria-label={cr.captured ? 'Mark as not captured' : 'Mark as captured'}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
