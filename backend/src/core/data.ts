export type CategoryId =
  | 'dining' | 'groceries' | 'flights' | 'hotels' | 'travel'
  | 'rideshare' | 'gas' | 'transit' | 'streaming' | 'online'
  | 'shopping' | 'utilities' | 'health' | 'entertainment' | 'other';

export type CardId = 'gold' | 'csr' | 'savor';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
}

export interface Card {
  id: CardId;
  name: string;
  issuer: string;
  currency: string;
  pointsLabel: string;
  isCashback?: boolean;
}

export interface Credit {
  id: string;
  name: string;
  annual: number;
  cadence: string;
  note?: string;
  durable?: boolean;
}

export const CATEGORIES: Category[] = [
  { id: 'dining',        name: 'Dining & Restaurants',  icon: 'dining' },
  { id: 'groceries',     name: 'US Supermarkets',        icon: 'grocery' },
  { id: 'flights',       name: 'Flights',                icon: 'flight' },
  { id: 'hotels',        name: 'Hotels & Lodging',       icon: 'hotel' },
  { id: 'travel',        name: 'Travel (other)',          icon: 'travel' },
  { id: 'rideshare',     name: 'Rideshare & Taxi',        icon: 'rideshare' },
  { id: 'gas',           name: 'Gas',                    icon: 'gas' },
  { id: 'transit',       name: 'Transit',                icon: 'transit' },
  { id: 'streaming',     name: 'Streaming',              icon: 'streaming' },
  { id: 'online',        name: 'Online Retail',          icon: 'online' },
  { id: 'shopping',      name: 'Shopping (in-store)',    icon: 'shopping' },
  { id: 'utilities',     name: 'Utilities & Bills',      icon: 'utilities' },
  { id: 'health',        name: 'Health & Wellness',      icon: 'health' },
  { id: 'entertainment', name: 'Entertainment',          icon: 'entertainment' },
  { id: 'other',         name: 'Other',                  icon: 'other' },
];

export const CARDS: Card[] = [
  { id: 'gold',  name: 'Amex Gold',         issuer: 'American Express', currency: 'MR pts',  pointsLabel: 'pts' },
  { id: 'csr',   name: 'Sapphire Reserve',  issuer: 'Chase',            currency: 'UR pts',  pointsLabel: 'pts' },
  { id: 'savor', name: 'Capital One Savor', issuer: 'Capital One',      currency: 'cash',    pointsLabel: '¢', isCashback: true },
];

export type MultiplierMap = Record<CategoryId, number>;

export const MULTIPLIERS: Record<CardId, MultiplierMap> = {
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

export const CREDITS: Record<CardId, Credit[]> = {
  gold: [
    { id: 'dining', name: 'Dining Credit (Resy, Grubhub, etc.)', annual: 120, cadence: '$10 monthly',       note: 'US-only partners.' },
    { id: 'uber',   name: 'Uber Cash',                           annual: 120, cadence: '$10 monthly',       note: 'US Uber & Uber Eats only.' },
    { id: 'resy',   name: 'Resy Credit',                         annual: 100, cadence: '$50 semi-annual',   note: 'US Resy restaurants.' },
    { id: 'dunkin', name: "Dunkin' Credit",                      annual:  84, cadence: '$7 monthly',        note: "US Dunkin' locations." },
  ],
  csr: [
    { id: 'travel',   name: 'Annual Travel Credit',              annual: 300,  cadence: 'Statement credit', durable: true,
      note: 'Auto-applied to ANY travel purchase worldwide — flights, trains, metros, tolls, parking, rideshare, hotels.' },
    { id: 'dining',   name: 'Exclusive Tables Dining Credit',    annual: 300,  cadence: '$150 semi-annual', note: 'Select Sapphire Reserve partner restaurants.' },
    { id: 'stubhub',  name: 'StubHub / Viagogo Credit',          annual: 300,  cadence: '$150 semi-annual', note: 'Global event tickets.' },
    { id: 'hotel',    name: 'The Edit Hotel Credit',             annual: 500,  cadence: 'Via portal',       note: 'Luxury hotel portfolio (global).' },
    { id: 'apple',    name: 'Apple TV+ & Apple Music',           annual: 250,  cadence: 'Monthly',          note: 'Global digital subscription.' },
    { id: 'lyft',     name: 'Lyft Credit',                       annual: 120,  cadence: '$10 monthly',      note: 'US/Canada Lyft only.' },
    { id: 'doordash', name: 'DoorDash DashPass + Credits',       annual: 300,  cadence: 'Mixed monthly',    note: 'US/select markets.' },
    { id: 'priority', name: 'Priority Pass & Sapphire Lounge',   annual: 469,  cadence: 'Amortized',        note: 'Worldwide airport lounges.' },
  ],
  savor: [],
};

export const DEFAULT_FEES: Record<CardId, number> = { gold: 325, csr: 795, savor: 0 };
export const DEFAULT_CPP: Record<CardId, number>  = { gold: 2.0, csr: 2.05, savor: 1.0 };

export const SEASONAL: Record<CategoryId, number[]> = {
  dining:        [1.05,1.10,1.12,1.08,1.00,0.98,1.06,1.20,0.90,0.92,0.95,1.00],
  groceries:     [1.00,1.02,1.04,1.02,1.00,1.02,1.10,1.18,0.96,0.95,0.94,0.98],
  flights:       [1.40,1.80,1.20,0.60,0.80,0.90,2.20,2.40,0.40,0.50,0.60,1.00],
  hotels:        [1.30,1.60,1.40,0.80,0.70,0.80,1.60,1.80,0.50,0.60,0.70,1.00],
  travel:        [1.20,1.40,1.20,0.80,0.80,0.90,1.30,1.40,0.70,0.80,0.90,1.10],
  rideshare:     [1.00,1.10,1.05,0.95,0.98,1.02,1.10,1.20,0.90,0.92,0.95,1.00],
  gas:           [1.00,1.10,1.10,1.00,0.95,0.95,1.00,1.05,0.95,0.95,0.95,1.00],
  transit:       [1.00,1.00,0.95,0.95,1.00,1.00,1.00,0.90,1.00,1.00,1.00,1.00],
  streaming:     [1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00,1.00],
  online:        [0.95,0.95,0.95,1.00,1.00,1.05,1.30,1.50,0.85,0.90,0.95,1.00],
  shopping:      [1.00,1.00,0.95,1.00,1.00,1.05,1.20,1.40,0.85,0.90,0.95,1.00],
  utilities:     [1.00,1.05,1.10,1.05,1.00,0.95,1.00,1.05,1.05,1.00,0.98,0.95],
  health:        [1.00,0.95,0.95,1.00,1.05,1.05,1.00,0.95,1.10,1.05,1.00,1.00],
  entertainment: [1.10,1.15,1.20,1.10,1.00,0.95,1.00,1.30,0.85,0.90,0.95,1.00],
  other:         [1.00,1.00,1.00,1.00,1.00,1.00,1.05,1.10,0.95,0.98,1.00,1.00],
};
