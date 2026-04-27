# Swipewise

Tells you the best credit card to use, every time you swipe.

## Quick start (Replit)

1. **Import this repo** into Replit: New Repl → "Import from GitHub" → paste `https://github.com/vibecoderwa/swipewise`.
2. **Add Plaid credentials** as Replit Secrets (Tools → Secrets):
   - `PLAID_CLIENT_ID` — from your Plaid dashboard
   - `PLAID_SECRET` — your **sandbox** secret (start here)
   - `PLAID_ENV` — `sandbox`
3. Click **Run**. Replit will install dependencies and start both the API (port 3001) and the web app (port 5173).
4. Open the web preview. Click **Connect a bank**, pick "First Platypus Bank", use Plaid sandbox credentials:
   - username: `user_good`
   - password: `pass_good`
5. After connecting, match each account to a real card so we know what rewards rules to apply.

## Architecture

- **Express API** (`api/`) — Plaid integration, SQLite storage, insights computation.
- **React frontend** (`src/`) — Vite-served in dev, built into `dist/` for prod, served by Express.
- **Card catalog** (`data/cards.json`) — manually curated reward rules for ~20 popular US cards.

## Endpoints

- `POST /api/plaid/link_token` — create a Link token for the user
- `POST /api/plaid/exchange` — exchange public_token for access_token, persist accounts
- `POST /api/sync` — pull last 30d transactions from Plaid
- `GET  /api/accounts` — connected accounts (with matched card)
- `POST /api/accounts/:id/match` — manually match an account to a card
- `GET  /api/cards` — card catalog
- `GET  /api/insights` — best card per category + missed-rewards analysis

## Going to production

When you're ready to use real bank data, request production access in the Plaid dashboard, then set `PLAID_ENV=production` and use your production secret.
