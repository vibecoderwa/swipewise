import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pool from './db/client.js';

import authRoutes         from './routes/auth.js';
import plaidRoutes        from './routes/plaid.js';
import cardsRoutes        from './routes/cards.js';
import transactionsRoutes from './routes/transactions.js';
import merchantsRoutes    from './routes/merchants.js';
import creditsRoutes      from './routes/credits.js';
import settingsRoutes     from './routes/settings.js';

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3000');

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
  credentials: true,
}));

// Plaid webhooks need raw body for signature verification
app.use('/plaid/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/auth',         authRoutes);
app.use('/plaid',        plaidRoutes);
app.use('/cards',        cardsRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/merchants',    merchantsRoutes);
app.use('/credits',      creditsRoutes);
app.use('/settings',     settingsRoutes);

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, env: process.env.NODE_ENV, ts: new Date().toISOString() });
  } catch {
    res.status(503).json({ ok: false, error: 'Database unreachable' });
  }
});

// ── Error handler ─────────────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err.message);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[swipewise-api] listening on :${PORT} (${process.env.NODE_ENV ?? 'development'})`);
});

export default app;
