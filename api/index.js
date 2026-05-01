import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';

import { db, getOrCreateUser } from './db.js';
import { plaidClient, PLAID_PRODUCTS, PLAID_COUNTRY_CODES } from './plaid.js';
import { CARDS, categoryFromPlaid, rewardRate, bestCardFor, matchCardFromAccount } from './cards.js';
import { recommendCards } from './recommendations.js';

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
  res.json({ userId });
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
  const rows = db.prepare(`
    SELECT DISTINCT matched_card_id FROM accounts
    WHERE user_id = ? AND matched_card_id IS NOT NULL
  `).all(userId);
  return rows.map(r => CARDS.find(c => c.id === r.matched_card_id)).filter(Boolean);
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

const distDir = join(__dirname, '..', 'dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(join(distDir, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`swipewise api on :${PORT} (plaid env=${process.env.PLAID_ENV || 'sandbox'})`);
});
