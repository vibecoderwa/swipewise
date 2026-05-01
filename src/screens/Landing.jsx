// Landing — pre-auth entry point.
// Visual reference: mocks/landing.jsx · LandingA ("Big Type + Wallet Spill").

export default function Landing({ onStart }) {
  return (
    <div className="screen landing">
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
        <span className="spark s1">✦</span>
        <span className="spark s2">✦</span>
        <span className="spark s3">✧</span>
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
    </div>
  );
}
