// Home stub — M0 surface for foreground location.
// Real geo-ranked merchant list (FR-HOME-01) lands at M1 once Plaid sync is wired.
// For M0 this proves: real iOS location permission + lat/lng → /merchants/near round-trip.

import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Screen } from '../components/Screen';
import { ChunkyBtn } from '../components/Button';
import { Pill } from '../components/Pill';
import { theme as t } from '../theme';
import { api } from '../lib/api';

type Phase = 'idle' | 'requesting' | 'denied' | 'fetching' | 'ready' | 'error';

type Merchant = NonNullable<Awaited<ReturnType<typeof api.merchantsNear>>['merchants']>[number];
type WalletCard = Awaited<ReturnType<typeof api.getCards>>[number];
type PlaidItem  = Awaited<ReturnType<typeof api.getPlaidItems>>[number];

function issuerStripe(issuer: string): string {
  const i = issuer.toLowerCase();
  if (i.includes('amex') || i.includes('american express')) return t.colors.amex;
  if (i.includes('chase')) return t.colors.chase;
  if (i.includes('capital one')) return t.colors.savor;
  return t.colors.ink;
}

const DEMO_MERCHANTS: Merchant[] = [
  {
    id: 'wf',
    name: 'Whole Foods Market',
    category: 'groceries',
    lat: 0,
    lng: 0,
    distanceM: 140,
    bestCard: { issuer: 'amex', name: 'Amex Gold', multiplier: 4 },
    expectedReward: 9.6,
  },
  {
    id: 'bb',
    name: 'Blue Bottle Coffee',
    category: 'dining',
    lat: 0,
    lng: 0,
    distanceM: 320,
    bestCard: { issuer: 'savor', name: 'Capital One Savor', multiplier: 4 },
    expectedReward: 0.26,
  },
  {
    id: 'unt',
    name: 'United Terminal 3',
    category: 'travel',
    lat: 0,
    lng: 0,
    distanceM: 980,
    bestCard: { issuer: 'chase', name: 'Sapphire Reserve', multiplier: 3 },
    expectedReward: 12.36,
  },
];

