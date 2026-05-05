import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';

import { db, getOrCreateUser, findUserByPhone, setUserPhone, isoYearWeek, getPrefs, setPrefs } from './db.js';
import { plaidClient, PLAID_PRODUCTS, PLAID_COUNTRY_CODES } from './plaid.js';
import { CARDS, categoryFromPlaid, rewardRate, bestCardFor, matchCardFromAccount } from './cards.js';
import { recommendCards } from './recommendations.js';
import { seedSyntheticHistory, FRIENDS, FRIEND_POSTS } from './seed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

function getUserId(req) {
  let userId = req.headers['x-user-id'];
  if (!userId) {
    userId = crypto.randomUUID();
  }
  getOrCreateUser(userId);
  return userId;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: process.env.PLAID_ENV || 'sandbox' });
});

app.get('/api/me', (req, res) => {
  const userId = getUserId(req);
  const u = db.prepare('SELECT id, phone FROM users WHERE id = ?').get(userId);
  res.json({ userId, phone: u?.phone || null });
});

// ─── Auth — phone + OTP (mock) ───────────────────────────────
// Prototype-grade: doesn't send real SMS. Any 6-digit code verifies.
// On send, we look up or create a user keyed by phone, and issue
// a mock code (always "421906" in non-production for easy demoing).
app.post('/api/auth/otp/send', (req, res) => {
  const { phone } = req.body || {};
  if (!phone || !/^\+?[\d\s().-]{7,}$/.test(phone)) {
    return res.status(400).json({ error: 'phone required' });
  }
  const normalized = phone.replace(/[^\d+]/g, '');

  let user = findUserByPhone(normalized);
  if (!user) {
    const newId = crypto.randomUUID();
    getOrCreateUser(newId);
    setUserPhone(newId, normalized);
    user = { id: newId };
  }

  const code = process.env.NODE_ENV === 'production'
    ? String(Math.floor(100000 + Math.random() * 900000))
    : '421906';
  const expiresAt = Date.now() + 10 * 60 * 1000;

  db.prepare(`INSERT INTO auth_otps (phone, user_id, code, expires_at, attempts)
              VALUES (?, ?, ?, ?, 0)
              ON CONFLICT(phone) DO UPDATE SET
                user_id = excluded.user_id,
                code = excluded.code,
                expires_at = excluded.expires_at,
                attempts = 0`)
    .run(normalized, user.id, code, expiresAt);

  res.json({
    sent: true,
    // For prototype convenience we surface the code in non-prod so the
    // user can demo the flow without a real SMS provider wired up.
    demo_code: process.env.NODE_ENV === 'production' ? undefined : code,
  });
});

app.post('/api/auth/otp/verify', (req, res) => {
  const { phone, code } = req.body || {};
  if (!phone || !code) return res.status(400).json({ error: 'phone and code required' });
  const normalized = phone.replace(/[^\d+]/g, '');

  const otp = db.prepare('SELECT * FROM auth_otps WHERE phone = ?').get(normalized);
  if (!otp) return res.status(400).json({ error: 'No code requested for this number' });
  if (otp.expires_at < Date.now()) return res.status(400).json({ error: 'Code expired — request a new one' });
  if (otp.attempts >= 5) return res.status(429).json({ error: 'Too many attempts. Request a new code.' });

  db.prepare('UPDATE auth_otps SET attempts = attempts + 1 WHERE phone = ?').run(normalized);

  if (String(code).trim() !== otp.code) {
    return res.status(400).json({ error: 'Wrong code — try again' });
  }

  // Burn the OTP after success.
  db.prepare('DELETE FROM auth_otps WHERE phone = ?').run(normalized);
  res.json({ user_id: otp.user_id, phone: normalized });
});

// ─── Manual card catalog selection (FR-ONB-02) ───────────────
app.get('/api/manual_cards', (req, res) => {
  const userId = getUserId(req);
  const rows = db.prepare('SELECT card_id FROM manual_cards WHERE user_id = ?').all(userId);
  const cards = rows.map(r => CARDS.find(c => c.id === r.card_id)).filter(Boolean);
  res.json({ cards });
});

