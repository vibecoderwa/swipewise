// Win Moment — fires after a confirmed smart swipe. Count-up dollar amount,
// multiplier badge bouncing in over the dollar, editorial confetti glyphs,
// streak ticking up with a coral "+1" floater, wry tagline.
//
// Two CTAs: "Brag a little" → Compose pre-filled, "Done" → Home.
import { useEffect, useRef, useState } from 'react';
import { categoryLabel } from '../lib/merchantInfer.js';

const TAGLINES = [
  '❋ that\'s a fancy coffee, on us ❋',
  '❋ small wins compound ❋',
  '❋ swipewise: 1, leakage: 0 ❋',
  '❋ the wallet sings ❋',
  '❋ another one for the ledger ❋',
];

const CONFETTI_GLYPHS = ['✦', '❋', '✧'];
const CONFETTI_COLORS = ['var(--lemon)', 'var(--coral)', 'var(--mint)', 'var(--sky)', 'var(--plum)'];

export default function WinMoment({ ctx, go, onClaim }) {
  const reward = Math.max(0.01, Number(ctx?.reward || 0));
  const targetEarn = reward;
  const merchant = ctx?.merchant || 'a smart swipe';
  const location = ctx?.location || '';
  const cardName = ctx?.card_name || 'your card';
  const category = ctx?.category || 'other';
  const rate = ctx?.rate || 1;
  const targetStreak = ctx?.streak_after?.streak ?? null;
  const targetYtd = ctx?.streak_after?.ytd_total ?? null;
  const priorStreak = ctx?.streak_before?.streak ?? targetStreak;
  const priorYtd = ctx?.streak_before?.ytd_total ?? targetYtd;
  const claimedRef = useRef(false);
  const claim = () => {
    if (claimedRef.current) return;
    claimedRef.current = true;
    onClaim?.();
  };

  // Animated values
  const [earn, setEarn] = useState(0);
  const [streak, setStreak] = useState(priorStreak ?? 0);
  const [ytd, setYtd] = useState(priorYtd ?? 0);
  const [showStreakUp, setShowStreakUp] = useState(false);
  const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)]);

  useEffect(() => {
    const start = performance.now();
    const dur = 900;
    let raf;
    const startYtd = priorYtd ?? 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setEarn(targetEarn * eased);
      if (targetYtd != null) setYtd(startYtd + (targetYtd - startYtd) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const t1 = setTimeout(() => {
      if (targetStreak != null && targetStreak > (priorStreak ?? 0)) {
        setStreak(targetStreak);
        setShowStreakUp(true);
      }
    }, 1000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
    };
  }, [targetEarn, targetStreak, targetYtd, priorStreak, priorYtd]);

  return (
    <div className="win-screen">
      {/* Editorial confetti — small ✦ ❋ ✧ glyphs falling, NOT generic stars */}
      <div className="win-confetti" style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: 10 }, (_, i) => {
          const ch = CONFETTI_GLYPHS[i % CONFETTI_GLYPHS.length];
          const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
          return (
            <span
              key={i}
              style={{
                left: `${10 + i * 9}%`,
                fontSize: 14 + (i % 3) * 4,
                color,
                animationDelay: `${i * 70}ms`,
                animationDuration: `${1800 + i * 90}ms`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>

      <div className="win-eyebrow">✓ Smart swipe recorded</div>
      <div className="win-merchant">
        {merchant}{location ? ` · ${location}` : ''}
      </div>

      <div className="win-amount-wrap">
        <div className="win-amount-inner">
          <div className="win-amount">
            <span className="dollar">+$</span>{earn.toFixed(2)}
          </div>
          <div className="win-badge">
            <span className="mult">{rate}×</span>
            <span className="cat-tag">{categoryLabel(category).toUpperCase().slice(0, 4)}</span>
          </div>
        </div>
        <div className="win-sub">
          earned on <b>{cardName}</b> for {categoryLabel(category).toLowerCase()}
        </div>
      </div>

      {targetStreak != null && (
        <div className="win-stats">
          <div className="home-stat streak" style={{ position: 'relative' }}>
            <span className="flame">🔥</span>
            <div>
              <div className="num">{streak} <small>wk</small></div>
              <div className="label">streak</div>
            </div>
            {showStreakUp && <span className="streak-up">+1</span>}
          </div>
          <div className="home-stat ytd">
            <div>
              <div className="num">+${Math.round(ytd)}</div>
              <div className="label">this year</div>
            </div>
          </div>
        </div>
      )}

      <div className="win-tagline">{tagline}</div>

      <div className="win-actions">
        <button
          className="btn accent"
          onClick={() => {
            claim();
            go('compose', {
              card_id: ctx?.card_id,
              card_name: cardName,
              merchant,
              location,
              category,
              rate,
              swipe_id: ctx?.swipe_id,
            });
          }}
        >
          📣 Brag a little
        </button>
        <button
          className="btn secondary"
          onClick={() => { claim(); go('home'); }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
