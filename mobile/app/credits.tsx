// Credits screen — per-card credit tracking with the CSR $300 Durable Travel
// Credit as a hero callout (FR-CRD-01, FR-CRD-02, FR-CRD-05).
//
// Voice rule: credits are framed as money earned back, never "spent" or
// "saved." Realized + potential are always paired side-by-side so the gap is
// never hidden (FR-CRD-05).
//
// One accent per surface: the CSR durable credit hero uses lemon; per-card
// accordions and toggles stay monochrome.

import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Screen } from '../components/Screen';
import { Pill } from '../components/Pill';
import { StepHeader } from '../components/StepHeader';
import { theme as t } from '../theme';
import { api } from '../lib/api';

type CreditsResp = Awaited<ReturnType<typeof api.getCredits>>;
type CardCredits = CreditsResp[number];
type Credit     = CardCredits['credits'][number];

const CARD_ISSUERS: Record<'gold' | 'csr' | 'savor', string> = {
  gold:  'American Express',
  csr:   'Chase',
  savor: 'Capital One',
};

function issuerStripe(cardId: 'gold' | 'csr' | 'savor'): string {
  if (cardId === 'gold') return t.colors.amex;
  if (cardId === 'csr')  return t.colors.chase;
  return t.colors.savor;
}

function formatMoney(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function CreditsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [cards, setCards]     = useState<CreditsResp>([]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await api.getCredits();
      setCards(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Optimistic toggle: flip locally, fire PATCH, revert on error.
  async function toggle(cardId: 'gold' | 'csr' | 'savor', creditId: string, next: boolean) {
    const before = cards;
    setCards((prev) =>
      prev.map((card) => {
        if (card.cardId !== cardId) return card;
        const updated = card.credits.map((c) => (c.id === creditId ? { ...c, captured: next } : c));
        const totalCaptured = updated.filter((c) => c.captured).reduce((s, c) => s + c.annual, 0);
        return { ...card, credits: updated, totalCaptured };
      }),
    );
    try {
      await api.setCreditCaptured(cardId, creditId, next);
    } catch (e) {
      setCards(before);
      Alert.alert("Couldn't save", e instanceof Error ? e.message : 'Unknown error');
    }
  }

  // The durable CSR travel credit — hero treatment per FR-CRD-02.
  const csr = cards.find((c) => c.cardId === 'csr');
  const durable = csr?.credits.find((c) => c.durable);

  return (
    <Screen scroll>
      <StepHeader step="Credits" />

      <View style={{ marginTop: 18 }}>
        <Pill label="credits · what you earn back" bg={t.colors.mint} />
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
          Money you{'\n'}can still claim.
        </Text>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator color={t.colors.ink} />
        </View>
      ) : error ? (
        <View
          style={{
            marginTop: 22,
            padding: 16,
            backgroundColor: t.colors.cream,
            ...t.border.thin,
            borderRadius: t.radii.lg,
            ...t.shadow.chunky,
          }}
        >
          <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 14, color: t.colors.coralDk }}>
            Couldn't load credits
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: t.colors.graphite,
              marginTop: 4,
              fontFamily: t.fonts.bodyRegular,
            }}
          >
            {error}
          </Text>
        </View>
      ) : cards.length === 0 ? (
        <View
          style={{
            marginTop: 22,
            padding: 16,
            backgroundColor: t.colors.cream,
            ...t.border.thin,
            borderRadius: t.radii.lg,
            ...t.shadow.chunky,
          }}
        >
          <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 14, color: t.colors.ink }}>
            No cards yet
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: t.colors.graphite,
              marginTop: 4,
              fontFamily: t.fonts.bodyRegular,
              lineHeight: 18,
            }}
          >
            Add cards from the catalog during onboarding to see their credits here.
          </Text>
        </View>
      ) : (
        <>
          {durable && csr ? (
            <DurableHero
              credit={durable}
              onToggle={(next) => toggle('csr', durable.id, next)}
            />
          ) : null}

          {cards.map((card) => (
            <CardSection
              key={card.cardId}
              card={card}
              onToggle={(creditId, next) => toggle(card.cardId, creditId, next)}
            />
          ))}
        </>
      )}
    </Screen>
  );
}

