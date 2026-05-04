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

function Pill({ children, tone = 'mint' }) {
  return <span className={`pill-chip ${tone}`}>{children}</span>;
}

function timeAgoShort(ts) {
  const d = Date.now() - ts;
  if (d < 60_000) return 'just now';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)} min ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)} h ago`;
  return `${Math.floor(d / 86_400_000)} d ago`;
}

export default function SettingsScreen({ accounts, cards, syncing, onSync, onChange, onSignOut, go }) {
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
    cpp: 1.5,
    auto_share: false,
    suggest_tags: true,
    show_badges: true,
  };

  // Connections summary line
  const plaidAccounts = accounts.filter(a => a.matched_card);
  const lastSyncTs = accounts[0]?.last_sync_at;
  const connectionSub = accounts.length === 0
    ? 'Read-only via Plaid · not connected'
    : `${accounts[0]?.institution_name || 'Bank'} · ${plaidAccounts.length || accounts.length} account${(plaidAccounts.length || accounts.length) === 1 ? '' : 's'}${lastSyncTs ? ' · synced ' + timeAgoShort(lastSyncTs) : ''}`;

  return (
    <div className="screen">
      <div className="screen-header" style={{ position: 'relative' }}>
        <div className="eyebrow">Preferences</div>
        <h1 style={{ fontSize: 38, lineHeight: 0.98 }}>
          A few <em>knobs</em><br/>for the picky.
        </h1>
        <div className="topright"><Folio n={9} /></div>
      </div>

      <Group title="Account">
        {phone && (
          <Row label="Phone"
               sub={`${phone} · verified`}
               right={<span style={{ fontSize: 12, color: 'var(--mint-dk)', fontWeight: 700 }}>✓</span>} />
        )}
        <Row label="Sign out" sub="Disconnect this device"
             onClick={onSignOut}
             right={<span className="chev">›</span>} />
      </Group>

      <Group title="Connections">
        <Row label="Plaid"
             sub={connectionSub}
             right={accounts.length > 0
               ? <Pill tone="mint">connected</Pill>
               : <Pill tone="cream">not connected</Pill>} />
        <Row label="Sync transactions"
             sub={syncing ? 'Pulling latest…' : 'Pull the latest from your bank'}
             onClick={syncing ? null : onSync}
             right={<span className="chev">{syncing ? '…' : '↻'}</span>} />
        <Row label="Add another bank"
             onClick={() => {}} /* PlaidConnect lives just below */
             right={<span style={{ fontSize: 18, fontWeight: 800 }}>+</span>} />
        <div className="s-row" style={{ paddingTop: 0 }}>
          <div className="text" style={{ width: '100%' }}>
            {accounts.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <AccountList accounts={accounts} cards={cards} onChange={onChange} />
              </div>
            )}
            <PlaidConnect onConnected={onChange} />
          </div>
        </div>
      </Group>

      <Group title="Notifications">
        <Row label="Arrival pings" sub="Tell me when I'm at a known merchant"
             right={<Toggle on={p.notif_arrival} onClick={() => patch('notif_arrival', !p.notif_arrival)} />} />
        <Row label="Expiring credits" sub="Alert me 48h before something expires"
             right={<Toggle on={p.notif_expiring} onClick={() => patch('notif_expiring', !p.notif_expiring)} />} />
        <Row label="Weekly summary" sub="A Sunday morning recap"
             right={<Toggle on={p.notif_weekly} onClick={() => patch('notif_weekly', !p.notif_weekly)} />} />
      </Group>

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
        <Row label="Auto-share my swipes"
             sub={p.auto_share
               ? 'Posts go up automatically — no prompt.'
               : "We'll suggest, you decide."}
             right={<Toggle on={p.auto_share} onClick={() => patch('auto_share', !p.auto_share)} />} />
        <Row label="Suggest friend tags"
             sub="Based on past co-swipes at the same place"
             right={<Toggle on={p.suggest_tags} onClick={() => patch('suggest_tags', !p.suggest_tags)} />} />
        <Row label="Show multiplier badges"
             sub="Big 4× and 5× on your posts"
             right={<Toggle on={p.show_badges} onClick={() => patch('show_badges', !p.show_badges)} />} />
        <Row label="Manage friends"
             sub="4 friends · 2 pending"
             onClick={() => go?.('friends')}
             right={<span className="chev">›</span>} />
      </Group>

      <Group title="Preferences">
        <div className="s-row">
          <div className="text" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="label">Cents per point</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900 }}>
                {p.cpp.toFixed(1)}¢
              </div>
            </div>
            <div className="sub" style={{ marginTop: 2 }}>
              How you value the points you earn. Higher means we'll push points cards harder.
            </div>
            <input
              type="range" min={1.0} max={3.0} step={0.1}
              value={p.cpp}
              onChange={e => patch('cpp', parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: 12, accentColor: 'var(--lemon-dk)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--dim)', marginTop: 4 }}>
              <span>cash-only</span><span>balanced</span><span>points-maxxer</span>
            </div>
          </div>
        </div>
      </Group>

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
        <Row label="See myself as a friend would"
             sub="Preview the public version of your profile"
             onClick={() => {}}
             right={<span className="chev">›</span>} />
        <Row label="Export my data" onClick={() => {}} right={<span className="chev">›</span>} />
        <Row label="Delete account" sub="Permanent, no take-backs"
             right={<span style={{ fontSize: 12, color: 'var(--coral-dk)', fontWeight: 700 }}>danger</span>} />
      </Group>

      <Group title="Future">
        <Row label="Moments preview"
             sub="iOS chrome mocks — push, Dynamic Island, lock & home widgets"
             onClick={() => go?.('moments')}
             right={<span className="chev">›</span>} />
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
