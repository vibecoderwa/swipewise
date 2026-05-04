import { useEffect, useState } from 'react';
import PlaidConnect from '../components/PlaidConnect.jsx';
import Folio from '../components/Folio.jsx';
import { api } from '../lib/api.js';

// Onboarding — Plaid-first with manual fallback (FR-ONB-01, FR-ONB-02).
// Visual reference: mocks/onboarding.jsx · OnboardA_Plaid + OnboardB_Manual.

const V1_CARD_IDS = [
  'amex_gold',
  'chase_sapphire_reserve',
  'capone_savor',
  'chase_sapphire_preferred',
  'amex_platinum',
];

function brandKey(card) {
  if (!card) return 'default';
  if (card.id?.startsWith('amex_')) return 'amex';
  if (card.id?.startsWith('chase_')) return 'chase';
  if (card.id?.startsWith('capone_')) return 'capone';
  if (card.id?.startsWith('citi_')) return 'citi';
  if (card.id?.startsWith('discover_')) return 'discover';
  return 'default';
}

export default function Onboarding({ onDone }) {
  const [mode, setMode] = useState('choose'); // 'choose' | 'manual'
  return (
    <div className="screen">
      {mode === 'choose' && <Choose onPickManual={() => setMode('manual')} onDone={onDone} />}
      {mode === 'manual' && <ManualPick onBack={() => setMode('choose')} onDone={onDone} />}
    </div>
  );
}

function Choose({ onPickManual, onDone }) {
  const [connecting, setConnecting] = useState(false);
  return (
    <>
      <div className="auth-top">
        <div className="step-meta">Step 3 of 3</div>
        <button className="text-link" onClick={onDone}>Skip for now</button>
        <div style={{ marginLeft: 8 }}><Folio n={4} /></div>
      </div>

      <div className="stagger">
        <span className="pill-chip" style={{ marginTop: 12 }}>let's add your cards</span>
        <h1 className="hero-q" style={{ marginTop: 14 }}>
          Bring your<br/>wallet, not your<br/>card numbers.
        </h1>
        <p className="hero-q-sub">
          Connect your bank through Plaid. We read which cards you have and categorize
          your spend. <b>Read-only.</b> <i>No numbers stored.</i>
        </p>
      </div>

      <div className={`plaid-cta ${connecting ? 'connecting' : ''}`}>
        {connecting ? (
          <div className="connecting-row">
            <div className="plaid-spinner" />
            <div className="connecting-text">
              <div className="h">Linking your bank…</div>
              <div className="s">Reading cards · categorizing transactions · setting up geofences</div>
            </div>
          </div>
        ) : (
          <>
            <div className="plaid-cta-head">
              <span className="plaid-mark">P</span>
              <span>Plaid — the secure way</span>
            </div>
            <div className="plaid-cta-body">
              Works with 12,000+ US banks. Takes ~20 seconds. We auto-detect your credit cards.
            </div>
          </>
        )}
        <PlaidConnect onConnected={onDone} onBusyChange={setConnecting} />
      </div>

      <div className="trust-row">
        <span className="pill">🔒 256-bit encrypted</span>
        <span className="pill">👁 Read-only</span>
        <span className="pill">🚫 No selling</span>
      </div>

      <div className="or-divider"><span>or</span></div>

      <button className="manual-row" onClick={onPickManual}>
        <div className="manual-icon">✍︎</div>
        <div className="manual-text">
          <div className="manual-title">Enter cards manually</div>
          <div className="manual-sub">Pick from our catalog. No bank needed.</div>
        </div>
        <div className="manual-chev">›</div>
      </button>

      <div className="hero-q-secondary" style={{ marginTop: 24 }}>
        You're in control. Disconnect anytime in Settings.
      </div>
    </>
  );
}

function ManualPick({ onBack, onDone }) {
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.cards();
        setCards(r.cards);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  // Show v1 catalog cards first, then the rest sorted by issuer.
  const ordered = [...cards].sort((a, b) => {
    const av = V1_CARD_IDS.indexOf(a.id), bv = V1_CARD_IDS.indexOf(b.id);
    if (av !== -1 || bv !== -1) {
      return (av === -1 ? 999 : av) - (bv === -1 ? 999 : bv);
    }
    return a.name.localeCompare(b.name);
  });

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function save() {
    if (selected.size === 0) return;
    setBusy(true);
    setError(null);
    try {
      await api.setManualCards([...selected]);
      onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <>
      <div className="auth-top">
        <button className="back-btn" onClick={onBack} aria-label="Back">‹</button>
        <div className="step-meta">Add manually</div>
        <div style={{ marginLeft: 'auto' }}><Folio n={5} /></div>
      </div>

      <div className="stagger">
        <h1 className="hero-q" style={{ marginTop: 24 }}>
          Pick the cards<br/>in your wallet.
        </h1>
        <p className="hero-q-sub">
          {selected.size} selected · <i>tap to toggle</i>
        </p>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="manual-list">
        {ordered.map(c => {
          const isSel = selected.has(c.id);
          return (
            <button
              key={c.id}
              className={`manual-card ${isSel ? 'selected' : ''}`}
              onClick={() => toggle(c.id)}
            >
              <span className={`brand-swatch ${brandKey(c)}`} aria-hidden="true" />
              <div className="manual-card-text">
                <div className="manual-card-name">{c.name}</div>
                <div className="manual-card-fee">{c.annual_fee ? `$${c.annual_fee}/yr` : 'No fee'}</div>
              </div>
              <span className={`check-tile ${isSel ? 'on' : ''}`}>{isSel ? '✓' : ''}</span>
            </button>
          );
        })}
      </div>

      <div className="auth-cta">
        <button className="btn accent" disabled={selected.size === 0 || busy} onClick={save}>
          {busy
            ? 'Saving…'
            : selected.size === 0
              ? 'Pick at least one card'
              : `Continue with ${selected.size} card${selected.size === 1 ? '' : 's'}`}
        </button>
      </div>
    </>
  );
}
