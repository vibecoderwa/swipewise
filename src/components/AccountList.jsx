import { useState } from 'react';
import { api } from '../lib/api.js';
import CardArt from './CardArt.jsx';

function brandKey(card) {
  if (!card) return 'default';
  if (card.id?.startsWith('amex_')) return 'amex';
  if (card.id?.startsWith('chase_')) return 'chase';
  if (card.id?.startsWith('capone_')) return 'capone';
  if (card.id?.startsWith('citi_')) return 'citi';
  if (card.id?.startsWith('discover_')) return 'discover';
  return 'default';
}

export default function AccountList({ accounts, cards, onChange }) {
  const [busy, setBusy] = useState(null);

  if (!accounts.length) {
    return <div className="muted small">No accounts yet.</div>;
  }

  async function setMatch(accountId, cardId) {
    setBusy(accountId);
    try {
      await api.matchAccount(accountId, cardId || null);
      await onChange?.();
    } finally {
      setBusy(null);
    }
  }

  return accounts.map(a => {
    const brand = brandKey(a.matched_card);
    return (
      <div className={`card-mini ${brand}`} key={a.id}>
        {a.matched_card
          ? <CardArt card={a.matched_card} size="sm" />
          : <div className={`chip ${brand}`}>••••</div>}
        <div className="card-mini-name">
          {a.matched_card?.name || `${a.institution_name || 'Bank'} · ${a.name}`}
          <span className="iss">
            {a.matched_card
              ? `${a.matched_card.issuer}${a.mask ? ` · ••${a.mask}` : ''}`
              : `${a.subtype || a.type}${a.mask ? ` · ••${a.mask}` : ''}`}
          </span>
        </div>
        <select
          className="select"
          value={a.matched_card_id || ''}
          onChange={e => setMatch(a.id, e.target.value)}
          disabled={busy === a.id}
        >
          <option value="">— pick card —</option>
          {cards.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    );
  });
}
