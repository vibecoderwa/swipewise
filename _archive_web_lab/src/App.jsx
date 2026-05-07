import { useEffect, useState, useCallback } from 'react';
import { api, clearSession } from './lib/api.js';
import TabBar from './components/TabBar.jsx';
import HomeScreen from './screens/Home.jsx';
import CategoriesScreen from './screens/Categories.jsx';
import AnalyticsScreen from './screens/Analytics.jsx';
import CreditsScreen from './screens/CreditsScreen.jsx';
import SettingsScreen from './screens/Settings.jsx';
import Landing from './screens/Landing.jsx';
import AuthPhone from './screens/AuthPhone.jsx';
import AuthOTP from './screens/AuthOTP.jsx';
import Onboarding from './screens/Onboarding.jsx';

const TAB_KEY = 'swipewise_tab';
const STAGE_KEY = 'swipewise_stage';
const ONBOARDED_KEY = 'swipewise_onboarded';

// Stages: 'landing' | 'auth_phone' | 'auth_otp' | 'onboarding' | 'app'
function initialStage() {
  const saved = localStorage.getItem(STAGE_KEY);
  // If we already have a phone-verified user, jump past auth.
  if (api.getPhone()) {
    return localStorage.getItem(ONBOARDED_KEY) === '1' ? 'app' : 'onboarding';
  }
  return saved || 'landing';
}

export default function App() {
  const [stage, setStage] = useState(initialStage);
  const [pendingAuth, setPendingAuth] = useState(null); // { phone, demoCode }

  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [insights, setInsights] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState(() => localStorage.getItem(TAB_KEY) || 'home');

  useEffect(() => { localStorage.setItem(TAB_KEY, tab); }, [tab]);
  useEffect(() => { localStorage.setItem(STAGE_KEY, stage); }, [stage]);

  const refresh = useCallback(async () => {
    try {
      const [a, i, r] = await Promise.all([
        api.accounts(),
        api.insights(),
        api.recommendations(),
      ]);
      setAccounts(a.accounts);
      setInsights(i);
      setRecommendations(r);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  // Once we hit the main app, hydrate user state.
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
  }

  // ─── Pre-app flow ─────────────────────────────────────────
  if (stage === 'landing') {
    return (
      <div className="app">
        <Landing onStart={() => setStage('auth_phone')} />
      </div>
    );
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
    return (
      <div className="app">
        <div className="screen"><div className="loading">Loading…</div></div>
      </div>
    );
  }

  const hasAccounts = accounts.length > 0 || (insights?.user_cards?.length || 0) > 0;

  return (
    <div className="app">
      {tab === 'home' && (
        <HomeScreen
          hasAccounts={hasAccounts}
          insights={insights}
          error={error}
          onConnected={refresh}
        />
      )}

      {tab === 'cats' && <CategoriesScreen insights={insights} />}

      {tab === 'analytics' && (
        <AnalyticsScreen insights={insights} recommendations={recommendations} cards={cards} />
      )}

      {tab === 'credits' && <CreditsScreen insights={insights} />}

      {tab === 'settings' && (
        <SettingsScreen
          accounts={accounts}
          cards={cards}
          syncing={syncing}
          onSync={manualSync}
          onChange={refresh}
          onSignOut={handleSignOut}
        />
      )}

      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
