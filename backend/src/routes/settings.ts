import { Router } from 'express';
import pool from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { DEFAULT_CPP, DEFAULT_FEES } from '../core/data.js';

const router = Router();

// GET /settings
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT cpp, fees, notif_arrivals, notif_credits, notif_recap,
            quiet_start, quiet_end, biometric_lock
     FROM user_settings WHERE user_id = $1`,
    [req.userId],
  );

  if (!rows.length) {
    return res.json({ cpp: DEFAULT_CPP, fees: DEFAULT_FEES,
      notifArrivals: true, notifCredits: true, notifRecap: true,
      quietStart: '22:00', quietEnd: '08:00', biometricLock: false });
  }

  const s = rows[0];
  res.json({
    cpp:           s.cpp,
    fees:          s.fees,
    notifArrivals: s.notif_arrivals,
    notifCredits:  s.notif_credits,
    notifRecap:    s.notif_recap,
    quietStart:    s.quiet_start,
    quietEnd:      s.quiet_end,
    biometricLock: s.biometric_lock,
  });
});

// PATCH /settings
router.patch('/', requireAuth, async (req, res) => {
  const allowed = ['cpp', 'fees', 'notif_arrivals', 'notif_credits',
                   'notif_recap', 'quiet_start', 'quiet_end', 'biometric_lock'] as const;

  const updates: string[] = [];
  const values:  unknown[] = [req.userId];

  const body = req.body as Record<string, unknown>;
  for (const key of allowed) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    const value = body[camel] ?? body[key];
    if (value !== undefined) {
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      updates.push(`${key} = $${values.length}`);
    }
  }

  if (!updates.length) return res.status(400).json({ error: 'No valid fields provided' });

  await pool.query(
    `INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
    [req.userId],
  );
  await pool.query(
    `UPDATE user_settings SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = $1`,
    values,
  );

  res.json({ updated: true });
});

export default router;
