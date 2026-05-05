import { CARDS, CATEGORIES, CREDITS, MULTIPLIERS, SEASONAL, CardId, CategoryId } from './data.js';

export interface SpendMap   extends Partial<Record<CategoryId, number>> {}
export interface FeeMap     extends Partial<Record<CardId, number>> {}
export interface CppMap     extends Partial<Record<CardId, number>> {}
export interface CreditsUsed extends Partial<Record<CardId, Record<string, boolean>>> {}

export interface ComputeState {
  spend:       Record<CategoryId, number>;
  fees:        Record<CardId, number>;
  cpp:         Record<CardId, number>;
  creditsUsed: Record<CardId, Record<string, boolean>>;
  ownedCards?: CardId[];
}

export interface CategoryRow {
  id:           CategoryId;
  name:         string;
  monthlySpend: number;
  annualSpend:  number;
  per:          Record<CardId, { mult: number; pts: number; val: number }>;
  winner:       CardId;
  runnerUp:     CardId;
  delta:        number;
  confidence:   'high' | 'medium' | 'low';
}

export interface CardSummary {
  pts:     number;
  rewards: number;
  credits: number;
  fee:     number;
  net:     number;
}

export interface ComputeResult {
  rows:             CategoryRow[];
  totalSpendAnnual: number;
  totalSpendMonthly:number;
  cards:            Record<CardId, CardSummary>;
  ranking:          Array<{ id: CardId; name: string; net: number }>;
  optimizedRewards: number;
  optimizedNet:     number;
  delta:            number;
}

export function computeAll(state: ComputeState, ownedCards?: CardId[]): ComputeResult {
  const { spend, fees, cpp, creditsUsed } = state;
  const cards = ownedCards ?? (CARDS.map(c => c.id) as CardId[]);

  const rows: CategoryRow[] = CATEGORIES.map(cat => {
    const monthlySpend = spend[cat.id] ?? 0;
    const annualSpend  = monthlySpend * 12;

    const per = {} as Record<CardId, { mult: number; pts: number; val: number }>;
    cards.forEach(cardId => {
      const mult = MULTIPLIERS[cardId][cat.id];
      const pts  = annualSpend * mult;
      const val  = pts * ((cpp[cardId] ?? 1) / 100);
      per[cardId] = { mult, pts, val };
    });

    let winner: CardId = cards[0];
    let runnerUp: CardId = cards[0];
    let topVal = -Infinity;
    let secondVal = -Infinity;

    cards.forEach(cardId => {
      const v = per[cardId].val;
      if (v > topVal)         { secondVal = topVal; runnerUp = winner; topVal = v; winner = cardId; }
      else if (v > secondVal) { secondVal = v; runnerUp = cardId; }
    });

    const gap = topVal - secondVal;
    const confidence: CategoryRow['confidence'] =
      topVal === 0    ? 'low' :
      gap / topVal > 0.5 ? 'high' :
      gap / topVal > 0.15 ? 'medium' : 'low';

    return { ...cat, monthlySpend, annualSpend, per, winner, runnerUp, delta: gap, confidence };
  });

  const totalSpendAnnual  = rows.reduce((s, r) => s + r.annualSpend, 0);
  const totalSpendMonthly = rows.reduce((s, r) => s + r.monthlySpend, 0);

  const cardSummaries = {} as Record<CardId, CardSummary>;
  cards.forEach(cardId => {
    const pts     = rows.reduce((s, r) => s + (r.per[cardId]?.pts ?? 0), 0);
    const rewards = rows.reduce((s, r) => s + (r.per[cardId]?.val ?? 0), 0);
    const credits = (CREDITS[cardId] ?? []).reduce(
      (s, c) => s + (creditsUsed[cardId]?.[c.id] ? c.annual : 0), 0
    );
    const fee = fees[cardId] ?? 0;
    cardSummaries[cardId] = { pts, rewards, credits, fee, net: rewards + credits - fee };
  });

  const optimizedRewards = rows.reduce(
    (s, r) => s + Math.max(...cards.map(cid => r.per[cid]?.val ?? 0)), 0
  );
  const totalCredits = cards.reduce((s, cid) => s + cardSummaries[cid].credits, 0);
  const totalFees    = cards.reduce((s, cid) => s + cardSummaries[cid].fee, 0);
  const optimizedNet = optimizedRewards + totalCredits - totalFees;

  const ranking = CARDS.filter(c => cards.includes(c.id))
    .map(c => ({ id: c.id, name: c.name, net: cardSummaries[c.id].net }))
    .sort((a, b) => b.net - a.net);

  return {
    rows, totalSpendAnnual, totalSpendMonthly,
    cards: cardSummaries, ranking,
    optimizedRewards, optimizedNet,
    delta: ranking.length >= 2 ? ranking[0].net - ranking[1].net : 0,
  };
}

export interface MonthPoint {
  month:  number;
  label:  string;
  [cardId: string]: number | string;
}

const MONTH_LABELS = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'];

export function monthlyTimeline(state: ComputeState, ownedCards?: CardId[]): MonthPoint[] {
  const { spend, cpp } = state;
  const cards = ownedCards ?? (CARDS.map(c => c.id) as CardId[]);

  return MONTH_LABELS.map((label, i) => {
    const point: MonthPoint = { month: i, label };
    cards.forEach(cardId => { point[cardId] = 0; });

    CATEGORIES.forEach(cat => {
      const s = (spend[cat.id] ?? 0) * (SEASONAL[cat.id]?.[i] ?? 1);
      cards.forEach(cardId => {
        (point[cardId] as number) += s * MULTIPLIERS[cardId][cat.id] * ((cpp[cardId] ?? 1) / 100);
      });
    });

    return point;
  });
}

export interface BestCardResult {
  bestCard:       CardId;
  multiplier:     number;
  expectedReward: number;
  runnerUp:       CardId;
  runnerUpReward: number;
  confidence:     'high' | 'medium' | 'low';
}

export function bestCardForMerchant(
  category: CategoryId,
  basketAmount: number,
  cpp: Record<CardId, number>,
  ownedCards?: CardId[],
): BestCardResult {
  const cards = ownedCards ?? (CARDS.map(c => c.id) as CardId[]);

  let best: CardId = cards[0];
  let bestReward = -Infinity;
  let runnerUp: CardId = cards[0];
  let runnerUpReward = -Infinity;

  cards.forEach(cardId => {
    const mult   = MULTIPLIERS[cardId][category];
    const reward = basketAmount * mult * ((cpp[cardId] ?? 1) / 100);
    if (reward > bestReward)             { runnerUpReward = bestReward; runnerUp = best; bestReward = reward; best = cardId; }
    else if (reward > runnerUpReward)    { runnerUpReward = reward; runnerUp = cardId; }
  });

  const gap = bestReward - runnerUpReward;
  const confidence: BestCardResult['confidence'] =
    bestReward === 0 ? 'low' :
    gap / bestReward > 0.5  ? 'high' :
    gap / bestReward > 0.15 ? 'medium' : 'low';

  return {
    bestCard: best,
    multiplier: MULTIPLIERS[best][category],
    expectedReward: Math.round(bestReward * 100) / 100,
    runnerUp,
    runnerUpReward: Math.round(runnerUpReward * 100) / 100,
    confidence,
  };
}
