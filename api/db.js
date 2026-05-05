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

  -- Smart-swipe events: a row per time the user confirmed they used the
  -- recommended card. Source of truth for streaks (consecutive weeks with
  -- ≥1 event) and YTD totals (sum of reward dollars in the current year).
  CREATE TABLE IF NOT EXISTS swipe_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    card_id TEXT,
    merchant TEXT,
    location TEXT,
    category TEXT,
    rate REAL,
    basket REAL,
    reward REAL,
    created_at INTEGER NOT NULL,
    iso_year INTEGER NOT NULL,
    iso_week INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_swipes_user ON swipe_events(user_id, created_at DESC);

  -- User-authored social posts. Friends posts are seeded in-memory.
  CREATE TABLE IF NOT EXISTS feed_posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    swipe_id TEXT,
    card_id TEXT,
    merchant TEXT,
    location TEXT,
    category TEXT,
    rate REAL,
    emoji TEXT,
    caption TEXT,
    tagged_ids TEXT,
    visibility TEXT NOT NULL DEFAULT 'friends',
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_posts_user ON feed_posts(user_id, created_at DESC);

  -- Pending swipes the user could share (auto-suggest cards in feed).
  -- Created when the seeder/Plaid detects a smart swipe; consumed when the
  -- user shares it or dismisses it.
  CREATE TABLE IF NOT EXISTS pending_swipes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    swipe_id TEXT,
    card_id TEXT,
    merchant TEXT,
    location TEXT,
    category TEXT,
    rate REAL,
    created_at INTEGER NOT NULL,
    dismissed_at INTEGER
  );

  -- Lightweight social/preferences kv per user.
  CREATE TABLE IF NOT EXISTS user_prefs (
    user_id TEXT PRIMARY KEY,
    default_visibility TEXT NOT NULL DEFAULT 'friends',
    reduce_patterns INTEGER NOT NULL DEFAULT 0,
    notif_arrival INTEGER NOT NULL DEFAULT 1,
    notif_expiring INTEGER NOT NULL DEFAULT 1,
    notif_weekly INTEGER NOT NULL DEFAULT 0,
    cpp REAL NOT NULL DEFAULT 1.5,
    auto_share INTEGER NOT NULL DEFAULT 0,
    suggest_tags INTEGER NOT NULL DEFAULT 1,
    show_badges INTEGER NOT NULL DEFAULT 1,
    persona TEXT NOT NULL DEFAULT 'roadwarrior',
    streak_freezes INTEGER NOT NULL DEFAULT 2,
    nag_under_amount REAL NOT NULL DEFAULT 20,
    crowd_optin INTEGER NOT NULL DEFAULT 0,
    seeded INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT 0
  );
`);

// Lightweight migrations for older dbs
try {
  const cols = db.prepare("PRAGMA table_info(user_prefs)").all();
  const colNames = new Set(cols.map(c => c.name));
  if (cols.length) {
    if (!colNames.has('seeded'))         db.exec('ALTER TABLE user_prefs ADD COLUMN seeded INTEGER NOT NULL DEFAULT 0');
    if (!colNames.has('auto_share'))     db.exec('ALTER TABLE user_prefs ADD COLUMN auto_share INTEGER NOT NULL DEFAULT 0');
    if (!colNames.has('suggest_tags'))   db.exec('ALTER TABLE user_prefs ADD COLUMN suggest_tags INTEGER NOT NULL DEFAULT 1');
    if (!colNames.has('show_badges'))    db.exec('ALTER TABLE user_prefs ADD COLUMN show_badges INTEGER NOT NULL DEFAULT 1');
    if (!colNames.has('persona'))        db.exec("ALTER TABLE user_prefs ADD COLUMN persona TEXT NOT NULL DEFAULT 'roadwarrior'");
    if (!colNames.has('streak_freezes')) db.exec('ALTER TABLE user_prefs ADD COLUMN streak_freezes INTEGER NOT NULL DEFAULT 2');
    if (!colNames.has('nag_under_amount')) db.exec('ALTER TABLE user_prefs ADD COLUMN nag_under_amount REAL NOT NULL DEFAULT 20');
    if (!colNames.has('crowd_optin'))    db.exec('ALTER TABLE user_prefs ADD COLUMN crowd_optin INTEGER NOT NULL DEFAULT 0');
  }
} catch (_) { /* ignore */ }

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

// ISO week — Monday-start. Returns { year, week } for use as the streak bucket.
export function isoYearWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Thursday in current week decides the year
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

export function getPrefs(userId) {
  let row = db.prepare('SELECT * FROM user_prefs WHERE user_id = ?').get(userId);
  if (!row) {
    db.prepare(`INSERT INTO user_prefs (user_id, updated_at) VALUES (?, ?)`).run(userId, Date.now());
    row = db.prepare('SELECT * FROM user_prefs WHERE user_id = ?').get(userId);
  }
  return row;
}

export function setPrefs(userId, patch) {
  const cur = getPrefs(userId);
  const merged = { ...cur, ...patch, updated_at: Date.now() };
  db.prepare(`
    UPDATE user_prefs SET
      default_visibility = ?, reduce_patterns = ?, notif_arrival = ?,
      notif_expiring = ?, notif_weekly = ?, cpp = ?,
      auto_share = ?, suggest_tags = ?, show_badges = ?,
      persona = ?, streak_freezes = ?, nag_under_amount = ?, crowd_optin = ?,
      seeded = ?, updated_at = ?
    WHERE user_id = ?
  `).run(
    merged.default_visibility, merged.reduce_patterns ? 1 : 0,
    merged.notif_arrival ? 1 : 0, merged.notif_expiring ? 1 : 0,
    merged.notif_weekly ? 1 : 0, merged.cpp,
    merged.auto_share ? 1 : 0, merged.suggest_tags ? 1 : 0, merged.show_badges ? 1 : 0,
    merged.persona, merged.streak_freezes, merged.nag_under_amount, merged.crowd_optin ? 1 : 0,
    merged.seeded ? 1 : 0, merged.updated_at, userId
  );
  return getPrefs(userId);
}
