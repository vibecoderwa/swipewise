import { useEffect, useState, useCallback } from 'react';
import { api } from './lib/api.js';
import TabBar from './components/TabBar.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';
import HomeScreen from './screens/Home.jsx';
import CategoriesScreen from './screens/Categories.jsx';
import AnalyticsScreen from './screens/Analytics.jsx';
import CreditsScreen from './screens/CreditsScreen.jsx';
import SettingsScreen from './screens/Settings.jsx';

const TAB_KEY = 'swipewise_tab';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [insights, setInsights] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState(() => localStorage.getItem(TAB_KEY) || 'home');

  useEffect(() => { localStorage.setItem(TAB_KEY, tab); }, [tab]);

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

  useEffect(() => {
    (async () => {
      try {
        await api.me();
        const c = await api.cards();
        setCards(c.cards);
        await refresh();
      } catch (e) {
        setError(e.message);
      } finally {
        setReady(true);
      }
    })();
  }, [refresh]);

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

  if (!ready) {
    return (
      <div className="app">
        <div className="screen"><div className="loading">Loading…</div></div>
      </div>
    );
  }

  const hasAccounts = accounts.length > 0;

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
        />
      )}

      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
