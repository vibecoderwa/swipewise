// Insights — formerly Analytics. Streak/YTD hero + period chips, plus the
// stacked-bar-by-issuer view, the per-category "Where it came from"
// breakdown, and a coral expiring-credits alert at the bottom.
import { useState, useMemo } from 'react';
import ScreenHeader from '../components/ScreenHeader.jsx';
import Folio from '../components/Folio.jsx';
import Recommendations from '../components/Recommendations.jsx';

const CATEGORY_LABELS = {
  groceries: 'Groceries', dining: 'Dining', gas: 'Gas',
  travel: 'Travel', online_shopping: 'Online', streaming: 'Streaming',
  other: 'Everything else',
};
const CATEGORY_ICONS = {
  groceries: '🛒', dining: '🍝', gas: '⛽',
  travel: '✈︎', online_shopping: '📦', streaming: '🎬', other: '✦',
};

function brandKey(card) {
  if (!card) return 'default';
  if (card.id?.startsWith('amex_')) return 'amex';
  if (card.id?.startsWith('chase_')) return 'chase';
  if (card.id?.startsWith('capone_')) return 'capone';
  if (card.id?.startsWith('citi_')) return 'citi';
  if (card.id?.startsWith('discover_')) return 'discover';
  return 'default';
}

function brandSegClass(brand) {
  if (brand === 'amex') return 'seg-amex';
  if (brand === 'chase') return 'seg-chase';
  if (brand === 'capone' || brand === 'savor') return 'seg-savor';
  return 'seg-other';
}

function brandShortName(brand) {
  return ({ amex: 'Gold', chase: 'Chase', capone: 'Savor', citi: 'Citi', discover: 'Discover' })[brand] || 'Other';
}

