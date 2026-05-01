import { useState } from 'react';
import PlaidConnect from '../components/PlaidConnect.jsx';
import CardArt from '../components/CardArt.jsx';
import { inferCategory, categoryLabel, bestCardFor, QUICK_MERCHANTS } from '../lib/merchantInfer.js';

function brandKey(card) {
  if (!card) return 'default';
  if (card.id?.startsWith('amex_')) return 'amex';
  if (card.id?.startsWith('chase_')) return 'chase';
  if (card.id?.startsWith('capone_')) return 'capone';
  if (card.id?.startsWith('citi_')) return 'citi';
  if (card.id?.startsWith('discover_')) return 'discover';
  return 'default';
}

export default function HomeScreen({ hasAccounts, insights, error, onConnected }) {
  const [query, setQuery] = useState('');
  const userCards = insights?.user_cards || [];

  const trimmed = query.trim();
  const category = trimmed ? inferCategory(trimmed) : null;
  const recommendation = (category && userCards.length) ? bestCardFor(category, userCards) : null;

  function detectLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation isn\'t supported on this device. Type a store name below.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => alert('Got your location. Merchant lookup is coming soon — for now, type the store name below.'),
      (err) => alert(err.code === err.PERMISSION_DENIED
        ? 'Location permission denied. Type the store name below.'
        : 'Couldn\'t get your location. Type the store name below.'),
      { timeout: 6000 }
    );
  }

  // First-run state — no accounts connected
  if (!hasAccounts) {
    return (
      <div className="screen">
        <div className="brand-mini">
          <div className="brand-mark-mini" />
          <span>Swipewise</span>
        </div>
        <h1 className="hero-q">
          Which card should<br/>
          I use <em>right now</em>?
        </h1>
        <p className="hero-q-sub">
          Connect your cards to start. Then we'll tell you which one to swipe — every time.
        </p>
        {error && <div className="error">{error}</div>}
        <PlaidConnect onConnected={onConnected} />
        <div className="hero-q-secondary">
          Read-only · Plaid-secured · no card numbers stored.
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="brand-mini">
        <div className="brand-mark-mini" />
        <span>Swipewise</span>
      </div>

      <h1 className="hero-q">
        Which card should<br/>
        I use <em>right now</em><span className="q-mark">?</span>
      </h1>
      <p className="hero-q-sub">
        Detect your location or type a store name to get an instant card recommendation.
      </p>

      {error && <div className="error">{error}</div>}

      <button className="btn pin-btn" onClick={detectLocation}>
        <span className="pin-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s7-7 7-13a7 7 0 1 0-14 0c0 6 7 13 7 13z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
        </span>
        Detect My Location
      </button>

      <div className="or-divider"><span>or</span></div>

      <div className="metric-eyebrow" style={{ marginBottom: 8 }}>Simulate store name</div>

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

      <ResultBox
        query={trimmed}
        category={category}
        recommendation={recommendation}
        hasMatchedCards={userCards.length > 0}
      />
    </div>
  );
}

function ResultBox({ query, category, recommendation, hasMatchedCards }) {
  if (!query) {
    return (
      <div className="result-empty">
        <div className="result-empty-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M3 11h18M7 15h4" />
          </svg>
        </div>
        <div>Your card recommendation will appear here</div>
      </div>
    );
  }

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
  const rate = recommendation.rate;

  return (
    <div className={`result-card ${brand}`}>
      <CardArt card={recommendation.card} size="md" />
      <div className="result-main">
        <div className="result-eyebrow">Use this card</div>
        <div className="result-name">{recommendation.card.name}</div>
        <div className="result-headline">
          <span className="big-rate">{rate}<span className="x">×</span></span>{' '}
          <span className="result-cat">{categoryLabel(category)}</span>
        </div>
      </div>
    </div>
  );
}
