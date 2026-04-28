const USER_KEY = 'swipewise_user_id';

function getUserId() {
  let id = localStorage.getItem(USER_KEY);
  return id;
}

function setUserId(id) {
  localStorage.setItem(USER_KEY, id);
}

async function request(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const userId = getUserId();
  if (userId) headers['x-user-id'] = userId;
  const res = await fetch(path, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(typeof err.error === 'string' ? err.error : JSON.stringify(err.error || err));
  }
  return res.json();
}

export const api = {
  async me() {
    const r = await request('/api/me');
    if (!getUserId() && r.userId) setUserId(r.userId);
    return r;
  },
  linkToken: () => request('/api/plaid/link_token', { method: 'POST', body: '{}' }),
  exchange: (public_token, institution) =>
    request('/api/plaid/exchange', { method: 'POST', body: JSON.stringify({ public_token, institution }) }),
  sync: () => request('/api/sync', { method: 'POST', body: '{}' }),
  accounts: () => request('/api/accounts'),
  matchAccount: (accountId, cardId) =>
    request(`/api/accounts/${accountId}/match`, { method: 'POST', body: JSON.stringify({ card_id: cardId }) }),
  cards: () => request('/api/cards'),
  insights: () => request('/api/insights'),
  recommendations: () => request('/api/recommendations'),
};
