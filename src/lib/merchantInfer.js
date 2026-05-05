const MERCHANT_HINTS = {
  groceries: [
    'whole foods', 'trader joe', 'safeway', 'kroger', 'wegmans', 'aldi', 'publix', 'costco',
    'sam\'s club', 'sams club', 'walmart', 'target', 'h-e-b', 'heb', 'sprouts', 'food lion',
    'giant', 'meijer', 'stop & shop', 'fairway', 'bjs', 'whole',
  ],
  dining: [
    'mcdonald', 'starbucks', 'chipotle', 'taco bell', 'subway', 'kfc', 'burger king', 'panera',
    'wendy', 'sweetgreen', 'shake shack', 'dominos', 'pizza', 'restaurant', 'cafe', 'coffee',
    'dunkin', 'chick-fil-a', 'chick fil a', 'in-n-out', 'in n out', 'five guys', 'cava',
    'sushi', 'thai', 'ramen', 'tacos', 'bistro', 'grill', 'kitchen', 'eatery',
  ],
  gas: [
    'shell', 'exxon', 'chevron', 'bp', 'mobil', 'sunoco', 'arco', 'gas station', '76',
    'speedway', 'wawa', 'sheetz', 'circle k', 'phillips 66', 'valero', 'marathon', 'racetrac',
  ],
  travel: [
    'delta', 'united', 'american airlines', 'southwest', 'jetblue', 'alaska airlines',
    'spirit airlines', 'frontier', 'lufthansa', 'air france', 'british airways', 'emirates',
    'marriott', 'hilton', 'hyatt', 'ihg', 'holiday inn', 'sheraton', 'westin', 'st regis',
    'four seasons', 'ritz-carlton', 'ritz carlton', 'airbnb', 'vrbo', 'expedia', 'booking',
    'kayak', 'priceline', 'orbitz', 'tripadvisor', 'lyft', 'uber', 'taxi', 'amtrak',
  ],
  online_shopping: [
    'amazon', 'ebay', 'etsy', 'shopify', 'walmart.com', 'target.com', 'asos', 'shein', 'temu',
    'aliexpress', 'rakuten',
  ],
  streaming: [
    'netflix', 'spotify', 'hulu', 'disney+', 'disney plus', 'youtube premium', 'apple tv',
    'apple music', 'paramount', 'peacock', 'hbo', 'max', 'tidal', 'audible',
  ],
};

const PRETTY = {
  groceries: 'Groceries',
  dining: 'Dining',
  gas: 'Gas',
  travel: 'Travel',
  online_shopping: 'Online shopping',
  streaming: 'Streaming',
  other: 'Everyday spending',
};

export function inferCategory(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return null;
  for (const [cat, names] of Object.entries(MERCHANT_HINTS)) {
    if (names.some(n => q.includes(n) || n.includes(q))) return cat;
  }
  return 'other';
}

export function categoryLabel(cat) {
  return PRETTY[cat] || cat;
}

export function bestCardFor(category, userCards) {
  let best = null;
  for (const card of userCards) {
    const rate = card.rewards?.[category] ?? card.rewards?.other ?? 1;
    if (!best || rate > best.rate) best = { card, rate };
  }
  return best;
}

export const QUICK_MERCHANTS = [
  'Whole Foods', 'Trader Joe\'s', 'Costco',
  'Shell', 'Chipotle', 'Starbucks',
  'Delta', 'Marriott', 'Amazon',
  'Netflix',
];
