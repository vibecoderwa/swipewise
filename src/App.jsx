import { useEffect, useState, useCallback } from 'react';
import { api } from './lib/api.js';
import PlaidConnect from './components/PlaidConnect.jsx';
import AccountList from './components/AccountList.jsx';
import Insights from './components/Insights.jsx';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [insights, setInsights] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [a, i] = await Promise.all([api.accounts(), api.insights()]);
      setAccounts(a.accounts);
      setInsights(i);
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
        <div className="brand-mark" />
        <div className="brand-name">Swipewise</div>
      </div>

      {!hasAccounts && (
        <div className="hero">
          <h1>The smartest card to swipe.</h1>
          <p>Connect a card, and we'll show you what to use—and what you've been leaving on the table.</p>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <div className="card">
        <h2>{hasAccounts ? 'Add another bank' : 'Get started'}</h2>
        <PlaidConnect onConnected={refresh} />
        {hasAccounts && (
          <>
            <div style={{ height: 8 }} />
            <button className="btn secondary" onClick={manualSync} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Sync transactions'}
            </button>
          </>
        )}
      </div>

      {hasAccounts && (
        <div className="card">
          <h2>Your accounts</h2>
          <AccountList accounts={accounts} cards={cards} onChange={refresh} />
        </div>
      )}

      {hasAccounts && <Insights data={insights} />}
    </div>
  );
}
