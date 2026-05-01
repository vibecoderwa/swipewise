# App Functional Requirements

_Started 2026-04-24 15:44 UTC_

---

## User

can you write up all the functional requirements this app is to build

## Assistant

I'll write up the functional requirements for a Personal "Agentic" Credit Card Optimizer. Let me first check what's in the project.

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

I have enough context. I'll write up a comprehensive functional requirements document. Note: I'll create an original requirements doc — I won't reproduce branded card UIs, just reference the cards by name as the existing brief does.

Aesthetic: I'll match the existing brief's editorial palette (paper/ink/lemon/mint) with Fraunces + Inter Tight, since this artifact lives alongside DESIGN_BRIEF.md.

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Functional requirements written up at **REQUIREMENTS.html** — 16 sections covering scope, auth, onboarding, the rewards engine, geofencing, notifications, widgets, credits, settings, privacy, NFRs, and milestones, with each requirement tagged FR-XXX-NN and a Must/Should/Could priority.

## User

not sure if user can read Plaid as verb.  Most people wouldn't be aware of Plaid. Regardless they are willing to connect through Plaid.  However, there may be customers who don't want to do that, but are comforatble adding their cards manually. In such personas, you only get the location based recos but not the deeper analytics.  That shoukld be made clear.  For manual adders, there should be an option to select popular cards 
<again.. don't start making updates yet.  Let's first discuss>

## Assistant

Good catches. Let me reflect back what I'm hearing before changing anything:

**1. "Plaid as a verb" persona description is too insider-y.** Most users have used Plaid (every fintech onboarding uses it) but don't know the name. They'll recognize the flow — "pick your bank, log in" — not the brand. I should describe the persona by behavior, not by jargon.

**2. Two distinct personas, not one persona with a fallback.** Right now the doc treats manual entry as a degraded path for the same user. You're saying it's a legitimate alternate persona — the "privacy-leaning manual adder" — who is fully comfortable with the app, just not with bank linking. That changes the framing from *"fallback if Plaid fails"* to *"first-class second path."*

**3. Feature parity needs to be explicit.** Manual users get:
- ✅ Location-based recommendations (geofence + push + widgets for "use this card here")
- ✅ Card / multiplier knowledge
- ✅ Credits & perks tracking (manually toggled)
- ❌ Realized vs. potential delta (no transaction history)
- ❌ Monthly timeline / what-if math
- ❌ Auto-detect of credits from transactions
- ❌ Top-merchant geofence seeding (no transaction history → would need a different seed: user-entered favorites, or just "merchants near you")

This is a meaningful product decision — the manual experience is the *pre-swipe concierge* without the *reflective analytics layer*.

**4. Popular-cards catalog for manual adders.** Currently the doc only references the v1 three-card set for manual selection. You're asking for a broader catalog (popular cards beyond the optimized three). That raises a question:

> For cards in the catalog that aren't in our "optimized set," do we still rank them in recommendations using their published multipliers? Or are they tracked-only (visible in the wallet, but the engine ignores them)?

Three reasonable answers:
- **(a)** Only the 3 v1 cards are rankable; others are "display only" until we add their reward structure.
- **(b)** Ship a broader catalog with multipliers for ~20–30 popular cards on day one (more upfront work, better experience).
- **(c)** Hybrid: 3 deeply-modeled cards + a "popular cards" list with simplified flat-rate multipliers and no credits tracking.

**5. Other things that fall out of this:**
- Onboarding fork needs a real choice screen ("Connect your bank — most accurate" vs. "Add cards manually — we'll skip the analytics") with honest tradeoffs, not a "fallback" framing.
- Empty-state for analytics screens when user is manual-only — what does the home screen show? The Sunday-morning reflective view doesn't exist for them.
- Geofence seeding for manual users — without transaction history, we need an alternative: user-entered favorites? "Popular merchants near you" from a generic source?

**Questions for you before I edit:**

