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
    const twilio = (await import('twilio')).default;
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `Your Swipewise code is ${code}. Don't share it with anyone. Not even your dog.`,
      from: TWILIO_PHONE_NUMBER,
      to:   phone,
    });
  } else {
    // Dev mode — log to console so you can test without Twilio credentials
    console.log(`[otp] Code for ${phone}: ${code}`);
  }
}
