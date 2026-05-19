// Home — M1 dashboard.
//
// Wires the real engine against synced Plaid transactions. Five blocks,
// monochrome-by-default per FR-VIS:
//   1. Header (logo + sign-out)
//   2. Pre-swipe pill + headline
//   3. Your wallet — institutions + detected cards
//   4. Period toggle (M/Q/Y) — FR-HOME-04 (AsyncStorage-persisted)
//   5. Optimization hero — Fraunces display number, optimal earnings (FR-HOME-05)
//   6. Card ranking — sorted by net value, issuer stripes (FR-ENG-01)
//   7. Best card by category — winner + multiplier + confidence (FR-HOME-07, FR-ENG-06)
//   8. Nearby merchants — foreground location + /merchants/near
//
// Voice rule (CLAUDE_CODE_BRIEF §Tone): every dollar figure is earned, never
// spent. Spend amounts are deliberately not shown as headline numbers.

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '../components/Screen';
import { ChunkyBtn } from '../components/Button';
import { Pill } from '../components/Pill';
import { theme as t } from '../theme';
import { api } from '../lib/api';

type Phase = 'idle' | 'requesting' | 'denied' | 'fetching' | 'ready' | 'error';
type Period = 'month' | 'quarter' | 'year';

type Merchant   = NonNullable<Awaited<ReturnType<typeof api.merchantsNear>>['merchants']>[number];
type WalletCard = Awaited<ReturnType<typeof api.getCards>>[number];
type PlaidItem  = Awaited<ReturnType<typeof api.getPlaidItems>>[number];
type Summary    = Awaited<ReturnType<typeof api.getSummary>>['summary'];

const PERIOD_KEY = 'swipewise.period';

const PERIOD_LABELS: Record<Period, string> = {
  month:   'Month',
  quarter: 'Quarter',
  year:    'Year',
};

const PERIOD_CAPTIONS: Record<Period, string> = {
  month:   'last 30 days',
  quarter: 'last 90 days',
  year:    'annualized',
};

const CARD_NAMES: Record<'gold' | 'csr' | 'savor', string> = {
  gold:  'Amex Gold',
  csr:   'Sapphire Reserve',
  savor: 'Capital One Savor',
};

const CARD_ISSUERS: Record<'gold' | 'csr' | 'savor', string> = {
  gold:  'American Express',
  csr:   'Chase',
  savor: 'Capital One',
};

function issuerStripe(issuer: string): string {
  const i = issuer.toLowerCase();
  if (i.includes('amex') || i.includes('american express')) return t.colors.amex;
  if (i.includes('chase')) return t.colors.chase;
  if (i.includes('capital one')) return t.colors.savor;
  return t.colors.ink;
}

function cardStripe(id: 'gold' | 'csr' | 'savor'): string {
  return issuerStripe(CARD_ISSUERS[id]);
}

// Scale annualized numbers to the selected period.
function scaleForPeriod(annual: number, period: Period): number {
  if (period === 'month')   return annual / 12;
  if (period === 'quarter') return annual / 4;
  return annual;
}