1. Which catalog approach — (a), (b), or (c)?
2. For manual users with no transaction history, what seeds the geofence list? User favorites? A generic nearby-merchants feed? Both?
3. Should the manual path be presented as fully equal at the choice screen, or should we gently steer toward Plaid (since it's the better experience) while making manual a respected option?
4. Can a user upgrade from manual → Plaid later, and would historical transactions backfill?

## User

Apply comment

## Assistant

The user wants me to apply just the comment about expanding personas, not the full discussion we were having. Let me update the personas section to reflect multiple personas including manual adders.

_[tool: str_replace_edit]_

_[tool: snip]_

Updated section 02 — replaced the single-persona block with three personas (Optimizer, Manual Adder, Skeptic-Turned-Linker), added a feature-availability matrix making the trade-offs explicit, and removed the "reads Plaid as a verb" line.

## User

do you have any other creative design ideas

## Assistant

_[tool: snip]_

Yes — here's a grab bag of design ideas, organized from "concrete features that fit the brief" to "weirder swings worth considering." Tagged so we can pick what to actually pursue.

---

### 🎯 Pre-swipe moment (the core)

1. **Apple Pay default-card hint** — instead of a notification, briefly change the lock-screen widget to a single bold card name 30 seconds after geofence enter. Like a sundial: ambient, not interruptive.
2. **"Confidence" indicator on recos** — sometimes the best card is obvious (4× vs. 1×); sometimes it's a coin flip (3× vs. 2.5×). A small dot or bar communicates this. Avoids over-trusting marginal recos.
3. **Basket-aware estimate** — instead of "best card here," show "+$9.60 on your usual basket of $42." Uses the median historical basket at that merchant. Linked-persona only.
4. **Two-card split prompt** — for merchants where splitting the bill across two cards meaningfully wins (e.g. groceries + alcohol at a hybrid store). Probably edge case but delightful when it fires.

### 📊 Reflective moment (Sunday morning)

5. **"Card of the month" award** — anthropomorphize: "Your Gold worked hardest this month — earned $87 across 41 swipes." Light, not gamified.
6. **Regret meter, kindly framed** — not "you wasted $14"; instead "$14 left on the table this month — here's where." Specific transactions, with a "I had a reason" dismiss.
7. **Annual fee health bar** — tiny visualization per card: are you on track to break even on the fee by Dec 31? Honest math, no spin.
8. **"What if I cancelled X" simulator** — recompute the year's net value pretending you didn't have card X. Useful when fees renew.

### 🔔 Notification design

9. **Compounding-quiet** — if user dismisses three arrivals at the same merchant without action, stop notifying for that merchant. Earned silence.
10. **Weekly recap as a Live Activity**, not a push — a Sunday-morning Dynamic Island peek instead of one more notification.
11. **Anniversary/credit nudges as calendar events** — option to write expiring-credit reminders into the user's calendar as all-day events. Less invasive than push.

### 🧩 Widgets & glance surfaces

12. **Lock-screen circular = "today's earnings"** — a single number that ticks as transactions clear. Tiny dopamine.
13. **StandBy Mode display** for nightstand iPhones — large card name + multiplier when at home, switches to nearby-merchant view when traveling.
14. **Photos widget remix** — for the rectangular lock widget, render the recommendation in a "ticket stub" / boarding pass aesthetic instead of a UI card. More physical, less app-y.

### 🗺️ Map & location

15. **Pre-trip mode** — user types a destination ("Paris, May 12–18"); app pre-warms recommendations for likely merchant categories at the destination, including foreign-transaction-fee gotchas. Travel cards finally earn their keep visibly.
16. **Geofence wake-up summary** — when you arrive at a known merchant, the app silently logs the visit. End-of-day summary: "you visited 4 merchants today, earned $X, optimal would have been $Y." Useful for manual-adder persona, who has no transaction history otherwise.

### 🃏 Manual-adder specific

17. **"Swipe log"** — a one-tap "I just swiped Gold here" log so manual users can build their own retroactive analytics over time. Becomes a lightweight transaction history.
18. **Receipt photo OCR** for credit auto-capture (e.g. CSR travel credit) — gives manual users some of the auto-detect superpowers without bank linking.
19. **Wallet import via Apple Pay enumeration** — if the user has cards in their iOS Wallet, offer to read just the card brand/product (not the number) to seed the catalog. Faster than a manual picker.

### 🎨 Brand & UX experiments

20. **"Cards in conversation"** — the three cards are characters with voices. Gold is gluttonous, CSR is the well-traveled friend, Savor is the easygoing one. Tiny tone shifts in copy per card. Risky; could be charming or insufferable.
21. **Receipt-style transaction detail** — full-bleed faux-paper receipt typography for transaction views. Plays into Fraunces serif + Mono numerals already in the system.
22. **Anti-loud aesthetic** — almost everything in the app is monochrome ink-on-paper, and *only* the recommended card gets color. Color = a nudge, never decoration.

### 🤖 Agentic / opinionated swings

23. **"Auto-default" suggestion** — the app figures out which card should be your default in Apple Pay this week (highest-EV across your typical pattern) and prompts a one-tap change in iOS Wallet settings.
24. **End-of-year report card** — a "Spotify Wrapped" style year-in-review for cards. Could be a viral moment if done with restraint.
25. **Card retirement ceremony** — when the simulator shows a card has cost more than it earned for 2 quarters, the app gently surfaces it: "This might be a goodbye." Not a hard recommendation; a conversation starter.

---

If any of these resonate, I'd suggest:
- **Pick 2–3 to add to the FRD** as either Should/Could requirements or as a new "Future surfaces" appendix
- **Pick 1 to mock visually** so we have a concrete artifact to react to (e.g. the Live Activity weekly recap, or the receipt-style transaction detail)

Which directions excite you?

## User

great ideas... what is your ranking of the ideas?

## Assistant

_[tool: snip]_

Here's my ranking — judged on **(a) leverage** (how much it shapes the product's identity), **(b) effort vs. payoff**, and **(c) risk of feeling gimmicky**. Top of the list is what I'd actually fight for.

