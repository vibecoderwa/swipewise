const USER_KEY = 'swipewise_user_id';
const PHONE_KEY = 'swipewise_phone';

function getUserId() {
  return localStorage.getItem(USER_KEY);
}

function setUserId(id) {
  if (id) localStorage.setItem(USER_KEY, id);
}

export function clearSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PHONE_KEY);
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
  getUserId,
  getPhone: () => localStorage.getItem(PHONE_KEY),

  async me() {
    const r = await request('/api/me');
    if (!getUserId() && r.userId) setUserId(r.userId);
    return r;
  },

  async otpSend(phone) {
    return request('/api/auth/otp/send', { method: 'POST', body: JSON.stringify({ phone }) });
  },
  async otpVerify(phone, code) {
    const r = await request('/api/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone, code }) });
    if (r.user_id) {
      setUserId(r.user_id);
      localStorage.setItem(PHONE_KEY, r.phone || phone);
    }
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
  manualCards: () => request('/api/manual_cards'),
  setManualCards: (card_ids) =>
    request('/api/manual_cards', { method: 'POST', body: JSON.stringify({ card_ids }) }),
  insights: () => request('/api/insights'),
  recommendations: () => request('/api/recommendations'),
  credits: () => request('/api/credits'),
  toggleCredit: (card_id, credit_id, captured) =>
    request('/api/credits/toggle', { method: 'POST', body: JSON.stringify({ card_id, credit_id, captured }) }),
};
