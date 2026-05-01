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
`);

export function getOrCreateUser(userId) {
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (existing) return existing;
  db.prepare('INSERT INTO users (id, created_at) VALUES (?, ?)').run(userId, Date.now());
  return { id: userId };
}
