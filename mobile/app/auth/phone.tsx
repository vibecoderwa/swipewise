// AuthA_Phone — phone number entry. FR-AUTH-01.
// E.164 format expected by backend: ^\+[1-9]\d{7,14}$
// We default to +1 / US for v1 (en-US only, FRD §15).

import { useMemo, useState } from 'react';
import { View, Text, TextInput, Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { ChunkyBtn } from '../../components/Button';
import { Pill } from '../../components/Pill';
import { StepHeader } from '../../components/StepHeader';
import { theme as t } from '../../theme';
import { api } from '../../lib/api';
import { setStep } from '../../lib/storage';

function formatUs(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function AuthPhone() {
  const router = useRouter();
  const [raw, setRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const e164 = useMemo(() => {
    const d = raw.replace(/\D/g, '');
    return d.length === 10 ? `+1${d}` : null;
  }, [raw]);

  async function send() {
    if (!e164) return;
    try {
      setSubmitting(true);
      await api.sendOtp(e164);
      await setStep('phone');
      router.push({ pathname: '/auth/otp', params: { phone: e164 } });
    } catch (err) {
      Alert.alert("Couldn't send code", err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen
        scroll
        footer={
          <>
            <ChunkyBtn
              label={submitting ? 'Sending…' : 'Send me a code'}
              size="lg"
              fullWidth
              disabled={!e164 || submitting}
              onPress={send}
            />
            <Text
              style={{
                textAlign: 'center',
                fontSize: 11.5,
                color: t.colors.dim,
                marginTop: 14,
                lineHeight: 17,
                fontFamily: t.fonts.bodyRegular,
              }}
            >
              By continuing, you agree to the Terms & Privacy.{'\n'}
              Standard message rates may apply.
            </Text>
            <Pressable
              hitSlop={8}
              onPress={() =>
                router.push({ pathname: '/auth/otp', params: { phone: '+14155550199', demo: '1' } })
              }
              style={{ marginTop: 10, alignSelf: 'center' }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: t.colors.plumDk,
                  fontFamily: t.fonts.bodyBold,
                  textDecorationLine: 'underline',
                }}
              >
                Preview without verification →
              </Text>
            </Pressable>
          </>
        }
      >
        <StepHeader step="Step 1 of 3" />

        <View style={{ marginTop: 36 }}>
          <Pill label="sign in · no password" bg={t.colors.mint} />
          <Text
            style={{
              fontFamily: t.fonts.display,
              fontSize: 40,
              lineHeight: 40,
              letterSpacing: -1.2,
              marginTop: 16,
              marginBottom: 10,
              color: t.colors.ink,
            }}
          >
            What's your{'\n'}number, boss?
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: t.colors.graphite,
              lineHeight: 21,
              fontFamily: t.fonts.bodyRegular,
            }}
          >
            We'll text you a code. No passwords to forget. No "your account has been breached"
            emails at 3am.
          </Text>
        </View>

        {/* Phone input */}
        <View style={{ marginTop: 28, flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              backgroundColor: t.colors.cream,
              borderColor: t.colors.ink,
              borderWidth: 2.5,
              borderRadius: t.radii.lg,
              paddingHorizontal: 14,
              paddingVertical: 12,
              ...t.shadow.chunkier,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 18 }}>🇺🇸</Text>
            <Text style={{ fontFamily: t.fonts.bodyBold, fontSize: 18 }}>+1</Text>
          </View>
          <TextInput
            value={formatUs(raw)}
            onChangeText={setRaw}
            keyboardType="phone-pad"
            placeholder="(415) 555-0199"
            placeholderTextColor={t.colors.dim}
            autoFocus
            maxLength={14}
            style={{
              flex: 1,
              backgroundColor: t.colors.paper,
              borderColor: t.colors.ink,
              borderWidth: 2.5,
              borderRadius: t.radii.lg,
              paddingHorizontal: 18,
              paddingVertical: 12,
              fontFamily: t.fonts.bodyBold,
              fontSize: 22,
              color: t.colors.ink,
              letterSpacing: 1,
              ...t.shadow.chunkier,
            }}
          />
        </View>
        <Text
          style={{
            fontSize: 12,
            color: t.colors.dim,
            marginTop: 10,
            fontFamily: t.fonts.bodyRegular,
          }}
        >
          We never share your number. Unsubscribe on first text if you change your mind.
        </Text>

        {/* Why no password card */}
        <View
          style={{
            marginTop: 24,
            padding: 16,
            backgroundColor: t.colors.cream,
            ...t.border.medium,
            borderRadius: t.radii.lg,
          }}
        >
          <Text
            style={{
              fontFamily: t.fonts.bodyExtraBold,
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 10,
            }}
          >
            why no password?
          </Text>
          {[
            "You won't forget it at tax time.",
            'Phishing is useless against OTP.',
            "We don't store anything we don't have to.",
          ].map((line) => (
            <Text
              key={line}
              style={{
                fontSize: 13,
                color: t.colors.graphite,
                marginBottom: 6,
                fontFamily: t.fonts.bodyRegular,
              }}
            >
              ✓ {line}
            </Text>
          ))}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
