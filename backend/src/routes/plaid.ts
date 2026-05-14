import { Router } from 'express';
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  RemovedTransaction,
} from 'plaid';
import pool from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { encrypt, decrypt } from '../lib/crypto.js';
import { mapPlaidCategory } from '../core/categories.js';

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments ?? 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET':    process.env.PLAID_SECRET!,
    },
  },
});
const plaid = new PlaidApi(plaidConfig);

const router = Router();

// POST /plaid/link-token
//
// Tries to create a Plaid Hosted Link (hosts the whole flow on plaid.com,
// solves OAuth banks like Chase). If Plaid rejects hosted_link (not all
// accounts have it enabled), falls back to a plain link_token that the
// mobile client opens via our in-house /plaid/link-page HTML shim — that
// still covers non-OAuth sandbox banks.
router.post('/link-token', requireAuth, async (req, res) => {
  const baseParams = {
    user:          { client_user_id: req.userId },
    client_name:   'Swipewise',
    products:      [Products.Transactions],
    country_codes: [CountryCode.Us],
    language:      'en',
    webhook:       process.env.PLAID_WEBHOOK_URL,
  };

  try {
    const response = await plaid.linkTokenCreate({
      ...baseParams,
      hosted_link: {
        url_lifetime_seconds:    14_400,
        completion_redirect_uri: 'swipewise://plaid-callback',
        is_mobile_app:           true,
      },
    } as Parameters<typeof plaid.linkTokenCreate>[0]);
    res.json({
      link_token:      response.data.link_token,
      hosted_link_url: (response.data as { hosted_link_url?: string }).hosted_link_url ?? null,
    });
    return;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[plaid] hosted_link failed, falling back to plain link_token: ${msg}`);
  }

  const fallback = await plaid.linkTokenCreate(baseParams);
  res.json({
    link_token:      fallback.data.link_token,
    hosted_link_url: null,
  });
});

// POST /plaid/exchange  — called after Link completes
router.post('/exchange', requireAuth, async (req, res) => {
  const { public_token } = req.body as { public_token?: string };
  if (!public_token) return res.status(400).json({ error: 'public_token required' });

  const exchangeRes = await plaid.itemPublicTokenExchange({ public_token });
  const { access_token, item_id } = exchangeRes.data;

  // Fetch institution name
  const itemRes  = await plaid.itemGet({ access_token });
  const instId   = itemRes.data.item.institution_id ?? null;
  let   instName: string | null = null;
  if (instId) {
    const instRes = await plaid.institutionsGetById({ institution_id: instId, country_codes: [CountryCode.Us] });
    instName = instRes.data.institution.name;
  }

  const encToken = encrypt(access_token);
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO plaid_items
       (user_id, plaid_item_id, access_token_enc, institution_id, institution_name)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (plaid_item_id) DO UPDATE
       SET access_token_enc = EXCLUDED.access_token_enc,
           status = 'active', error_code = NULL, updated_at = NOW()
     RETURNING id`,
    [req.userId, item_id, encToken, instId, instName],
  );

  const plaidItemDbId = rows[0].id;

  // Try to auto-match credit card accounts to our catalog
  const accountsRes = await plaid.accountsGet({ access_token });
  for (const account of accountsRes.data.accounts) {
    if (account.type !== 'credit') continue;
    const cardId = inferCardId(account.name ?? '', instName ?? '');
    if (cardId) {
      await pool.query(
        `INSERT INTO user_cards (user_id, card_id, plaid_item_id, plaid_account_id, source)
         VALUES ($1, $2, $3, $4, 'plaid')
         ON CONFLICT (user_id, card_id) DO UPDATE
           SET plaid_item_id = EXCLUDED.plaid_item_id,
               plaid_account_id = EXCLUDED.plaid_account_id,
               source = 'plaid', active = TRUE`,
        [req.userId, cardId, plaidItemDbId, account.account_id],
      );
    }
  }

  // Kick off backfill in background (don't await — let webhook handle incremental)
  void syncTransactions(plaidItemDbId, req.userId, access_token, true);

  res.json({ item_id, institution: instName });
});

