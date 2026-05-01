# Run Swipewise locally on a Mac

Three commands. ~5 minutes.

## 1. Install Node (one-time, skip if already installed)

Open **Terminal** (⌘+Space → "Terminal"). Paste:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
```

Verify:

```
node -v
```

Should print `v20.x` or higher.

## 2. Get the code

```
cd ~
git clone https://github.com/vibecoderwa/swipewise
cd swipewise
git checkout claude/implement-design-requirements-lrTny
npm install
```

## 3. Run it

```
npm run dev
```

Wait until you see both lines:

```
[api] swipewise api on :3001
[web]   Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser. That's it.

## Demo walkthrough

1. **Get started** → enter any 10-digit phone → Send code
2. OTP is `421906` (shown on the screen, no SMS)
3. **Enter cards manually** → pick Amex Gold, Sapphire Reserve, Savor → Continue
4. Browse Home, tap a merchant for the arrival sheet, check Categories / Analytics / Credits / Settings

## Stop the app

In Terminal: **Ctrl+C**.

## Restart later

```
cd ~/swipewise
npm run dev
```

## If something breaks

**"Port already in use" / EADDRINUSE:**
```
pkill -f node
npm run dev
```

**Pulled new changes from GitHub but app looks stale:**
```
git pull
npm install
npm run dev
```

**Want to wipe local data and start fresh:**
```
rm swipewise.db
npm run dev
```

## Plaid (optional)

Skip this for the manual-card demo path. To use real bank linking you need free Plaid sandbox credentials from https://dashboard.plaid.com.

```
cp .env.example .env
# edit .env: set PLAID_CLIENT_ID, PLAID_SECRET (sandbox), PLAID_ENV=sandbox
npm run dev
```

In Plaid Link, pick "First Platypus Bank" and use:
- username: `user_good`
- password: `pass_good`
