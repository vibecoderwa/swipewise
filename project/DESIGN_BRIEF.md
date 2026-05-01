# Swipewise — Design Brief for Claude Code

**Project:** Personal "Agentic" Credit Card Optimizer
**Target:** iOS-first mobile app (Expo/React Native + native Swift for widgets)
**Mockups:** `Swipewise v2 - Standalone.html` (open in browser — all screens on a pannable canvas)
**Source JSX:** `mocks/` folder — the React code that produced the mockups

---

## 1. What this app does

Swipewise tells users which credit card to swipe *before* they swipe it. It reads their transactions via Plaid, understands rewards structures per card, and surfaces in-the-moment guidance through geofenced push notifications, home-screen widgets, and lock-screen widgets.

Three cards in play for v1:
- **Amex Gold** — $325/yr · 4× dining & groceries
- **Chase Sapphire Reserve** — $795/yr · 3× dining/travel, $300 travel credit, Priority Pass
- **Capital One Savor** — $0/yr · 4% dining/entertainment, 3% groceries

---

## 2. Primary user flow

1. **Landing** → tap "Get started"
2. **Phone auth** → enter number → **OTP verify** (no passwords; Twilio or equivalent)
3. **Onboarding** → Plaid Link (primary) OR manual card selection from catalog (fallback)
4. **Home** → geo-suggest list (merchants near you, ranked by best card)
5. **Background** → geofence triggers push notification on merchant arrival
6. **Home-screen + lock-screen widgets** → glanceable "use this card here"

---

## 3. Design tokens — port into `theme.ts`

From `mocks/system.jsx` (the `T` object). Editorial / muted palette:

```ts
export const theme = {
  colors: {
    ink:      '#1A1814',  // warm near-black (primary text)
    paper:    '#F7F2E9',  // soft bone (app background)
    cream:    '#EFE7D7',  // secondary surfaces
    lemon:    '#D4B254',  // muted ochre — primary accent
    mint:     '#9CB49A',  // sage — positive/on-track
    coral:    '#C26B5A',  // terracotta — alerts/expiring
    sky:      '#8BA5B8',  // dusty blue — info/geo
    plum:     '#8C7A9E',  // mauve — secondary accent
    graphite: '#3A362F',  // secondary text
    dim:      '#8C8578',  // tertiary text, labels
    hairline: '#DCD4C1',  // dividers

    // Issuer colors
    amex:   '#AE8B3B',
    chase:  '#2B4468',
    savor:  '#7A3848',
  },
  fonts: {
    display: 'Fraunces',     // headlines, numbers — serif, expressive
    body:    'Inter Tight',  // UI — sans, tight
    mono:    'JetBrains Mono', // numeric + technical
  },
  radii: {
    sm: 8, md: 12, lg: 14, xl: 18, pill: 9999,
  },
  // Signature shadow style — hard, offset, no blur
  shadow: {
    chunky: '2px 2px 0 0 #1A1814',
  },
  border: '1.5px solid #1A1814',
};
```

**Critical visual rules:**
- No gradients. Solid fills only.
- Hard offset shadows (2–3px, no blur) on buttons and elevated surfaces.
- 1.5px ink borders, not hairlines, on primary CTAs and cards.
- Fraunces for all money amounts — italic & heavy for hero numbers.
- Dollar sign is always ~55% of the numeral size.

---

## 4. Screen inventory

Each screen in the mockup has a labeled artboard. Build in this order:

| # | Screen | File | Notes |
|---|---|---|---|
| 1 | Landing | `mocks/landing.jsx` — `LandingA` | Wallet-spill hero, phone CTA |
| 2 | Phone entry | `mocks/auth.jsx` — `AuthA_Phone` | Country code picker, validation |
| 3 | OTP verify | `mocks/auth.jsx` — `AuthB_OTP` | 6-digit, auto-advance, resend timer |
| 4 | Plaid onboarding | `mocks/onboarding.jsx` — `OnboardA_Plaid` | `react-native-plaid-link-sdk` |
| 5 | Manual fallback | `mocks/onboarding.jsx` — `OnboardB_Manual` | Catalog, multi-select |
| 6 | Geo-suggest list | `mocks/geo.jsx` — `GeoA_List` | Map peek + ranked merchants |
| 7 | Arrival banner | `mocks/geo.jsx` — `GeoB_Banner` | Shown on geofence enter |
| 8 | Push notification | `mocks/push.jsx` — `PushA_Arrival` | Rich iOS notification |
| 9 | Dynamic Island | `mocks/push.jsx` — `PushB_DynamicIsland` | Live Activity |