function formatMoney(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

const DEMO_MERCHANTS: Merchant[] = [
  { id: 'wf',  name: 'Whole Foods Market',  category: 'groceries', lat: 0, lng: 0, distanceM: 140, bestCard: { issuer: 'amex',  name: 'Amex Gold',          multiplier: 4 }, expectedReward: 9.6 },
  { id: 'bb',  name: 'Blue Bottle Coffee',  category: 'dining',    lat: 0, lng: 0, distanceM: 320, bestCard: { issuer: 'savor', name: 'Capital One Savor',  multiplier: 4 }, expectedReward: 0.26 },
  { id: 'unt', name: 'United Terminal 3',   category: 'travel',    lat: 0, lng: 0, distanceM: 980, bestCard: { issuer: 'chase', name: 'Sapphire Reserve',   multiplier: 3 }, expectedReward: 12.36 },
];

export default function Home() {
  const router = useRouter();
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const isDemo = demo === '1';

  // Period toggle — persisted across sessions per FR-HOME-04.
  const [period, setPeriod] = useState<Period>('year');
  useEffect(() => {
    AsyncStorage.getItem(PERIOD_KEY).then((p) => {
      if (p === 'month' || p === 'quarter' || p === 'year') setPeriod(p);
    });
  }, []);
  const choosePeriod = useCallback((p: Period) => {
    setPeriod(p);
    AsyncStorage.setItem(PERIOD_KEY, p).catch(() => {});
  }, []);

  // Wallet (linked institutions + matched cards).
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [walletLoaded, setWalletLoaded] = useState(false);
  useEffect(() => {
    if (isDemo) { setWalletLoaded(true); return; }
    let alive = true;
    (async () => {
      try {
        const [c, i] = await Promise.all([api.getCards(), api.getPlaidItems()]);
        if (!alive) return;
        setCards(c); setItems(i);
      } catch {
        // silent
      } finally {
        if (alive) setWalletLoaded(true);
      }
    })();
    return () => { alive = false; };
  }, [isDemo]);

  // Engine summary — reloads when period changes.
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  useEffect(() => {
    if (isDemo) { setSummary(null); setSummaryLoading(false); return; }
    let alive = true;
    setSummaryLoading(true);
    api.getSummary(period)
      .then((r) => { if (alive) { setSummary(r.summary); setSummaryLoading(false); } })
      .catch(() => { if (alive) setSummaryLoading(false); });
    return () => { alive = false; };
  }, [period, isDemo]);

  // Nearby merchants.
  const [phase, setPhase] = useState<Phase>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setError(null);
    setPhase('requesting');
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') { setPhase('denied'); return; }
    try {
      setPhase('fetching');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setCoords({ lat, lng });
      if (isDemo) { setMerchants(DEMO_MERCHANTS); setPhase('ready'); return; }
      const data = await api.merchantsNear(lat, lng, 1500);
      setMerchants(data.merchants ?? []);
      setPhase('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPhase('error');
    }
  }, [isDemo]);
  useEffect(() => { refresh(); }, [refresh]);

  async function signOut() {
    await api.signOut();
    router.replace('/');
  }

  return (
    <Screen scroll>
      <Header onSignOut={signOut} />

      <Pill
        label={isDemo ? 'preview mode · sample data' : 'm1 dashboard'}
        bg={isDemo ? t.colors.lemon : t.colors.sky}
      />
      <Text
        style={{
          fontFamily: t.fonts.display,
          fontSize: 36,
          lineHeight: 38,
          letterSpacing: -1.1,
          marginTop: 14,
          color: t.colors.ink,
        }}
      >
        Which card,{'\n'}right now?
      </Text>

      {!isDemo && walletLoaded && (items.length > 0 || cards.length > 0) ? (
        <YourWallet items={items} cards={cards} />
      ) : null}

      {!isDemo ? (
        <>
          <PeriodToggle period={period} onChange={choosePeriod} />

          {summaryLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={t.colors.ink} />
            </View>
          ) : summary ? (
            <>
              <OptimizationHero summary={summary} period={period} />
              <CardRanking summary={summary} period={period} />
              <CategoryBreakdown summary={summary} />
              <CreditsLink onPress={() => router.push('/credits')} />
            </>
          ) : (
            <SmallCard tone="dim">
              <Text style={{ fontFamily: t.fonts.bodyRegular, color: t.colors.dim, fontSize: 13 }}>
                Couldn't load the summary. Make sure the backend is reachable.
              </Text>
            </SmallCard>
          )}
        </>
      ) : null}

      <NearbySection
        phase={phase}
        coords={coords}
        merchants={merchants}
        error={error}
        baseUrl={api.baseUrl}
        onRefresh={refresh}
      />
    </Screen>
  );
}

// ─── Components ────────────────────────────────────────────────────────────────

function Header({ onSignOut }: { onSignOut: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 18,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 32,
            height: 32,
            backgroundColor: t.colors.lemon,
            ...t.border.medium,
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
            ...t.shadow.chunky,
          }}
        >
          <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 16 }}>$</Text>
        </View>
        <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 17, letterSpacing: -0.3 }}>
          Swipewise
        </Text>
      </View>
      <Pressable onPress={onSignOut} hitSlop={8}>
        <Text
          style={{
            fontSize: 13,
            color: t.colors.graphite,
            fontFamily: t.fonts.bodySemiBold,
            textDecorationLine: 'underline',
          }}
        >
          Sign out
        </Text>
      </Pressable>
    </View>
  );
}