function DurableHero({
  credit,
  onToggle,
}: {
  credit: Credit;
  onToggle: (next: boolean) => void;
}) {
  const realized  = credit.captured ? credit.annual : 0;
  const remaining = credit.captured ? 0 : credit.annual;
  return (
    <View
      style={{
        marginTop: 26,
        padding: 18,
        backgroundColor: t.colors.lemon,
        borderColor: t.colors.ink,
        borderWidth: 2.5,
        borderRadius: t.radii.xl,
        ...t.shadow.chunkiest,
      }}
    >
      <Text
        style={{
          fontFamily: t.fonts.bodyExtraBold,
          fontSize: 11,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: t.colors.ink,
          opacity: 0.7,
        }}
      >
        Sapphire Reserve · durable travel credit
      </Text>
      <Text
        style={{
          fontFamily: t.fonts.display,
          fontSize: 16,
          marginTop: 4,
          color: t.colors.ink,
        }}
      >
        {credit.name}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 14 }}>
        <Text
          style={{
            fontFamily: t.fonts.displayItalic,
            fontSize: 30,
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
            fontSize: 54,
            color: t.colors.ink,
            letterSpacing: -2,
            lineHeight: 54,
          }}
        >
          {formatMoney(realized)}
        </Text>
        <Text
          style={{
            marginLeft: 8,
            fontSize: 14,
            color: t.colors.ink,
            opacity: 0.75,
            fontFamily: t.fonts.bodyMedium,
          }}
        >
          realized
        </Text>
      </View>

      <Text
        style={{
          marginTop: 6,
          fontSize: 13,
          color: t.colors.ink,
          opacity: 0.85,
          fontFamily: t.fonts.bodyRegular,
          lineHeight: 18,
        }}
      >
        <Text style={{ fontFamily: t.fonts.bodyBold }}>${formatMoney(remaining)}</Text> remaining · resets at year end
      </Text>

      {credit.note ? (
        <Text
          style={{
            marginTop: 8,
            fontSize: 12,
            color: t.colors.ink,
            opacity: 0.65,
            fontFamily: t.fonts.bodyRegular,
            lineHeight: 17,
          }}
        >
          {credit.note}
        </Text>
      ) : null}

      <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <ToggleCheckbox value={credit.captured} onChange={onToggle} />
        <Text style={{ fontFamily: t.fonts.bodySemiBold, fontSize: 13, color: t.colors.ink }}>
          {credit.captured ? 'Captured this year' : 'Mark captured'}
        </Text>
      </View>
    </View>
  );
}

function CardSection({
  card,
  onToggle,
}: {
  card: CardCredits;
  onToggle: (creditId: string, next: boolean) => void;
}) {
  // Skip the durable CSR credit here — it's already in the hero.
  const credits = card.credits.filter((c) => !c.durable);
  if (credits.length === 0) {
    return null;
  }

  return (
    <View style={{ marginTop: 26 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 4,
            height: 22,
            backgroundColor: issuerStripe(card.cardId),
            marginRight: 10,
          }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 15, color: t.colors.ink }}>
            {card.cardName}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: t.colors.dim,
              fontFamily: t.fonts.bodyRegular,
              marginTop: 1,
            }}
          >
            {CARD_ISSUERS[card.cardId]}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: t.fonts.displayItalic,
            fontSize: 18,
            color: t.colors.ink,
            letterSpacing: -0.4,
          }}
        >
          ${formatMoney(card.totalCaptured)}
          <Text style={{ color: t.colors.dim, fontFamily: t.fonts.bodyRegular, fontSize: 12 }}>
            {' / $'}
            {formatMoney(card.totalPotential)}
          </Text>
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        {credits.map((c) => (
          <CreditRow
            key={c.id}
            credit={c}
            onToggle={(next) => onToggle(c.id, next)}
          />
        ))}
      </View>
    </View>
  );
}

function CreditRow({
  credit,
  onToggle,
}: {
  credit: Credit;
  onToggle: (next: boolean) => void;
}) {
  return (
    <View
      style={{
        padding: 12,
        backgroundColor: credit.captured ? t.colors.cream : t.colors.paper,
        borderColor: t.colors.ink,
        borderWidth: 1.5,
        borderRadius: t.radii.md,
        ...(credit.captured ? t.shadow.chunky : null),
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <ToggleCheckbox value={credit.captured} onChange={onToggle} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: t.fonts.bodyBold, fontSize: 14, color: t.colors.ink }}>
          {credit.name}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: t.colors.dim,
            fontFamily: t.fonts.bodyRegular,
            marginTop: 1,
          }}
        >
          {credit.cadence}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: t.fonts.displayItalic,
          fontSize: 18,
          color: credit.captured ? t.colors.ink : t.colors.dim,
          letterSpacing: -0.3,
        }}
      >
        ${formatMoney(credit.annual)}
      </Text>
    </View>
  );
}

function ToggleCheckbox({ value, onChange }: { value: boolean; onChange: (next: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        ...t.border.medium,
        backgroundColor: value ? t.colors.mint : t.colors.paper,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {value ? (
        <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 16, color: t.colors.ink }}>✓</Text>
      ) : null}
    </Pressable>
  );
}

