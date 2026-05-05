import { Router } from 'express';
import pool from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { CARDS, MULTIPLIERS, CREDITS, DEFAULT_FEES, DEFAULT_CPP } from '../core/data.js';
import type { CardId } from '../core/data.js';

const router = Router();

// GET /cards  — user's owned cards with full rewards structure
router.get('/', requireAuth, async (req, res) => {
  const { rows: userCards } = await pool.query<{ card_id: CardId; source: string }>(
    `SELECT card_id, source FROM user_cards WHERE user_id = $1 AND active = TRUE`,
    [req.userId],
  );

  const { rows: settings } = await pool.query<{ cpp: Record<CardId,number>; fees: Record<CardId,number> }>(
    `SELECT cpp, fees FROM user_settings WHERE user_id = $1`,
    [req.userId],
  );
  const cpp  = settings[0]?.cpp  ?? DEFAULT_CPP;
  const fees = settings[0]?.fees ?? DEFAULT_FEES;

  const cards = userCards.map(({ card_id, source }) => {
    const meta = CARDS.find(c => c.id === card_id)!;
    return {
      ...meta,
      source,
      multipliers:  MULTIPLIERS[card_id],
      credits:      CREDITS[card_id] ?? [],
      annualFee:    fees[card_id]    ?? DEFAULT_FEES[card_id] ?? 0,
      cpp:          cpp[card_id]     ?? DEFAULT_CPP[card_id]  ?? 1.0,
    };
  });

  res.json(cards);
});

// POST /cards  — add a card manually
router.post('/', requireAuth, async (req, res) => {
  const { cardId } = req.body as { cardId?: string };
  const valid = CARDS.map(c => c.id);
  if (!cardId || !valid.includes(cardId as CardId)) {
    return res.status(400).json({ error: `cardId must be one of: ${valid.join(', ')}` });
  }

  await pool.query(
    `INSERT INTO user_cards (user_id, card_id, source)
     VALUES ($1, $2, 'manual')
     ON CONFLICT (user_id, card_id) DO UPDATE SET active = TRUE`,
    [req.userId, cardId],
  );
  res.status(201).json({ added: cardId });
});

// DELETE /cards/:cardId
router.delete('/:cardId', requireAuth, async (req, res) => {
  await pool.query(
    `UPDATE user_cards SET active = FALSE WHERE user_id = $1 AND card_id = $2`,
    [req.userId, req.params.cardId],
  );
  res.json({ removed: req.params.cardId });
});

// GET /cards/catalog  — all supported cards (for manual selection in onboarding)
router.get('/catalog', (_req, res) => {
  res.json(CARDS.map(c => ({
    ...c,
    multipliers: MULTIPLIERS[c.id],
    defaultFee:  DEFAULT_FEES[c.id],
    defaultCpp:  DEFAULT_CPP[c.id],
    credits:     CREDITS[c.id] ?? [],
  })));
});

export default router;