### Widgets (native Swift — see §6)

| # | Widget | File | Size |
|---|---|---|---|
| 10 | Small — nearest | `mocks/widgets.jsx` — `SmallA` | systemSmall |
| 11 | Small — month total | `SmallB` | systemSmall |
| 12 | Medium — top 3 | `MediumA` | systemMedium |
| 13 | Medium — you're at | `MediumB` | systemMedium |
| 14 | Large — nearby | `LargeA` | systemLarge |
| 15 | Large — monthly | `LargeB` | systemLarge |
| 16 | Lock rect | `LockRectA` | accessoryRectangular |
| 17 | Lock circle | `LockCircleA` / `B` | accessoryCircular |

---

## 5. Backend contracts

Assume the existing Replit backend exposes (or should expose):

```
POST /auth/otp/send        { phone } → { sent: true }
POST /auth/otp/verify      { phone, code } → { token, userId }
POST /plaid/link-token     → { link_token }
POST /plaid/exchange       { public_token } → { item_id }
GET  /cards                → Card[]  (user's cards, from Plaid or manual)
GET  /transactions?range=  → Transaction[]  (categorized)
GET  /merchants/near       ?lat&lng&radius → Merchant[]
POST /merchants/rank       { merchantId } → { bestCard, multiplier, reward }
```

`Merchant` includes `{ id, name, category, lat, lng, distance }`.
`Card` includes rewards structure so the client can re-rank offline.

---

## 6. iOS Widgets — native Swift target

**Cannot be pure React Native.** Scaffold a WidgetKit target:

1. `npx expo prebuild` to get bare workflow.
2. In Xcode: File → New → Target → Widget Extension. Name it `SwipewiseWidgets`.
3. Add App Group `group.com.swipewise.shared` — both main app and widget target.
4. Main app writes `widgetData.json` to the App Group container on every relevant update (location change, card sync).
5. Widget reads the JSON in its `TimelineProvider`.
6. Use SwiftUI for widget views. The mockups in `mocks/widgets.jsx` are the visual spec — translate to SwiftUI.
7. Support sizes: `systemSmall`, `systemMedium`, `systemLarge`, `accessoryRectangular`, `accessoryCircular`.

Bridge updates from RN → widget via `react-native-shared-group-preferences` or a thin Swift module.

---

## 7. Geofencing + push

- `expo-location` — request foreground + background + "always" permission with clear rationale screen.
- On Plaid sync, fetch top 20 recurring merchants → create geofences (`expo-location` background task with `Location.startGeofencingAsync`).
- On enter → trigger local `expo-notifications` with merchant + best-card payload.
- Server push as fallback via APNs for high-value moments (expiring credits).

---

## 8. Copy rules

The wit **is** the brand. Copy is verbatim from mockups. Examples:

- Landing: *"Your wallet just got opinionated."*
- Phone entry: *"What's your number, boss?"*
- OTP: *"Six digits, and we're in."*
- Onboarding: *"Bring your wallet, not your card numbers."*
- Arrival: *"Walking into Whole Foods? Use Gold — 4× on groceries, +$9.60 on your usual basket."*

No corporate voice. No "Welcome to Swipewise!" No emojis in body copy — emojis only as iconographic elements (⏰ for expiring, 🔒 for privacy, 📍 for geo).

---

## 9. Suggested plan for Claude Code

1. Read mockup + this brief. Summarize understanding.
2. Diff current `theme.ts` vs §3 — show me the patch before applying.
3. Build screens 1–5 (auth + onboarding) as a milestone. I'll review in simulator before we move on.
4. Build screens 6–9 (geo + push). Requires location permission infra.
5. `expo prebuild` + widget target. Start with Medium-A only.
6. Expand widget coverage to all sizes + lock screen.

**Ask before generating code. Show the plan first. Then implement in small, reviewable chunks.**

---

## 10. What to ignore

- Any `HANDOFF.md` from v1 (described a different desktop dashboard)
- The v1 `src/` folder (pre-pivot prototype)
- "Loud" color variants — we landed on the muted editorial palette in §3
