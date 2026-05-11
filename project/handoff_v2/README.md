# Swipewise — Claude Code Handoff Package

This folder contains everything Claude Code needs to build Swipewise. Hand it over as a unit. Order matters — read top to bottom.

## Contents

1. **`CLAUDE_CODE_BRIEF.md`** — Start here. Meta-instructions, definition of done, tone rules, out-of-scope list.
2. **`REQUIREMENTS.html`** — The Functional Requirements Doc. Every FR-ID is a contract. (Located at project root — copy alongside this folder.)
3. **`GAP_ANALYSIS.html`** — What the existing repo has vs. what the FRD specifies. (Project root.)
4. **`Swipewise v2.html`** — Visual mockup canvas. Every screen has an artboard. (Project root.)
5. **`tokens.ts`** — Design tokens as code. Drop into `src/theme/tokens.ts` in the Expo app.
6. **The repo:** `github.com/vibecoderwa/swipewise` — branch from `main`, don't green-field.

## How to deliver to Claude Code

Two clean options:

**Option A — paste-friendly:**
1. Send `CLAUDE_CODE_BRIEF.md` first as the kickoff message.
2. Attach `REQUIREMENTS.html`, `GAP_ANALYSIS.html`, `tokens.ts` together.
3. Send the repo URL: `https://github.com/vibecoderwa/swipewise`.
4. Send the Swipewise v2 mockup (open it locally, screenshot the canvas, or zip and attach).

**Option B — single drop:**
1. Zip this `handoff/` folder + the four root files (`REQUIREMENTS.html`, `GAP_ANALYSIS.html`, `Swipewise v2.html`, `Swipewise v2 - Standalone.html`).
2. Attach the zip + the repo URL in one message.
3. Tell Claude Code: *"Read `handoff/CLAUDE_CODE_BRIEF.md` first, then proceed."*

## What's NOT here (and that's fine)

- **Test fixtures** — Plaid sample payloads. Generate during the first PR; not blocking.
- **Copy doc** — exhaustive notification/empty-state/error copy. The FRD includes voice and examples; details are inferable.
- **App Store metadata** — name, subtitle, keywords. Write after first build, not before.

## What to maintain over time

- `tokens.ts` and `mocks/system.jsx` should stay in sync. When you change one, change both — until the RN app fully replaces the canvas mocks.
- `cards.json` schema lives in the repo. Document changes in the repo's PR descriptions, not here.
- Every change to `REQUIREMENTS.html` should bump the footer version (`v1.0` → `v1.1`) and note what changed.
