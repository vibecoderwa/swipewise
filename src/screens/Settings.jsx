import { useEffect, useState } from 'react';
import ScreenHeader from '../components/ScreenHeader.jsx';
import Folio from '../components/Folio.jsx';
import AccountList from '../components/AccountList.jsx';
import PlaidConnect from '../components/PlaidConnect.jsx';
import ShareButton from '../components/ShareButton.jsx';
import { api } from '../lib/api.js';

const VISIBILITIES = [
  { id: 'friends', l: 'Friends', em: '👥' },
  { id: 'public',  l: 'Public',  em: '🌐' },
  { id: 'private', l: 'Private', em: '🔒' },
];

function Toggle({ on, onClick }) {
  return <button type="button" className={`toggle ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on} />;
}

function Group({ title, children }) {
  return (
    <div className="s-group">
      <div className="gh">{title}</div>
      <div className="body">{children}</div>
    </div>
  );
}

function Row({ label, sub, right, onClick }) {
  return (
    <div className="s-row" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="text">
        <div className="label">{label}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export default function SettingsScreen({ accounts, cards, syncing, onSync, onChange, onSignOut }) {
  const phone = api.getPhone();
  const [prefs, setPrefs] = useState(null);

  useEffect(() => {
    let cancel = false;
    api.prefs().then(p => { if (!cancel) setPrefs(p); }).catch(() => {});
    return () => { cancel = true; };
  }, []);

  function patch(k, v) {
    setPrefs(p => ({ ...p, [k]: v }));
    api.setPrefs({ [k]: v }).catch(() => {});
  }

  const p = prefs || {
    default_visibility: 'friends',
    reduce_patterns: false,
    notif_arrival: true,
    notif_expiring: true,
    notif_weekly: false,
  };

  return (
    <div className="screen">
      <ScreenHeader eyebrow="Preferences" title="Settings" right={<Folio n={9} />} />

      {/* Account */}
      <Group title="Account">
        {phone && <Row label="Phone" sub={`${phone} · verified`} right={<span style={{ fontSize: 12, color: 'var(--mint-dk)', fontWeight: 700 }}>✓</span>} />}
        <Row label="Sign out" sub="Disconnect this device"
             onClick={onSignOut}
             right={<span className="chev">›</span>} />
      </Group>

      {/* Connections */}
      <Group title="Connections">
        <Row label="Bank connection"
             sub={accounts.length > 0
               ? `${accounts.length} account${accounts.length === 1 ? '' : 's'} via Plaid`
               : 'Read-only via Plaid'}
             right={
               <button className="brand-action" onClick={onSync} disabled={syncing}>
                 {syncing ? 'Syncing…' : 'Sync'}
               </button>
             } />
        <div className="s-row">
          <div className="text" style={{ width: '100%' }}>
            {accounts.length === 0 ? (
              <div className="muted small" style={{ marginBottom: 10 }}>No accounts connected yet.</div>
            ) : (
              <AccountList accounts={accounts} cards={cards} onChange={onChange} />
            )}
            <PlaidConnect onConnected={onChange} />
          </div>
        </div>
      </Group>

      {/* Notifications */}
      <Group title="Notifications">
        <Row label="Arrival pings" sub="Tell me when I'm at a known merchant"
             right={<Toggle on={p.notif_arrival} onClick={() => patch('notif_arrival', !p.notif_arrival)} />} />
        <Row label="Expiring credits" sub="Alert me 48h before something expires"
             right={<Toggle on={p.notif_expiring} onClick={() => patch('notif_expiring', !p.notif_expiring)} />} />
        <Row label="Weekly summary" sub="A Sunday morning recap"
             right={<Toggle on={p.notif_weekly} onClick={() => patch('notif_weekly', !p.notif_weekly)} />} />
      </Group>

      {/* Social */}
      <Group title="Social">
        <div className="s-row">
          <div className="text" style={{ width: '100%' }}>
            <div className="label" style={{ marginBottom: 8 }}>Default visibility</div>
            <div className="vis-chips">
              {VISIBILITIES.map(v => (
                <button key={v.id}
                        className={p.default_visibility === v.id ? 'on' : ''}
                        onClick={() => patch('default_visibility', v.id)}>
                  <span>{v.em}</span>{v.l}
                </button>
              ))}
            </div>
            <div className="sub" style={{ marginTop: 8 }}>
              Who sees your swipes when you don't override it on a post.
            </div>
          </div>
        </div>
      </Group>

      {/* Honest privacy block — explicitly states what's shared, what isn't,
          and what your network can still infer from "amount-hidden" posts.
          The "Reduce pattern visibility" toggle is the practical lever. */}
      <Group title="Privacy">
        <div className="privacy-block">
          <div className="h">What we share when you post</div>
          <div className="lines">
            <div><span className="ok">✓</span>Merchant + city</div>
            <div><span className="ok">✓</span>Card brand + multiplier earned</div>
            <div><span className="ok">✓</span>Optional emoji, caption, tagged friends</div>
            <div><span className="ok">✓</span>Time of post</div>
          </div>
          <div className="h">What we never share</div>
          <div className="lines">
            <div><span className="no">✗</span>Amount you spent</div>
            <div><span className="no">✗</span>Exact address or coordinates</div>
            <div><span className="no">✗</span>Card number or last-4</div>
            <div><span className="no">✗</span>Account balance or credit limit</div>
          </div>
          <div className="aside">
            <b>One thing worth knowing.</b> Even with amounts hidden, a stream of posts says a lot
            about you — where you eat, when you travel, neighborhoods you frequent, how often you fly.
            <i> That's social.</i> The toggle below is the practical lever.
          </div>
        </div>
        <Row
          label="Reduce pattern visibility"
          sub={p.reduce_patterns
            ? 'Locations rounded to neighborhood. Posts batched weekly.'
            : 'Recommended if your feed is public or has weak ties.'}
          right={<Toggle on={p.reduce_patterns} onClick={() => patch('reduce_patterns', !p.reduce_patterns)} />}
        />
        <Row label="Export my data" right={<span className="chev">›</span>} />
        <Row label="Delete account" sub="Permanent, no take-backs"
             right={<span style={{ fontSize: 12, color: 'var(--coral-dk)', fontWeight: 700 }}>danger</span>} />
      </Group>

      <Group title="Share">
        <div className="s-row">
          <div className="text" style={{ width: '100%' }}>
            <div className="sub" style={{ marginBottom: 12 }}>
              Send Swipewise to a friend who's leaving rewards on the table.
            </div>
            <ShareButton fullWidth />
          </div>
        </div>
      </Group>

      <div style={{ textAlign: 'center', color: 'var(--dim)', fontSize: 11, marginTop: 22, fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
        ❋ Swipewise v2 · made with restraint ❋
      </div>
    </div>
  );
}
