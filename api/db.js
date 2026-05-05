import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, '..', 'swipewise.db');

mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS plaid_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    item_id TEXT NOT NULL,
    institution_name TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT,
    mask TEXT,
    type TEXT,
    subtype TEXT,
    matched_card_id TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    name TEXT,
    merchant_name TEXT,
    amount REAL,
    date TEXT,
    category TEXT,
    pfc_primary TEXT,
    pfc_detailed TEXT
  );

  CREATE TABLE IF NOT EXISTS captured_credits (
    user_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    credit_id TEXT NOT NULL,
    captured INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, card_id, credit_id)
  );

  CREATE TABLE IF NOT EXISTS manual_cards (
    user_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, card_id)
  );

  CREATE TABLE IF NOT EXISTS auth_otps (
    phone TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0
  );
`);

// Lightweight migration for existing dbs that pre-date the phone column
try {
  const cols = db.prepare("PRAGMA table_info(users)").all();
  if (!cols.find(c => c.name === 'phone')) {
    db.exec('ALTER TABLE users ADD COLUMN phone TEXT');
  }
} catch (_) { /* ignore */ }

export function getOrCreateUser(userId) {
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (existing) return existing;
  db.prepare('INSERT INTO users (id, created_at) VALUES (?, ?)').run(userId, Date.now());
  return { id: userId };
}

export function findUserByPhone(phone) {
  return db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
}

export function setUserPhone(userId, phone) {
  db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(phone, userId);
}
