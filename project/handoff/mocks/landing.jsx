// Landing page — 2 variations
// Screen size: 402 × 874 (iPhone 15 Pro viewport)

// ────────────────────────────────────────────────────────────
// Variation A — "Big Type + Swatches"
// Massive Fraunces display number as hero, card stickers arranged like a wallet spill.
// ────────────────────────────────────────────────────────────
function LandingA() {
  return (
    <div style={{
      width: 402, height: 874, background: T.paper, color: T.ink,
      fontFamily: T.body, position: 'relative', overflow: 'hidden',
    }}>
      <FakeStatus />

      {/* Brand bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 24px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, background: T.lemon, border: `2px solid ${T.ink}`, borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900,
            boxShadow: `2px 2px 0 0 ${T.ink}`,
          }}>$</div>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>Swipewise</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: T.graphite }}>Log in</span>
      </div>

      {/* Hero — overlapping stickers */}
      <div style={{ position: 'relative', height: 240, margin: '0 0 12px' }}>
        <div style={{ position: 'absolute', top: 40, left: 32 }}>
          <CardSticker brand="chase" name="Sapphire Reserve" last4="••21" rotate={-8} />
        </div>
        <div style={{ position: 'absolute', top: 76, left: 120 }}>
          <CardSticker brand="amex" name="Gold Card" last4="••04" rotate={4} />
        </div>
        <div style={{ position: 'absolute', top: 28, left: 210 }}>
          <CardSticker brand="savor" name="Savor" last4="••55" rotate={11} />
        </div>
        {/* sparkle decorations */}
        <div style={{ position: 'absolute', top: 20, right: 28, fontSize: 22 }}>✦</div>
        <div style={{ position: 'absolute', top: 180, left: 18, fontSize: 18, color: T.coral }}>✦</div>
        <div style={{ position: 'absolute', top: 210, right: 60, fontSize: 14, color: T.plumDk }}>✧</div>
      </div>

      {/* Headline */}
      <div style={{ padding: '0 24px' }}>
        <h1 className="display" style={{
          fontSize: 52, lineHeight: 0.92, margin: 0, fontWeight: 900, letterSpacing: -0.04,
        }}>
          Your wallet<br/>
          just got<br/>
          <span style={{
            background: T.lemon, padding: '0 10px',
            border: `2.5px solid ${T.ink}`, borderRadius: 12,
            boxShadow: `4px 4px 0 0 ${T.ink}`, display: 'inline-block',
            transform: 'rotate(-1.5deg)', marginTop: 4,
          }}>opinionated.</span>
        </h1>
        <p style={{
          fontSize: 17, lineHeight: 1.4, color: T.graphite, marginTop: 22,
          maxWidth: 320, letterSpacing: -0.2,
        }}>
          Know which card to swipe, <i>before</i> you swipe it. We track your rewards, credits, and every coffee you forget to expense.
        </p>
      </div>

      {/* CTA stack */}
      <div style={{ position: 'absolute', bottom: 40, left: 24, right: 24 }}>
        <ChunkyBtn bg={T.ink} fg={T.paper} size="lg" w="100%" style={{ marginBottom: 10 }}>
          Get started — it's free
        </ChunkyBtn>
        <div style={{ textAlign: 'center', fontSize: 13, color: T.dim, marginTop: 14 }}>
          <span style={{ fontWeight: 600, color: T.graphite }}>Already in?</span> Log in with your number
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Variation B — "Coupon / Ticket"
// Ticket-stub aesthetic with perforated edge, stat callouts, mascot.
// ────────────────────────────────────────────────────────────
function LandingB() {
  return (
    <div style={{
      width: 402, height: 874, background: T.cream, color: T.ink,
      fontFamily: T.body, position: 'relative', overflow: 'hidden',
    }}>
      <FakeStatus />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 24px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, background: T.coral, border: `2px solid ${T.ink}`, borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff',
            boxShadow: `2px 2px 0 0 ${T.ink}`,
          }}>$</div>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>Swipewise</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: T.graphite }}>Log in</span>
      </div>

      {/* Giant savings stat */}
      <div style={{ padding: '12px 24px 0' }}>
        <Pill bg={T.mint} fg={T.ink}>your rewards · audited</Pill>
        <div style={{ marginTop: 14 }}>
          <span className="display" style={{
            fontSize: 120, fontWeight: 900, lineHeight: 0.85, letterSpacing: -0.06,
          }}>
            $518
          </span>
          <div style={{ fontSize: 17, fontWeight: 600, color: T.graphite, marginTop: 10, lineHeight: 1.35 }}>
            That's what the average user finds in the first week. In rewards they were already earning — <i>and missing</i>.
          </div>
        </div>
      </div>

      {/* Receipt / ticket illustration */}
      <div style={{
        margin: '26px 24px 0', background: T.paper,
        border: `2.5px solid ${T.ink}`, borderRadius: 18,
        boxShadow: `5px 5px 0 0 ${T.ink}`, padding: 16,
        position: 'relative',
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: T.dim }}>★ TODAY ★</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, padding: '8px 0', borderBottom: `1.5px dashed ${T.hairline}` }}>
          <div style={{ width: 34, height: 34, background: T.sky, border: `1.5px solid ${T.ink}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>☕</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Blue Bottle · $6.50</div>
            <div style={{ fontSize: 12, color: T.dim }}>Swipe Gold → <b style={{ color: T.mintDk }}>4× points</b></div>
          </div>
          <Pill bg={T.amex} fg="#fff">AMEX</Pill>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1.5px dashed ${T.hairline}` }}>
          <div style={{ width: 34, height: 34, background: T.lemon, border: `1.5px solid ${T.ink}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✈︎</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>United flight · $412</div>
            <div style={{ fontSize: 12, color: T.dim }}>Swipe Sapphire → <b style={{ color: T.mintDk }}>5× points</b></div>
          </div>
          <Pill bg={T.chase} fg="#fff">CHASE</Pill>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0 0' }}>
          <div style={{ width: 34, height: 34, background: T.coral, border: `1.5px solid ${T.ink}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff' }}>⏰</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Uber Cash expires Sunday</div>
            <div style={{ fontSize: 12, color: T.dim }}>$15 poof, if you don't use it</div>
          </div>
        </div>

        {/* perforation dots */}
        <div style={{ position: 'absolute', left: -7, top: '50%', width: 12, height: 12, borderRadius: '50%', background: T.cream, border: `2px solid ${T.ink}` }} />
        <div style={{ position: 'absolute', right: -7, top: '50%', width: 12, height: 12, borderRadius: '50%', background: T.cream, border: `2px solid ${T.ink}` }} />
      </div>

      {/* CTA */}
      <div style={{ position: 'absolute', bottom: 40, left: 24, right: 24 }}>
        <ChunkyBtn bg={T.coral} fg="#fff" size="lg" w="100%" style={{ marginBottom: 10 }}>
          Show me my money →
        </ChunkyBtn>
        <div style={{ textAlign: 'center', fontSize: 13, color: T.dim, marginTop: 14 }}>
          No credit check. No card number needed. Plaid-secure.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LandingA, LandingB });