---

### 🥇 Tier 1 — These define the product

**1. #22 · Anti-loud aesthetic (color = the nudge)**
This is the one. Almost no app commits to "color is information, not decoration." It's a brand position *and* a usability win — the recommended card pops because nothing else does. Cheap to execute, hard to copy, fits the editorial palette already chosen. **Do this.**

**2. #2 · Confidence indicator on recos**
Honest products earn trust. A 4× vs 1× pick and a 3× vs 2.5× pick should not look identical. This is the difference between "the app is right" and "the app is sometimes confidently wrong." Low-effort, high-credibility. **Ship in v1.**

**3. #3 · Basket-aware estimates**
"+$9.60 on your usual basket" is the brief's signature copy. It's already in the design brief — formalize it as a requirement. Without it, recos feel theoretical; with it, they feel personal. Linked-persona only. **Already half-promised; finish the job.**

**4. #6 · Regret meter, kindly framed**
The differentiator vs. every other rewards app. Most products hide the gap; this one names it gently. Falls out of `computeAll()` for free. The framing is the whole game — "left on the table" not "wasted." **High leverage if the copy lands.**

---

### 🥈 Tier 2 — Strong adds, schedule for M2/M3

**5. #17 · Swipe log for manual users**
Solves the manual-persona analytics gap elegantly without bank linking. Single button, builds a lightweight history. Makes the manual path a real product, not a degraded one.

**6. #1 · Apple Pay default-card hint via lock widget**
The most native, least interruptive way to deliver the core value. Notifications fatigue; ambient widgets don't. Pairs well with #22.

**7. #19 · Wallet import via Apple Pay enumeration**
Onboarding speed is conversion. If we can read brand/product (not PAN) from iOS Wallet to pre-fill the catalog, manual onboarding goes from a chore to magic.

**8. #15 · Pre-trip mode**
Travel cards (CSR especially) only justify their fee on trips. Surfacing FX-fee gotchas and category boosts pre-trip is exactly when the app should be loud. Discrete feature, scoped, valuable.

**9. #9 · Compounding-quiet (earned silence)**
Best notification policy is one that learns to shut up. Cheap to implement, immediately raises the perceived intelligence of the app.

---

### 🥉 Tier 3 — Nice-to-haves, candidate cuts

**10. #7 · Annual fee health bar** — useful but adjacent to #6; might collapse into the credits screen.
**11. #8 · "What if I cancelled X" simulator** — powerful but probably a settings-deep feature, not a hero.
**12. #11 · Calendar events for credits** — clever, but a niche preference.
**13. #16 · End-of-day visit summary** — good for manual users; partially redundant with #17.
**14. #21 · Receipt-style transaction detail** — beautiful idea, easy to over-design. Worth one mock.
**15. #13 · StandBy Mode display** — narrow audience but cheap once widgets exist.
**16. #5 · Card of the month** — fine, but adjacent to #24.
**17. #10 · Weekly recap as Live Activity** — Live Activities are finicky; risk/reward unclear.

