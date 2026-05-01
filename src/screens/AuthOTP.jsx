import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

// OTP verification (FR-AUTH-02).
// Six auto-advancing digit fields, paste-to-fill, 60s resend timer.
// Visual reference: mocks/auth.jsx · AuthB_OTP.

function maskPhone(phone) {
  // +14155550199 → +1 (415) ••• 0199
  const m = phone?.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (!m) return phone;
  return `+1 (${m[1]}) ••• ${m[3]}`;
}

export default function AuthOTP({ phone, demoCode, onBack, onVerified }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [currentDemo, setCurrentDemo] = useState(demoCode || null);
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  function setDigit(i, v) {
    const sanitized = v.replace(/\D/g, '').slice(-1);
    setDigits(prev => {
      const next = [...prev];
      next[i] = sanitized;
      return next;
    });
    if (sanitized && i < 5) refs.current[i + 1]?.focus();
  }

  function onKeyDown(i, e) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  function onPaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = [...digits];
    for (let i = 0; i < 6; i++) next[i] = text[i] || '';
    setDigits(next);
    const lastIdx = Math.min(text.length, 5);
    refs.current[lastIdx]?.focus();
  }

  const code = digits.join('');
  const ready = code.length === 6;

  async function verify() {
    if (!ready) return;
    setError(null);
    setBusy(true);
    try {
      await api.otpVerify(phone, code);
      onVerified();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  // Auto-submit when all 6 are filled
  useEffect(() => {
    if (ready && !busy) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function resend() {
    setError(null);
    try {
      const r = await api.otpSend(phone);
      setSecondsLeft(60);
      setCurrentDemo(r.demo_code || currentDemo);
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } catch (e) {
      setError(e.message);
    }
  }

  const mm = String(Math.floor(secondsLeft / 60));
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="screen auth-screen">
      <div className="auth-top">
        <button className="back-btn" onClick={onBack} aria-label="Back">‹</button>
        <div className="step-meta">Step 2 of 3</div>
      </div>

      <div className="pill info" style={{ marginTop: 12 }}>check your texts</div>
      <h1 className="hero-q" style={{ marginTop: 14 }}>
        Six digits, and<br/>we're in<span className="q-mark">.</span>
      </h1>
      <p className="hero-q-sub">
        Code sent to <b>{maskPhone(phone)}</b>. Expires in 10:00.
      </p>

      <div className="otp-row" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => refs.current[i] = el}
            className={`otp-cell ${d ? 'filled' : ''}`}
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => setDigit(i, e.target.value)}
            onKeyDown={e => onKeyDown(i, e)}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      <div className="otp-resend">
        <span>Didn't get it? </span>
        {secondsLeft > 0 ? (
          <span className="muted">Resend in 0:{ss}</span>
        ) : (
          <button className="text-link" onClick={resend}>Resend code</button>
        )}
      </div>

      {currentDemo && (
        <div className="demo-sms">
          <div className="demo-head">SWIPEWISE</div>
          <div>
            Your code is <b className="demo-code">{currentDemo}</b>.
            Don't share it with anyone. Not even your dog.
          </div>
        </div>
      )}

      {error && <div className="error" style={{ marginTop: 14 }}>{error}</div>}

      <div className="auth-cta">
        <button className="btn positive" disabled={!ready || busy} onClick={verify}>
          {busy ? 'Verifying…' : 'Verify & continue'}
        </button>
      </div>
    </div>
  );
}
