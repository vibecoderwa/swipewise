// Landing — pre-auth entry point. Two variants:
//  A) wallet spill of card stickers + "Your wallet just got opinionated."
//  B) receipt / ticket stub style with the "$518 average first-week find" hook
import { useState, useEffect } from 'react';
import Sparkle from '../components/Sparkle.jsx';
import Marginalia from '../components/Marginalia.jsx';

const VARIANT_KEY = 'swipewise_landing_variant';

function VariantA({ onStart }) {
  return (
    <>
      <div className="brand-mini">
        <div className="brand-mark-mini" />
        <span>Swipewise</span>
      </div>

      <div className="landing-stickers" aria-hidden="true">
        <div className="sticker chase">
          <div className="sticker-issuer">Chase</div>
          <div className="sticker-num">•••• •••• •••• ••21</div>
          <div className="sticker-name">Sapphire Reserve</div>
        </div>
        <div className="sticker amex">
          <div className="sticker-issuer">American Express</div>
          <div className="sticker-num">•••• •••• •••• ••04</div>
          <div className="sticker-name">Gold Card</div>
        </div>
        <div className="sticker savor">
          <div className="sticker-issuer">Capital One</div>
          <div className="sticker-num">•••• •••• •••• ••55</div>
          <div className="sticker-name">Savor</div>
        </div>
        <Sparkle ch="✦" size={22} delay={0}     style={{ position: 'absolute', top: 20, right: 28 }} />
        <Sparkle ch="✦" size={18} delay={400} color="var(--coral)" style={{ position: 'absolute', top: 180, left: 18 }} />
        <Sparkle ch="✧" size={14} delay={800} color="var(--plum-dk)" style={{ position: 'absolute', top: 210, right: 60 }} />
        <Marginalia dir="left" rotate={-4} style={{ top: 4, left: 18 }}>
          three cards. one brain.
        </Marginalia>
      </div>

      <h1 className="hero-q landing-hero">
        Your wallet<br/>
        just got<br/>
        <span className="accent">opinionated.</span>
      </h1>

      <p className="hero-q-sub">
        Know which card to swipe, <i>before</i> you swipe it. We track your rewards,
        credits, and every coffee you forget to expense.
      </p>

      <div className="landing-cta">
        <button className="btn" onClick={onStart}>Get started — it's free</button>
        <div className="hero-q-secondary">
          Already in? <a className="text-link" href="#" onClick={e => { e.preventDefault(); onStart(); }}>Log in with your number</a>
        </div>
      </div>
    </>
  );
}

function VariantB({ onStart }) {
  return (
    <>
      <div className="brand-mini">
        <div className="brand-mark-mini" />
        <span>Swipewise</span>
      </div>

      <div className="stagger" style={{ marginTop: 12 }}>
        <span className="pill-chip mint">your rewards · audited</span>
        <h1 className="hero-q" style={{ marginTop: 14, fontSize: 96, lineHeight: 0.85 }}>
          $518
        </h1>
        <p className="hero-q-sub">
          That's what the average user finds in the first week. In rewards they were
          already earning — <i>and missing</i>.
        </p>
      </div>

      <div className="receipt-card">
        <div className="head">★ TODAY ★</div>
        <div className="row">
          <div className="ic sky">☕</div>
          <div style={{ flex: 1 }}>
            <div className="name">Blue Bottle · $6.50</div>
            <div className="sub">Swipe Gold → <b style={{ color: 'var(--mint-dk)' }}>4× points</b></div>
          </div>
          <span className="pill-chip" style={{ background: 'var(--amex)', color: '#fff' }}>AMEX</span>
        </div>
        <div className="row">
          <div className="ic lemon">✈︎</div>
          <div style={{ flex: 1 }}>
            <div className="name">United flight · $412</div>
            <div className="sub">Swipe Sapphire → <b style={{ color: 'var(--mint-dk)' }}>5× points</b></div>
          </div>
          <span className="pill-chip" style={{ background: 'var(--chase)', color: '#fff' }}>CHASE</span>
        </div>
        <div className="row">
          <div className="ic coral">⏰</div>
          <div style={{ flex: 1 }}>
            <div className="name">Uber Cash expires Sunday</div>
            <div className="sub">$15 poof, if you don't use it</div>
          </div>
        </div>
      </div>

      <div className="landing-cta">
        <button className="btn alert" onClick={onStart}>Show me my money →</button>
        <div className="hero-q-secondary">
          No credit check. No card number needed. Plaid-secure.
        </div>
      </div>
    </>
  );
}

export default function Landing({ onStart }) {
  const [variant, setVariant] = useState(() => localStorage.getItem(VARIANT_KEY) || 'A');
  useEffect(() => { localStorage.setItem(VARIANT_KEY, variant); }, [variant]);
  const flip = () => setVariant(v => v === 'A' ? 'B' : 'A');
  return (
    <div className={`screen landing ${variant === 'B' ? 'landing-b' : ''}`}>
      <button className="landing-variant-toggle" onClick={flip} aria-label="Toggle landing variant">
        variant {variant} ↔
      </button>
      {variant === 'A' ? <VariantA onStart={onStart} /> : <VariantB onStart={onStart} />}
    </div>
  );
}
