import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';

export default function Credits({ userCards }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const r = await api.credits();
      setData(r);
    } catch {
      // swallow — credits is non-critical
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh, userCards.length]);

  if (!data || data.cards.length === 0) {
    if (!userCards.length) return null;
    return (
      <div className="card">
        <h2>Credits &amp; perks</h2>
        <div className="muted small">
          None of your matched cards have tracked credits in our catalog yet.
        </div>
      </div>
    );
  }

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
      <h2>Credits &amp; perks</h2>

      <div style={{ marginBottom: 18 }}>
        <div className="metric-label">Realized this year vs. potential</div>
        <div className="metric-big">
          ${Math.round(data.total_realized)}
          <span style={{ fontSize: 24, color: 'var(--dim)', marginLeft: 8 }}>
            / ${Math.round(data.total_potential)}
          </span>
        </div>
        <div className="metric-sub">
          {data.net_after_fees >= 0
            ? <>Net of <b>${Math.round(data.total_fees)}</b> in annual fees, you're <b>+${Math.round(data.net_after_fees)}</b> ahead.</>
            : <>Annual fees of ${Math.round(data.total_fees)} put you <b>${Math.round(Math.abs(data.net_after_fees))}</b> behind. Capture the credits below.</>}
        </div>
      </div>

      {data.cards.map(c => (
        <div key={c.card_id}>
          <div className="credit-card-head">
            <span className="credit-card-name">{c.card_name}</span>
            <span className="muted small" style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              ${c.annual_fee}/yr fee
            </span>
          </div>
          {c.credits.map(cr => {
            const key = `${c.card_id}::${cr.id}`;
            return (
              <div className="credit" key={cr.id}>
                <button
                  className={`credit-toggle ${cr.captured ? 'checked' : ''}`}
                  onClick={() => toggle(c.card_id, cr.id, cr.captured)}
                  disabled={busy === key}
                  aria-label={cr.captured ? 'Mark as not captured' : 'Mark as captured'}
                />
                <div>
                  <div className="credit-name">{cr.name}</div>
                  <div className="credit-meta">{cr.cadence} · ${cr.value}/yr</div>
                  <div className="muted small" style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.45 }}>
                    {cr.description}
                  </div>
                </div>
                <div className="credit-value">${cr.value}</div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
