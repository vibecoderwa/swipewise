import { useState } from 'react';
import { api } from '../lib/api.js';
import Folio from '../components/Folio.jsx';
import Marginalia from '../components/Marginalia.jsx';

// Phone-number sign-in (FR-AUTH-01).
// Visual reference: mocks/auth.jsx · AuthA_Phone.

function format(value) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function AuthPhone({ onBack, onSent }) {
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const digits = phone.replace(/\D/g, '');
  const ready = digits.length === 10;

  async function send() {
    setError(null);
    setBusy(true);
    try {
      const fullPhone = `+1${digits}`;
      const r = await api.otpSend(fullPhone);
      onSent({ phone: fullPhone, demoCode: r.demo_code });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen auth-screen">
      <div className="auth-top">
        <button className="back-btn" onClick={onBack} aria-label="Back">‹</button>
        <div className="step-meta">Step 1 of 3</div>
        <div style={{ marginLeft: 'auto' }}><Folio n={2} /></div>
      </div>

      <div className="stagger">
        <span className="pill-chip mint" style={{ marginTop: 12 }}>sign in · no password</span>
        <h1 className="hero-q" style={{ marginTop: 14 }}>
          What's your<br/>number, boss<span className="q-mark">?</span>
        </h1>
        <p className="hero-q-sub">
          We'll text you a code. No passwords to forget. <i>No "your account has been
          breached" emails at 3am.</i>
        </p>
      </div>

      <div className="phone-row" style={{ position: 'relative' }}>
        <div className="cc-pill">🇺🇸 +1 ▾</div>
        <input
          className="phone-input"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(415) 555-0199"
          value={format(phone)}
          onChange={e => setPhone(e.target.value)}
          autoFocus
        />
        {!phone && (
          <Marginalia dir="right" rotate={-4} style={{ top: -28, right: 4 }}>
            any U.S. number works
          </Marginalia>
        )}
      </div>
      <div className="phone-helper">🔒 We never share your number.</div>

      <div className="why-block">
        <div className="why-head">why no password?</div>
        <div className="why-line">✓ You won't forget it at tax time.</div>
        <div className="why-line">✓ Phishing is useless against OTP.</div>
        <div className="why-line">✓ We don't store anything we don't have to.</div>
      </div>

      {error && <div className="error" style={{ marginTop: 14 }}>{error}</div>}

      <div className="auth-cta">
        <button className="btn" disabled={!ready || busy} onClick={send}>
          {busy ? 'Sending…' : 'Send me a code'}
        </button>
        <div className="auth-fineprint">
          By continuing, you agree to the Terms &amp; Privacy.<br/>
          Standard message rates may apply.
        </div>
      </div>
    </div>
  );
}
