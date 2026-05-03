import { useEffect, useState, useCallback } from 'react';
import { api, clearSession } from './lib/api.js';
import TabBar from './components/TabBar.jsx';
import BackButton from './components/BackButton.jsx';
import MotionScreen from './components/MotionScreen.jsx';
import HomeScreen from './screens/Home.jsx';
import CardsScreen from './screens/Cards.jsx';
import InsightsScreen from './screens/Insights.jsx';
import SettingsScreen from './screens/Settings.jsx';
import FriendsScreen from './screens/Friends.jsx';
import ComposeScreen from './screens/Compose.jsx';
import WinMoment from './screens/WinMoment.jsx';
import Landing from './screens/Landing.jsx';
import AuthPhone from './screens/AuthPhone.jsx';
import AuthOTP from './screens/AuthOTP.jsx';
import Onboarding from './screens/Onboarding.jsx';

const TAB_KEY = 'swipewise_tab';
const STAGE_KEY = 'swipewise_stage';
const ONBOARDED_KEY = 'swipewise_onboarded';

const TAB_IDS = new Set(['home', 'cards', 'insights', 'settings']);

function initialStage() {
  const saved = localStorage.getItem(STAGE_KEY);
  if (api.getPhone()) {
    return localStorage.getItem(ONBOARDED_KEY) === '1' ? 'app' : 'onboarding';
  }
  return saved || 'landing';
}

export default function App() {
  const [stage, setStage] = useState(initialStage);
  const [pendingAuth, setPendingAuth] = useState(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [insights, setInsights] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [credits, setCredits] = useState(null);
  const [streak, setStreak] = useState({ streak: 0, ytd_total: 0, ytd_year: new Date().getFullYear() });
  const [feed, setFeed] = useState({ posts: [], pending: [], friends: [], friends_week: { names: [], total_reward: '0' } });
  const [syncing, setSyncing] = useState(false);

  // Screen routing — a small stack so the floating back button works.
  // The "tab" is whichever of TAB_IDS is currently on top of the stack
  // (or in history below the current off-tab screen).
  const [screen, setScreen] = useState(() => localStorage.getItem(TAB_KEY) || 'home');
  const [history, setHistory] = useState([]);
  // Optional context attached to the current screen (e.g. compose draft / win payload)
  const [ctx, setCtx] = useState(null);
  const [direction, setDirection] = useState('forward');

  useEffect(() => {
    if (TAB_IDS.has(screen)) localStorage.setItem(TAB_KEY, screen);
  }, [screen]);
  useEffect(() => { localStorage.setItem(STAGE_KEY, stage); }, [stage]);

  const refresh = useCallback(async () => {
    try {
      const [a, i, r, s, f, cr] = await Promise.all([
        api.accounts(),
        api.insights(),
        api.recommendations(),
        api.streak(),
        api.feed(),
        api.credits(),
      ]);
      setAccounts(a.accounts);
      setInsights(i);
      setRecommendations(r);
      setStreak(s);
      setFeed(f);
      setCredits(cr);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    if (stage !== 'app') return;
    let cancelled = false;
    (async () => {
      setReady(false);
      try {
        await api.me();
        const c = await api.cards();
        if (cancelled) return;
        setCards(c.cards);
        await refresh();
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [stage, refresh]);

  async function manualSync() {
    setSyncing(true);
    setError(null);
    try {
      await api.sync();
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  function handleSignOut() {
    clearSession();
    localStorage.removeItem(ONBOARDED_KEY);
    setStage('landing');
    setCards([]); setAccounts([]); setInsights(null); setRecommendations(null);
    setHistory([]); setScreen('home');
  }

  // ─── Navigation ───
  function go(next, nextCtx = null) {
    if (next === screen) return;
    setDirection('forward');
    // Switching to a tab clears the history (start fresh from the tab)
    if (TAB_IDS.has(next)) {
      setHistory([]);
    } else {
      setHistory(h => [...h, screen]);
    }
    setScreen(next);
    setCtx(nextCtx);
  }
  function back() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setDirection('back');
    setHistory(h => h.slice(0, -1));
    setScreen(prev);
    setCtx(null);
  }

  // ─── Pre-app flow ─────────────────────────────────────────
  if (stage === 'landing') {
    return <div className="app"><Landing onStart={() => setStage('auth_phone')} /></div>;
  }
  if (stage === 'auth_phone') {
    return (
      <div className="app">
        <AuthPhone
          onBack={() => setStage('landing')}
          onSent={({ phone, demoCode }) => {
            setPendingAuth({ phone, demoCode });
            setStage('auth_otp');
          }}
        />
      </div>
    );
  }
  if (stage === 'auth_otp') {
    return (
      <div className="app">
        <AuthOTP
          phone={pendingAuth?.phone}
          demoCode={pendingAuth?.demoCode}
          onBack={() => setStage('auth_phone')}
          onVerified={() => setStage('onboarding')}
        />
      </div>
    );
  }
  if (stage === 'onboarding') {
    return (
      <div className="app">
        <Onboarding
          onDone={() => {
            localStorage.setItem(ONBOARDED_KEY, '1');
            setStage('app');
          }}
        />
      </div>
    );
  }

  // ─── Main app ─────────────────────────────────────────────
  if (!ready) {
    return <div className="app"><div className="screen"><div className="loading">Loading…</div></div></div>;
  }

  const hasAccounts = accounts.length > 0 || (insights?.user_cards?.length || 0) > 0;
  const hideTabBar = screen === 'compose' || screen === 'winmoment';

  // Screens that show on a dark background — the back button switches to its
  // light-on-dark variant for those.
  const isDarkScreen = false;

  const screenMode = (screen === 'compose' || screen === 'winmoment') ? 'sheet' : 'page';

  return (
    <div className="app">
      {/* Floating back button — universal nav chrome, hidden when no history */}
      {history.length > 0 && (
        <BackButton onClick={back} dark={isDarkScreen} />
      )}

      <MotionScreen key={screen} direction={direction} mode={screenMode}>

      {screen === 'home' && (
        <HomeScreen
          hasAccounts={hasAccounts}
          insights={insights}
          streak={streak}
          friendsWeek={feed.friends_week}
          error={error}
          onConnected={refresh}
          go={go}
        />
      )}
      {screen === 'cards' && (
        <CardsScreen
          insights={insights}
          credits={credits}
          go={go}
          onChange={refresh}
        />
      )}
      {screen === 'insights' && (
        <InsightsScreen
          insights={insights}
          recommendations={recommendations}
          cards={cards}
          credits={credits}
          streak={streak}
          go={go}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          accounts={accounts}
          cards={cards}
          syncing={syncing}
          onSync={manualSync}
          onChange={refresh}
          onSignOut={handleSignOut}
          go={go}
        />
      )}

      {screen === 'friends' && (
        <FriendsScreen
          feed={feed}
          go={go}
          onRefresh={refresh}
        />
      )}
      {screen === 'compose' && (
        <ComposeScreen
          ctx={ctx}
          friends={feed.friends}
          go={go}
          back={back}
          onPosted={refresh}
        />
      )}
      {screen === 'winmoment' && (
        <WinMoment
          ctx={ctx}
          go={go}
          onClaim={refresh}
        />
      )}

      </MotionScreen>

      {!hideTabBar && (
        <TabBar
          active={TAB_IDS.has(screen) ? screen : (history.find(h => TAB_IDS.has(h)) || 'home')}
          onChange={go}
        />
      )}
    </div>
  );
}
