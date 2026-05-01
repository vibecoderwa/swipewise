import ScreenHeader from '../components/ScreenHeader.jsx';
import AccountList from '../components/AccountList.jsx';
import PlaidConnect from '../components/PlaidConnect.jsx';
import ShareButton from '../components/ShareButton.jsx';
import { api } from '../lib/api.js';

export default function SettingsScreen({ accounts, cards, syncing, onSync, onChange, onSignOut }) {
  const phone = api.getPhone();

  return (
    <div className="screen">
      <ScreenHeader eyebrow="Preferences" title="Settings" />

      <div className="card">
        <h2>My accounts</h2>
        {accounts.length === 0 ? (
          <div className="muted small" style={{ marginBottom: 12 }}>No accounts connected yet.</div>
        ) : (
          <AccountList accounts={accounts} cards={cards} onChange={onChange} />
        )}
      </div>

      <div className="card">
        <h2>Bank connection</h2>
        <div className="muted small" style={{ marginBottom: 14, lineHeight: 1.5 }}>
          Secured by Plaid. Read-only access. Bank credentials are never stored.
        </div>
        <PlaidConnect onConnected={onChange} />
        <div style={{ height: 10 }} />
        <button className="btn secondary" onClick={onSync} disabled={syncing}>
          {syncing ? 'Syncing…' : 'Sync transactions'}
        </button>
      </div>

      <div className="card">
        <h2>Account</h2>
        {phone && (
          <div className="muted small" style={{ marginBottom: 14, fontFamily: 'var(--font-mono)' }}>
            Signed in as {phone}
          </div>
        )}
        <button className="btn secondary" onClick={onSignOut}>Sign out</button>
      </div>

      <div className="card">
        <h2>Share</h2>
        <div className="muted small" style={{ marginBottom: 14 }}>
          Send Swipewise to a friend who's leaving rewards on the table.
        </div>
        <ShareButton fullWidth />
      </div>
    </div>
  );
}
