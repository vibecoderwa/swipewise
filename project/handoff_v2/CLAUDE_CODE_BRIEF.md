# Swipewise — Claude Code Handoff Brief

**You are building:** a personal credit-card optimizer for iOS (Expo / React Native), with a thin web companion. Existing repo at `github.com/vibecoderwa/swipewise` is a working web prototype with Plaid plumbing, SQLite, and a recommendation engine. **Do not green-field.** Branch from `main` and grow into the full product.

---

## The package you've been given

| File | What it is | How to treat it |
|---|---|---|
| `REQUIREMENTS.html` | Functional Requirements Doc (FRD), v1.0 | **Source of truth.** Every `FR-*` ID is a contract. |
| `GAP_ANALYSIS.html` | What's in the repo vs. what's missing | Your starting line. Don't rebuild what exists. |
| `Swipewise v2.html` | Mockup canvas (panable, zoomable artboards) | **Visual contract.** Match type/color/spacing/copy tone exactly. |
| `tokens.ts` | Design tokens as code | Drop into the Expo app at `src/theme/tokens.ts`. |
| `mocks/` (in repo, plus this canvas) | Per-screen JSX mocks | Reference for layout. Not production code. |
| `data/cards.json` | Card definitions (multipliers, credits) | Extend, don't replace. |

---

## Read order

1. `REQUIREMENTS.html` end-to-end. **Especially §2 (personas), §17 (visual principles), §18 (post-v1 swings).**
2. `GAP_ANALYSIS.html` to know what exists.
3. Open `Swipewise v2.html` and pan the canvas. Every artboard has an FR-ID it implements.
4. The repo's `api/recommendations.js` and `data/cards.json` — that's the engine you'll extend.

---

## Definition of done (per FR)

A requirement is "done" when:
1. **Code** implements the behavior described.
2. **UI** matches the corresponding artboard within reasonable fidelity (spacing, type, color, copy).
3. **Tests** cover the requirement's happy path + at least one edge case.
4. **Accessibility:** hit targets ≥ 44px, contrast ≥ 4.5:1 for body text, VoiceOver labels on all interactive elements.
5. **Copy** has been read aloud — does it match the personality of the FRD examples? If it sounds like a generic SaaS app, rewrite it.
6. **Commit message** references the FR-ID: `feat(FR-ENG-06): confidence indicator on recommendations`.

---

## Tone & visual rules (non-negotiable)

These come from §17 of the FRD. Internalize them before writing UI code.

- **Anti-loud aesthetic.** No neons, no gradients, no emoji unless it's the user's content. Editorial type, muted palette, generous whitespace.
- **One accent per surface.** Don't paint multiple cards with multiple accent colors. Pick one, commit.
- **Earned, not spent.** Every dollar figure in the app is framed as money the user earned, never money they spent. "$24 in points this week" — never "you spent $1,200 this week."
- **Curious, not corrective.** When the app is "wrong" (user picked a sub-optimal card), it observes, never corrects. Read the FR-CLD section for the model.
- **Numbers in the display serif.** Big numbers use Fraunces. Body and metadata use Inter Tight. Mono only for receipts and code-like artifacts.

---

## Out of scope for v1

Build none of these unless explicitly told. They are intentionally Could/Should in the FRD.

- §18 standout features (Reckoning, Receipts, Public pages, Cooldown, Brief, Therapist, Watch, Found Money). These ship after v1.
- Spend tracking, budgeting, debt reduction. **Swipewise is not a budgeting app.** If a feature drifts toward Mint/YNAB territory, stop and ask.
- Friend graphs, follower counts, likes. Social is one-way share-out only (FR-SOC).
- In-app issuer applications. Recommend, don't transact.
- Notifications beyond what FR-NOT-* specifies. No re-engagement spam.

---

## Architecture decisions already made

Don't relitigate these without surfacing the question first.

- **iOS first**, Android later. Expo + React Native + TypeScript.
- **Plaid for transactions**, with a manual-add fallback path (FR-MAN-*). Both must be first-class.
- **SQLite on device** for transactions and rewards ledger; sync to a thin server only for cross-device continuity (post-v1).
- **No ML in v1.** The recommendation engine is rule-based (multiplier table × CPP × credit-aware), as in the repo today.
- **Tokens live in `src/theme/tokens.ts`** (provided). Components consume tokens, never raw hex.

---

## When to ask vs. infer

**Ask** when:
- A requirement is ambiguous and the choice changes the product's identity (tone, scope, persona priority).
- You'd be adding a feature not listed in the FRD.
- You're about to add a third-party SDK or service.

**Infer** when:
- The FRD says what but not how (e.g. "show a confidence indicator" — pick a treatment that matches the mockup canvas).
- Copy is missing on a non-headline screen — write something that matches the voice and flag it for review.
- A token isn't defined — extend `tokens.ts` and call it out in your PR.

---

## First three PRs (suggested)

1. **`chore: scaffold Expo app + tokens`** — set up the RN project, drop in `tokens.ts`, port the existing 6 cards from `data/cards.json`, get a blank Home screen rendering.
2. **`feat(FR-ONB-*): onboarding + Plaid link + manual fallback`** — three personas (FR-PER-*), Plaid link flow, manual card add. Auth via phone+OTP.
3. **`feat(FR-ENG-* + FR-HOME-*): Home + recommendation engine`** — the daily driver screen. Confidence indicator, "left on the table" frame, merchant detail.

After those three, the rest of the FRD's Must/Should items are unlocked in any order.

---

## Questions back to product

If you hit any of these, surface immediately — not after building:

- **Card data freshness.** Who maintains `cards.json`? When Amex changes a multiplier, what's the update path?
- **CPP defaults.** §13 lets users adjust point values. What are the v1 defaults per card? (Pulled from the engine; needs a product call.)
- **Notification budget.** §FR-NOT caps total daily pushes. What's the number? (Mockup implies ≤2/day, FRD doesn't pin it.)
- **Manual-only persona feature parity.** §2 implies Manual Adders get fewer features. Which exactly? (Decision matrix in §2 is incomplete.)

---

**Last note:** the FRD reads "soft" on purpose — opinionated about voice, lighter on implementation detail. That's deliberate. The point isn't to constrain you; it's to make the product feel like one thing. If a technical decision serves the personality described in §2 and §17, you're on the right path.
