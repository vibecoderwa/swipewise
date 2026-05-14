// OnboardA_Plaid — Plaid as primary path. FR-ONB-01, FR-ONB-04.
//
// M1: Plaid Link via react-native-webview Modal.
//
// Why a Modal+WebView and not WebBrowser.openAuthSessionAsync:
// iOS's ASWebAuthenticationSession (what openAuthSessionAsync uses) restricts
// iframes and modal popups, which Plaid Link relies on to render its UI.
// In that environment, /plaid/link-page would load and show "Opening Plaid
// Link…" but Plaid's iframe never renders. A regular WebView has no such
// restriction, and we intercept the swipewise://plaid-callback redirect
// via onShouldStartLoadWithRequest.

import { useState } from 'react';
import { View, Text, Pressable, Alert, Modal, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '../../components/Screen';
import { ChunkyBtn } from '../../components/Button';
import { Pill } from '../../components/Pill';
import { theme as t } from '../../theme';
import { setStep } from '../../lib/storage';
import { api } from '../../lib/api';

const TOKEN_KEY = 'swipewise.accessToken';
const RETURN_URL = 'swipewise://plaid-callback';

async function authedJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const tok = await AsyncStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (tok) headers.set('Authorization', `Bearer ${tok}`);
  const res = await fetch(`${api.baseUrl}${path}`, { ...init, headers });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export default function OnboardPlaid() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [exchanging, setExchanging] = useState(false);

  async function connect() {
    if (loading) return;
    setLoading(true);
    try {
      // Backend returns hosted_link_url whenever Plaid sandbox provisions it.
      // Hosted Link runs the entire flow on plaid.com (handles OAuth banks
      // like Chase / BofA without needing Universal Links on our side). On
      // completion, Plaid redirects to swipewise://plaid-callback with a
      // public_token query param — caught by onShouldStartLoadWithRequest.
      //
      // If hosted_link_url comes back null (older Plaid SDK or non-supporting
      // env), fall back to the in-house /plaid/link-page HTML shim — works
      // for non-OAuth sandbox banks only.
      const tokenResp = await authedJson<{
        link_token: string;
        hosted_link_url: string | null;
      }>('/plaid/link-token', { method: 'POST', body: '{}' });

      setLinkUrl(
        tokenResp.hosted_link_url ??
          `${api.baseUrl}/plaid/link-page?token=${encodeURIComponent(tokenResp.link_token)}`,
      );
    } catch (e) {
      Alert.alert("Couldn't connect", e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCallback(url: string): Promise<void> {
    setLinkUrl(null);
    if (!url.startsWith(RETURN_URL)) return;
    try {
      const u = new URL(url);
      const cancelled = u.searchParams.get('cancelled');
      const error = u.searchParams.get('error');
      const publicToken = u.searchParams.get('public_token');
      if (cancelled) return;
      if (error) {
        Alert.alert("Couldn't connect", `Plaid error: ${error}`);
        return;
      }
      if (!publicToken) {
        Alert.alert("Couldn't connect", 'No token returned from Plaid.');
        return;
      }
      setExchanging(true);
      await authedJson('/plaid/exchange', {
        method: 'POST',
        body: JSON.stringify({ public_token: publicToken }),
      });
      await setStep('done');
      router.replace('/home');
    } catch (e) {
      Alert.alert("Couldn't connect", e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setExchanging(false);
    }
  }

  async function manual() {
    await setStep('plaid');
    router.push('/onboarding/manual');
  }

  return (
    <>
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
            <ChunkyBtn
              label={loading ? 'Opening…' : exchanging ? 'Linking…' : 'Connect my bank'}
              fullWidth
              onPress={connect}
              disabled={loading || exchanging}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
          <Pill label="256-bit encrypted" bg={t.colors.cream} />
          <Pill label="read-only" bg={t.colors.cream} />
          <Pill label="no selling" bg={t.colors.cream} />
        </View>

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
              <Text style={{ fontFamily: t.fonts.display, fontSize: 22, lineHeight: 26 }}>+</Text>
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

      <Modal
        visible={!!linkUrl}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setLinkUrl(null)}
      >
        <View style={{ flex: 1, backgroundColor: t.colors.paper }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 60,
              paddingHorizontal: 20,
              paddingBottom: 12,
              backgroundColor: t.colors.paper,
              borderBottomColor: t.colors.hairline,
              borderBottomWidth: 1,
            }}
          >
            <Pressable onPress={() => setLinkUrl(null)} hitSlop={12}>
              <Text style={{ fontFamily: t.fonts.bodySemiBold, fontSize: 16, color: t.colors.ink }}>
                Cancel
              </Text>
            </Pressable>
            <Text style={{ fontFamily: t.fonts.bodyExtraBold, fontSize: 15, color: t.colors.ink }}>
              Connect your bank
            </Text>
            <View style={{ width: 50 }} />
          </View>
          {linkUrl ? (
            <WebView
              source={{ uri: linkUrl }}
              originWhitelist={['https://*', 'http://*', 'swipewise://*']}
              onShouldStartLoadWithRequest={(req) => {
                if (req.url.startsWith(RETURN_URL)) {
                  handleCallback(req.url);
                  return false;
                }
                return true;
              }}
              startInLoadingState
              renderLoading={() => (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActivityIndicator color={t.colors.ink} />
                </View>
              )}
              javaScriptEnabled
              domStorageEnabled
              thirdPartyCookiesEnabled
            />
          ) : null}
        </View>
      </Modal>
    </>
  );
}
