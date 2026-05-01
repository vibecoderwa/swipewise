import ScreenHeader from '../components/ScreenHeader.jsx';
import Icon from '../components/Icon.jsx';

const CATEGORY_META = [
  { id: 'groceries',       label: 'Groceries',     icon: 'grocery' },
  { id: 'dining',          label: 'Dining',        icon: 'dining' },
  { id: 'gas',             label: 'Gas',           icon: 'gas' },
  { id: 'travel',          label: 'Travel',        icon: 'flight' },
  { id: 'online_shopping', label: 'Online',        icon: 'online' },
  { id: 'streaming',       label: 'Streaming',     icon: 'streaming' },
  { id: 'other',           label: 'Everything else', icon: 'shopping' },
];

function brandKey(cardId) {
  if (!cardId) return 'dim';
  if (cardId.startsWith('amex_')) return 'amex';
  if (cardId.startsWith('chase_')) return 'chase';
  if (cardId.startsWith('capone_')) return 'capone';
  if (cardId.startsWith('citi_')) return 'citi';
  if (cardId.startsWith('discover_')) return 'discover';
  return 'dim';
}

export default function CategoriesScreen({ insights }) {
  if (!insights) return <div className="screen"><div className="loading">Loading…</div></div>;
  const { best_by_category, user_cards } = insights;

  if (!user_cards.length) {
    return (
      <div className="screen">
        <ScreenHeader eyebrow="Spending" title="Categories" />
        <div className="card">
          <div className="metric-sub">
            Match your accounts to real cards in <b>Settings</b> first.
          </div>
        </div>
      </div>
    );
  }

  // Sort by rate descending so the highest-earning categories surface first
  const rows = CATEGORY_META.map(m => ({
    ...m,
    best: best_by_category[m.id],
  }));

  return (
    <div className="screen">
      <ScreenHeader eyebrow="Spending" title="Categories" />
      <div className="card">
        <div className="muted small" style={{ marginBottom: 8, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 14 }}>
          The card that earns most per dollar in each category — across the cards you own.
        </div>
        <div className="cat-list">
          {rows.map(r => (
            <div className="cat-row-m" key={r.id}>
              <div className="cat-icon">
                <Icon name={r.icon} size={18} />
              </div>
              <div className="cat-text">
                <div className="cat-name">{r.label}</div>
                <div className="cat-sub">{r.best ? r.best.card_name : 'No matched card'}</div>
              </div>
              <div className="cat-amount">{r.best ? `${r.best.rate}%` : '—'}</div>
              <span className={`mult ${brandKey(r.best?.card_id)}`}>{r.best ? `${r.best.rate}×` : '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
