# Swipewise — Mobile (M0 Skeleton)

iOS-first Expo app. M0 is the navigable shell against the editorial design system from `project/DESIGN_BRIEF.md`.

## What works in M0

- **Theme tokens** — `theme.ts`, ported verbatim from `project/mocks/system.jsx`.
- **Custom fonts** — Fraunces / Inter Tight / JetBrains Mono via `@expo-google-fonts`.
- **Screens 1–5** wired through expo-router:
  - `app/index.tsx` — Landing (`LandingA`)
  - `app/auth/phone.tsx` — Phone entry (E.164, US +1) → real `POST /auth/otp/send`
  - `app/auth/otp.tsx` — 6-digit OTP, paste-to-fill, 60s resend → real `POST /auth/otp/verify`, JWT stored in AsyncStorage
  - `app/onboarding/plaid.tsx` — Plaid CTA (mocked at M0; real Link at M1) + manual fallback
  - `app/onboarding/manual.tsx` — Catalog multi-select
- **Home stub** — `app/home.tsx` requests foreground location with `expo-location`, calls real `GET /merchants/near`, renders ranked merchants. Empty until you wire Plaid.
- **Resumable onboarding state** (FR-ONB-05) — `lib/storage.ts` records the last completed step.

## What's not in M0

- Real Plaid Link (M1)
- Background geofencing + push (M2)
- Live Activities, widgets (M2/M3)
- Biometric re-auth, account deletion UI (M4)

## Running on Replit + Expo Go

1. Make sure the backend is running and reachable. Update `app.json` → `extra.apiBaseUrl` to your Replit backend URL (e.g. `https://swipewise-backend.your-name.repl.co`).
2. From `mobile/`: `npx expo start --tunnel`.
3. On your iPhone, install **Expo Go** from the App Store.
4. Scan the QR code from the terminal. The app boots inside Expo Go on your phone.

> Foreground location works in Expo Go. Background geofencing does **not** — that requires a dev build (M2, $99/yr Apple Developer Program).

## Backend env (Replit)

For real SMS at `/auth/otp/send`, set on Replit:

```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15555555555
```

Without those, the OTP code is logged to the server console (still functional for dev — read it from Replit logs and type it in).
