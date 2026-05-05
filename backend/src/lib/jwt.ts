import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db/client.js';

const ACCESS_SECRET  = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TTL     = '1h';
const REFRESH_DAYS   = 30;

export interface AccessPayload { sub: string; type: 'access' }
export interface RefreshPayload { sub: string; type: 'refresh'; jti: string }

export function signAccess(userId: string): string {
  return jwt.sign({ sub: userId, type: 'access' } satisfies AccessPayload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export async function signRefresh(userId: string): Promise<string> {
  const jti     = crypto.randomUUID();
  const token   = jwt.sign({ sub: userId, type: 'refresh', jti } satisfies RefreshPayload, REFRESH_SECRET, { expiresIn: `${REFRESH_DAYS}d` });
  const hash    = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + REFRESH_DAYS * 86_400_000);

  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, hash, expires],
  );

  return token;
}

export function verifyAccess(token: string): AccessPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload;
}

export async function rotateRefresh(oldToken: string): Promise<{ access: string; refresh: string } | null> {
  let payload: RefreshPayload;
  try {
    payload = jwt.verify(oldToken, REFRESH_SECRET) as RefreshPayload;
  } catch {
    return null;
  }

  const hash = crypto.createHash('sha256').update(oldToken).digest('hex');
  const { rowCount } = await pool.query(
    'DELETE FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()',
    [hash],
  );
  if (!rowCount) return null;

  const access  = signAccess(payload.sub);
  const refresh = await signRefresh(payload.sub);
  return { access, refresh };
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}
