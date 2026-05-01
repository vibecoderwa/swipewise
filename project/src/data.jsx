// Data model — Amex Gold vs Chase Sapphire Reserve vs Capital One Savor
// Balanced spender persona: ~$5,200/month

const CATEGORIES = [
  { id: 'dining',      name: 'Dining & Restaurants', txns: 18, monthly: 640, icon: 'dining' },
  { id: 'groceries',   name: 'US Supermarkets',      txns: 11, monthly: 720, icon: 'grocery' },
  { id: 'flights',     name: 'Flights',              txns: 1,  monthly: 310, icon: 'flight' },
  { id: 'hotels',      name: 'Hotels & Lodging',     txns: 1,  monthly: 240, icon: 'hotel' },
  { id: 'travel',      name: 'Travel (other)',       txns: 3,  monthly: 180, icon: 'travel' },
  { id: 'rideshare',   name: 'Rideshare & Taxi',     txns: 7,  monthly: 140, icon: 'rideshare' },
  { id: 'gas',         name: 'Gas',                  txns: 4,  monthly: 180, icon: 'gas' },
  { id: 'transit',     name: 'Transit',              txns: 6,  monthly: 95,  icon: 'transit' },
  { id: 'streaming',   name: 'Streaming',            txns: 4,  monthly: 68,  icon: 'streaming' },
  { id: 'online',      name: 'Online Retail',        txns: 14, monthly: 540, icon: 'online' },
  { id: 'shopping',    name: 'Shopping (in-store)',  txns: 9,  monthly: 320, icon: 'shopping' },
  { id: 'utilities',   name: 'Utilities & Bills',    txns: 6,  monthly: 420, icon: 'utilities' },
  { id: 'health',      name: 'Health & Wellness',    txns: 3,  monthly: 180, icon: 'health' },
  { id: 'entertainment', name: 'Entertainment',      txns: 5,  monthly: 160, icon: 'entertainment' },
  { id: 'other',       name: 'Other',                txns: 8,  monthly: 220, icon: 'other' },
];

const CARDS = [
  { id: 'gold', name: 'Amex Gold',        issuer: 'American Express', currency: 'MR pts', pointsLabel: 'pts' },
  { id: 'csr',  name: 'Sapphire Reserve', issuer: 'Chase',            currency: 'UR pts', pointsLabel: 'pts' },
  { id: 'savor',name: 'Capital One Savor',issuer: 'Capital One',      currency: 'cash',   pointsLabel: '¢', isCashback: true },
];

// Multipliers (points-per-dollar OR cashback %; for Savor we store the % directly and treat as 1¢/unit)
// Amex Gold: 4x dining, 4x US grocery, 3x flights direct, 1x other
// CSR (2025+): 8x Chase Travel portal, 4x flights/hotels direct, 3x dining, 1x other
// Savor: 4% dining/entertainment/streaming, 3% groceries (ex-Walmart/Target), 1% other. No annual fee ($0).
const MULTIPLIERS = {
  gold: {
    dining: 4, groceries: 4, flights: 3, hotels: 1, travel: 1,
    rideshare: 1, gas: 1, transit: 1, streaming: 1,
    online: 1, shopping: 1, utilities: 1, health: 1, entertainment: 1, other: 1,
  },
  csr: {
    dining: 3, groceries: 1, flights: 4, hotels: 4, travel: 8,
    rideshare: 1, gas: 1, transit: 1, streaming: 1,
    online: 1, shopping: 1, utilities: 1, health: 1, entertainment: 1, other: 1,
  },
  savor: {
    dining: 4, groceries: 3, flights: 1, hotels: 1, travel: 1,
    rideshare: 1, gas: 1, transit: 1, streaming: 4,
    online: 1, shopping: 1, utilities: 1, health: 1, entertainment: 4, other: 1,
  },
};