export default function Home() {
  const router = useRouter();
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const isDemo = demo === '1';
  const [phase, setPhase] = useState<Phase>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [cards, setCards] = useState<WalletCard[]>([]);
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [walletLoaded, setWalletLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load wallet (linked institutions + matched cards) once on mount. Independent
  // of the location flow — we want this visible whether or not location permits.
  useEffect(() => {
    if (isDemo) {
      setWalletLoaded(true);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const [c, i] = await Promise.all([api.getCards(), api.getPlaidItems()]);
        if (!alive) return;
        setCards(c);
        setItems(i);
      } catch {
        // silent — header section just collapses if backend is unreachable
      } finally {
        if (alive) setWalletLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isDemo]);

  const refresh = useCallback(async () => {
    setError(null);
    setPhase('requesting');
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
      setPhase('denied');
      return;
    }
    try {
      setPhase('fetching');
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setCoords({ lat, lng });
      if (isDemo) {
        setMerchants(DEMO_MERCHANTS);
        setPhase('ready');
        return;
      }
      const data = await api.merchantsNear(lat, lng, 1500);
      setMerchants(data.merchants ?? []);
      setPhase('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPhase('error');
    }
  }, [isDemo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function signOut() {
    await api.signOut();
    router.replace('/');
  }

  return (
    <Screen scroll>
      {/* Header */}
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
          <Text
            style={{
              fontFamily: t.fonts.bodyExtraBold,
              fontSize: 17,
              letterSpacing: -0.3,
            }}
          >
            Swipewise
          </Text>
        </View>
        <Pressable onPress={signOut} hitSlop={8}>
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

      <Pill
        label={isDemo ? 'preview mode · sample data' : 'nearby — m0 preview'}
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
      <Text
        style={{
          fontSize: 14,
          color: t.colors.graphite,
          fontFamily: t.fonts.bodyRegular,
          marginTop: 8,
          lineHeight: 20,
        }}
      >
        Foreground location only at M0 — full geofenced push lands at M2.
      </Text>

      {!isDemo && walletLoaded && (items.length > 0 || cards.length > 0) ? (
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
          <Text
            style={{
              fontFamily: t.fonts.bodyExtraBold,
              fontSize: 13,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              color: t.colors.dim,
            }}
          >
            Your wallet
          </Text>

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
                  <Text
                    style={{
                      fontFamily: t.fonts.bodyBold,
                      fontSize: 15,
                      color: t.colors.ink,
                    }}
                  >
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
                <View
                  key={c.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 6,
                  }}
                >
                  <View
                    style={{
                      width: 4,
                      height: 22,
                      backgroundColor: issuerStripe(c.issuer),
                      marginRight: 10,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: t.fonts.bodyBold,
                        fontSize: 14,
                        color: t.colors.ink,
                      }}
                    >
                      {c.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: t.colors.dim,
                        fontFamily: t.fonts.bodyRegular,
                        marginTop: 1,
                      }}
                    >
                      {c.issuer} · {c.currency} · ${c.annualFee}/yr
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : items.length > 0 ? (
            <Text
              style={{
                marginTop: 10,
                fontSize: 12,
                color: t.colors.dim,
                fontFamily: t.fonts.bodyRegular,
                lineHeight: 17,
              }}
            >
              We didn't recognize any of the supported cards (Amex Gold, Sapphire Reserve, Capital One Savor) on these accounts. Sandbox banks ship generic accounts.
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={{ marginTop: 22 }}>
        {phase === 'requesting' || phase === 'fetching' ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator color={t.colors.ink} />
            <Text style={{ marginTop: 12, color: t.colors.dim, fontFamily: t.fonts.bodyRegular }}>
              {phase === 'requesting' ? 'Asking iOS for location…' : 'Looking around…'}
            </Text>
          </View>
        ) : phase === 'denied' ? (
          <Card>
            <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 15, color: t.colors.ink }}>
              Location off
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: t.colors.graphite,
                marginTop: 6,
                fontFamily: t.fonts.bodyRegular,
                lineHeight: 18,
              }}
            >
              Swipewise needs your location to recommend the right card here. Open Settings → Swipewise → Location to allow.
            </Text>
            <View style={{ marginTop: 12 }}>
              <ChunkyBtn label="Try again" size="sm" onPress={refresh} />
            </View>
          </Card>
        ) : phase === 'error' ? (
          <Card>
            <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 15, color: t.colors.coralDk }}>
              Couldn't reach the server
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: t.colors.graphite,
                marginTop: 6,
                fontFamily: t.fonts.bodyRegular,
                lineHeight: 18,
              }}
            >
              {error}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: t.colors.dim,
                marginTop: 6,
                fontFamily: t.fonts.monoMedium,
              }}
            >
              {api.baseUrl}
            </Text>
            <View style={{ marginTop: 12 }}>
              <ChunkyBtn label="Retry" size="sm" onPress={refresh} />
            </View>
          </Card>
        ) : phase === 'ready' && merchants.length === 0 ? (
          <Card>
            <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 15, color: t.colors.ink }}>
              Nothing nearby (yet).
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: t.colors.graphite,
                marginTop: 6,
                fontFamily: t.fonts.bodyRegular,
                lineHeight: 18,
              }}
            >
              Once you connect Plaid, we'll seed merchants from your transaction history. Until then, this list is empty.
            </Text>
            {coords ? (
              <Text
                style={{
                  fontSize: 12,
                  color: t.colors.dim,
                  marginTop: 8,
                  fontFamily: t.fonts.monoMedium,
                }}
              >
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </Text>
            ) : null}
            <View style={{ marginTop: 12 }}>
              <ChunkyBtn label="Refresh" size="sm" onPress={refresh} />
            </View>
          </Card>
        ) : phase === 'ready' ? (
          <ScrollView style={{ marginTop: 4 }}>
            {merchants.map((m) => (
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
                <Text
                  style={{
                    fontFamily: t.fonts.bodyExtraBold,
                    fontSize: 16,
                    color: t.colors.ink,
                  }}
                >
                  {m.name}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: t.colors.dim,
                    marginTop: 2,
                    fontFamily: t.fonts.bodyRegular,
                  }}
                >
                  {Math.round(m.distanceM)}m · {m.category}
                </Text>
                {m.bestCard ? (
                  <Text
                    style={{
                      fontSize: 13,
                      color: t.colors.graphite,
                      marginTop: 6,
                      fontFamily: t.fonts.bodyRegular,
                    }}
                  >
                    Use{' '}
                    <Text style={{ fontFamily: t.fonts.bodyBold }}>
                      {m.bestCard.name}
                    </Text>{' '}
                    — {m.bestCard.multiplier}×
                    {typeof m.expectedReward === 'number'
                      ? ` (≈ $${m.expectedReward.toFixed(2)})`
                      : null}
                  </Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </Screen>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        padding: 16,
        backgroundColor: t.colors.cream,
        borderColor: t.colors.ink,
        borderWidth: 2,
        borderRadius: t.radii.lg,
        ...t.shadow.chunky,
      }}
    >
      {children}
    </View>
  );
}