app.post('/api/manual_cards', (req, res) => {
  const userId = getUserId(req);
  const { card_ids } = req.body || {};
  if (!Array.isArray(card_ids)) return res.status(400).json({ error: 'card_ids[] required' });
  const known = new Set(CARDS.map(c => c.id));
  const valid = card_ids.filter(id => known.has(id));

  const tx = db.transaction((ids) => {
    db.prepare('DELETE FROM manual_cards WHERE user_id = ?').run(userId);
    const ins = db.prepare('INSERT INTO manual_cards (user_id, card_id, added_at) VALUES (?, ?, ?)');
    const now = Date.now();
    for (const id of ids) ins.run(userId, id, now);
  });
  tx(valid);

  // First time the user adds cards via the manual path, seed synthetic
  // history so the streak and YTD aren't empty on day one.
  const userCardObjs = valid.map(id => CARDS.find(c => c.id === id)).filter(Boolean);
  seedSyntheticHistory(userId, userCardObjs);

  res.json({ ok: true, count: valid.length });
});

app.post('/api/plaid/link_token', async (req, res) => {
  try {
    const userId = getUserId(req);
    const r = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Swipewise',
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: 'en',
    });
    res.json({ link_token: r.data.link_token, user_id: userId });
  } catch (err) {
    console.error('link_token error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.post('/api/plaid/exchange', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { public_token, institution } = req.body;
    const exchange = await plaidClient.itemPublicTokenExchange({ public_token });
    const access_token = exchange.data.access_token;
    const item_id = exchange.data.item_id;

    const itemRowId = crypto.randomUUID();
    db.prepare(`INSERT INTO plaid_items (id, user_id, access_token, item_id, institution_name, created_at)
                VALUES (?, ?, ?, ?, ?, ?)`)
      .run(itemRowId, userId, access_token, item_id, institution?.name || null, Date.now());

    const acctsResp = await plaidClient.accountsGet({ access_token });
    const insertAcct = db.prepare(`INSERT OR REPLACE INTO accounts
      (id, item_id, user_id, name, mask, type, subtype, matched_card_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

    for (const a of acctsResp.data.accounts) {
      const matched = matchCardFromAccount(a);
      insertAcct.run(
        a.account_id, itemRowId, userId, a.name, a.mask,
        a.type, a.subtype, matched?.id || null
      );
    }

    res.json({ ok: true, accounts: acctsResp.data.accounts.length });
  } catch (err) {
    console.error('exchange error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.post('/api/sync', async (req, res) => {
  try {
    const userId = getUserId(req);
    const items = db.prepare('SELECT * FROM plaid_items WHERE user_id = ?').all(userId);
    let totalAdded = 0;

    for (const item of items) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      const fmt = d => d.toISOString().slice(0, 10);

      const txResp = await plaidClient.transactionsGet({
        access_token: item.access_token,
        start_date: fmt(start),
        end_date: fmt(end),
        options: { count: 250 },
      });

      const upsert = db.prepare(`INSERT OR REPLACE INTO transactions
        (id, user_id, account_id, name, merchant_name, amount, date, category, pfc_primary, pfc_detailed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

      for (const t of txResp.data.transactions) {
        upsert.run(
          t.transaction_id, userId, t.account_id,
          t.name, t.merchant_name, t.amount, t.date,
          (t.category && t.category[0]) || null,
          t.personal_finance_category?.primary || null,
          t.personal_finance_category?.detailed || null,
        );
        totalAdded++;
      }
    }
    res.json({ ok: true, transactions_synced: totalAdded });
  } catch (err) {
    console.error('sync error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.get('/api/accounts', (req, res) => {
  const userId = getUserId(req);
  const accts = db.prepare(`
    SELECT a.*, i.institution_name
    FROM accounts a JOIN plaid_items i ON a.item_id = i.id
    WHERE a.user_id = ?
  `).all(userId);
  const enriched = accts.map(a => ({
    ...a,
    matched_card: a.matched_card_id ? CARDS.find(c => c.id === a.matched_card_id) : null,
  }));
  res.json({ accounts: enriched });
});

app.post('/api/accounts/:id/match', (req, res) => {
  const userId = getUserId(req);
  const { card_id } = req.body;
  if (card_id && !CARDS.find(c => c.id === card_id)) {
    return res.status(400).json({ error: 'Unknown card_id' });
  }
  db.prepare('UPDATE accounts SET matched_card_id = ? WHERE id = ? AND user_id = ?')
    .run(card_id || null, req.params.id, userId);
  res.json({ ok: true });
});

app.get('/api/cards', (_req, res) => {
  res.json({ cards: CARDS });
});

function userCards(userId) {
  const plaidRows = db.prepare(`
    SELECT DISTINCT matched_card_id FROM accounts
    WHERE user_id = ? AND matched_card_id IS NOT NULL
  `).all(userId);
  const manualRows = db.prepare(`
    SELECT card_id FROM manual_cards WHERE user_id = ?
  `).all(userId);
  const ids = new Set([
    ...plaidRows.map(r => r.matched_card_id),
    ...manualRows.map(r => r.card_id),
  ]);
  return [...ids].map(id => CARDS.find(c => c.id === id)).filter(Boolean);
}

app.get('/api/insights', (req, res) => {
  const userId = getUserId(req);
  const cards = userCards(userId);
  const txs = db.prepare(`
    SELECT t.*, a.matched_card_id
    FROM transactions t JOIN accounts a ON t.account_id = a.id
    WHERE t.user_id = ? AND t.amount > 0
    ORDER BY t.date DESC LIMIT 100
  `).all(userId);

  const items = txs.map(t => {
    const category = categoryFromPlaid(t.pfc_detailed, t.pfc_primary);
    const usedCard = t.matched_card_id ? CARDS.find(c => c.id === t.matched_card_id) : null;
    const usedRate = usedCard ? rewardRate(usedCard, category) : 1.0;
    const best = cards.length ? bestCardFor(category, cards) : null;
    const missed = best && usedCard
      ? Math.max(0, (best.rate - usedRate) / 100 * t.amount)
      : 0;
    return {
      id: t.id, date: t.date, name: t.merchant_name || t.name,
      amount: t.amount, category,
      used_card: usedCard ? { id: usedCard.id, name: usedCard.name, rate: usedRate } : null,
      best_card: best ? { id: best.card.id, name: best.card.name, rate: best.rate } : null,
      missed_rewards: Number(missed.toFixed(2)),
    };
  });

  const totalMissed = items.reduce((s, i) => s + i.missed_rewards, 0);
  const byCategory = {};
  for (const c of cards) {
    for (const cat of ['groceries', 'dining', 'gas', 'travel', 'online_shopping', 'streaming', 'other']) {
      if (!byCategory[cat] || rewardRate(c, cat) > byCategory[cat].rate) {
        byCategory[cat] = { card_id: c.id, card_name: c.name, rate: rewardRate(c, cat) };
      }
    }
  }

  res.json({
    user_cards: cards,
    transactions: items,
    total_missed_rewards: Number(totalMissed.toFixed(2)),
    best_by_category: byCategory,
  });
});

app.get('/api/credits', (req, res) => {
  const userId = getUserId(req);
  const cards = userCards(userId);

  const captured = new Map();
  for (const row of db.prepare('SELECT card_id, credit_id, captured FROM captured_credits WHERE user_id = ?').all(userId)) {
    captured.set(`${row.card_id}::${row.credit_id}`, row.captured === 1);
  }

  const result = [];
  let totalRealized = 0;
  let totalPotential = 0;
  let totalFees = 0;

  for (const card of cards) {
    if (!card.credits || !card.credits.length) continue;
    const items = card.credits.map(cr => {
      const key = `${card.id}::${cr.id}`;
      const isCaptured = captured.has(key) ? captured.get(key) : !!cr.defaultCaptured;
      totalPotential += cr.value;
      if (isCaptured) totalRealized += cr.value;
      return { ...cr, captured: isCaptured };
    });
    totalFees += card.annual_fee || 0;
    result.push({
      card_id: card.id,
      card_name: card.name,
      issuer: card.issuer,
      annual_fee: card.annual_fee || 0,
      credits: items,
    });
  }

  res.json({
    cards: result,
    total_realized: Number(totalRealized.toFixed(2)),
    total_potential: Number(totalPotential.toFixed(2)),
    total_fees: Number(totalFees.toFixed(2)),
    net_after_fees: Number((totalRealized - totalFees).toFixed(2)),
  });
});

app.post('/api/credits/toggle', (req, res) => {
  const userId = getUserId(req);
  const { card_id, credit_id, captured } = req.body;
  if (!card_id || !credit_id) return res.status(400).json({ error: 'card_id and credit_id required' });

  db.prepare(`INSERT INTO captured_credits (user_id, card_id, credit_id, captured, updated_at)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(user_id, card_id, credit_id) DO UPDATE SET captured = excluded.captured, updated_at = excluded.updated_at`)
    .run(userId, card_id, credit_id, captured ? 1 : 0, Date.now());

  res.json({ ok: true });
});

app.get('/api/recommendations', (req, res) => {
  const userId = getUserId(req);
  const cards = userCards(userId);
  const ownedCardIds = cards.map(c => c.id);

  const txs = db.prepare(`
    SELECT t.*
    FROM transactions t
    WHERE t.user_id = ? AND t.amount > 0
    ORDER BY t.date DESC
  `).all(userId);

  let days = 30;
  if (txs.length > 0) {
    const dates = txs.map(t => t.date).filter(Boolean).sort();
    if (dates.length >= 2) {
      const oldest = new Date(dates[0]);
      const newest = new Date(dates[dates.length - 1]);
      const span = Math.max(1, Math.round((newest - oldest) / 86400000));
      days = Math.min(span, 90);
    }
  }

  const result = recommendCards({ transactions: txs, ownedCardIds, days });
  res.json(result);
});

// ─── Streak + YTD ────────────────────────────────────────────
// Streak is the count of consecutive recent ISO weeks (working backwards from
// the current week) in which the user logged ≥1 smart-swipe event. YTD is the
// sum of `reward` across this calendar year's events. Both are real, computed.
app.get('/api/streak', (req, res) => {
  const userId = getUserId(req);
  const events = db.prepare(`
    SELECT iso_year, iso_week, reward, created_at FROM swipe_events
    WHERE user_id = ?
  `).all(userId);

  const yearNow = new Date().getUTCFullYear();
  const weekKeys = new Set(events.map(e => `${e.iso_year}-${e.iso_week}`));

  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 200; i++) {
    const { year, week } = isoYearWeek(cursor);
    const key = `${year}-${week}`;
    if (weekKeys.has(key)) {
      streak++;
    } else if (streak > 0) {
      break;
    } else if (i > 0) {
      // No events in current week is OK — only break the streak once we've
      // started counting.
      break;
    }
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }

  const ytd = events
    .filter(e => e.iso_year === yearNow)
    .reduce((s, e) => s + (e.reward || 0), 0);

  res.json({
    streak,
    ytd_total: Math.round(ytd),
    ytd_year: yearNow,
    event_count: events.length,
  });
});

// Log a new smart-swipe event. Returns the updated streak/ytd so the client
// can drive the count-up animation in WinMoment without a second call.
app.post('/api/swipes', (req, res) => {
  const userId = getUserId(req);
  const { card_id, merchant, location, category, rate, basket } = req.body || {};
  if (!card_id || !merchant || !category) {
    return res.status(400).json({ error: 'card_id, merchant, category required' });
  }
  const card = CARDS.find(c => c.id === card_id);
  if (!card) return res.status(400).json({ error: 'unknown card_id' });

  const r = Number(rate) || rewardRate(card, category);
  const b = Number(basket) || 0;
  const reward = +(r * b * 0.01).toFixed(2);
  const now = new Date();
  const { year, week } = isoYearWeek(now);
  const id = crypto.randomUUID();

  db.prepare(`
    INSERT INTO swipe_events
    (id, user_id, card_id, merchant, location, category, rate, basket, reward, created_at, iso_year, iso_week)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, card_id, merchant, location || null, category,
         r, b, reward, now.getTime(), year, week);

  res.json({ ok: true, id, reward });
});

// ─── Feed: friends posts + user's own posts + pending suggestions ─
app.get('/api/feed', (req, res) => {
  const userId = getUserId(req);

  const userPosts = db.prepare(`
    SELECT * FROM feed_posts WHERE user_id = ? ORDER BY created_at DESC
  `).all(userId).map(p => {
    const card = CARDS.find(c => c.id === p.card_id);
    return {
      id: p.id, is_you: true,
      user_name: 'You', avatar_init: 'Y', avatar_tone: 'plum',
      card_id: p.card_id, card_name: card?.name || p.card_id,
      merchant: p.merchant, location: p.location,
      category: p.category, rate: p.rate,
      emoji: p.emoji, caption: p.caption,
      tagged: p.tagged_ids ? JSON.parse(p.tagged_ids) : [],
      visibility: p.visibility,
      created_at: p.created_at,
    };
  });

  const now = Date.now();
  const friendPosts = FRIEND_POSTS.map(p => {
    const card = CARDS.find(c => c.id === p.card_id);
    return {
      id: p.id, is_you: false,
      user_name: p.user_name, avatar_init: p.avatar_init, avatar_tone: p.avatar_tone,
      card_id: p.card_id, card_name: card?.name || p.card_id,
      merchant: p.merchant, location: p.location,
      category: p.category, rate: p.rate,
      emoji: p.emoji, caption: p.caption,
      tagged: p.tagged,
      created_at: now - p.hours_ago * 3600 * 1000,
      likes: p.likes, comments: p.comments,
    };
  });

  const pending = db.prepare(`
    SELECT * FROM pending_swipes
    WHERE user_id = ? AND dismissed_at IS NULL
    ORDER BY created_at DESC
  `).all(userId).map(p => {
    const card = CARDS.find(c => c.id === p.card_id);
    return {
      id: p.id, swipe_id: p.swipe_id,
      card_id: p.card_id, card_name: card?.name || p.card_id,
      merchant: p.merchant, location: p.location,
      category: p.category, rate: p.rate,
      created_at: p.created_at,
    };
  });

  // Friends-week activity stat for the home strip
  const weekAgo = now - 7 * 86400 * 1000;
  const weekFriends = friendPosts.filter(p => p.created_at >= weekAgo);
  const friendNamesShort = [...new Set(weekFriends.map(p => p.user_name.split(' ')[0]))];

  res.json({
    posts: [...userPosts, ...friendPosts].sort((a, b) => b.created_at - a.created_at),
    pending,
    friends: FRIENDS,
    friends_week: {
      names: friendNamesShort,
      total_reward: weekFriends.reduce((s, p) => s + (p.rate * 18), 0).toFixed(0),
    },
  });
});

app.post('/api/posts', (req, res) => {
  const userId = getUserId(req);
  const { swipe_id, card_id, merchant, location, category, rate, emoji, caption, tagged, visibility } = req.body || {};
  if (!card_id || !merchant) return res.status(400).json({ error: 'card_id and merchant required' });

  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO feed_posts
    (id, user_id, swipe_id, card_id, merchant, location, category, rate, emoji, caption, tagged_ids, visibility, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, swipe_id || null, card_id, merchant, location || null,
         category || null, rate || null, emoji || null, caption || null,
         JSON.stringify(tagged || []), visibility || 'friends', Date.now());

  // If this was a pending suggestion, mark it dismissed so it leaves the strip.
  if (swipe_id) {
    db.prepare('UPDATE pending_swipes SET dismissed_at = ? WHERE swipe_id = ? AND user_id = ?')
      .run(Date.now(), swipe_id, userId);
  }

  res.json({ ok: true, id });
});

app.post('/api/pending/:id/dismiss', (req, res) => {
  const userId = getUserId(req);
  db.prepare('UPDATE pending_swipes SET dismissed_at = ? WHERE id = ? AND user_id = ?')
    .run(Date.now(), req.params.id, userId);
  res.json({ ok: true });
});

// ─── Prefs ───────────────────────────────────────────────────
app.get('/api/prefs', (req, res) => {
  const userId = getUserId(req);
  const p = getPrefs(userId);
  res.json({
    default_visibility: p.default_visibility,
    reduce_patterns: !!p.reduce_patterns,
    notif_arrival: !!p.notif_arrival,
    notif_expiring: !!p.notif_expiring,
    notif_weekly: !!p.notif_weekly,
    cpp: p.cpp,
    auto_share: !!p.auto_share,
    suggest_tags: !!p.suggest_tags,
    show_badges: !!p.show_badges,
    persona: p.persona,
    streak_freezes: p.streak_freezes,
    nag_under_amount: p.nag_under_amount,
    crowd_optin: !!p.crowd_optin,
  });
});
app.post('/api/prefs', (req, res) => {
  const userId = getUserId(req);
  const allowed = ['default_visibility', 'reduce_patterns', 'notif_arrival',
                   'notif_expiring', 'notif_weekly', 'cpp',
                   'auto_share', 'suggest_tags', 'show_badges',
                   'persona', 'streak_freezes', 'nag_under_amount', 'crowd_optin'];
  const patch = {};
  for (const k of allowed) if (k in (req.body || {})) patch[k] = req.body[k];
  const p = setPrefs(userId, patch);
  res.json({ ok: true, prefs: p });
});

// ─── Swipe history feed (Plaid + manual swipe events combined) ───
// Returns chronological feed of swipes: from `swipe_events` (manual confirmed
// + recommended path) and `transactions` (Plaid-detected). Each carries an
// `optimal` flag computed against `bestCardFor(category, userCards)`.
app.get('/api/log', (req, res) => {
  const userId = getUserId(req);
  const cards = userCards(userId);

  const events = db.prepare(`
    SELECT * FROM swipe_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 100
  `).all(userId).map(e => {
    const card = CARDS.find(c => c.id === e.card_id);
    const best = cards.length ? bestCardFor(e.category, cards) : null;
    const optimal = best && card ? best.card.id === card.id : true;
    const earned = (e.rate / 100) * (e.basket || 0);
    const couldHave = best ? (best.rate / 100) * (e.basket || 0) : earned;
    return {
      id: e.id, source: 'manual',
      ts: e.created_at,
      merchant: e.merchant, location: e.location,
      category: e.category,
      card_id: e.card_id, card_name: card?.name || e.card_id,
      rate: e.rate, basket: e.basket,
      earned: +earned.toFixed(2),
      could_have: +couldHave.toFixed(2),
      missed: +Math.max(0, couldHave - earned).toFixed(2),
      optimal,
      best_card_id: best?.card.id,
      best_rate: best?.rate,
    };
  });

  const txs = db.prepare(`
    SELECT t.*, a.matched_card_id
    FROM transactions t JOIN accounts a ON t.account_id = a.id
    WHERE t.user_id = ? AND t.amount > 0
    ORDER BY t.date DESC LIMIT 100
  `).all(userId).map(t => {
    const cat = categoryFromPlaid(t.pfc_detailed, t.pfc_primary);
    const card = t.matched_card_id ? CARDS.find(c => c.id === t.matched_card_id) : null;
    const usedRate = card ? rewardRate(card, cat) : 1;
    const best = cards.length ? bestCardFor(cat, cards) : null;
    const earned = (usedRate / 100) * t.amount;
    const couldHave = best ? (best.rate / 100) * t.amount : earned;
    return {
      id: t.id, source: 'plaid',
      ts: new Date(t.date).getTime(),
      merchant: t.merchant_name || t.name,
      category: cat,
      card_id: card?.id, card_name: card?.name || 'Unknown',
      rate: usedRate, basket: t.amount,
      earned: +earned.toFixed(2),
      could_have: +couldHave.toFixed(2),
      missed: +Math.max(0, couldHave - earned).toFixed(2),
      optimal: best && card ? best.card.id === card.id : true,
      best_card_id: best?.card.id,
      best_rate: best?.rate,
    };
  });

  const all = [...events, ...txs].sort((a, b) => b.ts - a.ts);
  res.json({
    items: all,
    counts: {
      total: all.length,
      optimal: all.filter(x => x.optimal).length,
      suboptimal: all.filter(x => !x.optimal).length,
      manual: all.filter(x => x.source === 'manual').length,
    },
    total_missed: +all.reduce((s, x) => s + x.missed, 0).toFixed(2),
  });
});

const distDir = join(__dirname, '..', 'dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(join(distDir, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`swipewise api on :${PORT} (plaid env=${process.env.PLAID_ENV || 'sandbox'})`);
});
