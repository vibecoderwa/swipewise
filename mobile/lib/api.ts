// Thin client for the Swipewise backend (Express + Postgres).
// Base URL comes from app.json `extra.apiBaseUrl`; override per-env later.

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL: string =
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ??
  'http://localhost:8080';

const TOKEN_KEY = 'swipewise.accessToken';
const REFRESH_KEY = 'swipewise.refreshToken';
const USER_KEY = 'swipewise.userId';

export type Tokens = { token: string; refreshToken: string; userId: string };

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (init.auth) {
    const tok = await AsyncStorage.getItem(TOKEN_KEY);
    if (tok) headers.set('Authorization', `Bearer ${tok}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = (body as { error?: string }).error ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body as T;
}

export const api = {
  baseUrl: BASE_URL,

  sendOtp: (phone: string) =>
    request<{ sent: true }>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyOtp: async (phone: string, code: string) => {
    const tokens = await request<Tokens>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
    await AsyncStorage.multiSet([
      [TOKEN_KEY, tokens.token],
      [REFRESH_KEY, tokens.refreshToken],
      [USER_KEY, tokens.userId],
    ]);
    return tokens;
  },

  signOut: async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY, USER_KEY]);
  },

  merchantsNear: (lat: number, lng: number, radius = 1500) =>
    request<{
      merchants: Array<{
        id: string;
        name: string;
        category: string;
        lat: number;
        lng: number;
        distanceM: number;
        bestCard?: { issuer: string; name: string; multiplier: number };
        expectedReward?: number;
      }>;
    }>(`/merchants/near?lat=${lat}&lng=${lng}&radius=${radius}`, { auth: true }),

  getCards: () =>
    request<
      Array<{
        id: 'gold' | 'csr' | 'savor';
        name: string;
        issuer: string;
        currency: string;
        pointsLabel: string;
        isCashback?: boolean;
        source: 'plaid' | 'manual';
        annualFee: number;
        cpp: number;
      }>
    >('/cards', { auth: true }),

  getPlaidItems: () =>
    request<
      Array<{
        id: string;
        institution_name: string;
        status: string;
        error_code: string | null;
        last_synced_at: string | null;
        created_at: string;
      }>
    >('/plaid/items', { auth: true }),

  getSummary: (range: 'month' | 'quarter' | 'year') =>
    request<{
      summary: {
        rows: Array<{
          id: string;
          name: string;
          monthlySpend: number;
          annualSpend: number;
          winner: 'gold' | 'csr' | 'savor';
          runnerUp: 'gold' | 'csr' | 'savor';
          delta: number;
          confidence: 'high' | 'medium' | 'low';
          per: Record<'gold' | 'csr' | 'savor', { mult: number; pts: number; val: number }>;
        }>;
        totalSpendAnnual: number;
        totalSpendMonthly: number;
        cards: Record<
          'gold' | 'csr' | 'savor',
          { pts: number; rewards: number; credits: number; fee: number; net: number }
        >;
        ranking: Array<{ id: 'gold' | 'csr' | 'savor'; name: string; net: number }>;
        optimizedRewards: number;
        optimizedNet: number;
        delta: number;
      };
      timeline: Array<{ month: number; label: string; [card: string]: number | string }>;
    }>(`/transactions/summary?range=${range}`, { auth: true }),

  getCredits: () =>
    request<
      Array<{
        cardId: 'gold' | 'csr' | 'savor';
        cardName: string;
        credits: Array<{
          id: string;
          name: string;
          annual: number;
          cadence: string;
          note?: string;
          durable?: boolean;
          captured: boolean;
        }>;
        totalPotential: number;
        totalCaptured: number;
      }>
    >('/credits', { auth: true }),

  setCreditCaptured: (cardId: string, creditId: string, captured: boolean) =>
    request<{ cardId: string; creditId: string; captured: boolean }>(
      `/credits/${cardId}/${creditId}`,
      {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ captured }),
      },
    ),
};