// Statement credits (annual value if fully used)
const CREDITS = {
  gold: [
    { id: 'dining',   name: 'Dining Credit (Resy, Grubhub, etc.)', annual: 120, cadence: '$10 monthly', note: 'US-only partners; limited abroad.' },
    { id: 'uber',     name: 'Uber Cash',                            annual: 120, cadence: '$10 monthly', note: 'US Uber & Uber Eats only.' },
    { id: 'resy',     name: 'Resy Credit',                          annual: 100, cadence: '$50 semi-annual', note: 'US Resy restaurants.' },
    { id: 'dunkin',   name: 'Dunkin\u2019 Credit',                  annual: 84,  cadence: '$7 monthly', note: 'US Dunkin\u2019 locations.' },
  ],
  csr: [
    { id: 'travel',   name: 'Annual Travel Credit',                 annual: 300, cadence: 'Statement credit', durable: true,
      note: 'Auto-applied to ANY travel purchase worldwide — flights, trains, metros, tolls, parking, rideshare, taxis, hotels, cruises, tours.' },
    { id: 'dining',   name: 'Exclusive Tables Dining Credit',       annual: 300, cadence: '$150 semi-annual', note: 'Select Sapphire Reserve partner restaurants.' },
    { id: 'stubhub',  name: 'StubHub / Viagogo Credit',             annual: 300, cadence: '$150 semi-annual', note: 'Global event tickets.' },
    { id: 'hotel',    name: 'The Edit Hotel Credit',                annual: 500, cadence: 'Via portal', note: 'Luxury hotel portfolio (global).' },
    { id: 'apple',    name: 'Apple TV+ & Apple Music',              annual: 250, cadence: 'Monthly', note: 'Global digital subscription.' },
    { id: 'lyft',     name: 'Lyft Credit (in-app)',                 annual: 120, cadence: '$10 monthly', note: 'US/Canada Lyft only.' },
    { id: 'doordash', name: 'DoorDash DashPass + Credits',          annual: 300, cadence: 'Mixed monthly', note: 'US/select markets.' },
    { id: 'priority', name: 'Priority Pass & Sapphire Lounge',      annual: 469, cadence: 'Amortized', note: 'Worldwide airport lounges.' },
  ],
  savor: [], // No annual credits. It's a $0-fee cashback card.
};

const DEFAULT_FEES = { gold: 325, csr: 795, savor: 0 };
// cents-per-unit: MR ~2¢, UR ~2.05¢, cashback = 1¢ exact
const DEFAULT_CPP = { gold: 2.0, csr: 2.05, savor: 1.0 };

