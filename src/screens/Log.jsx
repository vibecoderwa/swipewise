// Log — every swipe accounted for. Plaid-detected + manual-confirmed events
// in one chronological feed, with filter chips and a quick-entry sheet for
// cash/missed swipes that count toward the streak. Screens 8 & 9 of the v2
// design brief (FR-MAN-01..04 + the SwipeHistory mock).
import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import ScreenHeader from '../components/ScreenHeader.jsx';
import Folio from '../components/Folio.jsx';
import { categoryLabel } from '../lib/merchantInfer.js';

const FILTERS = [
  { id: 'all',        l: 'All' },
  { id: 'optimal',    l: 'Optimal' },
  { id: 'suboptimal', l: 'Suboptimal' },
  { id: 'manual',     l: 'Manual' },
];

function dayKey(ts) {
  const d = new Date(ts);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yest = new Date(today.getTime() - 86400_000);
  if (d >= today) return 'Today';
  if (d >= yest) return 'Yesterday';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
}

function timeStr(ts) {
  return new Date(ts).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase().replace(' ', '');
}

export default function LogScreen({ insights, go, onChange }) {
  const [data, setData]   = useState(null);
  const [filter, setFilter] = useState('all');
  const [showLog, setShowLog] = useState(false);

  useEffect(() => { api.log().then(setData).catch(() => {}); }, []);

  if (!data) {
    return (
      <div className="screen">
        <div className="loading">Loading…</div>
      </div>
    );
  }

  const items = data.items.filter(it => {
    if (filter === 'optimal')    return it.optimal;
    if (filter === 'suboptimal') return !it.optimal;
    if (filter === 'manual')     return it.source === 'manual';
    return true;
  });

  const grouped = items.reduce((acc, it) => {
    const k = dayKey(it.ts);
    (acc[k] = acc[k] || []).push(it);
    return acc;
  }, {});

  return (
    <div className="screen">
      <div className="screen-header" style={{ position: 'relative' }}>
        <div className="eyebrow">Swipe log</div>
        <div className="topright" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Folio n={9} />
          <button className="quick-add-btn" onClick={() => setShowLog(true)} aria-label="Log a swipe">+</button>
        </div>
        <h1 style={{ fontSize: 36 }}>Every swipe,<br/><em>accounted for.</em></h1>
        <p className="hero-q-sub" style={{ fontSize: 13 }}>
          Plaid + your manual logs, in one feed.
        </p>
      </div>

      <div className="pill-row" style={{ marginBottom: 16 }}>
        {FILTERS.map(f => {
          const count = f.id === 'all' ? data.counts.total : data.counts[f.id];
          return (
            <button
              key={f.id}
              className={filter === f.id ? 'active' : ''}
              onClick={() => setFilter(f.id)}
            >
              {f.l} · {count}
            </button>
          );
        })}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="result-empty">
          ❋ no swipes here yet ❋<br/>
          <span style={{ fontSize: 11 }}>tap + to log one manually</span>
        </div>
      ) : Object.entries(grouped).map(([day, list]) => (
        <div key={day} className="log-day-group">
          <div className="day-label">{day}</div>
          <div className="log-rows">
            {list.map(s => (
              <div key={s.id} className="log-row">
                <span className={`stripe ${s.optimal ? 'ok' : 'bad'}`} />
                <span className="time">{timeStr(s.ts)}</span>
                <div className="meta">
                  <div className="m">{s.merchant || 'Unknown'}</div>
                  <div className="sub">
                    <span>{s.card_name}</span>
                    <span className="dot" />
                    <span className={`source ${s.source}`}>{s.source.toUpperCase()}</span>
                    <span className="dot" />
                    <span>{categoryLabel(s.category)}</span>
                  </div>
                </div>
                <span className="amt">${s.basket?.toFixed(2) || '0.00'}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {data.total_missed > 0 && (
        <div className="missed-foot">
          ${data.total_missed.toFixed(0)} left on the table this period.
          <button onClick={() => go?.('lefttable')}>see why ›</button>
        </div>
      )}

      {showLog && (
        <ManualLogSheet
          insights={insights}
          onClose={() => setShowLog(false)}
          onLogged={() => {
            setShowLog(false);
            api.log().then(setData);
            onChange?.();
          }}
        />
      )}
    </div>
  );
}

// ─── Manual log sheet ───
// Slides up from the bottom. Big amount, merchant chip, card picker with
// "BEST" tag on the recommended card, live "+$X earned" callout, "Log swipe
// · keep streak" CTA.
function ManualLogSheet({ insights, onClose, onLogged }) {
  const userCards = insights?.user_cards || [];
  const [amount,   setAmount]   = useState('42.50');
  const [merchant, setMerchant] = useState('Tartine Bakery');
  const [category, setCategory] = useState('dining');
  const [chosen,   setChosen]   = useState(null);
  const [busy,     setBusy]     = useState(false);

  const numAmt = parseFloat(amount) || 0;

  // Find the best card for this category
  const cardWithRate = (card) => {
    const r = card.rewards?.[category] ?? card.rewards?.other ?? 1;
    return { card, rate: r };
  };
  const ranked = [...userCards].map(cardWithRate).sort((a, b) => b.rate - a.rate);
  const bestId = ranked[0]?.card.id;
  const selected = chosen || ranked[0];

  const earned = selected ? (selected.rate / 100) * numAmt : 0;
  const couldHave = ranked[0] ? (ranked[0].rate / 100) * numAmt : 0;
  const optimal = selected && selected.card.id === bestId;

  async function submit() {
    if (busy || !selected) return;
    setBusy(true);
    try {
      await api.logSwipe({
        card_id: selected.card.id,
        merchant,
        location: '',
        category,
        rate: selected.rate,
        basket: numAmt,
      });
      onLogged();
    } catch {
      setBusy(false);
    }
  }

  // Amount editing — bare digits, $ stays
  function setAmt(s) {
    const cleaned = s.replace(/[^\d.]/g, '');
    setAmount(cleaned);
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet log-sheet" onClick={e => e.stopPropagation()}>
        <div className="grabber" />
        <span className="pill-chip" style={{ marginBottom: 12 }}>quick log · 5 sec</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, lineHeight: 1, margin: '0 0 6px' }}>
          What did you<br/><em>swipe?</em>
        </h2>
        <p className="hero-q-sub" style={{ fontSize: 12, marginBottom: 16 }}>
          For when Plaid is slow or it's cash. Counts in your streak.
        </p>

        <div className="amount-card">
          <div className="lab">Amount</div>
          <div className="amt-row">
            <span className="dollar">$</span>
            <input
              className="amt-input"
              inputMode="decimal"
              value={amount}
              onChange={e => setAmt(e.target.value)}
            />
          </div>
        </div>

        <div className="log-section">
          <div className="lab">Where</div>
          <input
            className="compose-input"
            value={merchant}
            onChange={e => setMerchant(e.target.value)}
            placeholder="Merchant name"
          />
          <select
            className="compose-input"
            style={{ marginTop: 8 }}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {['dining', 'groceries', 'gas', 'travel', 'online_shopping', 'streaming', 'other'].map(c => (
              <option key={c} value={c}>{categoryLabel(c)}</option>
            ))}
          </select>
        </div>

        {userCards.length > 0 && (
          <div className="log-section">
            <div className="lab">Card swiped</div>
            <div className="card-picker">
              {ranked.slice(0, 3).map(({ card, rate }) => {
                const isBest = card.id === bestId;
                const isSel = selected?.card.id === card.id;
                return (
                  <button
                    key={card.id}
                    className={`card-tile ${isSel ? 'selected' : ''} ${isBest ? 'best' : ''}`}
                    onClick={() => setChosen({ card, rate })}
                  >
                    <span className={`brand-swatch ${brandKey(card)}`} />
                    <div className="cn">{card.name.split(' ').slice(-2).join(' ')}</div>
                    <div className="rt">{rate}×</div>
                    {isBest && <span className="best-badge">BEST</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className={`live-calc ${optimal ? 'ok' : 'meh'}`}>
          <span className="ic">{optimal ? '✦' : '⚠︎'}</span>
          <div className="text">
            <b>{optimal ? 'Optimal swipe.' : 'Could be better.'}</b>{' '}
            Earning <b className="amt">+${earned.toFixed(2)}</b> on this ${numAmt.toFixed(2)}.
            {!optimal && couldHave > earned && (
              <> <span className="dim">({ranked[0].card.name.split(' ').slice(-2).join(' ')} would earn +${couldHave.toFixed(2)})</span></>
            )}
          </div>
        </div>

        <button className="btn" onClick={submit} disabled={busy || !selected || numAmt <= 0}>
          {busy ? 'Logging…' : 'Log swipe · keep streak'}
        </button>
      </div>
    </div>
  );
}

function brandKey(card) {
  if (!card) return 'amex';
  const id = card.id || '';
  if (id.startsWith('amex_')) return 'amex';
  if (id.startsWith('chase_')) return 'chase';
  if (id.startsWith('capone_')) return 'capone';
  if (id.startsWith('citi_')) return 'citi';
  if (id.startsWith('discover_')) return 'discover';
  return 'amex';
}