// GET /plaid/link-page  — serves an HTML shim that opens Plaid Link inside a WebView.
// Renders any JS errors visibly on the page so we can see what fails in the
// embedded WebView (where we don't have devtools access).
router.get('/link-page', (req, res) => {
  const token = String(req.query.token ?? '');
  if (!token) return res.status(400).send('Missing token');
  const tokenJson = JSON.stringify(token);
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>Connect your bank</title>
  <style>
    html,body{margin:0;padding:0;height:100%;background:#fafaf7;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#1a1a1a}
    .wrap{padding:24px;font-size:14px;line-height:1.5}
    .step{margin:6px 0;color:#444}
    .ok{color:#0a7a3a}
    .err{color:#b00020;white-space:pre-wrap;word-break:break-all}
    h2{margin:0 0 12px;font-size:16px}
  </style>
</head>
<body>
  <div class="wrap">
    <h2>Connecting to Plaid…</h2>
    <div id="log"></div>
  </div>
  <script>
    var log = document.getElementById('log');
    function step(msg, cls){
      var div = document.createElement('div');
      div.className = 'step' + (cls ? ' ' + cls : '');
      div.textContent = msg;
      log.appendChild(div);
    }
    function back(qs){
      step('Redirecting to app: ' + qs);
      window.location.href = 'swipewise://plaid-callback?' + qs;
    }
    window.onerror = function(message, source, lineno, colno, error){
      step('JS error: ' + message + ' at ' + source + ':' + lineno, 'err');
      return false;
    };
    step('Step 1 — Loading Plaid SDK from cdn.plaid.com…');
    var script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.onload = function(){
      step('Step 2 — Plaid SDK loaded. typeof Plaid = ' + typeof window.Plaid, typeof window.Plaid === 'undefined' ? 'err' : 'ok');
      if (typeof window.Plaid === 'undefined') {
        step('Plaid global not defined after script load.', 'err');
        return;
      }
      try {
        step('Step 3 — Calling Plaid.create…');
        var handler = window.Plaid.create({
          token: ${tokenJson},
          onLoad: function(){ step('Plaid.onLoad fired.', 'ok'); },
          onEvent: function(eventName){ step('Plaid.onEvent: ' + eventName); },
          onSuccess: function(public_token){
            back('public_token=' + encodeURIComponent(public_token));
          },
          onExit: function(err){
            if (err) back('error=' + encodeURIComponent((err && (err.error_code || err.error_type)) || 'unknown'));
            else back('cancelled=1');
          },
        });
        step('Step 4 — Plaid.create returned. Calling handler.open()…');
        handler.open();
        step('Step 5 — handler.open() returned.', 'ok');
      } catch (e) {
        step('Plaid.create/open threw: ' + (e && e.message || e), 'err');
        back('error=' + encodeURIComponent(String(e && e.message || e)));
      }
    };
    script.onerror = function(){
      step('FAILED to load Plaid SDK script. The CDN may be blocked from this WebView, or the page lacks network access.', 'err');
      back('error=cdn_load_failed');
    };
    document.head.appendChild(script);
  </script>
</body>
</html>`);
});

// POST /plaid/webhook  — called by Plaid on new transactions
router.post('/webhook', async (req, res) => {
  const { webhook_type, webhook_code, item_id } = req.body as {
    webhook_type: string; webhook_code: string; item_id: string;
  };

  res.json({ received: true }); // Acknowledge immediately

  if (webhook_type === 'TRANSACTIONS' && webhook_code === 'SYNC_UPDATES_AVAILABLE') {
    const { rows } = await pool.query<{ id: string; user_id: string; access_token_enc: Buffer }>(
      `SELECT id, user_id, access_token_enc FROM plaid_items WHERE plaid_item_id = $1 AND status = 'active'`,
      [item_id],
    );
    if (rows.length) {
      const item        = rows[0];
      const accessToken = decrypt(item.access_token_enc);
      void syncTransactions(item.id, item.user_id, accessToken, false);
    }
  }

  if (webhook_type === 'ITEM' && webhook_code === 'ERROR') {
    await pool.query(
      `UPDATE plaid_items SET status = 'error', error_code = $1, updated_at = NOW() WHERE plaid_item_id = $2`,
      [req.body.error?.error_code ?? 'UNKNOWN', item_id],
    );
  }
});

// GET /plaid/items  — list user's linked institutions
router.get('/items', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, institution_name, status, error_code, last_synced_at, created_at
     FROM plaid_items WHERE user_id = $1 ORDER BY created_at ASC`,
    [req.userId],
  );
  res.json(rows);
});

// DELETE /plaid/items/:id  — disconnect a Plaid item
router.delete('/items/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query<{ access_token_enc: Buffer; plaid_item_id: string }>(
    `SELECT access_token_enc, plaid_item_id FROM plaid_items WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.userId],
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });

  const accessToken = decrypt(rows[0].access_token_enc);
  await plaid.itemRemove({ access_token: accessToken }).catch(() => {});
  await pool.query(
    `UPDATE plaid_items SET status = 'revoked', updated_at = NOW() WHERE id = $1`,
    [req.params.id],
  );
  res.json({ disconnected: true });
});

// ── Sync helper ───────────────────────────────────────────────────────────────

async function syncTransactions(
  dbItemId: string,
  userId: string,
  accessToken: string,
  isBackfill: boolean,
): Promise<void> {
  const { rows: itemRows } = await pool.query<{ cursor: string | null }>(
    'SELECT cursor FROM plaid_items WHERE id = $1',
    [dbItemId],
  );
  let cursor = itemRows[0]?.cursor ?? undefined;
  let hasMore = true;
  let added = 0;

  while (hasMore) {
    const response = await plaid.transactionsSync({
      access_token: accessToken,
      cursor,
      count: 500,
      options: { include_personal_finance_category: true },
    });

    const { added: newTxs, modified, removed, next_cursor, has_more } = response.data;

    for (const tx of newTxs) {
      const cat = mapPlaidCategory(
        tx.personal_finance_category?.primary,
        tx.personal_finance_category?.detailed,
      );
      await pool.query(
        `INSERT INTO transactions
           (user_id, plaid_tx_id, amount, category, merchant_name,
            merchant_lat, merchant_lng, plaid_primary, plaid_detailed, date, pending, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'plaid')
         ON CONFLICT (plaid_tx_id) DO NOTHING`,
        [
          userId, tx.transaction_id,
          Math.abs(tx.amount),
          cat,
          tx.merchant_name ?? tx.name,
          tx.location?.lat ?? null,
          tx.location?.lon ?? null,
          tx.personal_finance_category?.primary ?? null,
          tx.personal_finance_category?.detailed ?? null,
          tx.date,
          tx.pending,
        ],
      );
      added++;
    }

    for (const tx of modified) {
      const cat = mapPlaidCategory(
        tx.personal_finance_category?.primary,
        tx.personal_finance_category?.detailed,
      );
      await pool.query(
        `UPDATE transactions SET amount=$1, category=$2, merchant_name=$3, pending=$4, updated_at=NOW()
         WHERE plaid_tx_id=$5 AND user_id=$6`,
        [Math.abs(tx.amount), cat, tx.merchant_name ?? tx.name, tx.pending, tx.transaction_id, userId],
      );
    }

    for (const tx of (removed as RemovedTransaction[])) {
      await pool.query(
        `UPDATE transactions SET removed=TRUE, updated_at=NOW() WHERE plaid_tx_id=$1 AND user_id=$2`,
        [tx.transaction_id, userId],
      );
    }

    cursor  = next_cursor;
    hasMore = has_more;

    // For backfill, cap at 5,000 transactions
    if (isBackfill && added >= 5_000) break;
  }

  await pool.query(
    `UPDATE plaid_items SET cursor=$1, last_synced_at=NOW() WHERE id=$2`,
    [cursor, dbItemId],
  );
}

function inferCardId(accountName: string, institutionName: string): string | null {
  const combined = `${accountName} ${institutionName}`.toLowerCase();
  if (combined.includes('gold'))                     return 'gold';
  if (combined.includes('sapphire reserve'))         return 'csr';
  if (combined.includes('savor') && combined.includes('capital one')) return 'savor';
  return null;
}

export default router;