const MONTHS = ['May \u201925','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan \u201926','Feb','Mar','Apr'];
const SEASONAL = {
  dining:    [1.05, 1.10, 1.12, 1.08, 1.00, 0.98, 1.06, 1.20, 0.90, 0.92, 0.95, 1.00],
  groceries: [1.00, 1.02, 1.04, 1.02, 1.00, 1.02, 1.10, 1.18, 0.96, 0.95, 0.94, 0.98],
  flights:   [1.40, 1.80, 1.20, 0.60, 0.80, 0.90, 2.20, 2.40, 0.40, 0.50, 0.60, 1.00],
  hotels:    [1.30, 1.60, 1.40, 0.80, 0.70, 0.80, 1.60, 1.80, 0.50, 0.60, 0.70, 1.00],
  travel:    [1.20, 1.40, 1.20, 0.80, 0.80, 0.90, 1.30, 1.40, 0.70, 0.80, 0.90, 1.10],
  rideshare: [1.00, 1.10, 1.05, 0.95, 0.98, 1.02, 1.10, 1.20, 0.90, 0.92, 0.95, 1.00],
  gas:       [1.00, 1.10, 1.10, 1.00, 0.95, 0.95, 1.00, 1.05, 0.95, 0.95, 0.95, 1.00],
  transit:   [1.00, 1.00, 0.95, 0.95, 1.00, 1.00, 1.00, 0.90, 1.00, 1.00, 1.00, 1.00],
  streaming: [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
  online:    [0.95, 0.95, 0.95, 1.00, 1.00, 1.05, 1.30, 1.50, 0.85, 0.90, 0.95, 1.00],
  shopping:  [1.00, 1.00, 0.95, 1.00, 1.00, 1.05, 1.20, 1.40, 0.85, 0.90, 0.95, 1.00],
  utilities: [1.00, 1.05, 1.10, 1.05, 1.00, 0.95, 1.00, 1.05, 1.05, 1.00, 0.98, 0.95],
  health:    [1.00, 0.95, 0.95, 1.00, 1.05, 1.05, 1.00, 0.95, 1.10, 1.05, 1.00, 1.00],
  entertainment: [1.10, 1.15, 1.20, 1.10, 1.00, 0.95, 1.00, 1.30, 0.85, 0.90, 0.95, 1.00],
  other:     [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.05, 1.10, 0.95, 0.98, 1.00, 1.00],
};

// Card-level colors
const CARD_COLORS = {
  gold:  { main: 'var(--gold)',  wash: 'var(--gold-wash)',  ink: 'var(--gold-ink)' },
  csr:   { main: 'var(--csr)',   wash: 'var(--csr-wash)',   ink: 'var(--csr-ink)' },
  savor: { main: 'var(--savor)', wash: 'var(--savor-wash)', ink: 'var(--savor-ink)' },
};

function computeAll(state) {
  const { spend, fees, cpp, creditsUsed } = state;

  const rows = CATEGORIES.map(cat => {
    const monthlySpend = spend[cat.id];
    const annualSpend = monthlySpend * 12;
    const per = {};
    CARDS.forEach(card => {
      const mult = MULTIPLIERS[card.id][cat.id];
      const pts = annualSpend * mult;
      const val = pts * (cpp[card.id] / 100);
      per[card.id] = { mult, pts, val };
    });
    // Find winner
    let winner = null, topVal = -Infinity, secondVal = -Infinity;
    CARDS.forEach(card => {
      const v = per[card.id].val;
      if (v > topVal) { secondVal = topVal; topVal = v; winner = card.id; }
      else if (v > secondVal) { secondVal = v; }
    });
    return { ...cat, monthlySpend, annualSpend, per, winner, delta: topVal - secondVal };
  });

  const totalSpendAnnual = rows.reduce((s,r)=>s+r.annualSpend,0);
  const totalSpendMonthly = rows.reduce((s,r)=>s+r.monthlySpend,0);

  const cards = {};
  CARDS.forEach(card => {
    const pts = rows.reduce((s,r)=>s+r.per[card.id].pts, 0);
    const rewards = rows.reduce((s,r)=>s+r.per[card.id].val, 0);
    const credits = (CREDITS[card.id] || []).reduce((s,c) =>
      s + (creditsUsed[card.id]?.[c.id] ? c.annual : 0), 0);
    const fee = fees[card.id];
    const net = rewards + credits - fee;
    cards[card.id] = { pts, rewards, credits, fee, net };
  });

  // Optimized: best-of-all-cards per category
  const optimizedRewards = rows.reduce((s,r) => s + Math.max(...CARDS.map(c => r.per[c.id].val)), 0);
  const totalCredits = CARDS.reduce((s,c) => s + cards[c.id].credits, 0);
  const totalFees = CARDS.reduce((s,c) => s + cards[c.id].fee, 0);
  const optimizedNet = optimizedRewards + totalCredits - totalFees;

  // Sorted ranking
  const ranking = [...CARDS].map(c => ({ ...c, net: cards[c.id].net })).sort((a,b) => b.net - a.net);

  return {
    rows, totalSpendAnnual, totalSpendMonthly,
    cards, ranking,
    optimizedRewards, optimizedNet,
    delta: ranking[0].net - ranking[1].net,
  };
}

function monthlyTimeline(state) {
  const { spend, cpp } = state;
  return MONTHS.map((m, i) => {
    const out = { m };
    CARDS.forEach(card => { out[card.id] = 0; });
    CATEGORIES.forEach(cat => {
      const s = spend[cat.id] * (SEASONAL[cat.id]?.[i] ?? 1);
      CARDS.forEach(card => {
        out[card.id] += s * MULTIPLIERS[card.id][cat.id] * (cpp[card.id] / 100);
      });
    });
    return out;
  });
}

Object.assign(window, { CATEGORIES, CARDS, MULTIPLIERS, CREDITS, DEFAULT_FEES, DEFAULT_CPP, MONTHS, SEASONAL, CARD_COLORS, computeAll, monthlyTimeline });
