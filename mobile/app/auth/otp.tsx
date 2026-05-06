// AuthB_OTP — 6-digit code, auto-advance, paste-to-fill, 60s resend timer.
// FR-AUTH-02. Backend enforces 3-attempt lockout + 10-min expiry.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { ChunkyBtn } from '../../components/Button';
import { Pill } from '../../components/Pill';
import { StepHeader } from '../../components/StepHeader';
import { theme as t } from '../../theme';
import { api } from '../../lib/api';
import { setStep } from '../../lib/storage';

const RESEND_SECS = 60;

export default function AuthOtp() {
  const router = useRouter();
  const { phone, demo } = useLocalSearchParams<{ phone: string; demo?: string }>();
  const isDemo = demo === '1';
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resend, setResend] = useState(RESEND_SECS);
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resend <= 0) return;
    const id = setTimeout(() => setResend((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resend]);

  const code = digits.join('');
  const masked = useMemo(() => maskPhone(phone), [phone]);

  function update(i: number, val: string) {
    // Paste-to-fill: if user pastes 6+ digits, distribute them.
    const just = val.replace(/\D/g, '');
    if (just.length > 1) {
      const pasted = just.slice(0, 6).split('');
      const next = ['', '', '', '', '', ''];
      for (let k = 0; k < pasted.length; k++) next[k] = pasted[k];
      setDigits(next);
      const focusAt = Math.min(pasted.length, 5);
      inputs.current[focusAt]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = just;
    setDigits(next);
    if (just && i < 5) inputs.current[i + 1]?.focus();
  }

  function backspaceAt(i: number) {
    if (digits[i]) return;
    if (i > 0) {
      const next = [...digits];
      next[i - 1] = '';
      setDigits(next);
      inputs.current[i - 1]?.focus();
    }
  }

  async function verify() {
    if (code.length !== 6 || !phone) return;
    if (isDemo) {
      await setStep('otp');
      router.replace({ pathname: '/onboarding/plaid', params: { demo: '1' } });
      return;
    }
    try {
      setSubmitting(true);
      await api.verifyOtp(phone, code);
      await setStep('otp');
      router.replace('/onboarding/plaid');
    } catch (err) {
      Alert.alert('Code rejected', err instanceof Error ? err.message : 'Invalid or expired code');
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  async function resendCode() {
    if (resend > 0 || !phone) return;
    try {
      await api.sendOtp(phone);
      setResend(RESEND_SECS);
    } catch (err) {
      Alert.alert("Couldn't resend", err instanceof Error ? err.message : 'Unknown error');
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
          <ChunkyBtn
            label={submitting ? 'Verifying…' : isDemo ? 'Continue (preview) →' : 'Verify & continue'}
            size="lg"
            fullWidth
            bg={t.colors.mint}
            fg={t.colors.ink}
            disabled={(!isDemo && code.length !== 6) || submitting}
            onPress={verify}
          />
        }
      >
        <StepHeader step="Step 2 of 3" />

        <View style={{ marginTop: 36 }}>
          <Pill label={isDemo ? 'preview mode · no backend' : 'check your texts'} bg={isDemo ? t.colors.lemon : t.colors.sky} />
          <Text
            style={{
              fontFamily: t.fonts.display,
              fontSize: 42,
              lineHeight: 42,
              letterSpacing: -1.2,
              marginTop: 16,
              marginBottom: 10,
              color: t.colors.ink,
            }}
          >
            Six digits, and{'\n'}we're in.
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: t.colors.graphite,
              lineHeight: 21,
              fontFamily: t.fonts.bodyRegular,
            }}
          >
            Code sent to{' '}
            <Text style={{ fontFamily: t.fonts.bodyBold }}>{masked || 'your phone'}</Text>. Expires
            in 10:00.
          </Text>
        </View>

        {/* OTP boxes */}
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            justifyContent: 'center',
            marginTop: 40,
          }}
        >
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => {
                inputs.current[i] = r;
              }}
              value={d}
              onChangeText={(v) => update(i, v)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') backspaceAt(i);
              }}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={i === 0}
              textContentType={i === 0 ? 'oneTimeCode' : 'none'}
              style={{
                width: 48,
                height: 60,
                backgroundColor: d ? t.colors.lemon : t.colors.paper,
                borderColor: t.colors.ink,
                borderWidth: 2.5,
                borderRadius: t.radii.md,
                ...(d ? t.shadow.chunkier : t.shadow.chunky),
                textAlign: 'center',
                fontFamily: t.fonts.display,
                fontSize: 30,
                color: t.colors.ink,
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={resendCode}
          disabled={resend > 0}
          hitSlop={8}
          style={{ marginTop: 28, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 14, color: t.colors.graphite, fontFamily: t.fonts.bodyRegular }}>
            Didn't get it?{' '}
            <Text
              style={{
                fontFamily: t.fonts.bodyBold,
                color: t.colors.plumDk,
                textDecorationLine: 'underline',
              }}
            >
              {resend > 0 ? `Resend in 0:${String(resend).padStart(2, '0')}` : 'Resend now'}
            </Text>
          </Text>
        </Pressable>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function maskPhone(p?: string): string {
  if (!p) return '';
  // +14155550199 → +1 (415) ••• 0199
  const d = p.replace(/\D/g, '');
  if (d.length < 11) return p;
  return `+${d.slice(0, 1)} (${d.slice(1, 4)}) ••• ${d.slice(7)}`;
}
