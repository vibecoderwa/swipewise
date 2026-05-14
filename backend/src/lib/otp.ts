import crypto from 'crypto';
import pool from '../db/client.js';

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS    = 3;

export function generateCode(): string {
  return String(crypto.randomInt(100_000, 999_999));
}

// ─── Path selection ──────────────────────────────────────────────────────────
// Three modes, in order of preference:
//
// 1. Twilio Verify  (TWILIO_VERIFY_SERVICE_SID set + Twilio account creds)
//    Twilio fully owns OTP issuance, delivery, and verification. Bypasses
//    A2P 10DLC (error 30034) because Verify uses pre-approved sender pools.
//    No code is stored in our DB. Recommended for production-shaped dev.
//
// 2. Twilio Programmable Messaging  (account creds + from-number set)
//    We generate the code, persist it in otp_codes, and ask Twilio to SMS
//    the body. Subject to A2P 10DLC (US carrier filtering) for unregistered
//    long-codes -- expect undelivered until 10DLC is registered.
//
// 3. Dev fallback  (no Twilio creds at all)
//    Code prints to the server console. Look in the Replit Shell logs.

function verifyMode(): boolean {
  return Boolean(process.env.TWILIO_VERIFY_SERVICE_SID && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

function messagingMode(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
}

// ─── Twilio Verify path ──────────────────────────────────────────────────────
// In Verify mode we don't persist codes ourselves. issueOtp returns an empty
// string (the route still calls it for API symmetry) and sendOtp triggers
// Twilio's send. verifyOtp delegates to Twilio's check endpoint.

async function verifyStartSend(phone: string): Promise<void> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;
  const twilio = (await import('twilio')).default;
  const client = twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!);
  console.log(`[otp] TWILIO PATH: verify-service | to=${phone}`);
  try {
    const v = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID!)
      .verifications.create({ to: phone, channel: 'sms' });
    console.log(`[otp] Twilio Verify response: sid=${v.sid} status=${v.status}`);
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string; moreInfo?: string; status?: number };
    console.error(`[otp] Twilio Verify ERROR: code=${e.code} status=${e.status} message=${e.message} moreInfo=${e.moreInfo}`);
    throw err;
  }
}

async function verifyCheckCode(phone: string, code: string): Promise<boolean> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;
  const twilio = (await import('twilio')).default;
  const client = twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!);
  try {
    const check = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to: phone, code });
    console.log(`[otp] Twilio Verify check: status=${check.status} valid=${check.valid}`);
    return check.status === 'approved';
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string };
    // Verify returns 404 if the verification has expired or the code is wrong
    // after too many attempts. Translate that into a normal verification fail.
    console.warn(`[otp] Twilio Verify check failed: code=${e.code} message=${e.message}`);
    return false;
  }
}

// ─── Messaging / DB path ─────────────────────────────────────────────────────

export async function issueOtp(phone: string): Promise<string> {
  if (verifyMode()) {
    // Verify owns code state. Trigger send here (issuance + delivery are coupled
    // for Verify) and return a sentinel; the route's separate sendOtp call is a
    // no-op in Verify mode.
    await verifyStartSend(phone);
    return '';
  }

  // Invalidate any existing unused codes for this number.
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
  if (verifyMode()) {
    return verifyCheckCode(phone, code);
  }

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
  // Verify mode: issueOtp already triggered the send. Nothing to do here.
  if (verifyMode()) {
    console.log(`[otp] sendOtp no-op (verify mode handled in issueOtp)`);
    return;
  }

  if (messagingMode()) {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
    console.log(`[otp] TWILIO PATH: messaging | from=${TWILIO_PHONE_NUMBER} to=${phone}`);
    const twilio = (await import('twilio')).default;
    const client = twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!);
    try {
      const msg = await client.messages.create({
        body: `Your Swipewise code is ${code}. Don't share it with anyone. Not even your dog.`,
        from: TWILIO_PHONE_NUMBER!,
        to:   phone,
      });
      console.log(`[otp] Twilio Messaging response: sid=${msg.sid} status=${msg.status} errorCode=${msg.errorCode ?? 'none'} errorMessage=${msg.errorMessage ?? 'none'}`);
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string; moreInfo?: string; status?: number };
      console.error(`[otp] Twilio Messaging ERROR: code=${e.code} status=${e.status} message=${e.message} moreInfo=${e.moreInfo}`);
      throw err;
    }
    return;
  }

  console.log(`[otp] TWILIO PATH: dev-fallback (no Twilio creds set)`);
  console.log(`[otp] Code for ${phone}: ${code}`);
}
