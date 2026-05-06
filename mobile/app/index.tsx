// Landing — LandingA from project/mocks/landing.jsx.
// "Your wallet just got opinionated."

import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../components/Screen';
import { ChunkyBtn } from '../components/Button';
import { theme as t } from '../theme';
import { setStep } from '../lib/storage';

function CardSticker({
  issuer,
  name,
  last4,
  rotate,
  top,
  left,
}: {
  issuer: 'amex' | 'chase' | 'savor';
  name: string;
  last4: string;
  rotate: number;
  top: number;
  left: number;
}) {
  const bg =
    issuer === 'amex' ? t.colors.amex : issuer === 'chase' ? t.colors.chase : t.colors.savor;
  const fg = issuer === 'amex' ? t.colors.ink : '#FFFFFF';
  const issuerName =
    issuer === 'amex' ? 'American Express' : issuer === 'chase' ? 'Chase' : 'Capital One';
  return (
    <View
      style={{
        position: 'absolute',
        top,
        left,
        width: 200,
        height: 124,
        borderRadius: t.radii.lg,
        backgroundColor: bg,
        ...t.border.thin,
        ...t.shadow.chunkier,
        padding: 14,
        justifyContent: 'space-between',
        transform: [{ rotate: `${rotate}deg` }],
      }}
    >
      <Text
        style={{
          color: fg,
          fontFamily: t.fonts.bodyBold,
          fontSize: 12,
          letterSpacing: 1,
          opacity: 0.9,
        }}
      >
        {issuerName.toUpperCase()}
      </Text>
      <View
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 32,
          height: 24,
          borderRadius: 4,
          backgroundColor: issuer === 'amex' ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
        }}
      />
      <View>
        <Text
          style={{
            color: fg,
            fontFamily: t.fonts.monoMedium,
            fontSize: 12,
            letterSpacing: 1.5,
            opacity: 0.85,
          }}
        >
          •••• •••• •••• {last4}
        </Text>
        <Text
          style={{
            color: fg,
            fontFamily: t.fonts.bodyBold,
            fontSize: 16,
            marginTop: 2,
            letterSpacing: -0.3,
          }}
        >
          {name}
        </Text>
      </View>
    </View>
  );
}

export default function Landing() {
  const router = useRouter();

  const start = async () => {
    await setStep('landing');
    router.push('/auth/phone');
  };

  return (
    <Screen
      footer={
        <>
          <ChunkyBtn label="Get started — it's free" size="lg" fullWidth onPress={start} />
          <Text
            style={{
              textAlign: 'center',
              fontSize: 13,
              color: t.colors.dim,
              marginTop: 14,
              fontFamily: t.fonts.bodyRegular,
            }}
          >
            <Text style={{ fontFamily: t.fonts.bodySemiBold, color: t.colors.graphite }}>
              Already in?
            </Text>{' '}
            Log in with your number
          </Text>
        </>
      }
    >
      {/* Brand bar */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 6,
          paddingBottom: 18,
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
        <Pressable hitSlop={8} onPress={() => router.push('/auth/phone')}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: t.fonts.bodySemiBold,
              color: t.colors.graphite,
            }}
          >
            Log in
          </Text>
        </Pressable>
      </View>

      {/* Hero — wallet spill */}
      <View style={{ height: 220, marginBottom: 12 }}>
        <CardSticker issuer="chase" name="Sapphire Reserve" last4="••21" rotate={-8} top={32} left={8} />
        <CardSticker issuer="amex" name="Gold Card" last4="••04" rotate={4} top={64} left={88} />
        <CardSticker issuer="savor" name="Savor" last4="••55" rotate={11} top={20} left={170} />
        <Text style={{ position: 'absolute', top: 14, right: 8, fontSize: 22 }}>✦</Text>
        <Text style={{ position: 'absolute', top: 170, left: 0, fontSize: 18, color: t.colors.coral }}>
          ✦
        </Text>
      </View>

      {/* Headline */}
      <View>
        <Text
          style={{
            fontFamily: t.fonts.display,
            fontSize: 48,
            lineHeight: 48,
            letterSpacing: -1.5,
            color: t.colors.ink,
          }}
        >
          Your wallet{'\n'}just got
        </Text>
        <View
          style={{
            alignSelf: 'flex-start',
            marginTop: 6,
            backgroundColor: t.colors.lemon,
            paddingHorizontal: 12,
            paddingVertical: 2,
            borderRadius: t.radii.md,
            borderWidth: 2.5,
            borderColor: t.colors.ink,
            ...t.shadow.chunkiest,
            transform: [{ rotate: '-1.5deg' }],
          }}
        >
          <Text
            style={{
              fontFamily: t.fonts.display,
              fontSize: 48,
              lineHeight: 52,
              letterSpacing: -1.5,
              color: t.colors.ink,
            }}
          >
            opinionated.
          </Text>
        </View>
        <Text
          style={{
            fontSize: 17,
            lineHeight: 24,
            color: t.colors.graphite,
            marginTop: 22,
            maxWidth: 320,
            letterSpacing: -0.2,
            fontFamily: t.fonts.bodyRegular,
          }}
        >
          Know which card to swipe,{' '}
          <Text style={{ fontFamily: t.fonts.bodyRegular, fontStyle: 'italic' }}>before</Text> you
          swipe it. We track your rewards, credits, and every coffee you forget to expense.
        </Text>
      </View>
    </Screen>
  );
}
