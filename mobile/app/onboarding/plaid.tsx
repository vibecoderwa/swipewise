// OnboardA_Plaid — Plaid as primary path. FR-ONB-01, FR-ONB-04 (permissions priming).
// M0: button is mocked (no react-native-plaid-link-sdk yet); we route forward as if linked.

import { View, Text, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { ChunkyBtn } from '../../components/Button';
import { Pill } from '../../components/Pill';
import { theme as t } from '../../theme';
import { setStep } from '../../lib/storage';

export default function OnboardPlaid() {
  const router = useRouter();

  async function connect() {
    Alert.alert(
      'Plaid Link (M0 stub)',
      'Real Plaid Link wires up at M1. For now, we mark you as linked and continue.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            await setStep('done');
            router.replace('/home');
          },
        },
      ],
    );
  }

  async function manual() {
    await setStep('plaid');
    router.push('/onboarding/manual');
  }

  return (
    <Screen
      scroll
      footer={
        <Text
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: t.colors.dim,
            fontFamily: t.fonts.bodyRegular,
          }}
        >
          You're in control. Disconnect anytime in Settings.
        </Text>
      }
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 6,
        }}
      >
        <Text style={{ fontSize: 14, fontFamily: t.fonts.bodySemiBold, color: t.colors.dim }}>
          Step 3 of 3
        </Text>
        <Pressable hitSlop={8} onPress={manual}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: t.fonts.bodyBold,
              color: t.colors.graphite,
              textDecorationLine: 'underline',
            }}
          >
            Skip for now
          </Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 28 }}>
        <Pill label="let's add your cards" bg={t.colors.lemon} />
        <Text
          style={{
            fontFamily: t.fonts.display,
            fontSize: 40,
            lineHeight: 42,
            letterSpacing: -1.2,
            marginTop: 14,
            marginBottom: 10,
            color: t.colors.ink,
          }}
        >
          Bring your{'\n'}wallet, not your{'\n'}card numbers.
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: t.colors.graphite,
            lineHeight: 21,
            fontFamily: t.fonts.bodyRegular,
          }}
        >
          Connect your bank through Plaid. We read which cards you have and categorize your spend.{' '}
          <Text style={{ fontFamily: t.fonts.bodyBold }}>Read-only.</Text> No numbers stored.
        </Text>
      </View>

      {/* Plaid CTA card */}
      <View
        style={{
          marginTop: 28,
          padding: 20,
          backgroundColor: t.colors.sky,
          borderColor: t.colors.ink,
          borderWidth: 2.5,
          borderRadius: t.radii.xl,
          ...t.shadow.chunkiest,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <View
            style={{
              width: 28,
              height: 28,
              backgroundColor: t.colors.ink,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: t.colors.lemon, fontFamily: t.fonts.bodyExtraBold, fontSize: 16 }}>
              P
            </Text>
          </View>
          <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 15, color: t.colors.ink }}>
            Plaid — the secure way
          </Text>
        </View>
        <Text
          style={{
            fontSize: 13,
            color: t.colors.ink,
            opacity: 0.85,
            lineHeight: 18,
            fontFamily: t.fonts.bodyRegular,
          }}
        >
          Works with 12,000+ US banks. Takes ~20 seconds. We auto-detect your credit cards.
        </Text>
        <View style={{ marginTop: 14 }}>
          <ChunkyBtn label="Connect my bank" fullWidth onPress={connect} />
        </View>
      </View>

      {/* Trust strip */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
        <Pill label="🔒 256-bit encrypted" bg={t.colors.cream} />
        <Pill label="👁 read-only" bg={t.colors.cream} />
        <Pill label="🚫 no selling" bg={t.colors.cream} />
      </View>

      {/* Divider */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginTop: 28,
        }}
      >
        <View style={{ flex: 1, height: 1.5, backgroundColor: t.colors.hairline }} />
        <Text
          style={{
            fontSize: 12,
            fontFamily: t.fonts.bodyBold,
            color: t.colors.dim,
            letterSpacing: 1,
          }}
        >
          OR
        </Text>
        <View style={{ flex: 1, height: 1.5, backgroundColor: t.colors.hairline }} />
      </View>

      {/* Manual entry */}
      <Pressable onPress={manual} style={{ marginTop: 18 }}>
        <View
          style={{
            padding: 14,
            backgroundColor: t.colors.paper,
            borderColor: t.colors.ink,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderRadius: t.radii.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: t.colors.cream,
              ...t.border.thin,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>✍︎</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 15, color: t.colors.ink }}>
              Enter cards manually
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: t.colors.dim,
                marginTop: 2,
                fontFamily: t.fonts.bodyRegular,
              }}
            >
              Pick from our catalog of 200+ cards. No bank needed.
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontFamily: t.fonts.bodyBold, color: t.colors.ink }}>›</Text>
        </View>
      </Pressable>
    </Screen>
  );
}
