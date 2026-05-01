// Onboarding — Plaid-first + manual fallback — 2 variations

function OnboardA_Plaid() {
  return (
    <div style={{
      width: 402, height: 874, background: T.paper, color: T.ink,
      fontFamily: T.body, position: 'relative', overflow: 'hidden',
    }}>
      <FakeStatus />
      <div style={{ padding: '10px 24px 0', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.dim }}>Step 3 of 3</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.graphite, textDecoration: 'underline' }}>Skip for now</div>
      </div>

      <div style={{ padding: '28px 24px 0' }}>
        <Pill bg={T.lemon}>let's add your cards</Pill>
        <h1 className="display" style={{ fontSize: 42, lineHeight: 0.98, margin: '14px 0 10px', fontWeight: 900, letterSpacing: -0.03 }}>
          Bring your<br/>wallet, not your<br/>card numbers.
        </h1>
        <p style={{ fontSize: 15, color: T.graphite, lineHeight: 1.4, margin: 0 }}>
          Connect your bank through Plaid. We read which cards you have and categorize your spend. <b>Read-only.</b> No numbers stored.
        </p>
      </div>

      {/* Plaid CTA */}
      <div style={{
        margin: '28px 24px 0', padding: 20,
        background: T.sky, border: `2.5px solid ${T.ink}`, borderRadius: 18,
        boxShadow: `5px 5px 0 0 ${T.ink}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, background: T.ink, color: T.lemon, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16 }}>P</div>
          <span style={{ fontWeight: 800, fontSize: 15 }}>Plaid — the secure way</span>
        </div>
        <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.4, opacity: 0.85 }}>
          Works with 12,000+ US banks. Takes ~20 seconds. We auto-detect your credit cards.
        </div>
        <div style={{ marginTop: 14 }}>
          <ChunkyBtn bg={T.ink} fg={T.paper} size="md" w="100%">🔗 Connect my bank</ChunkyBtn>
        </div>
      </div>

      {/* trust strip */}
      <div style={{ display: 'flex', gap: 8, padding: '18px 24px 0', flexWrap: 'wrap' }}>
        <Pill bg={T.cream} fg={T.ink}>🔒 256-bit encrypted</Pill>
        <Pill bg={T.cream} fg={T.ink}>👁 Read-only</Pill>
        <Pill bg={T.cream} fg={T.ink}>🚫 No selling</Pill>
      </div>

      {/* divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 24px 0' }}>
        <div style={{ flex: 1, height: 1.5, background: T.hairline }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: T.dim, letterSpacing: 1 }}>OR</div>
        <div style={{ flex: 1, height: 1.5, background: T.hairline }} />
      </div>

      {/* Manual */}
      <div style={{ margin: '18px 24px 0' }}>
        <div style={{
          padding: '14px 16px', background: T.paper,
          border: `2px dashed ${T.ink}`, borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.cream, border: `1.5px solid ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✍︎</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Enter cards manually</div>
            <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>Pick from our catalog of 200+ cards. No bank needed.</div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>›</div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 44, left: 24, right: 24, textAlign: 'center', fontSize: 12, color: T.dim }}>
        You're in control. Disconnect anytime in Settings.
      </div>
    </div>
  );
}

function OnboardB_Manual() {
  const cards = [
    { brand: 'amex', name: 'Amex Gold', fee: '$325/yr', selected: true },
    { brand: 'chase', name: 'Sapphire Reserve', fee: '$795/yr', selected: true },
    { brand: 'savor', name: 'Capital One Savor', fee: 'No fee', selected: true },
    { brand: 'chase', name: 'Sapphire Preferred', fee: '$95/yr', selected: false },
    { brand: 'amex', name: 'Amex Platinum', fee: '$695/yr', selected: false },
  ];
  return (
    <div style={{
      width: 402, height: 874, background: T.paper, color: T.ink,
      fontFamily: T.body, position: 'relative', overflow: 'hidden',
    }}>
      <FakeStatus />
      <div style={{ padding: '10px 24px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: T.paper,
          border: `2px solid ${T.ink}`, boxShadow: `2px 2px 0 0 ${T.ink}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
        }}>‹</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.dim, marginLeft: 6 }}>Add manually</div>
      </div>

      <div style={{ padding: '28px 24px 0' }}>
        <h1 className="display" style={{ fontSize: 38, lineHeight: 0.98, margin: '0 0 10px', fontWeight: 900, letterSpacing: -0.03 }}>
          Pick the cards<br/>in your wallet.
        </h1>
        <p style={{ fontSize: 14, color: T.graphite, margin: 0 }}>3 selected · tap to toggle</p>
      </div>

      {/* Search */}
      <div style={{ margin: '18px 24px 0' }}>
        <div style={{
          padding: '12px 16px', background: T.cream,
          border: `2px solid ${T.ink}`, borderRadius: 14, boxShadow: `2px 2px 0 0 ${T.ink}`,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 15,
        }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <span style={{ color: T.dim }}>Search 200+ cards…</span>
        </div>
      </div>

      {/* List */}
      <div style={{ margin: '18px 24px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cards.map((c, i) => (
          <div key={i} style={{
            padding: 14, background: c.selected ? T.cream : T.paper,
            border: `2.5px solid ${T.ink}`, borderRadius: 14,
            boxShadow: c.selected ? `4px 4px 0 0 ${T.ink}` : `2px 2px 0 0 ${T.ink}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <CardSwatch brand={c.brand} size={42} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>{c.fee}</div>
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              border: `2px solid ${T.ink}`,
              background: c.selected ? T.mint : T.paper,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 16,
            }}>{c.selected ? '✓' : ''}</div>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 44, left: 24, right: 24 }}>
        <ChunkyBtn bg={T.lemon} fg={T.ink} size="lg" w="100%">Continue with 3 cards</ChunkyBtn>
      </div>
    </div>
  );
}

Object.assign(window, { OnboardA_Plaid, OnboardB_Manual });
