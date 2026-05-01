import { useEffect, useState, useCallback } from 'react';
import { api } from './lib/api.js';
import PlaidConnect from './components/PlaidConnect.jsx';
import AccountList from './components/AccountList.jsx';
import Insights from './components/Insights.jsx';
import ShareButton from './components/ShareButton.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';
import Recommendations from './components/Recommendations.jsx';
import Credits from './components/Credits.jsx';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [insights, setInsights] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [syncing, setSyncing] = useState(false);

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
    try {
      await api.sync();
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  if (!ready) return <div className="app"><div className="loading">Loading…</div></div>;

  const hasAccounts = accounts.length > 0;

  return (
    <div className="app">
      <div className="brand">
        <div className="brand-left">
          <div className="brand-mark" />
          <div className="brand-name">Swipewise</div>
        </div>
        <ShareButton />
      </div>

      <InstallPrompt />

      {!hasAccounts && (
        <div className="hero">
          <span className="sparkle s1">✦</span>
          <span className="sparkle s2">✦</span>
          <h1>
            Your wallet<br/>
            just got<br/>
            <span className="pop">opinionated.</span>
          </h1>
          <p>
            Know which card to swipe, <i>before</i> you swipe it. We track your rewards, credits, and every coffee you forget to optimize.
          </p>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {!hasAccounts && (
        <div className="card">
          <h2>Get started</h2>
          <PlaidConnect onConnected={refresh} />
        </div>
      )}

      {hasAccounts && <Insights data={insights} />}

      {hasAccounts && <Recommendations data={recommendations} allCards={cards} />}

      {hasAccounts && <Credits userCards={insights?.user_cards || []} />}

      {hasAccounts && (
        <div className="card">
          <h2>Your accounts</h2>
          <AccountList accounts={accounts} cards={cards} onChange={refresh} />
        </div>
      )}

      {hasAccounts && (
        <div className="card">
          <h2>Add another bank</h2>
          <PlaidConnect onConnected={refresh} />
          <div style={{ height: 8 }} />
          <button className="btn secondary" onClick={manualSync} disabled={syncing}>
            {syncing ? 'Syncing…' : 'Sync transactions'}
          </button>
        </div>
      )}
    </div>
  );
}
