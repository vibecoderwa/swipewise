# Swipewise

Tells you the best credit card to swipe — surfaces the right card per merchant + reminds you about unused statement credits. **Mobile-first** (iOS via Expo).

## Run & Operate

- **Mobile (canonical product):** `cd mobile && npx expo start` — open in Expo Go, scan QR.
- **Backend:** auto-started by the `Backend API` workflow (`cd backend && PORT=8080 npm run dev`). Listens on `:8080`, exposed publicly at `https://${REPLIT_DEV_DOMAIN}:8080`.
- **DB schema apply:** `psql $DATABASE_URL -f backend/src/db/schema.sql` (already applied; idempotent).
- **Backend typecheck:** `cd backend && npx tsc --noEmit`.
- **Required env:** `DATABASE_URL` (auto), `JWT_SECRET`, `JWT_REFRESH_SECRET`, `AES_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `NODE_ENV`. (Plaid keys needed for M1.)

## Stack

- **Mobile:** Expo SDK 54, expo-router 6, React 19, RN 0.81, TypeScript, AsyncStorage, expo-location, Google Fonts (Fraunces / Inter Tight / JetBrains Mono).
- **Backend:** Node 20, Express 4, TypeScript (`tsx watch`), `pg` (Postgres), `jsonwebtoken`, `twilio`, `helmet`, `cors`, `plaid`.
- **DB:** Replit-managed Postgres 16. Schema source of truth: `backend/src/db/schema.sql`.

## Where things live

- `mobile/` — the product. `app/` (expo-router screens), `components/`, `lib/api.ts` + `lib/storage.ts`, `theme.ts`, `app.json` (`extra.apiBaseUrl` points at the public backend URL).
- `backend/` — Express API. Routes in `backend/src/routes/`, business logic in `backend/src/core/` and `backend/src/lib/`. Entry: `backend/src/index.ts`.
- `backend/src/db/schema.sql` — canonical schema (11 tables: users, otp_codes, refresh_tokens, plaid_items, user_cards, transactions, merchants, user_merchant_favorites, user_credits, manual_swipes, user_settings).
- `design/project/DESIGN_BRIEF.md` — v2 visual brief (Fraunces hero italics, hard-offset 2px shadows, 1.5px ink borders, no gradients).
- `_archive_web_lab/src/` — archived Vite/React design lab (replaced by `mobile/` as the build path; kept for reference).
- `api/` — **deprecated** Express+SQLite scratchpad from v1. Do not extend; ignore.

## Architecture decisions

- **`mobile/` is the canonical M0+ surface.** The web design lab in `_archive_web_lab/` is reference-only.
- **Two backends exist on disk; only `backend/` (TS+Postgres) is real.** The legacy `api/` (JS+SQLite) is unused and not started by any workflow.
- **OTP-only auth.** Phone → 6-digit code via Twilio (logs to console if Twilio creds absent). JWT access + rotating refresh tokens; refresh hashes stored in `refresh_tokens`.
- **Plaid access tokens are AES-encrypted at rest** (`AES_KEY`); see `backend/src/lib/crypto.ts`.
- **Public exposure:** backend bound to local `:8080`, `.replit` maps `localPort 8080 → externalPort 8080`. Mobile app uses the resulting `https://<dev-domain>:8080` URL — workspace must be running for the device to reach the API.

## Product

Five core flows (per `design/project/DESIGN_BRIEF.md` and `REQUIREMENTS.md`): phone OTP sign-in → Plaid link OR manual card-pick → home (best-card-now + nearby merchants + unused credits) → settings.

## User preferences

- **Don't touch `mobile/` outside `app.json` `extra.apiBaseUrl` unless explicitly asked** — design tokens, fonts, screens, components are off-limits to the agent.
- **Don't change schema or backend route logic** without explicit ask.
- Skip Plaid Link work until M1.
- Verbatim copy from mocks; no gradients; 2px hard-offset shadows; 1.5px ink borders; Fraunces italic for hero dollars.

## Gotchas

- **`/auth/otp/send` route does not catch async errors** — any Twilio rejection (e.g. error 21266 when `to == from`) becomes an unhandled promise rejection and crashes `tsx watch`. Restart `Backend API` workflow if it dies. Fix is a `try/catch` in `backend/src/routes/auth.ts`, but route-logic changes are gated.
- **`apiBaseUrl` in `mobile/app.json` is the workspace's dev URL.** When the workspace sleeps, the mobile app errors with "Network request failed". For real device testing, keep this workspace open.
- **Workflow `waitForPort` only allows certain ports** (3000–9000 subset). `8080` works; `8082` does not. Keep backend on `:8080`.
- **`git commit`/`git push` are blocked** for the main agent — file changes get auto-committed via checkpoints. Push the branch yourself or via a project task.

## Pointers

- Skills: `database`, `environment-secrets`, `workflows`, `deployment`.
- External: Twilio error catalog (https://www.twilio.com/docs/errors), Plaid docs (https://plaid.com/docs/), Expo Router docs (https://expo.github.io/router/).