function YourWallet({ items, cards }: { items: PlaidItem[]; cards: WalletCard[] }) {
  return (
    <View
      style={{
        marginTop: 22,
        padding: 16,
        backgroundColor: t.colors.cream,
        borderColor: t.colors.ink,
        borderWidth: 1.5,
        borderRadius: t.radii.lg,
        ...t.shadow.chunky,
      }}
    >
      <SectionLabel>Your wallet</SectionLabel>
      {items.length > 0 ? (
        <View style={{ marginTop: 10 }}>
          {items.map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 6,
                borderBottomColor: t.colors.hairline,
                borderBottomWidth: 1,
              }}
            >
              <Text style={{ fontFamily: t.fonts.bodyBold, fontSize: 15, color: t.colors.ink }}>
                {item.institution_name}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: item.status === 'active' ? t.colors.mintDk : t.colors.coralDk,
                  fontFamily: t.fonts.monoMedium,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {item.status}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {cards.length > 0 ? (
        <View style={{ marginTop: 12 }}>
          {cards.map((c) => (
            <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
              <View style={{ width: 4, height: 22, backgroundColor: issuerStripe(c.issuer), marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: t.fonts.bodyBold, fontSize: 14, color: t.colors.ink }}>{c.name}</Text>
                <Text style={{ fontSize: 11, color: t.colors.dim, fontFamily: t.fonts.bodyRegular, marginTop: 1 }}>
                  {c.issuer} · {c.currency} · ${c.annualFee}/yr
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : items.length > 0 ? (
        <Text style={{ marginTop: 10, fontSize: 12, color: t.colors.dim, fontFamily: t.fonts.bodyRegular, lineHeight: 17 }}>
          We didn't recognize any of the supported cards (Amex Gold, Sapphire Reserve, Capital One Savor) on these accounts. Sandbox banks ship generic accounts.
        </Text>
      ) : null}
    </View>
  );
}

function PeriodToggle({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        marginTop: 22,
      }}
    >
      {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => {
        const active = p === period;
        return (
          <Pressable
            key={p}
            onPress={() => onChange(p)}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 12,
              backgroundColor: active ? t.colors.ink : t.colors.paper,
              borderColor: t.colors.ink,
              borderWidth: 1.5,
              borderRadius: t.radii.md,
              ...(active ? t.shadow.chunky : null),
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: active ? t.colors.paper : t.colors.ink,
                fontFamily: t.fonts.bodySemiBold,
                fontSize: 14,
              }}
            >
              {PERIOD_LABELS[p]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function OptimizationHero({ summary, period }: { summary: Summary; period: Period }) {
  const optimal = scaleForPeriod(summary.optimizedRewards, period);
  const optimalNet = scaleForPeriod(summary.optimizedNet, period);
  const fees = optimal - optimalNet; // total annual fee allocation for this window
  return (
    <View style={{ marginTop: 22 }}>
      <SectionLabel>Optimal earnings · {PERIOD_CAPTIONS[period]}</SectionLabel>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
        <Text
          style={{
            fontFamily: t.fonts.displayItalic,
            fontSize: 36,
            color: t.colors.ink,
            letterSpacing: -1,
            marginRight: 2,
          }}
        >
          $
        </Text>
        <Text
          style={{
            fontFamily: t.fonts.display,
            fontSize: 64,
            color: t.colors.ink,
            letterSpacing: -2.5,
            lineHeight: 64,
          }}
        >
          {formatMoney(optimal)}
        </Text>
      </View>
      <Text
        style={{
          marginTop: 6,
          fontSize: 13,
          color: t.colors.graphite,
          fontFamily: t.fonts.bodyRegular,
          lineHeight: 18,
        }}
      >
        Net of annual fees: <Text style={{ fontFamily: t.fonts.bodyBold }}>${formatMoney(optimalNet)}</Text>
        {fees > 0 ? <Text style={{ color: t.colors.dim }}>{`  (− $${formatMoney(fees)} in fees)`}</Text> : null}
      </Text>
    </View>
  );
}

function CardRanking({ summary, period }: { summary: Summary; period: Period }) {
  return (
    <View style={{ marginTop: 26 }}>
      <SectionLabel>Top cards</SectionLabel>
      <View style={{ marginTop: 10 }}>
        {summary.ranking.map((r, idx) => {
          const card = summary.cards[r.id];
          const net = scaleForPeriod(card?.net ?? 0, period);
          return (
            <View
              key={r.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomColor: t.colors.hairline,
                borderBottomWidth: idx === summary.ranking.length - 1 ? 0 : 1,
              }}
            >
              <View style={{ width: 4, height: 32, backgroundColor: cardStripe(r.id), marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: t.fonts.bodyBold, fontSize: 15, color: t.colors.ink }}>
                  {CARD_NAMES[r.id]}
                </Text>
                <Text style={{ fontSize: 11, color: t.colors.dim, fontFamily: t.fonts.bodyRegular, marginTop: 1 }}>
                  {CARD_ISSUERS[r.id]}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: t.fonts.displayItalic,
                  fontSize: 22,
                  color: t.colors.ink,
                  letterSpacing: -0.5,
                }}
              >
                ${formatMoney(net)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function CategoryBreakdown({ summary }: { summary: Summary }) {
  // Top categories by annualized spend, capped at 6. Spend amounts are intentionally
  // not surfaced as headline numbers (FR-VIS / "earned, not spent" voice).
  // Filter out malformed rows (no winner or no entry in `per` for the winner) —
  // this happens when the engine ran with zero owned cards.
  const top = [...summary.rows]
    .filter((r) => r.annualSpend > 0 && r.winner && r.per && r.per[r.winner])
    .sort((a, b) => b.annualSpend - a.annualSpend)
    .slice(0, 6);

  if (top.length === 0) return null;

  return (
    <View style={{ marginTop: 26 }}>
      <SectionLabel>Best card by category</SectionLabel>
      <View style={{ marginTop: 10 }}>
        {top.map((row, idx) => {
          const mult = row.per[row.winner]?.mult ?? 1;
          return (
            <View
              key={row.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomColor: t.colors.hairline,
                borderBottomWidth: idx === top.length - 1 ? 0 : 1,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: t.fonts.bodyBold, fontSize: 14, color: t.colors.ink }}>
                  {row.name}
                </Text>
                <Text style={{ fontSize: 12, color: t.colors.graphite, fontFamily: t.fonts.bodyRegular, marginTop: 1 }}>
                  Swipe <Text style={{ fontFamily: t.fonts.bodyBold }}>{CARD_NAMES[row.winner]}</Text>
                  {mult > 1 ? <Text>{`  · ${mult}×`}</Text> : null}
                </Text>
              </View>
              <ConfidenceDots level={row.confidence} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ConfidenceDots({ level }: { level: 'high' | 'medium' | 'low' }) {
  const filled = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 8 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i < filled ? t.colors.ink : t.colors.hairline,
          }}
        />
      ))}
    </View>
  );
}

function CreditsLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        marginTop: 26,
        padding: 14,
        backgroundColor: t.colors.paper,
        borderColor: t.colors.ink,
        borderWidth: 1.5,
        borderRadius: t.radii.lg,
        ...t.shadow.chunky,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 15, color: t.colors.ink }}>
          View all credits
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: t.colors.dim,
            marginTop: 2,
            fontFamily: t.fonts.bodyRegular,
          }}
        >
          Per-card breakdown · CSR $300 travel hero
        </Text>
      </View>
      <Text style={{ fontSize: 20, fontFamily: t.fonts.bodyBold, color: t.colors.ink }}>›</Text>
    </Pressable>
  );
}

function NearbySection({
  phase,
  coords,
  merchants,
  error,
  baseUrl,
  onRefresh,
}: {
  phase: Phase;
  coords: { lat: number; lng: number } | null;
  merchants: Merchant[];
  error: string | null;
  baseUrl: string;
  onRefresh: () => void;
}) {
  return (
    <View style={{ marginTop: 26 }}>
      <SectionLabel>Nearby</SectionLabel>
      <View style={{ marginTop: 10 }}>
        {phase === 'requesting' || phase === 'fetching' ? (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <ActivityIndicator color={t.colors.ink} />
            <Text style={{ marginTop: 10, color: t.colors.dim, fontFamily: t.fonts.bodyRegular, fontSize: 13 }}>
              {phase === 'requesting' ? 'Asking iOS for location…' : 'Looking around…'}
            </Text>
          </View>
        ) : phase === 'denied' ? (
          <SmallCard tone="ink">
            <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 14, color: t.colors.ink }}>
              Location off
            </Text>
            <Text style={{ fontSize: 12, color: t.colors.graphite, marginTop: 4, fontFamily: t.fonts.bodyRegular, lineHeight: 17 }}>
              Open Settings → Swipewise → Location to allow.
            </Text>
            <View style={{ marginTop: 10 }}>
              <ChunkyBtn label="Try again" size="sm" onPress={onRefresh} />
            </View>
          </SmallCard>
        ) : phase === 'error' ? (
          <SmallCard tone="coral">
            <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 14, color: t.colors.coralDk }}>
              Couldn't reach the server
            </Text>
            <Text style={{ fontSize: 12, color: t.colors.graphite, marginTop: 4, fontFamily: t.fonts.bodyRegular, lineHeight: 17 }}>
              {error}
            </Text>
            <Text style={{ fontSize: 11, color: t.colors.dim, marginTop: 4, fontFamily: t.fonts.monoMedium }}>
              {baseUrl}
            </Text>
            <View style={{ marginTop: 10 }}>
              <ChunkyBtn label="Retry" size="sm" onPress={onRefresh} />
            </View>
          </SmallCard>
        ) : merchants.length === 0 ? (
          <SmallCard tone="ink">
            <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 14, color: t.colors.ink }}>
              Nothing nearby (yet).
            </Text>
            <Text style={{ fontSize: 12, color: t.colors.graphite, marginTop: 4, fontFamily: t.fonts.bodyRegular, lineHeight: 17 }}>
              We seed nearby merchants from your transaction history. Sandbox transactions don't have real coordinates, so this stays empty until you link a real account.
            </Text>
            {coords ? (
              <Text style={{ fontSize: 11, color: t.colors.dim, marginTop: 6, fontFamily: t.fonts.monoMedium }}>
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </Text>
            ) : null}
            <View style={{ marginTop: 10 }}>
              <ChunkyBtn label="Refresh" size="sm" onPress={onRefresh} />
            </View>
          </SmallCard>
        ) : (
          merchants.map((m) => (
            <View
              key={m.id}
              style={{
                padding: 14,
                backgroundColor: t.colors.paper,
                borderColor: t.colors.ink,
                borderWidth: 1.5,
                borderRadius: t.radii.lg,
                ...t.shadow.chunky,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 16, color: t.colors.ink }}>
                {m.name}
              </Text>
              <Text style={{ fontSize: 12, color: t.colors.dim, marginTop: 2, fontFamily: t.fonts.bodyRegular }}>
                {Math.round(m.distanceM)}m · {m.category}
              </Text>
              {m.bestCard ? (
                <Text style={{ fontSize: 13, color: t.colors.graphite, marginTop: 6, fontFamily: t.fonts.bodyRegular }}>
                  Use <Text style={{ fontFamily: t.fonts.bodyBold }}>{m.bestCard.name}</Text> — {m.bestCard.multiplier}×
                  {typeof m.expectedReward === 'number' ? ` (≈ $${m.expectedReward.toFixed(2)})` : null}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontFamily: t.fonts.bodyExtraBold,
        fontSize: 12,
        letterSpacing: 0.9,
        textTransform: 'uppercase',
        color: t.colors.dim,
      }}
    >
      {children}
    </Text>
  );
}

function SmallCard({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'ink' | 'coral' | 'dim';
}) {
  return (
    <View
      style={{
        padding: 14,
        backgroundColor: tone === 'coral' ? t.colors.paper : t.colors.cream,
        borderColor: t.colors.ink,
        borderWidth: 1.5,
        borderRadius: t.radii.lg,
        ...t.shadow.chunky,
      }}
    >
      {children}
    </View>
  );
}
