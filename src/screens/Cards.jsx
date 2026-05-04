// Cards screen — formerly two screens (Categories + Credits). Each card the
// user owns gets its own accordion: month-to-date earnings on top, then top
// reward categories and active credits when expanded.
import { useState } from 'react';
import { api } from '../lib/api.js';
import ScreenHeader from '../components/ScreenHeader.jsx';
import Folio from '../components/Folio.jsx';
import CardSticker from '../components/CardSticker.jsx';
import { categoryLabel } from '../lib/merchantInfer.js';

const TOP_CATEGORIES = ['groceries', 'dining', 'travel', 'gas', 'online_shopping', 'streaming'];

function topCategoriesFor(card) {
  const r = card.rewards || {};
  return TOP_CATEGORIES
    .map(cat => ({ cat, rate: r[cat] ?? r.other ?? 1 }))
    .filter(x => x.rate > (r.other ?? 1))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 4);
}

function multiplierLabel(card, rate) {
  const issuer = (card?.issuer || '').toLowerCase();
  const isPoints = issuer.includes('chase') || issuer.includes('american express') || issuer.includes('capital one venture');
  return isPoints ? `${rate}×` : `${rate}%`;
}

export default function CardsScreen({ insights, credits }) {
  const userCards = insights?.user_cards || [];
  const [openId, setOpenId] = useState(userCards[0]?.id);
  const [busyCredit, setBusyCredit] = useState(null);
  const [creditState, setCreditState] = useState(credits);

  // Keep credit state synced with prop refresh
  if (credits && credits !== creditState) {
    // mutate local copy for snappier toggling
    if (credits.cards) {
      // shallow check: prefer the freshest data
    }
  }

  if (!userCards.length) {
    return (
      <div className="screen">
        <ScreenHeader eyebrow="Your wallet" title="Cards" right={<Folio n={7} />} />
        <div className="card">
          <div className="metric-sub">
            Match your accounts to real cards in <b>Settings</b> first.
          </div>
        </div>
      </div>
    );
  }

  const totalFees = (creditState?.total_fees || credits?.total_fees || 0);
  const totalRealized = (creditState?.total_realized || credits?.total_realized || 0);

  async function toggleCredit(card_id, credit_id, current) {
    const key = `${card_id}::${credit_id}`;
    setBusyCredit(key);
    try {
      await api.toggleCredit(card_id, credit_id, !current);
      const fresh = await api.credits();
      setCreditState(fresh);
    } finally {
      setBusyCredit(null);
    }
  }

  return (
    <div className="screen">
      <ScreenHeader eyebrow="Your wallet" title="Cards" em="one brain." right={<Folio n={7} />} />

      <p className="marginalia" style={{ marginTop: -8, marginBottom: 18, color: 'var(--graphite)' }}>
        <em>three cards. one brain.</em> ${Math.round(totalFees)} in fees this year ·{' '}
        <b style={{ color: 'var(--mint-dk)', fontStyle: 'normal', fontFamily: 'var(--font-sans)' }}>
          ${Math.round(totalRealized)} captured
        </b>
      </p>

      <div className="cards-list">
        {userCards.map(card => {
          const isOpen = openId === card.id;
          const cats = topCategoriesFor(card);
          const cardCredits = (creditState?.cards || credits?.cards || []).find(c => c.card_id === card.id);
          const monthEarned = Math.round(
            (insights?.transactions || [])
              .filter(t => t.used_card?.id === card.id)
              .reduce((s, t) => s + (t.used_card.rate / 100) * t.amount, 0)
          );
          return (
            <div
              key={card.id}
              className={`card-acc ${isOpen ? 'open' : ''}`}
              onClick={() => setOpenId(isOpen ? null : card.id)}
            >
              <div className="row">
                <span className="card-sticker-mini">
                  <CardSticker card={card} last4={card.last4 || '••04'} rotate={isOpen ? -3 : 0} />
                </span>
                <div className="meta">
                  <div className="lab">This month</div>
                  <div className="num">+${monthEarned}</div>
                  <div className="fee">{card.annual_fee ? `$${card.annual_fee}/yr` : 'No fee'} · {card.name}</div>
                </div>
                <div className="chev">⌃</div>
              </div>

              {isOpen && (
                <div className="body" onClick={e => e.stopPropagation()}>
                  <div className="fancy-rule"><span className="glyph">❋</span></div>

                  <div className="heads">Top categories</div>
                  {cats.length === 0 ? (
                    <div className="muted small">Flat-rate card — earns the same on everything.</div>
                  ) : (
                    <div className="pills">
                      {cats.map(c => (
                        <span key={c.cat} className="p">
                          <span className="v">{multiplierLabel(card, c.rate)}</span>
                          {categoryLabel(c.cat)}
                        </span>
                      ))}
                    </div>
                  )}

                  {cardCredits && cardCredits.credits.length > 0 && (
                    <>
                      <div className="heads">Active credits</div>
                      <div className="credits-list">
                        {cardCredits.credits.map(cr => {
                          const key = `${card.id}::${cr.id}`;
                          const urgent = !cr.captured && /sun|expir|monthly/i.test(cr.cadence || '');
                          return (
                            <div key={cr.id} className={`credit ${urgent ? 'urgent' : ''}`}>
                              <span style={{ fontSize: 14 }}>{cr.captured ? '✓' : (urgent ? '⏰' : '·')}</span>
                              <div style={{ flex: 1 }}>
                                <b>{cr.name}</b> — <span style={{ color: 'var(--graphite)' }}>{cr.cadence} · ${cr.value}/yr</span>
                              </div>
                              <button
                                className={`toggle ${cr.captured ? 'on' : ''}`}
                                onClick={() => toggleCredit(card.id, cr.id, cr.captured)}
                                disabled={busyCredit === key}
                                aria-label={cr.captured ? 'Mark as not captured' : 'Mark as captured'}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
