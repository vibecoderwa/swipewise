// StreakDetail — calendar grid (last 5 weeks of optimal/missed/freeze days),
// freezes counter, milestone tier strip. Reachable from the streak chip on
// Home. Replaces the simple-streak-jump-to-Insights flow.
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import Folio from '../components/Folio.jsx';

const TIERS = [
  { d: 7,   l: 'Wk' },
  { d: 30,  l: 'Mo' },
  { d: 100, l: '100' },
  { d: 365, l: 'Yr' },
];

export default function StreakDetail({ streak, go }) {
  const [log, setLog] = useState(null);
  const [prefs, setPrefs] = useState(null);

  useEffect(() => {
    api.log().then(setLog).catch(() => {});
    api.prefs().then(setPrefs).catch(() => {});
  }, []);

  const grid = useMemo(() => buildCalendar(log?.items || []), [log]);

  const days = streak?.streak ?? 0;
  const freezes = prefs?.streak_freezes ?? 2;
  const nextTier = TIERS.find(t => t.d > days) || TIERS[TIERS.length - 1];
  const remaining = Math.max(0, nextTier.d - days);

  return (
    <div className="screen streak-screen">
      <div className="screen-header" style={{ position: 'relative' }}>
        <div className="eyebrow">Streak</div>
        <div className="topright"><Folio n={14} /></div>
      </div>

      <div className="streak-hero">
        <div className="flame">🔥</div>
        <div className="big-num">{days}</div>
        <div className="cap">days of optimal swipes</div>
      </div>

      <div className="streak-stats">
        <div className="ss-card sky">
          <div className="lab">Freezes</div>
          <div className="val">{freezes}</div>
          <div className="sub">auto-applies on a miss</div>
        </div>
        <div className="ss-card lemon">
          <div className="lab">Next tier</div>
          <div className="val">{nextTier.d}</div>
          <div className="sub">{remaining} {remaining === 1 ? 'day' : 'days'} to go</div>
        </div>
      </div>

      <div className="cal-block">
        <div className="lab">Last 5 weeks</div>
        <div className="cal-row dow">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="cal-grid">
          {grid.map((s, i) => (
            <div key={i} className={`cal-cell ${s}`}>
              {s === 'today' ? '★' : s === 'freeze' ? '❄' : s === 'miss' ? '·' : ''}
            </div>
          ))}
        </div>
        <div className="cal-legend">
          <span><span className="sw kept" />Kept</span>
          <span><span className="sw today" />Today</span>
          <span><span className="sw freeze" />Freeze</span>
          <span><span className="sw miss" />Miss</span>
        </div>
      </div>

      <div className="tier-strip">
        <div className="lab">Milestones</div>
        <div className="row">
          {TIERS.map(t => (
            <div key={t.d} className={`tier ${days >= t.d ? 'hit' : ''}`}>
              <div className="d">{t.d}</div>
              <div className="lt">{t.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="streak-foot">
        Reward what we want — <i>good behavior</i>, not spend volume. The streak counts days
        you swiped the recommended card. Freezes auto-apply on a miss.
      </div>
    </div>
  );
}

// Build a 5-week calendar of statuses ending today. For each day in the
// window, classify as kept/miss/freeze/today/future based on swipe events
// (kept = ≥1 optimal swipe that day; miss = swipes but none optimal; freeze
// fakes one slot to demo the freeze ornament).
function buildCalendar(items) {
  const days = 35;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const grid = [];
  // Snap window to ISO Monday weeks
  const dow = (today.getDay() + 6) % 7; // 0 = Mon
  const start = new Date(today.getTime() - (days - 1 - (6 - dow)) * 86400_000);

  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86400_000);
    if (d > today) { grid.push('future'); continue; }
    if (sameDay(d, today)) { grid.push('today'); continue; }
    const dayItems = items.filter(x => sameDay(new Date(x.ts), d));
    if (dayItems.length === 0) { grid.push('past'); continue; }
    const anyOptimal = dayItems.some(x => x.optimal);
    grid.push(anyOptimal ? 'kept' : 'miss');
  }
  // Fake one freeze cell roughly mid-window for the demo
  const freezeIdx = Math.min(grid.length - 8, 11);
  if (grid[freezeIdx] === 'past' || grid[freezeIdx] === 'miss') grid[freezeIdx] = 'freeze';
  return grid;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
}
