// OnboardB_Manual — manual catalog. FR-ONB-02. v1 catalog includes the three v1 cards
// plus two adjacent products to demonstrate selection.

import { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '../../components/Screen';
import { ChunkyBtn } from '../../components/Button';
import { CardSwatch, type Issuer } from '../../components/CardSwatch';
import { StepHeader } from '../../components/StepHeader';
import { theme as t } from '../../theme';
import { setStep } from '../../lib/storage';

type Card = { id: string; issuer: Issuer; name: string; fee: string };

const CATALOG: Card[] = [
  { id: 'amex_gold',     issuer: 'amex',  name: 'Amex Gold',          fee: '$325/yr' },
  { id: 'csr',           issuer: 'chase', name: 'Sapphire Reserve',   fee: '$795/yr' },
  { id: 'savor',         issuer: 'savor', name: 'Capital One Savor',  fee: 'No fee' },
  { id: 'csp',           issuer: 'chase', name: 'Sapphire Preferred', fee: '$95/yr' },
  { id: 'amex_platinum', issuer: 'amex',  name: 'Amex Platinum',      fee: '$695/yr' },
];

export default function OnboardManual() {
  const router = useRouter();
  const [picked, setPicked] = useState<Set<string>>(
    new Set(['amex_gold', 'csr', 'savor']),
  );

  const count = picked.size;
  const cta = useMemo(
    () => (count === 0 ? 'Pick at least one card' : `Continue with ${count} card${count === 1 ? '' : 's'}`),
    [count],
  );

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function continueOn() {
    await AsyncStorage.setItem(
      'swipewise.manualCards',
      JSON.stringify(Array.from(picked)),
    );
    await setStep('done');
    router.replace('/home');
  }

  return (
    <Screen
      scroll
      footer={
        <ChunkyBtn
          label={cta}
          size="lg"
          fullWidth
          bg={t.colors.lemon}
          fg={t.colors.ink}
          disabled={count === 0}
          onPress={continueOn}
        />
      }
    >
      <StepHeader step="Add manually" />

      <View style={{ marginTop: 28 }}>
        <Text
          style={{
            fontFamily: t.fonts.display,
            fontSize: 36,
            lineHeight: 38,
            letterSpacing: -1.2,
            marginBottom: 10,
            color: t.colors.ink,
          }}
        >
          Pick the cards{'\n'}in your wallet.
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: t.colors.graphite,
            fontFamily: t.fonts.bodyRegular,
          }}
        >
          {count} selected · tap to toggle
        </Text>
      </View>

      <View style={{ marginTop: 18, gap: 10 }}>
        {CATALOG.map((c) => {
          const on = picked.has(c.id);
          return (
            <Pressable
              key={c.id}
              onPress={() => toggle(c.id)}
              style={{
                padding: 14,
                backgroundColor: on ? t.colors.cream : t.colors.paper,
                borderColor: t.colors.ink,
                borderWidth: 2.5,
                borderRadius: t.radii.lg,
                ...(on ? t.shadow.chunkiest : t.shadow.chunky),
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <CardSwatch issuer={c.issuer} size={42} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 16, color: t.colors.ink }}>
                  {c.name}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: t.colors.dim,
                    marginTop: 2,
                    fontFamily: t.fonts.bodyRegular,
                  }}
                >
                  {c.fee}
                </Text>
              </View>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  ...t.border.medium,
                  backgroundColor: on ? t.colors.mint : t.colors.paper,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {on ? (
                  <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 16 }}>✓</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
