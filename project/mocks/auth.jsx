// Auth — phone number + OTP — 2 variations
// Screen size: 402 × 874

function AuthA_Phone() {
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
        <div style={{ fontSize: 14, fontWeight: 600, color: T.dim, marginLeft: 6 }}>Step 1 of 3</div>
      </div>

      <div style={{ padding: '36px 24px 0' }}>
        <Pill bg={T.mint}>sign in · no password</Pill>
        <h1 className="display" style={{ fontSize: 42, lineHeight: 0.98, margin: '16px 0 10px', fontWeight: 900, letterSpacing: -0.03 }}>
          What's your<br/>number, boss?
        </h1>
        <p style={{ fontSize: 15, color: T.graphite, lineHeight: 1.4, margin: 0 }}>
          We'll text you a code. No passwords to forget. No "your account has been breached" emails at 3am.
        </p>
      </div>

      {/* Phone input block */}
      <div style={{ margin: '28px 24px 0' }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'stretch',
        }}>
          <div style={{
            background: T.cream, border: `2.5px solid ${T.ink}`, borderRadius: 14,
            padding: '14px 16px', fontWeight: 700, fontSize: 18,
            boxShadow: `3px 3px 0 0 ${T.ink}`,
            display: 'flex', alignItems: 'center', gap: 8, minWidth: 88,
          }}>🇺🇸 <span>+1</span><span style={{ fontSize: 12 }}>▾</span></div>
          <div style={{
            flex: 1, background: T.paper, border: `2.5px solid ${T.ink}`, borderRadius: 14,
            padding: '14px 18px', fontWeight: 700, fontSize: 22,
            boxShadow: `3px 3px 0 0 ${T.ink}`, letterSpacing: 1,
          }}>(415) 555-0199<span style={{ background: T.ink, display: 'inline-block', width: 2, height: 22, marginLeft: 3, verticalAlign: 'middle', animation: 'blink 1s infinite' }} /></div>
        </div>
        <div style={{ fontSize: 12, color: T.dim, marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          🔒 We never share your number. Unsubscribe on first text if you change your mind.
        </div>
      </div>

      {/* Why phone, no password */}
      <div style={{ margin: '24px 24px 0', padding: 16, background: T.cream, border: `2px solid ${T.ink}`, borderRadius: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>why no password?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: T.graphite }}>
          <div>✓ You won't forget it at tax time.</div>
          <div>✓ Phishing is useless against OTP.</div>
          <div>✓ We don't store anything we don't have to.</div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 44, left: 24, right: 24 }}>
        <ChunkyBtn bg={T.ink} fg={T.paper} size="lg" w="100%">Send me a code</ChunkyBtn>
        <div style={{ textAlign: 'center', fontSize: 11.5, color: T.dim, marginTop: 14, lineHeight: 1.5 }}>
          By continuing, you agree to the Terms & Privacy.<br/>Standard message rates may apply.
        </div>
      </div>
    </div>
  );
}

function AuthB_OTP() {
  const digits = ['4','2','1','9','','',''];
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
        <div style={{ fontSize: 14, fontWeight: 600, color: T.dim, marginLeft: 6 }}>Step 2 of 3</div>
      </div>

      <div style={{ padding: '36px 24px 0' }}>
        <Pill bg={T.sky}>check your texts</Pill>
        <h1 className="display" style={{ fontSize: 44, lineHeight: 0.98, margin: '16px 0 10px', fontWeight: 900, letterSpacing: -0.03 }}>
          Six digits, and<br/>we're in.
        </h1>
        <p style={{ fontSize: 15, color: T.graphite, lineHeight: 1.4, margin: 0 }}>
          Code sent to <b>+1 (415) ••• 0199</b>. Expires in 5:00.
        </p>
      </div>

      {/* OTP boxes */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '40px 24px 0' }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{
            width: 48, height: 60, background: digits[i] ? T.lemon : T.paper,
            border: `2.5px solid ${T.ink}`, borderRadius: 12,
            boxShadow: digits[i] ? `3px 3px 0 0 ${T.ink}` : `2px 2px 0 0 ${T.ink}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.display, fontWeight: 900, fontSize: 32,
          }}>{digits[i] || (i === 4 ? '|' : '')}</div>
        ))}
      </div>

      <div style={{ textAlign: 'center', margin: '28px 24px 0' }}>
        <span style={{ fontSize: 14, color: T.graphite }}>Didn't get it? </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.plumDk, textDecoration: 'underline' }}>Resend in 0:32</span>
      </div>

      {/* mini illustrated phone */}
      <div style={{
        margin: '44px auto 0', width: 220, padding: 16,
        background: T.cream, border: `2px solid ${T.ink}`, borderRadius: 20,
        boxShadow: `4px 4px 0 0 ${T.ink}`,
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: T.dim, marginBottom: 8 }}>SWIPEWISE</div>
        <div style={{ fontSize: 14, lineHeight: 1.4, color: T.graphite }}>
          Your code is <b style={{ color: T.ink, background: T.lemon, padding: '2px 6px', borderRadius: 4 }}>421906</b>.
          Don't share it with anyone. Not even your dog.
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 44, left: 24, right: 24 }}>
        <ChunkyBtn bg={T.mint} fg={T.ink} size="lg" w="100%">Verify & continue</ChunkyBtn>
      </div>
    </div>
  );
}

Object.assign(window, { AuthA_Phone, AuthB_OTP });
