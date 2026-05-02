import { useEffect, useMemo, useState } from 'react';
import PlaidConnect from '../components/PlaidConnect.jsx';
import CardArt from '../components/CardArt.jsx';
import Avatar from '../components/Avatar.jsx';
import Folio from '../components/Folio.jsx';
import { api } from '../lib/api.js';
import { inferCategory, categoryLabel, bestCardFor, QUICK_MERCHANTS } from '../lib/merchantInfer.js';
import { rankMerchants, distanceLabel } from '../lib/nearby.js';

function brandKey(card) {
  if (!card) return 'default';
  if (card.id?.startsWith('amex_')) return 'amex';
  if (card.id?.startsWith('chase_')) return 'chase';
  if (card.id?.startsWith('capone_')) return 'capone';
  if (card.id?.startsWith('citi_')) return 'citi';
  if (card.id?.startsWith('discover_')) return 'discover';
  return 'default';
}

function multLabel(card, rate) {
  // Cash-back cards (no point system) read as "%"; points cards as "×".
  const issuerName = (card?.issuer || '').toLowerCase();
  const isPoints = card && (issuerName.includes('chase') || issuerName.includes('american express') || issuerName.includes('capital one'));
  return isPoints ? `${rate}×` : `${rate}%`;
}

function expectedUplift(card, baseline, rate, basket) {
  // FR-ENG-07 basket-aware uplift estimate (simplified).
  // Estimates extra reward dollars for using `card` at `rate` vs. a 1% baseline.
  const cppCash = 0.01; // 1¢/pt for points cards as a v1 default — the design brief calls out CPP overrides in settings.
  const uplift = Math.max(0, (rate - baseline) / 100 * basket);
  // For points, treat 1 point ≈ 1 cent for the back-of-envelope dollar number.
  return uplift * (cppCash / 0.01);
}

function confidenceLevel(top, second) {
  if (!top) return 'low';
  if (!second) return 'high';
  const gap = (top.rate || 1) - (second.rate || 1);
  if (gap >= 2) return 'high';
  if (gap >= 1) return 'medium';
  return 'low';
}

function ConfidenceDots({ level }) {
  const lit = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <span className="conf" title={`${level} confidence`}>
      {[0,1,2].map(i => <span key={i} className={`conf-dot ${i < lit ? 'on' : ''}`} />)}
    </span>
  );
}

