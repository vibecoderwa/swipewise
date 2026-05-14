import { Router } from 'express';
import pool from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { computeAll, monthlyTimeline } from '../core/rewards.js';
import { DEFAULT_FEES, DEFAULT_CPP, CATEGORIES } from '../core/data.js';
import type { CardId, CategoryId } from '../core/data.js';

const router = Router();

// GET /transactions?range=month|quarter|year&page=1&limit=50
router.get('/', requireAuth, async (req, res) => {
  const { range = 'month', page = '1', limit = '50' } = req.query as Record<string, string>;

  const interval = range === 'year' ? '1 year' : range === 'quarter' ? '3 months' : '1 month';
  const offset   = (parseInt(page) - 1) * parseInt(limit);

  const { rows } = await pool.query(
    `SELECT id, card_id, amount, category, merchant_name, date, pending, source, user_category
     FROM transactions
     WHERE user_id = $1 AND removed = FALSE AND date >= NOW() - INTERVAL '${interval}'
     ORDER BY date DESC
     LIMIT $2 OFFSET $3`,
    [req.userId, parseInt(limit), offset],
  );

  res.json(rows);
});

// PATCH /transactions/:id/category  — per-user category override
router.patch('/:id/category', requireAuth, async (req, res) => {
  const { category } = req.body as { category?: string };
  const valid = CATEGORIES.map(c => c.id) as string[];
  if (!category || !valid.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  await pool.query(
    `UPDATE transactions SET user_category = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3`,
    [category, req.params.id, req.userId],
  );
  res.json({ updated: true });
});

// GET /transactions/summary  — computeAll result
router.get('/summary', requireAuth, async (req, res) => {
  const { range = 'year' } = req.query as { range?: string };
  const interval = range === 'year' ? '1 year' : range === 'quarter' ? '3 months' : '1 month';

  const [txResult, settingsResult, cardsResult] = await Promise.all([
    pool.query<{ category: string; user_category: string | null; amount: string }>(
      `SELECT COALESCE(user_category, category) AS category, user_category, amount
       FROM transactions
       WHERE user_id = $1 AND removed = FALSE AND pending = FALSE
         AND date >= NOW() - INTERVAL '${interval}'`,
      [req.userId],
    ),
    pool.query<{ cpp: Record<CardId,number>; fees: Record<CardId,number> }>(
      `SELECT cpp, fees FROM user_settings WHERE user_id = $1`, [req.userId],
    ),
    pool.query<{ card_id: CardId }>(
      `SELECT card_id FROM user_cards WHERE user_id = $1 AND active = TRUE`, [req.userId],
    ),
  ]);

  const cpp     = settingsResult.rows[0]?.cpp  ?? DEFAULT_CPP;
  const fees    = settingsResult.rows[0]?.fees ?? DEFAULT_FEES;
  // If the user has no matched cards yet (e.g. sandbox accounts didn't map to
  // any v1 card product), pass `undefined` so computeAll falls back to all
  // supported cards. Otherwise downstream consumers see rows with `winner`
  // undefined and a `per` map with no entries.
  const ownedRows = cardsResult.rows.map(r => r.card_id);
  const owned     = ownedRows.length > 0 ? ownedRows : undefined;

  // Aggregate monthly spend per category
  const spend = Object.fromEntries(CATEGORIES.map(c => [c.id, 0])) as Record<CategoryId, number>;
  const multiplier = range === 'year' ? 1/12 : range === 'quarter' ? 1/3 : 1;
  txResult.rows.forEach(tx => {
    const cat = (tx.category ?? 'other') as CategoryId;
    if (cat in spend) spend[cat] += parseFloat(tx.amount) * multiplier;
  });

  const creditsUsed: Record<string, Record<string, boolean>> = {};
  const { rows: creditRows } = await pool.query(
    `SELECT card_id, credit_id, captured FROM user_credits WHERE user_id = $1`, [req.userId],
  );
  creditRows.forEach(r => {
    creditsUsed[r.card_id] ??= {};
    creditsUsed[r.card_id][r.credit_id] = r.captured;
  });

  const result = computeAll({ spend, fees, cpp, creditsUsed: creditsUsed as any }, owned);
  const timeline = monthlyTimeline({ spend, fees, cpp, creditsUsed: creditsUsed as any }, owned);

  res.json({ summary: result, timeline });
});

// POST /transactions  — manual swipe log (FR-MAN-01)
router.post('/manual', requireAuth, async (req, res) => {
  const { cardId, merchantName, category, amount } = req.body as {
    cardId?: string; merchantName?: string; category?: string; amount?: number;
  };
  if (!cardId) return res.status(400).json({ error: 'cardId required' });

  await pool.query(
    `INSERT INTO manual_swipes (user_id, card_id, merchant_name, category, amount)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.userId, cardId, merchantName ?? null, category ?? 'other', amount ?? null],
  );

  // Also write as a transaction row so it shows in analytics
  await pool.query(
    `INSERT INTO transactions (user_id, card_id, amount, category, merchant_name, date, source)
     VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, 'manual')`,
    [req.userId, cardId, amount ?? 0, category ?? 'other', merchantName ?? null],
  );

  res.status(201).json({ logged: true });
});

export default router;
