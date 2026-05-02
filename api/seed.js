// Synthetic seeder — populates a freshly-onboarded user with plausible past
// swipe events + a few pending unposted swipes, so the demo doesn't start
// with all zeros. Idempotent: skipped after the first call per user.

import crypto from 'crypto';
import { db, isoYearWeek, setPrefs, getPrefs } from './db.js';
import { CARDS, rewardRate } from './cards.js';

const SEED_MERCHANTS = [
  { merchant: 'Whole Foods',     location: 'Embarcadero', category: 'groceries', basket: 92 },
  { merchant: "Trader Joe's",    location: 'Castro',      category: 'groceries', basket: 64 },
  { merchant: 'Blue Bottle',     location: 'Hayes Valley',category: 'dining',    basket: 7 },
  { merchant: 'Tartine',         location: '18th',        category: 'dining',    basket: 18 },
  { merchant: 'Chipotle',        location: 'SoMa',        category: 'dining',    basket: 14 },
  { merchant: 'Shell',           location: 'Mission',     category: 'gas',       basket: 48 },
  { merchant: 'Delta',           location: 'SFO T2',      category: 'travel',    basket: 412 },
  { merchant: 'Uber',            location: 'Marina',      category: 'travel',    basket: 22 },
  { merchant: 'Amazon',          location: 'online',      category: 'online_shopping', basket: 56 },
  { merchant: 'Bi-Rite',         location: 'Mission',     category: 'groceries', basket: 41 },
];

function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }

// Cheap deterministic PRNG so two seeds for the same user produce same stream.
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function bestCard(category, userCards) {
  let best = null;
  for (const c of userCards) {
    const r = rewardRate(c, category);
    if (!best || r > best.rate) best = { card: c, rate: r };
  }
  return best;
}

// Seed ~13 weeks of past activity, 1–4 swipes per week. Distribution is
// front-loaded to give a believable streak count (e.g. 12 weeks).
export function seedSyntheticHistory(userId, userCards) {
  const prefs = getPrefs(userId);
  if (prefs.seeded) return { seeded: false, reason: 'already-seeded' };
  if (!userCards.length) return { seeded: false, reason: 'no-cards' };

  const seedNum = [...userId].reduce((s, c) => s + c.charCodeAt(0), 0);
  const rnd = mulberry32(seedNum);

  const ins = db.prepare(`
    INSERT INTO swipe_events
    (id, user_id, card_id, merchant, location, category, rate, basket, reward, created_at, iso_year, iso_week)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const events = [];

  // 12 consecutive past weeks (skip the most recent — keeps it interesting),
  // plus this week. → streak = 13.
  for (let w = 12; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setUTCDate(weekStart.getUTCDate() - w * 7);
    const swipesThisWeek = 1 + Math.floor(rnd() * 4);
    for (let i = 0; i < swipesThisWeek; i++) {
      const m = pick(SEED_MERCHANTS, rnd);
      const best = bestCard(m.category, userCards);
      if (!best) continue;
      const t = new Date(weekStart);
      t.setUTCDate(t.getUTCDate() - Math.floor(rnd() * 6));
      t.setUTCHours(10 + Math.floor(rnd() * 11), Math.floor(rnd() * 60), 0, 0);
      // Reward in dollars, points cards valued at ~1.5¢/pt
      const cppCash = 0.01;
      const reward = best.rate * m.basket * cppCash;
      const { year, week } = isoYearWeek(t);
      events.push({
        id: crypto.randomUUID(),
        card_id: best.card.id,
        merchant: m.merchant,
        location: m.location,
        category: m.category,
        rate: best.rate,
        basket: m.basket,
        reward: +reward.toFixed(2),
        created_at: t.getTime(),
        iso_year: year, iso_week: week,
      });
    }
  }

  const tx = db.transaction((rows) => {
    for (const e of rows) {
      ins.run(e.id, userId, e.card_id, e.merchant, e.location, e.category,
              e.rate, e.basket, e.reward, e.created_at, e.iso_year, e.iso_week);
    }
  });
  tx(events);

  // Seed a couple of pending swipes — auto-suggest cards in the feed.
  const pendIns = db.prepare(`
    INSERT INTO pending_swipes
    (id, user_id, swipe_id, card_id, merchant, location, category, rate, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const recent = events.slice(-2);
  for (const e of recent) {
    pendIns.run(crypto.randomUUID(), userId, e.id, e.card_id,
                e.merchant, e.location, e.category, e.rate, e.created_at);
  }

  setPrefs(userId, { seeded: true });
  return { seeded: true, events: events.length };
}

// Friend posts — pure fixture, not user-specific. The Friends/Feed screen
// renders these alongside the user's own feed_posts.
export const FRIENDS = [
  { id: 'alex',  name: 'Alex W.',  init: 'A', tone: 'sky'   },
  { id: 'jamie', name: 'Jamie P.', init: 'J', tone: 'mint'  },
  { id: 'sam',   name: 'Sam C.',   init: 'S', tone: 'coral' },
  { id: 'riya',  name: 'Riya P.',  init: 'R', tone: 'lemon' },
];

export const FRIEND_POSTS = [
  {
    id: 'alex-delta', user_id: 'alex', user_name: 'Alex W.', avatar_init: 'A', avatar_tone: 'sky',
    card_id: 'chase_sapphire_reserve', merchant: 'Delta', location: 'SFO T2',
    category: 'travel', rate: 5, emoji: '✈︎', caption: 'redeye to JFK',
    tagged: [], hours_ago: 1, likes: 12, comments: 2,
  },
  {
    id: 'jamie-tartine', user_id: 'jamie', user_name: 'Jamie P.', avatar_init: 'J', avatar_tone: 'mint',
    card_id: 'capone_savor', merchant: 'Tartine', location: '18th',
    category: 'dining', rate: 4, emoji: '🥐', caption: 'morning fuel',
    tagged: ['sam'], hours_ago: 3, likes: 8, comments: 1,
  },
  {
    id: 'sam-wf', user_id: 'sam', user_name: 'Sam C.', avatar_init: 'S', avatar_tone: 'coral',
    card_id: 'amex_gold', merchant: 'Whole Foods', location: 'Embarcadero',
    category: 'groceries', rate: 4, emoji: null, caption: null,
    tagged: [], hours_ago: 5, likes: 2, comments: 0,
  },
  {
    id: 'riya-drisco', user_id: 'riya', user_name: 'Riya P.', avatar_init: 'R', avatar_tone: 'lemon',
    card_id: 'chase_sapphire_reserve', merchant: 'Hotel Drisco', location: 'Pac Heights',
    category: 'travel', rate: 3, emoji: '🛏', caption: 'anniversary stay',
    tagged: ['alex'], hours_ago: 26, likes: 23, comments: 4,
  },
];
