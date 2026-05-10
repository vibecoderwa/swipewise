import crypto from 'crypto';
import pool from '../db/client.js';

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS    = 3;

export function generateCode(): string {
  return String(crypto.randomInt(100_000, 999_999));
}

export async function issueOtp(phone: string): Promise<string> {
  // Invalidate any existing unused codes for this number
  await pool.query('UPDATE otp_codes SET used = TRUE WHERE phone = $1 AND used = FALSE', [phone]);

  const code      = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);
  await pool.query(
    'INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)',
    [phone, code, expiresAt],
  );
  return code;
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const { rows } = await pool.query<{ id: string; code: string; attempts: number }>(
    `SELECT id, code, attempts FROM otp_codes
     WHERE phone = $1 AND used = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [phone],
  );

  if (!rows.length) return false;
  const row = rows[0];

  if (row.attempts >= MAX_ATTEMPTS) return false;

  if (row.code !== code) {
    await pool.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1', [row.id]);
    return false;
  }

  await pool.query('UPDATE otp_codes SET used = TRUE WHERE id = $1', [row.id]);
  return true;
}

export async function sendOtp(phone: string, code: string): Promise<void> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
    console.log(`[otp] TWILIO PATH: env-vars-detected | from=${TWILIO_PHONE_NUMBER} to=${phone}`);
    const twilio = (await import('twilio')).default;
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    try {
      const msg = await client.messages.create({
        body: `Your Swipewise code is ${code}. Don't share it with anyone. Not even your dog.`,
        from: TWILIO_PHONE_NUMBER,
        to:   phone,
      });
      console.log(`[otp] Twilio response: sid=${msg.sid} status=${msg.status} errorCode=${msg.errorCode ?? 'none'} errorMessage=${msg.errorMessage ?? 'none'}`);
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string; moreInfo?: string; status?: number };
      console.error(`[otp] Twilio ERROR: code=${e.code} status=${e.status} message=${e.message} moreInfo=${e.moreInfo}`);
      throw err; // re-throw so route returns 502
    }
  } else {
    console.log(`[otp] TWILIO PATH: dev-fallback (missing vars: SID=${!!TWILIO_ACCOUNT_SID} TOKEN=${!!TWILIO_AUTH_TOKEN} FROM=${!!TWILIO_PHONE_NUMBER})`);
    console.log(`[otp] Code for ${phone}: ${code}`);
  }
}
