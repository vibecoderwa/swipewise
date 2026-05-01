# Card Optimizer — Replit Handoff Brief

**Goal:** Turn the HTML prototype (`index.html`) into a production mobile app (iOS + Android via Expo / React Native) with real transaction data via Plaid.

---

## 1 · Stack recommendation

| Layer | Pick | Why |
|---|---|---|
| Client | **Expo (React Native)** + TypeScript | One codebase → iOS + Android; Expo Go for instant device preview on Replit. |
| State | Zustand or TanStack Query | Lightweight; fits the prototype's shape. |
| Charts | `react-native-svg` + `victory-native` | Matches the SVG timeline + sparklines from the web version. |
| Backend | **Replit-hosted Node/Express** (or Hono) | Needs to live server-side to hold Plaid secrets. |
| DB | Replit Postgres (or Supabase) | Users, access tokens, category overrides, credit toggles. |
| Auth | Clerk or Supabase Auth | Handles magic-link + Apple/Google sign-in cleanly. |
| Plaid | `react-native-plaid-link-sdk` + `plaid` Node SDK | Sandbox first, then Development, then Production. |

---

## 2 · Plaid integration (sandbox → prod path)

### Flow
1. **Client:** user taps "Connect bank" → backend creates a `link_token` → Plaid Link opens → returns a `public_token`.
2. **Backend:** exchange `public_token` for `access_token` → store in DB keyed by user.
3. **Backend cron** (or webhook `TRANSACTIONS:SYNC_UPDATES_AVAILABLE`): call `/transactions/sync` every N hours, upsert transactions.
4. **Categorization:** use Plaid's `personal_finance_category.primary` / `.detailed` — then map to the app's 15 buckets (see §4).
5. **Client:** fetches `/api/transactions?range=12m` → runs the same `computeAll()` logic as the prototype.

### Required Plaid products
- `transactions` (core)
- `auth` (optional, for verifying account ownership)
- `liabilities` (optional, to pull actual credit-card balances/APRs later)

### Env vars (Replit Secrets)
```
PLAID_CLIENT_ID=...
PLAID_SECRET=...                 # sandbox key first
PLAID_ENV=sandbox                # then 'development' then 'production'
PLAID_WEBHOOK_URL=https://<replit-app>.replit.app/webhooks/plaid
```

### Key endpoints to build
```
POST /api/plaid/link-token        → creates link_token for client
POST /api/plaid/exchange          → public_token → access_token (store)
POST /api/plaid/sync              → runs transactions/sync for a user
POST /webhooks/plaid              → handles TRANSACTIONS_UPDATES_AVAILABLE, etc.
GET  /api/summary?period=annual   → returns computeAll() output
GET  /api/transactions?range=12m  → paginated transactions list
```

---

## 3 · Port the computation engine verbatim

The prototype's `src/data.jsx` has the entire model. Lift these symbols directly into a shared TS module (`packages/core/rewards.ts`) used by both client and server:

```ts
export const CARDS = [/* gold, csr, savor */];
export const CATEGORIES = [/* 15 items */];
export const MULTIPLIERS = { gold: {...}, csr: {...}, savor: {...} };
export const CREDITS = { gold: [...], csr: [...], savor: [] };
export function computeAll(state): Result { /* same logic */ }
export function monthlyTimeline(state): TimelinePoint[] { /* same */ }
```

Nothing in `computeAll` depends on React — it's pure and portable. Unit-test it on the server.

---

## 4 · Plaid category → app category mapping

Plaid's `personal_finance_category.primary` values map roughly like this:

