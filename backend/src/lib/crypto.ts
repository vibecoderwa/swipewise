import crypto from 'crypto';

// AES-256-GCM envelope encryption for Plaid access_tokens.
// Key: 32-byte hex string in AES_KEY env var.
const KEY = Buffer.from(process.env.AES_KEY ?? '0'.repeat(64), 'hex');
const ALGO = 'aes-256-gcm';

export function encrypt(plaintext: string): Buffer {
  const iv         = crypto.randomBytes(12);
  const cipher     = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted  = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag        = cipher.getAuthTag();
  // layout: 12-byte IV | 16-byte tag | ciphertext
  return Buffer.concat([iv, tag, encrypted]);
}

export function decrypt(data: Buffer): string {
  const iv        = data.subarray(0, 12);
  const tag       = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher  = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