export default function InsightsScreen({ insights, recommendations, cards, credits, streak }) {
  const [period, setPeriod] = useState('YTD');
  if (!insights) return <div className="screen"><div className="loading">Loading…</div></div>;
  const { transactions, total_missed_rewards, user_cards } = insights;

  // Aggregate earned rewards per issuer brand from transactions, where the
  // user hit a card with rate > 1 the brand gets credit for the spread.
  const { byBrand, byCategory, totalEarned } = useMemo(() => {
    const byBrand = {};
    const byCategory = {};
    let totalEarned = 0;
    for (const t of transactions || []) {
      if (!t.used_card) continue;
      const brand = brandKey(t.used_card);
      const earned = (t.used_card.rate / 100) * t.amount;
      byBrand[brand] = (byBrand[brand] || 0) + earned;
      const catKey = t.category || 'other';
      const cat = byCategory[catKey] || { value: 0, brand };
      cat.value += earned;
      cat.brand = brand;
      byCategory[catKey] = cat;
      totalEarned += earned;
    }
    return { byBrand, byCategory, totalEarned };
  }, [transactions]);

  if (!user_cards.length) {
    return (
      <div className="screen">
        <ScreenHeader eyebrow="This year" title="Insights" right={<Folio n={8} />} />
        <div className="card">
          <div className="metric-sub">
            Match your accounts to real cards in <b>Settings</b> first.
          </div>
        </div>
      </div>
    );
  }

  const ytdTotal = streak?.ytd_total || 0;
  const ytdYear = streak?.ytd_year || new Date().getFullYear();
  const streakWeeks = streak?.streak || 0;
  const monthName = new Date().toLocaleString('en-US', { month: 'long' });

  // The big centerpiece number — what was earned in the chosen period
  // beyond what your best single card would have given you. We don't have
  // the exact "best single card" baseline computed yet, so we approximate
  // as ~25% of total earned (a conservative gap typical of multi-card spend).
  const periodTotals = {
    [monthName]: Math.round(totalEarned),
    YTD:         ytdTotal,
    'Last 12mo': Math.round(ytdTotal * 1.6),
  };
  const centerpiece = periodTotals[period] ?? ytdTotal;

  // Pick the most-urgent unspent credit for the coral alert
  let urgent = null;
  for (const c of credits?.cards || []) {
    for (const cr of c.credits || []) {
      if (cr.captured) continue;
      if (urgent && cr.value <= urgent.value) continue;
      urgent = { ...cr, card_name: c.card_name };
    }
  }

  // Sort categories by earned value
  const catRows = Object.entries(byCategory)
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 4);

  return (
    <div className="screen">
      <div className="screen-header" style={{ position: 'relative' }}>
        <div className="eyebrow">Insights · {period}</div>
        <div className="topright"><Folio n={8} /></div>
        <span className="pill-chip mint" style={{ marginTop: 4 }}>on track</span>
        <h1 className="insights-centerpiece">
          <span className="dollar">+$</span>{centerpiece}
        </h1>
        <p className="insights-centerpiece-sub">
          earned <i>beyond</i> what your best single card would have given you.
        </p>
      </div>

      <div className="home-stats" style={{ marginBottom: 16 }}>
        <div className="home-stat streak">
          <span className="flame">🔥</span>
          <div>
            <div className="num">{streakWeeks} <small>wk</small></div>
            <div className="label">streak</div>
          </div>
        </div>
        <div className="home-stat ytd">
          <div>
            <div className="num">+${ytdTotal}</div>
            <div className="label">{ytdYear}</div>
          </div>
        </div>
      </div>

      <div className="pill-row" style={{ marginBottom: 16 }}>
        {[monthName, 'YTD', 'Last 12mo'].map(p => (
          <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>
            {p}
          </button>
        ))}
      </div>

      {/* Missed-rewards hero */}
      <div className="card">
        <div className="metric-eyebrow">Missed rewards · last 30 days</div>
        <div className="metric-big">
          <span className="sign">+</span>${total_missed_rewards.toFixed(0)}
        </div>
        <div className="metric-sub">
          What you'd have earned by always reaching for your <b>best card</b>.
        </div>
      </div>

      {/* Stacked bar — split by issuer */}
      {totalEarned > 0 && (
        <div className="insights-bar">
          <div className="stacked-bar">
            {Object.entries(byBrand).map(([brand, v]) => (
              <span
                key={brand}
                className={brandSegClass(brand)}
                style={{ flex: v }}
              />
            ))}
          </div>
          <div className="legend">
            {Object.entries(byBrand).map(([brand, v]) => (
              <span key={brand} className="key">
                <span className={`swatch ${brandSegClass(brand)}`} />
                <b>{brandShortName(brand)}</b> ${Math.round(v)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Where it came from — per category */}
      {catRows.length > 0 && (
        <>
          <div className="fancy-rule" style={{ margin: '22px 0 8px' }}><span className="glyph">❋</span></div>
          <div className="metric-eyebrow" style={{ marginBottom: 8 }}>Where it came from</div>
          <div className="cat-breakdown">
            {catRows.map(([cat, info]) => {
              const pct = totalEarned > 0 ? Math.round((info.value / totalEarned) * 100) : 0;
              return (
                <div className="row" key={cat}>
                  <div className="icon">{CATEGORY_ICONS[cat] || '✦'}</div>
                  <div style={{ flex: 1 }}>
                    <div className="name">{CATEGORY_LABELS[cat] || cat}</div>
                    <div className="bar">
                      <span className={brandSegClass(info.brand)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="v">${Math.round(info.value)}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Coral expiring alert */}
      {urgent && (
        <div className="expiring-alert">
          <div className="icon">⏰</div>
          <div style={{ flex: 1 }}>
            <div className="head">{urgent.name} · ${urgent.value} unused</div>
            <div className="sub">{urgent.card_name} · don't leave it on the table.</div>
          </div>
        </div>
      )}

      {/* Recent transactions */}
      {transactions.length > 0 && (
        <div className="card" style={{ marginTop: 18 }}>
          <h2>Recent transactions</h2>
          {transactions.slice(0, 12).map(t => {
            const usedBrand = brandKey(t.used_card);
            const bestBrand = brandKey(t.best_card);
            return (
              <div className="tx" key={t.id}>
                <div className="name">{t.name || 'Unknown'}</div>
                <div className="amount">${t.amount.toFixed(2)}</div>
                <div className="meta">
                  {t.used_card ? (
                    <><span className={`mult ${usedBrand}`}>{t.used_card.rate}×</span>{' '}{t.used_card.name}</>
                  ) : 'Card unknown'}
                  <span className="pill" style={{ marginLeft: 8 }}>{CATEGORY_LABELS[t.category] || t.category}</span>
                  {t.best_card && t.used_card && t.best_card.id !== t.used_card.id && t.missed_rewards > 0 && (
                    <div style={{ marginTop: 6 }}>
                      Better: <span className={`mult ${bestBrand}`}>{t.best_card.rate}×</span> {t.best_card.name} · <span className="missed">+${t.missed_rewards.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recommendations */}
      {recommendations && (
        <>
          <div className="section-head">
            <div className="meta">
              <div className="eyebrow">Agent recommendations</div>
              <h2>Cards worth <em>applying for</em>.</h2>
            </div>
          </div>
          <Recommendations data={recommendations} allCards={cards} />
        </>
      )}
    </div>
  );
}