---

### 🤔 Tier 4 — Skip or defer

**18. #14 · Boarding-pass-style widget** — visual flex with no functional payoff.
**19. #18 · Receipt OCR for credits** — high effort, narrow benefit, OCR rarely "just works."
**20. #12 · Today's earnings ticker** — dopamine slop. Not the brand.
**21. #4 · Two-card split prompt** — too edge-case for v1.
**22. #23 · Auto-default in Apple Pay** — Apple won't let us, and even if they did, it's a dark-pattern smell.
**23. #25 · Card retirement ceremony** — charming, but tone is hard to land. Cuttable.

---

### ❌ Probably don't

**24. #20 · Cards as characters with voices** — high charm ceiling, very high cringe floor. Most rewards apps die on tone. Skip unless we have a specific writer driving it.
**25. #24 · Year-in-review** — Spotify Wrapped fatigue is real. Could ship in year two if the data is interesting; nothing to do for v1.

---

### My recommended action set

If I had to pick **five** to add to the FRD as Should-priority requirements right now:

→ **#22, #2, #3, #6, #17**

These give us: a defensible aesthetic position, honest recommendations, the signature copy moment, the differentiating analytics frame, and a real product for the manual persona. None of them are expensive; together they make the app feel like one thing, not a feature list.

Want me to draft those as FR-XXX requirements and slot them into the doc?

## User

yes

## Assistant

_[tool: snip]_

_[tool: read_file]_

I'll add the five new requirements. Let me find good homes for each:

- **#22 (Anti-loud aesthetic)** → new Section 17 "Visual principles" or top of Home (FR-HOME)
- **#2 (Confidence indicator)** → Engine + Home
- **#3 (Basket-aware)** → Engine + Notifications
- **#6 (Regret meter)** → Home
- **#17 (Swipe log)** → Onboarding/Manual + new section

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: snip]_

Now let me also update the TOC to include the new sections, and update the home/notification sections to reference the new requirements.

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

Added the five requirements:

- **FR-ENG-06 / FR-HOME-07** — confidence score, surfaced everywhere
- **FR-ENG-07 / FR-NOT-05** — basket-aware uplift estimate
- **FR-HOME-06** — "left on the table" frame with kindly dismiss
- **New §12.5 (FR-MAN-01–04)** — manual-adder swipe log, with upgrade path
- **New §13.5 (FR-VIS-01–04)** — anti-loud aesthetic as enforceable visual principles

TOC updated. Want me to mock one of these visually next — likely the home list with confidence indicators, or the "left on the table" summary?

## User

should I just upload this document to Claude Code?

## Assistant

_[tool: snip]_

You can, but a couple of recommendations to make it land better:

**1. Send it as a package, not just the FRD.** Claude Code does best with multiple anchored documents. The full set you'd want to hand over:

- `REQUIREMENTS.html` (this doc) — *what* to build
- `DESIGN_BRIEF.md` — *how* it should look and feel, with token values
- `Swipewise v2 - Standalone.html` — visual reference for every screen
- `mocks/` folder — the JSX source the screens were built from
- `HANDOFF.md` — the original Replit/Plaid technical handoff

The FRD alone is good for scoping; combined with the brief + mocks, Claude Code can actually build to spec.

**2. Convert the FRD to Markdown for Claude Code.** HTML works, but Markdown is more token-efficient and easier for Claude Code to grep/reference. I can generate a `REQUIREMENTS.md` mirror of this document — same content, simpler format — so Claude Code can read it natively without parsing layout.

**3. Add a short "how to use this doc" preamble** for Claude Code specifically:
- Build order (which milestones first)
- Which sections are contract vs. guidance
- How to flag ambiguity back to you

**4. Strip what Claude Code doesn't need.** The visual styling of the FRD (Fraunces, hard shadows, etc.) is for you reviewing the doc, not for the agent. The Markdown version drops that overhead.

Want me to:
- **(a)** Generate `REQUIREMENTS.md` (clean Markdown mirror), or
- **(b)** Bundle everything into a `handoff/` folder with a top-level README that orients Claude Code, or
- **(c)** Both?

## User

c

## Assistant

## User

Save as standalone HTML: REQUIREMENTS.html

## Assistant

