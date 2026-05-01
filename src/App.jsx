import { useEffect, useState, useCallback } from 'react';
import { api } from './lib/api.js';
import PlaidConnect from './components/PlaidConnect.jsx';
import AccountList from './components/AccountList.jsx';
import Insights from './components/Insights.jsx';
import ShareButton from './components/ShareButton.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';
import Recommendations from './components/Recommendations.jsx';
import Credits from './components/Credits.jsx';

function SectionHead({ eyebrow, title, em, right }) {
  return (
    <div className="section-head">
      <div className="meta">
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}{em && <> <em>{em}</em></>}{title && '.'}</h2>
      </div>
      {right && <div className="right">{right}</div>}
    </div>
  );
}

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
  const userCardCount = (insights?.user_cards || []).length;

  return (
    <div className="app">
      <div className="brand">
        <div className="brand-left">
          <div className="brand-mark" />
          <span className="brand-name">Swipewise</span>
        </div>
        <ShareButton />
      </div>

      <InstallPrompt />

      {!hasAccounts && (
        <div className="hero">
          <div className="eyebrow">Welcome</div>
          <h1>The smartest <em>card</em> to swipe.</h1>
          <p>
            Connect once. We'll quietly tell you which card to use — and what you've been <b>leaving on the table</b>.
          </p>
          <PlaidConnect onConnected={refresh} />
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {hasAccounts && (
        <>
          <SectionHead
            eyebrow={`Reflective · last 30 days`}
            title="What you've been"
            em="leaving on the table"
            right={null}
          />
          <Insights data={insights} />
        </>
      )}

      {hasAccounts && userCardCount > 0 && (
        <>
          <SectionHead
            eyebrow="Agent recommendations"
            title="Cards worth"
            em="applying for"
            right={null}
          />
          <Recommendations data={recommendations} allCards={cards} />
        </>
      )}

      {hasAccounts && userCardCount > 0 && (
        <>
          <SectionHead
            eyebrow="Benefits · annual"
            title="Credits &"
            em="perks"
          />
          <Credits userCards={insights?.user_cards || []} />
        </>
      )}

      {hasAccounts && (
        <>
          <SectionHead
            eyebrow="Setup"
            title="Your"
            em="accounts"
          />
          <div className="card">
            <AccountList accounts={accounts} cards={cards} onChange={refresh} />
          </div>
        </>
      )}

      {hasAccounts && (
        <div className="card" style={{ marginTop: 12 }}>
          <PlaidConnect onConnected={refresh} />
          <div style={{ height: 10 }} />
          <button className="btn secondary" onClick={manualSync} disabled={syncing}>
            {syncing ? 'Syncing…' : 'Sync transactions'}
          </button>
        </div>
      )}
    </div>
  );
}
