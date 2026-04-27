import { useState } from 'react';
import { api } from '../lib/api.js';

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

  return accounts.map(a => (
    <div className="account" key={a.id}>
      <div>
        <div className="name">{a.institution_name || 'Bank'} · {a.name}</div>
        <div className="meta">
          {a.subtype || a.type}{a.mask ? ` ••${a.mask}` : ''}
        </div>
      </div>
      <select
        className="select"
        value={a.matched_card_id || ''}
        onChange={e => setMatch(a.id, e.target.value)}
        disabled={busy === a.id}
      >
        <option value="">— pick a card —</option>
        {cards.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  ));
}
