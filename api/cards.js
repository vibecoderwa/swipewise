import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cardsPath = join(__dirname, '..', 'data', 'cards.json');
export const CARDS = JSON.parse(readFileSync(cardsPath, 'utf-8'));

const CATEGORY_MAP = {
  'FOOD_AND_DRINK_GROCERIES': 'groceries',
  'FOOD_AND_DRINK_RESTAURANT': 'dining',
  'FOOD_AND_DRINK_FAST_FOOD': 'dining',
  'FOOD_AND_DRINK_COFFEE': 'dining',
  'TRANSPORTATION_GAS': 'gas',
  'TRAVEL_FLIGHTS': 'travel',
  'TRAVEL_LODGING': 'travel',
  'TRAVEL_RENTAL_CARS': 'travel',
  'TRAVEL_PUBLIC_TRANSIT': 'travel',
  'TRAVEL_TAXIS_AND_RIDE_SHARES': 'travel',
  'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES': 'online_shopping',
  'ENTERTAINMENT_TV_AND_MOVIES': 'streaming',
};

export function categoryFromPlaid(pfcDetailed, pfcPrimary) {
  if (pfcDetailed && CATEGORY_MAP[pfcDetailed]) return CATEGORY_MAP[pfcDetailed];
  if (pfcPrimary === 'FOOD_AND_DRINK') return 'dining';
  if (pfcPrimary === 'TRAVEL') return 'travel';
  if (pfcPrimary === 'TRANSPORTATION') return 'gas';
  return 'other';
}

export function rewardRate(card, category) {
  const rules = card.rewards || {};
  return rules[category] ?? rules.other ?? 1.0;
}

export function bestCardFor(category, userCards) {
  let best = null;
  for (const card of userCards) {
    const rate = rewardRate(card, category);
    if (!best || rate > best.rate) {
      best = { card, rate };
    }
  }
  return best;
}

export function matchCardFromAccount(account) {
  const text = `${account.name || ''} ${account.official_name || ''}`.toLowerCase();
  let best = null;
  for (const card of CARDS) {
    for (const keyword of card.match_keywords || []) {
      if (text.includes(keyword.toLowerCase())) {
        const score = keyword.length;
        if (!best || score > best.score) {
          best = { card, score };
        }
      }
    }
  }
  return best?.card || null;
}
