// Moments — preview-only gallery of how Swipewise will look in iOS chrome
// (push notifications, Dynamic Island Live Activity, lock-screen widgets,
// home-screen widgets). These are mocks for the future-state vision; they're
// not real OS integrations. Reachable via Settings → "Moments preview".
import { useState } from 'react';
import Folio from '../components/Folio.jsx';

const VARIANTS = [
  { id: 'push',     l: 'Push (arrival)' },
  { id: 'share',    l: 'Push (share?)' },
  { id: 'island',   l: 'Dynamic Island' },
  { id: 'lock',     l: 'Lock widgets' },
  { id: 'home',     l: 'Home widgets' },
];

function StatusBar({ time = '9:41' }) {
  return (
    <div className="moments-status">
      <span>{time}</span>
      <span className="ind">
        <svg width="17" height="11" viewBox="0 0 17 11">
          <rect x="0"    y="7"   width="3" height="4"   rx="0.5" fill="currentColor" />
          <rect x="4.5"  y="5"   width="3" height="6"   rx="0.5" fill="currentColor" />
          <rect x="9"    y="2.5" width="3" height="8.5" rx="0.5" fill="currentColor" />
          <rect x="13.5" y="0"   width="3" height="11"  rx="0.5" fill="currentColor" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="currentColor" fill="none" />
          <rect x="2"   y="2"   width="16" height="8"  rx="1.5" fill="currentColor" />
        </svg>
      </span>
    </div>
  );
}

function PushArrival() {
  return (
    <div className="moments-screen dark">
      <StatusBar time="2:14" />
      <div className="moments-clock">
        <div className="day">Sunday, April 26</div>
        <div className="time">2:14</div>
      </div>
      <div className="moments-glow" style={{ background: 'radial-gradient(circle, rgba(212,178,84,0.18) 0%, transparent 60%)' }} />
      <div className="moments-notifs">
        <div className="notif-card">
          <div className="brand">$</div>
          <div className="body">
            <div className="head"><span className="app">Swipewise</span><span className="ts">now</span></div>
            <div className="msg">
              Walking into Whole Foods? <span style={{ color: 'var(--mint-dk)' }}>Use Gold</span> — 4× on
              groceries, +$9.60 on your usual basket.
            </div>
          </div>
        </div>
        <div className="notif-card faded">
          <div className="brand alt">⏰</div>
          <div className="body">
            <div className="head"><span className="app">Swipewise</span><span className="ts">2h ago</span></div>
            <div className="msg">Uber Cash expires Sunday — $15 unused</div>
          </div>
        </div>
      </div>
      <div className="moments-tip">tap notification to open app</div>
    </div>
  );
}

function PushPostSwipe() {
  return (
    <div className="moments-screen dark">
      <StatusBar time="7:42" />
      <div className="moments-clock">
        <div className="day">Thursday, May 1</div>
        <div className="time">7:42</div>
      </div>
      <div className="moments-glow" style={{ background: 'radial-gradient(circle, rgba(156,180,154,0.20) 0%, transparent 60%)' }} />
      <div className="moments-notifs">
        <div className="notif-card">
          <div className="brand">$</div>
          <div className="body">
            <div className="head"><span className="app">Swipewise</span><span className="ts">now</span></div>
            <div className="msg">
              Nice — Gold @ <b>MTR · Bellevue</b>. <span style={{ color: 'var(--mint-dk)' }}>4× earned.</span>{' '}
              Tap to share with friends.
            </div>
          </div>
        </div>
        <div className="quick-actions">
          <span className="qa primary">⚡ Share now</span>
          <span className="qa">+ vibe</span>
          <span className="qa muted">skip</span>
        </div>
      </div>
      <div className="moments-tip">long-press for actions · tap to open feed</div>
    </div>
  );
}

function DynamicIsland() {
  return (
    <div className="moments-screen dark">
      <StatusBar />
      <div className="dynamic-island">
        <div className="card-mark">AMEX</div>
        <div className="island-body">
          <div className="eye">You're at Whole Foods</div>
          <div className="line">Swipe Gold · 4× points</div>
        </div>
        <div className="island-pill">+$9.60</div>
      </div>
      <div className="moments-clock" style={{ paddingTop: 110 }}>
        <div className="day">Sunday, April 26</div>
        <div className="time">2:14</div>
      </div>
      <div className="island-grid">
        <div className="g-card">
          <div className="lab">Swipewise</div>
          <div className="big">Use Gold here</div>
          <div className="sm">4× on groceries</div>
        </div>
        <div className="g-card">
          <div className="lab">Expiring</div>
          <div className="big">Uber $15</div>
          <div className="sm" style={{ color: '#ffb4a2' }}>in 2 days</div>
        </div>
      </div>
      <div className="moments-tip">tap the island to open</div>
    </div>
  );
}

