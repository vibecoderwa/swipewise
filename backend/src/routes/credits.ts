import { Router } from 'express';
import pool from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { CREDITS, CARDS } from '../core/data.js';
import type { CardId } from '../core/data.js';

const router = Router();

// GET /credits  — all credits for user's cards with captured state
router.get('/', requireAuth, async (req, res) => {
  const [cardsRes, capturedRes] = await Promise.all([
    pool.query<{ card_id: CardId }>(
      `SELECT card_id FROM user_cards WHERE user_id = $1 AND active = TRUE`, [req.userId],
    ),
    pool.query<{ card_id: string; credit_id: string; captured: boolean }>(
      `SELECT card_id, credit_id, captured FROM user_credits WHERE user_id = $1`, [req.userId],
    ),
  ]);

  const capturedMap: Record<string, Record<string, boolean>> = {};
  capturedRes.rows.forEach(r => {
    capturedMap[r.card_id] ??= {};
    capturedMap[r.card_id][r.credit_id] = r.captured;
  });

  const result = cardsRes.rows.map(({ card_id }) => {
    const meta    = CARDS.find(c => c.id === card_id)!;
    const credits = (CREDITS[card_id] ?? []).map(credit => ({
      ...credit,
      captured: capturedMap[card_id]?.[credit.id] ?? false,
    }));

    const totalPotential = credits.reduce((s, c) => s + c.annual, 0);
    const totalCaptured  = credits.filter(c => c.captured).reduce((s, c) => s + c.annual, 0);

    return { cardId: card_id, cardName: meta.name, credits, totalPotential, totalCaptured };
  });

  res.json(result);
});

// PATCH /credits/:cardId/:creditId  — toggle captured state
router.patch('/:cardId/:creditId', requireAuth, async (req, res) => {
  const { cardId, creditId } = req.params;
  const { captured } = req.body as { captured: boolean };

  await pool.query(
    `INSERT INTO user_credits (user_id, card_id, credit_id, captured)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, card_id, credit_id)
     DO UPDATE SET captured = EXCLUDED.captured, updated_at = NOW()`,
    [req.userId, cardId, creditId, captured],
  );

  res.json({ cardId, creditId, captured });
});

export default router;
