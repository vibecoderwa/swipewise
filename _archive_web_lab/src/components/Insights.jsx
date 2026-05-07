const CATEGORY_LABELS = {
  groceries: 'Groceries',
  dining: 'Dining',
  gas: 'Gas',
  travel: 'Travel',
  online_shopping: 'Online',
  streaming: 'Streaming',
  other: 'Everything else',
};

function brandKey(card) {
  if (!card) return 'default';
  if (card.id?.startsWith('amex_')) return 'amex';
  if (card.id?.startsWith('chase_')) return 'chase';
  if (card.id?.startsWith('capone_')) return 'capone';
  if (card.id?.startsWith('citi_')) return 'citi';
  if (card.id?.startsWith('discover_')) return 'discover';
  return 'default';
}

export default function Insights({ data }) {
  if (!data) return null;
  const { transactions, total_missed_rewards, best_by_category, user_cards } = data;

  if (!user_cards.length) {
    return (
      <div className="card">
        <div className="metric-eyebrow">Almost there</div>
        <div className="metric-sub" style={{ marginTop: 10 }}>
          Match each connected account to a real card below so we can compute rewards.
        </div>
      </div>
    );
  }

  const cats = ['groceries', 'dining', 'gas', 'travel', 'online_shopping', 'streaming', 'other'];

  return (
    <>
      <div className="card">
        <div className="metric-eyebrow">Missed rewards · last 30 days</div>
        <div className="metric-big">
          <span className="sign">+</span>${total_missed_rewards.toFixed(0)}
        </div>
        <div className="metric-sub">
          What you'd have earned by always reaching for your <b>best card</b>.
        </div>
      </div>

      <div className="card">
        <h2>Best card by category</h2>
        <div className="cat-grid">
          {cats.map(c => {
            const b = best_by_category[c];
            return (
              <div className="cat" key={c}>
                <div className="label">{CATEGORY_LABELS[c]}</div>
                <div className="value">{b ? b.card_name : '—'}</div>
                {b && <div className="rate">{b.rate}% back</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2>Recent transactions</h2>
        {transactions.length === 0 && (
          <div className="muted small">No transactions yet. Sync above to pull the latest.</div>
        )}
        {transactions.slice(0, 25).map(t => {
          const usedBrand = brandKey(t.used_card);
          const bestBrand = brandKey(t.best_card);
          return (
            <div className="tx" key={t.id}>
              <div className="name">{t.name || 'Unknown'}</div>
              <div className="amount">${t.amount.toFixed(2)}</div>
              <div className="meta">
                <span className={`mult ${usedBrand}`}>
                  {t.used_card ? `${t.used_card.rate}×` : '—'}
                </span>{' '}
                {t.used_card ? t.used_card.name : 'Card unknown'}
                <span className="pill" style={{ marginLeft: 8 }}>{CATEGORY_LABELS[t.category] || t.category}</span>
                {t.best_card && t.used_card && t.best_card.id !== t.used_card.id && t.missed_rewards > 0 && (
                  <div style={{ marginTop: 6 }}>
                    Better: <span className={`mult ${bestBrand}`}>{t.best_card.rate}×</span> {t.best_card.name} · <span className="missed">+${t.missed_rewards.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