function LockWidgets() {
  return (
    <div className="moments-screen dark">
      <StatusBar />
      <div className="moments-glow" style={{ background: 'radial-gradient(circle, rgba(212,178,84,0.15) 0%, transparent 60%)' }} />
      <div className="moments-clock" style={{ paddingTop: 40 }}>
        <div className="day">Sunday, April 26</div>
        <div className="time">9:41</div>
      </div>
      <div className="lock-widgets-row">
        <div className="circ-widget">
          <div className="lab">USE</div>
          <div className="big">4×</div>
          <div className="lab" style={{ color: '#ffd93d' }}>GOLD</div>
        </div>
        <div className="circ-widget alert">
          <div style={{ fontSize: 16 }}>⏰</div>
          <div className="big" style={{ fontSize: 18 }}>$15</div>
          <div className="lab" style={{ fontSize: 8 }}>UBER · 2d</div>
        </div>
      </div>
      <div className="lock-rect">
        <div className="card-mark amex-mark">AMEX</div>
        <div className="rect-body">
          <div className="lab">At Whole Foods · use</div>
          <div className="line">Gold · 4× groceries</div>
        </div>
        <div className="badge-amt">+$9.60</div>
      </div>
      <div className="moments-tip">lock-screen widgets · iOS 16+</div>
    </div>
  );
}

function HomeWidgets() {
  return (
    <div className="moments-screen home-bg">
      <StatusBar />
      <div className="home-widget-stack">
        <div className="widget medium">
          <div className="row">
            <div className="lab">TOP 3 NEAR YOU</div>
            <div className="lab" style={{ opacity: 0.6 }}>updated just now</div>
          </div>
          <div className="merch-row">
            <span className="ic">🛒</span>
            <div style={{ flex: 1 }}>
              <div className="n">Whole Foods</div>
              <div className="s">220 ft</div>
            </div>
            <span className="brand-swatch amex" />
            <span className="mult">4×</span>
          </div>
          <div className="merch-row">
            <span className="ic">⛽</span>
            <div style={{ flex: 1 }}>
              <div className="n">Shell</div>
              <div className="s">0.2 mi</div>
            </div>
            <span className="brand-swatch savor" />
            <span className="mult">3%</span>
          </div>
          <div className="merch-row">
            <span className="ic">☕</span>
            <div style={{ flex: 1 }}>
              <div className="n">Blue Bottle</div>
              <div className="s">0.3 mi</div>
            </div>
            <span className="brand-swatch amex" />
            <span className="mult">4×</span>
          </div>
        </div>
        <div className="widget-row">
          <div className="widget small lemon">
            <div className="lab">NEAREST</div>
            <div className="title">Whole Foods</div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <span className="brand-swatch amex" />
              <div>
                <div className="lab" style={{ color: 'var(--graphite)' }}>Use Gold</div>
                <div className="big">4×</div>
              </div>
            </div>
          </div>
          <div className="widget small ink">
            <div className="lab" style={{ color: 'rgba(255,255,255,0.6)' }}>THIS MONTH</div>
            <div className="big">+$83</div>
            <div className="sm" style={{ color: 'rgba(255,255,255,0.7)' }}>vs using one card</div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 4 }}>
              <span style={{ width: 14, height: 9, borderRadius: 2, background: 'var(--amex)' }} />
              <span style={{ width: 14, height: 9, borderRadius: 2, background: 'var(--chase)' }} />
              <span style={{ width: 14, height: 9, borderRadius: 2, background: 'var(--savor)' }} />
            </div>
          </div>
        </div>
      </div>
      <div className="moments-tip" style={{ color: 'rgba(255,255,255,0.85)' }}>home-screen widgets · today view</div>
    </div>
  );
}

const VARIANT_RENDER = {
  push: PushArrival,
  share: PushPostSwipe,
  island: DynamicIsland,
  lock: LockWidgets,
  home: HomeWidgets,
};

export default function MomentsScreen({ go }) {
  const [active, setActive] = useState('push');
  const Render = VARIANT_RENDER[active];

  return (
    <div className="screen">
      <div className="screen-header" style={{ position: 'relative' }}>
        <div className="eyebrow">Future state · preview</div>
        <h1 style={{ fontSize: 36 }}>Moments<br/><em>worth a glance.</em></h1>
        <div className="topright"><Folio n={12} /></div>
      </div>

      <p className="hero-q-sub">
        Mocks of how Swipewise will live in iOS chrome — notifications, Dynamic Island,
        lock-screen widgets, home-screen widgets. Not yet shipped; <i>this is the vision</i>.
      </p>

      <div className="moments-tabs">
        {VARIANTS.map(v => (
          <button
            key={v.id}
            className={active === v.id ? 'on' : ''}
            onClick={() => setActive(v.id)}
          >
            {v.l}
          </button>
        ))}
      </div>

      <div className="moments-frame">
        <Render />
      </div>
    </div>
  );
}