export default function HomeScreen({ hasAccounts, insights, error, onConnected, streak, friendsWeek, go }) {
  const userCards = insights?.user_cards || [];
  const [query, setQuery] = useState('');
  const [userLoc, setUserLoc] = useState(null);
  const [locStatus, setLocStatus] = useState('idle'); // 'idle' | 'pending' | 'granted' | 'denied'
  const [openMerchant, setOpenMerchant] = useState(null);

  const ranked = useMemo(() => {
    if (userCards.length === 0) return [];
    return rankMerchants(userLoc).map(m => {
      const top = bestCardFor(m.category, userCards);
      const rest = userCards.filter(c => c.id !== top?.card.id);
      const runner = rest.length ? bestCardFor(m.category, rest) : null;
      const uplift = top ? expectedUplift(top.card, runner?.rate ?? 1, top.rate, m.basket) : 0;
      const level = confidenceLevel(top, runner);
      return { ...m, top, runner, uplift, level };
    });
  }, [userCards, userLoc]);

  // First-run state — no cards yet.
  if (!hasAccounts) {
    return (
      <div className="screen">
        <div className="brand-mini">
          <div className="brand-mark-mini" />
          <span>Swipewise</span>
        </div>
        <h1 className="hero-q">
          Your wallet<br/>
          just got<br/>
          <span className="accent">opinionated.</span>
        </h1>
        <p className="hero-q-sub">
          Bring your wallet, not your card numbers. We read which cards you have and
          tell you which to swipe — <i>before</i> you swipe it.
        </p>
        {error && <div className="error">{error}</div>}
        <PlaidConnect onConnected={onConnected} />
        <div className="hero-q-secondary">
          Read-only · Plaid-secured · no card numbers stored
        </div>
      </div>
    );
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setLocStatus('denied');
      return;
    }
    setLocStatus('pending');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('granted');
      },
      () => setLocStatus('denied'),
      { timeout: 6000 }
    );
  }

  const trimmed = query.trim();
  const searchCategory = trimmed ? inferCategory(trimmed) : null;
  const searchReco = (searchCategory && userCards.length) ? bestCardFor(searchCategory, userCards) : null;

  async function recordSwipe(merchant) {
    if (!merchant?.top) return;
    const card = merchant.top.card;
    const before = streak || { streak: 0, ytd_total: 0 };
    try {
      const r = await api.logSwipe({
        card_id: card.id,
        merchant: merchant.name,
        location: merchant.sub,
        category: merchant.category,
        rate: merchant.top.rate,
        basket: merchant.basket || 0,
      });
      // Predict the post-swipe state without round-tripping /api/streak —
      // the win moment will animate from "before" to "after" while the
      // refresh kicks in in the background.
      const after = {
        streak: Math.max(before.streak, before.streak + (before.streak === 0 ? 1 : 0)),
        ytd_total: Math.round((before.ytd_total || 0) + r.reward),
      };
      go?.('winmoment', {
        card_id: card.id,
        card_name: card.name,
        merchant: merchant.name,
        location: merchant.sub,
        category: merchant.category,
        rate: merchant.top.rate,
        reward: r.reward,
        swipe_id: r.id,
        streak_before: before,
        streak_after: after,
      });
    } catch (e) {
      // Swallow — the user can retry on the next tap.
    }
  }

  return (
    <div className="screen">
      <div className="brand-mini home-header">
        <div className="brand-mark-mini" />
        <span>Swipewise</span>
      </div>

      {/* Streak + YTD strip — two chips a returning user wants to see first */}
      {streak && (
        <div className="home-stats">
          <button className="home-stat streak" onClick={() => go?.('insights')}>
            <span className="flame">🔥</span>
            <div>
              <div className="num">{streak.streak} <small>wk</small></div>
              <div className="label">streak</div>
            </div>
          </button>
          <button className="home-stat ytd" onClick={() => go?.('insights')}>
            <div>
              <div className="num">+${streak.ytd_total}</div>
              <div className="label">this year · {streak.ytd_year}</div>
            </div>
          </button>
        </div>
      )}

      <div className="geo-eyebrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className={`geo-dot ${locStatus === 'granted' ? 'on' : ''}`} />
          {locStatus === 'granted' ? 'Near you · live' : 'Near you · sample'}
        </span>
        <Folio n={6} />
      </div>
      <h1 className="hero-q" style={{ marginTop: 8 }}>
        {ranked.length === 0
          ? <>Match a card<br/>to get going.</>
          : <>{ranked.length} places.<br/><em>{ranked.length} smart swipes.</em></>}
      </h1>
      <p className="hero-q-sub">
        Tap a place to see why. Or grant location to re-rank by distance.
      </p>

      {error && <div className="error">{error}</div>}

      {locStatus !== 'granted' && (
        <button className="btn pin-btn" onClick={detectLocation} disabled={locStatus === 'pending'}>
          <span className="pin-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s7-7 7-13a7 7 0 1 0-14 0c0 6 7 13 7 13z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </span>
          {locStatus === 'pending' ? 'Locating…' : 'Detect my location'}
        </button>
      )}
      {locStatus === 'denied' && (
        <div className="hero-q-secondary" style={{ textAlign: 'left', marginTop: 10 }}>
          Location denied — list shown is a sample.
        </div>
      )}

      {ranked.length > 0 && (
        <>
          <div className="merchants-list">
            {ranked.map((m, i) => {
              const card = m.top?.card;
              const dLabel = distanceLabel(userLoc, m);
              const isAccent = i === 0; // FR-VIS-02: only the top pick gets the accent
              return (
                <button
                  key={m.id}
                  className={`merchant-row ${isAccent ? 'accent' : ''} ${brandKey(card)}`}
                  onClick={() => setOpenMerchant(m)}
                >
                  <div className="merchant-icon">{m.icon}</div>
                  <div className="merchant-text">
                    <div className="merchant-name">{m.name}</div>
                    <div className="merchant-sub">{m.sub}{dLabel ? ` · ${dLabel}` : ''}</div>
                  </div>
                  <div className="merchant-right">
                    <div className="merchant-mult">
                      <span className={`chip chip-sm ${brandKey(card)}`} aria-hidden="true" />
                      <span className="merchant-rate">{m.top ? multLabel(card, m.top.rate) : '—'}</span>
                    </div>
                    <div className="merchant-uplift">
                      {m.uplift > 0 ? `+$${m.uplift.toFixed(m.uplift < 1 ? 2 : (m.uplift < 10 ? 2 : 0))}` : ''}
                      <ConfidenceDots level={m.level} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* "✓ Just swiped" — confirms the user took our top recommendation
              and fires the Win Moment. Mirrors the prototype's geo arrival flow. */}
          {ranked[0]?.top && (
            <div className="just-swiped-row">
              <button
                className="just-swiped"
                onClick={() => recordSwipe(ranked[0])}
              >
                ✓ Just swiped {ranked[0].top.card.name.split(' ').slice(-2).join(' ')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Friends activity strip — quiet surface, NOT a tab. Tap to open
          the full Friends view via go('friends'). */}
      {go && friendsWeek?.names?.length > 0 && (
        <button
          className="friends-strip"
          onClick={() => go('friends')}
        >
          <div className="stack">
            <Avatar tone="sky"   init={friendsWeek.names[0]?.[0] || 'A'} size={22} />
            {friendsWeek.names[1] && <Avatar tone="mint"  init={friendsWeek.names[1]?.[0]} size={22} />}
            {friendsWeek.names[2] && <Avatar tone="coral" init={friendsWeek.names[2]?.[0]} size={22} />}
          </div>
          <div className="copy">
            <b>{friendsWeek.names.slice(0, 2).join(', ')}{friendsWeek.names.length > 2 ? ` & ${friendsWeek.names.length - 2} ${friendsWeek.names.length - 2 === 1 ? 'other' : 'others'}` : ''}</b>{' '}
            earned <span className="gain">+${friendsWeek.total_reward}</span> this week
          </div>
          <span className="chev">›</span>
        </button>
      )}

      <div className="or-divider"><span>or type a store</span></div>

      <div className="search-box">
        <span className="search-icon">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/>
          </svg>
        </span>
        <input
          type="text"
          placeholder="e.g. Whole Foods, Shell, Delta…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoComplete="off"
        />
        {query && (
          <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear">×</button>
        )}
      </div>

      {!trimmed && (
        <div className="quick-row">
          {QUICK_MERCHANTS.slice(0, 6).map(m => (
            <button key={m} className="quick-chip" onClick={() => setQuery(m)}>{m}</button>
          ))}
        </div>
      )}

      {trimmed && (
        <SearchResult
          query={trimmed}
          category={searchCategory}
          recommendation={searchReco}
          hasMatchedCards={userCards.length > 0}
        />
      )}

      {openMerchant && (
        <ArrivalDetail
          merchant={openMerchant}
          onClose={() => setOpenMerchant(null)}
        />
      )}
    </div>
  );
}

function SearchResult({ query, category, recommendation, hasMatchedCards }) {
  if (!hasMatchedCards) {
    return (
      <div className="result-empty">
        <div>Match your accounts to real cards in <b>Settings</b> first.</div>
      </div>
    );
  }
  if (!recommendation) {
    return (
      <div className="result-empty">
        <div>Couldn't infer a category for "<b>{query}</b>". Try a more common store name.</div>
      </div>
    );
  }

  const brand = brandKey(recommendation.card);
  return (
    <div className={`result-card ${brand}`}>
      <CardArt card={recommendation.card} size="md" />
      <div className="result-main">
        <div className="result-eyebrow">Use this card</div>
        <div className="result-name">{recommendation.card.name}</div>
        <div className="result-headline">
          <span className="big-rate">{recommendation.rate}<span className="x">×</span></span>{' '}
          <span className="result-cat">{categoryLabel(category)}</span>
        </div>
      </div>
    </div>
  );
}

// Merchant arrival detail — visual reference: mocks/geo.jsx · GeoB_Banner.
function ArrivalDetail({ merchant, onClose }) {
  const { name, sub, top, runner, uplift } = merchant;
  if (!top) return null;
  const card = top.card;
  return (
    <div className="arrival-overlay" onClick={onClose}>
      <div className="arrival-sheet" onClick={e => e.stopPropagation()}>
        <button className="arrival-close" onClick={onClose} aria-label="Close">×</button>

        <div className="arrival-banner">
          <div className="arrival-pin">📍</div>
          <div>
            <div className="arrival-eyebrow">You're at</div>
            <div className="arrival-merchant">{name}</div>
          </div>
        </div>

        <div className="arrival-body">
          <div className="arrival-section-label">Swipe this one</div>
          <div className={`arrival-card ${brandKey(card)}`}>
            <CardArt card={card} size="md" />
            <div>
              <div className="result-name">{card.name}</div>
              <div className="big-rate">
                {top.rate}<span className="x">×</span>{' '}
                <span className="result-cat">{sub.toLowerCase()}</span>
              </div>
            </div>
            <div className="arrival-stamp">
              <span className="stamp-num">{top.rate}×</span>
              <span className="stamp-unit">{(card?.issuer || '').toLowerCase().includes('capital one') ? 'CASH' : 'PTS'}</span>
            </div>
          </div>

          <div className="arrival-uplift">
            Based on a typical basket {merchant.basket ? `(~$${merchant.basket})` : ''},
            that's roughly <b>+${uplift.toFixed(uplift < 10 ? 2 : 0)}</b> more than your runner-up.
          </div>

          {runner && (
            <>
              <div className="arrival-section-label">Not {card.name.split(' ')[0]}? Next best:</div>
              <div className="alt-row">
                <div className={`alt-tile ${brandKey(runner.card)}`}>
                  <span className={`chip chip-sm ${brandKey(runner.card)}`} aria-hidden="true" />
                  <div>
                    <div className="alt-name">{runner.card.name}</div>
                    <div className="alt-rate">{multLabel(runner.card, runner.rate)}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
