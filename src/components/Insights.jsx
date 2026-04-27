const CATEGORY_LABELS = {
  groceries: 'Groceries',
  dining: 'Dining',
  gas: 'Gas',
  travel: 'Travel',
  online_shopping: 'Online',
  streaming: 'Streaming',
  other: 'Everything else',
};

export default function Insights({ data }) {
  if (!data) return null;
  const { transactions, total_missed_rewards, best_by_category, user_cards } = data;

  if (!user_cards.length) {
    return (
      <div className="card">
        <h2>Insights</h2>
        <div className="muted small">
          Match each connected account to a card above so we can compute rewards.
        </div>
      </div>
    );
  }

  const cats = ['groceries', 'dining', 'gas', 'travel', 'online_shopping', 'streaming', 'other'];

  return (
    <>
      <div className="card">
        <h2>Missed rewards (last 30d)</h2>
        <div className="big">${total_missed_rewards.toFixed(2)}</div>
        <div className="muted small">
          What you'd have earned by always using your best card.
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
                {b && <div className="rate">{b.rate}× / %</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2>Recent transactions</h2>
        {transactions.length === 0 && (
          <div className="muted small">No transactions yet. In Plaid sandbox, transactions appear after a few seconds.</div>
        )}
        {transactions.slice(0, 25).map(t => (
          <div className="tx" key={t.id}>
            <div className="name">{t.name || 'Unknown'}</div>
            <div className="amount">${t.amount.toFixed(2)}</div>
            <div className="meta">
              <span className="pill">{CATEGORY_LABELS[t.category] || t.category}</span>{' '}
              {t.used_card ? `Used: ${t.used_card.name} (${t.used_card.rate}×)` : 'Card unknown'}
              {t.best_card && t.used_card && t.best_card.id !== t.used_card.id && (
                <> · Better: <span className="missed">{t.best_card.name} ({t.best_card.rate}×)</span> · +${t.missed_rewards.toFixed(2)}</>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
