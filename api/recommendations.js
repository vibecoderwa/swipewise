import { CARDS, categoryFromPlaid, rewardRate } from './cards.js';

const CATEGORIES = ['groceries', 'dining', 'gas', 'travel', 'online_shopping', 'streaming', 'other'];

const CATEGORY_LABELS = {
  groceries: 'groceries',
  dining: 'dining',
  gas: 'gas',
  travel: 'travel',
  online_shopping: 'online shopping',
  streaming: 'streaming',
  other: 'everyday spending',
};

export function recommendCards({ transactions, ownedCardIds, days = 30 }) {
  const annualByCategory = {};
  for (const c of CATEGORIES) annualByCategory[c] = 0;

  let txCount = 0;
  for (const t of transactions) {
    if (!t || t.amount == null || t.amount <= 0) continue;
    const cat = categoryFromPlaid(t.pfc_detailed, t.pfc_primary);
    annualByCategory[cat] = (annualByCategory[cat] || 0) + t.amount;
    txCount++;
  }

  const annualFactor = days > 0 ? 365 / days : 12;
  for (const c of CATEGORIES) annualByCategory[c] *= annualFactor;
  const totalAnnualSpend = CATEGORIES.reduce((s, c) => s + annualByCategory[c], 0);

  const ownedSet = new Set(ownedCardIds);
  const ownedCards = CARDS.filter(c => ownedSet.has(c.id));

  const baseRate = {};
  for (const cat of CATEGORIES) {
    let best = ownedCards.length ? 0 : 1;
    for (const c of ownedCards) {
      const r = rewardRate(c, cat);
      if (r > best) best = r;
    }
    baseRate[cat] = best;
  }

  const candidates = CARDS.filter(c => !ownedSet.has(c.id));

  const recs = candidates.map(card => {
    let extraRewards = 0;
    const breakdown = [];
    for (const cat of CATEGORIES) {
      const newRate = rewardRate(card, cat);
      const oldRate = baseRate[cat];
      if (newRate > oldRate) {
        const extra = annualByCategory[cat] * (newRate - oldRate) / 100;
        if (extra > 0) {
          extraRewards += extra;
          breakdown.push({
            category: cat,
            label: CATEGORY_LABELS[cat],
            annual_spend: Number(annualByCategory[cat].toFixed(2)),
            extra_rewards: Number(extra.toFixed(2)),
            new_rate: newRate,
            old_rate: oldRate,
          });
        }
      }
    }
    breakdown.sort((a, b) => b.extra_rewards - a.extra_rewards);

    const annualFee = card.annual_fee || 0;
    const netExtra = extraRewards - annualFee;

    let headline = null;
    if (breakdown[0]) {
      const top = breakdown[0];
      headline = `${top.new_rate}% on ${top.label} — your ${shareTier(top.annual_spend, totalAnnualSpend)} category`;
    }

    return {
      card_id: card.id,
      card_name: card.name,
      issuer: card.issuer,
      annual_fee: annualFee,
      annual_extra_rewards: Number(extraRewards.toFixed(2)),
      net_value: Number(netExtra.toFixed(2)),
      headline,
      top_categories: breakdown.slice(0, 3),
    };
  });

  const ranked = recs
    .filter(r => r.net_value > 5)
    .sort((a, b) => b.net_value - a.net_value)
    .slice(0, 5);

  // Confidence per FR-ENG-06: gap between #1 and #2 net_value, normalized.
  for (let i = 0; i < ranked.length; i++) {
    const me = ranked[i];
    const next = ranked[i + 1];
    if (!next) {
      me.confidence = 'high';
      continue;
    }
    const gap = me.net_value - next.net_value;
    const ratio = gap / Math.max(1, next.net_value);
    me.confidence = ratio > 0.5 ? 'high' : ratio > 0.15 ? 'medium' : 'low';
  }

  const sufficient = txCount >= 5 && totalAnnualSpend > 0;

  return {
    sufficient_data: sufficient,
    transaction_count: txCount,
    days_of_data: days,
    annual_spend_by_category: Object.fromEntries(
      CATEGORIES.map(c => [c, Number(annualByCategory[c].toFixed(2))])
    ),
    total_annual_spend: Number(totalAnnualSpend.toFixed(2)),
    recommendations: ranked,
  };
}

function shareTier(catSpend, totalSpend) {
  if (totalSpend <= 0) return 'top';
  const pct = catSpend / totalSpend;
  if (pct >= 0.3) return 'biggest';
  if (pct >= 0.15) return 'top';
  return 'growing';
}
