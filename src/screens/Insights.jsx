// Insights — formerly Analytics. Adds the streak/YTD hero up top so the
// numbers from the home strip get a proper detail view, and keeps the
// existing missed-rewards / recommendations content below.
import { useState } from 'react';
import ScreenHeader from '../components/ScreenHeader.jsx';
import Folio from '../components/Folio.jsx';
import Recommendations from '../components/Recommendations.jsx';

const CATEGORY_LABELS = {
  groceries: 'Groceries', dining: 'Dining', gas: 'Gas',
  travel: 'Travel', online_shopping: 'Online', streaming: 'Streaming',
  other: 'Everything else',
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

export default function InsightsScreen({ insights, recommendations, cards, streak }) {
  const [period, setPeriod] = useState('YTD');
  if (!insights) return <div className="screen"><div className="loading">Loading…</div></div>;
  const { transactions, total_missed_rewards, user_cards } = insights;

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

  return (
    <div className="screen">
      <ScreenHeader eyebrow={`Insights · ${period}`} title="Insights" right={<Folio n={8} />} />

      {/* Streak + YTD hero — same chips as Home, displayed bigger */}
      <div className="home-stats" style={{ marginBottom: 20 }}>
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
            <div className="label">{ytdYear} · earned via swipewise</div>
          </div>
        </div>
      </div>

      <div className="pill-row" style={{ marginBottom: 16 }}>
        {['Month', 'YTD', 'Last 12mo'].map(p => (
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

      {/* Recent transactions */}
      {transactions.length > 0 && (
        <div className="card">
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
