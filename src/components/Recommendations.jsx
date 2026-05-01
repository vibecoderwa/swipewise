import { useState } from 'react';
import CardArt from './CardArt.jsx';

function ConfidenceBadge({ level }) {
  const lit = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <span className="conf" title={`${level} confidence`}>
      {[0, 1, 2].map(i => (
        <span key={i} className={`conf-dot ${i < lit ? 'on' : ''}`} />
      ))}
    </span>
  );
}

export default function Recommendations({ data, allCards = [] }) {
  const cardById = Object.fromEntries(allCards.map(c => [c.id, c]));
  const [expanded, setExpanded] = useState(null);
  if (!data) return null;

  if (!data.sufficient_data) {
    return (
      <div className="card">
        <h2>Card recommendations</h2>
        <div className="muted small">
          We need a bit more transaction history to make solid recommendations
          (currently {data.transaction_count} transactions). Sync again in a few
          days as more transactions roll in.
        </div>
      </div>
    );
  }

  if (data.recommendations.length === 0) {
    return (
      <div className="card">
        <h2>Card recommendations</h2>
        <div className="muted small">
          Based on your spending, your current cards already cover you well —
          no card we know of would meaningfully improve your rewards after fees.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Cards you should apply for</h2>
      <div className="muted small" style={{ marginBottom: 12 }}>
        Estimated extra rewards per year, after annual fee, based on your last{' '}
        {data.days_of_data} days of spending.
      </div>
      {data.recommendations.map((r, i) => (
        <div className="rec" key={r.card_id}>
          <div className="rec-row">
            <CardArt card={cardById[r.card_id] || { id: r.card_id, name: r.card_name, issuer: r.issuer }} size="md" />
            <div className="rec-main">
              <div className="rec-name">
                {r.card_name}
                <ConfidenceBadge level={r.confidence} />
              </div>
              <div className="rec-headline muted small">{r.headline}</div>
            </div>
            <div className="rec-value">
              <div className="rec-net">+${Math.round(r.net_value)}</div>
              <div className="rec-fee">/yr{r.annual_fee > 0 ? ` · $${r.annual_fee} fee` : ''}</div>
            </div>
          </div>
          <button
            className="rec-toggle"
            onClick={() => setExpanded(expanded === r.card_id ? null : r.card_id)}
          >
            {expanded === r.card_id ? 'Hide breakdown' : 'See breakdown →'}
          </button>
          {expanded === r.card_id && (
            <div className="rec-breakdown">
              {r.top_categories.map(b => (
                <div className="rec-cat" key={b.category}>
                  <span>
                    <b>${Math.round(b.extra_rewards)}/yr</b> on {b.label}
                  </span>
                  <span className="muted small">
                    {b.new_rate}% vs your {b.old_rate}% · ${Math.round(b.annual_spend)}/yr
                  </span>
                </div>
              ))}
              <div className="muted small" style={{ marginTop: 8 }}>
                Annual fee: ${r.annual_fee} · Gross extra: ${Math.round(r.annual_extra_rewards)}/yr
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