| Plaid PFC primary | App category |
|---|---|
| `FOOD_AND_DRINK` → detailed=RESTAURANT | `dining` |
| `FOOD_AND_DRINK` → detailed=GROCERIES | `groceries` |
| `TRAVEL` → AIRLINES_AND_AVIATION | `flights` |
| `TRAVEL` → LODGING | `hotels` |
| `TRAVEL` → other | `travel` |
| `TRANSPORTATION` → TAXIS_AND_RIDE_SHARES | `rideshare` |
| `TRANSPORTATION` → GAS | `gas` |
| `TRANSPORTATION` → PUBLIC_TRANSIT / TOLLS / PARKING | `transit` |
| `ENTERTAINMENT` → TV_AND_MOVIES (Netflix/Spotify merchants) | `streaming` |
| `ENTERTAINMENT` → other | `entertainment` |
| `GENERAL_MERCHANDISE` → ONLINE_MARKETPLACES | `online` |
| `GENERAL_MERCHANDISE` → other | `shopping` |
| `RENT_AND_UTILITIES` | `utilities` |
| `MEDICAL` | `health` |
| fallback | `other` |

Store the mapping in a single `categorize.ts` so users can override per-transaction.

---

## 5 · Mobile screen inventory

Translate web sections → native screens:

1. **Onboarding** — connect Plaid, pick cards owned, set cpp preferences.
2. **Home / Hero** — big net-value delta, 3 card cards stacked, period toggle.
3. **Categories** — vertical list (not a wide table); tap → category detail with merchant breakdown.
4. **Recommendations** — 3 cards in a pager (swipeable), then "if you kept all three" summary.
5. **Timeline** — full-bleed chart screen with scrubber.
6. **Credits** — accordion per card. **Keep the Durable Travel Credit callout prominent** — it's the key insight.
7. **Settings** — cpp sliders, fees, persona, manage Plaid connections, sign out.

---

## 6 · What to ship first (milestones)

1. **M0 · Skeleton** — Expo app boots, navigation, static mock data (use the JS defaults from prototype). Cursor/Replit agent can scaffold this in a day.
2. **M1 · Plaid sandbox** — Link flow works, transactions sync, mapped to categories, real `computeAll` numbers show. Sandbox test users only.
3. **M2 · Polish** — charts, animations, the travel-credit callout, credit toggles persist to DB.
4. **M3 · Plaid dev/prod** — submit for Plaid Development access, handle rate limits + webhooks.
5. **M4 · Ship** — TestFlight / Play internal. Add manual-entry fallback for users who don't want bank linking.

---

## 7 · Prompt to paste into Replit's AI

> Build a mobile app (Expo + TypeScript) called **Card Optimizer** that compares rewards across Amex Gold, Chase Sapphire Reserve, and Capital One Savor using real bank transactions via Plaid.
>
> Use the attached `HANDOFF.md`, `src/data.jsx`, and `index.html` from the design prototype as the spec. Port `computeAll()` and `monthlyTimeline()` verbatim into a shared `core/rewards.ts` module. Set up Plaid sandbox with `link_token`/`exchange`/`sync` endpoints on an Express backend hosted on Replit. Map Plaid `personal_finance_category` values to the app's 15 categories per the mapping table in the handoff. Build the mobile screens listed in §5, preserving the Durable $300 Travel Credit callout as a hero component on the CSR credits screen.
>
> Start with M0 (skeleton with mock data), then M1 (Plaid sandbox working end-to-end). Don't build M3+ yet.

---

## 8 · Things to watch out for

- **Plaid sandbox merchant data is thin.** The PFC detail is decent but merchant names are placeholder. Expect to hand-tune category rules against real dev data.
- **Apple & Google both allow finance apps** but require clear data-use disclosures. Plaid provides a Data Transparency Messaging template — use it verbatim.
- **Token storage must be encrypted.** Never send `access_token` to the client. Only exchange + store server-side.
- **The $795 CSR fee is hot** — users will scrutinize the credit math. Default to "100% captured" but make it obvious how to toggle, and show realized vs potential side-by-side.
- **Don't animate count-ups in React Native with `requestAnimationFrame`** like the prototype — use `react-native-reanimated` `useSharedValue` + `withTiming` instead.
- **iOS review:** positioning as a "financial optimizer" is fine; avoid language that implies you're moving money.
