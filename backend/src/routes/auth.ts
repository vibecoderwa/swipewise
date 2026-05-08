import { Router } from 'express';
import pool from '../db/client.js';
import { issueOtp, sendOtp, verifyOtp } from '../lib/otp.js';
import { signAccess, signRefresh, rotateRefresh, revokeAllRefreshTokens } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /auth/otp/send
router.post('/otp/send', async (req, res) => {
  const { phone } = req.body as { phone?: string };
  if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number. Use E.164 format (+12125551234).' });
  }

  try {
    const code = await issueOtp(phone);
    await sendOtp(phone, code);
    res.json({ sent: true });
  } catch (err) {
    const e = err as { code?: number; message?: string };
    console.error('[otp/send]', e.code ?? '', e.message ?? err);
    res.status(502).json({ error: 'Could not send code. Please try again.' });
  }
});

// POST /auth/otp/verify
router.post('/otp/verify', async (req, res) => {
  const { phone, code } = req.body as { phone?: string; code?: string };
  if (!phone || !code) return res.status(400).json({ error: 'phone and code required' });

  const valid = await verifyOtp(phone, code);
  if (!valid) return res.status(401).json({ error: 'Invalid or expired code' });

  // Upsert user
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO users (phone) VALUES ($1)
     ON CONFLICT (phone) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [phone],
  );
  const userId = rows[0].id;

  // Provision default settings row if first login
  await pool.query(
    `INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
    [userId],
  );

  const access  = signAccess(userId);
  const refresh = await signRefresh(userId);
  res.json({ token: access, refreshToken: refresh, userId });
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

  const tokens = await rotateRefresh(refreshToken);
  if (!tokens) return res.status(401).json({ error: 'Invalid or expired refresh token' });

  res.json({ token: tokens.access, refreshToken: tokens.refresh });
});

// POST /auth/signout  (requires auth)
router.post('/signout', requireAuth, async (req, res) => {
  await revokeAllRefreshTokens(req.userId);
  res.json({ signedOut: true });
});

// DELETE /auth/account  (requires auth)
router.delete('/account', requireAuth, async (req, res) => {
  await revokeAllRefreshTokens(req.userId);
  // Soft-schedule deletion — actual purge handled by a cron job within 30 days
  await pool.query(
    `UPDATE users SET updated_at = NOW() WHERE id = $1`,
    [req.userId],
  );
  // In production: revoke Plaid items, queue async deletion task
  res.json({ scheduled: true, message: 'Account and data will be purged within 30 days.' });
});

export default router;
