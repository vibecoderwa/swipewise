// Friends / Feed — reachable from the home friends-strip, NOT a top-level
// tab. Shows friends' swipes + the user's own posts, with a pinned
// auto-suggest card at the top for any pending unposted swipes.
import { useState } from 'react';
import { api } from '../lib/api.js';
import Avatar from '../components/Avatar.jsx';
import CardArt from '../components/CardArt.jsx';
import Folio from '../components/Folio.jsx';
import ScreenHeader from '../components/ScreenHeader.jsx';
import { categoryLabel } from '../lib/merchantInfer.js';

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60_000) return 'just now';
  if (d < 3600_000) return `${Math.floor(d / 60_000)}m`;
  if (d < 86_400_000) return `${Math.floor(d / 3600_000)}h`;
  return `${Math.floor(d / 86_400_000)}d`;
}

function formatTagged(ids, friends) {
  const names = ids
    .map(id => friends.find(f => f.id === id)?.name.split(' ')[0])
    .filter(Boolean);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]} & ${names.length - 1} others`;
}

function PendingSwipeCard({ pending, onShareNow, onShareEdit, onDismiss }) {
  return (
    <div className="pending-swipe">
      <div className="head">
        <span style={{ fontSize: 13 }}>✦</span>
        <span>Heads up · {timeAgo(pending.created_at)}</span>
        <span className="x" onClick={onDismiss}>✕</span>
      </div>
      <div className="copy">
        You just swiped <b>{pending.card_name}</b> at <b>{pending.merchant}{pending.location ? ` · ${pending.location}` : ''}</b>.
        <span className="ask"> Share with friends?</span>
      </div>
      <div className="swipe">
        <CardArt card={{ id: pending.card_id }} size="sm" />
        <div className="name">{categoryLabel(pending.category)}</div>
        <div className="rate">{pending.rate}×</div>
      </div>
      <div className="ctas">
        <button className="btn" onClick={onShareNow}>Share now</button>
        <button className="btn-alt" onClick={onShareEdit}>+ vibe</button>
      </div>
    </div>
  );
}

function FeedPost({ p, friends }) {
  return (
    <div className={`feed-post ${p.is_you ? 'you-new' : ''}`}>
      <div className="top">
        <Avatar tone={p.avatar_tone} init={p.avatar_init} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="who">
            {p.user_name}
            {p.is_you && <span className="you-pill">YOU</span>}
          </div>
          <div className="place">
            at <b>{p.merchant}{p.location ? ` · ${p.location}` : ''}</b>
          </div>
          {p.tagged && p.tagged.length > 0 && (
            <div className="tagged">
              <span>with</span>
              <div className="stack">
                {p.tagged.slice(0, 3).map(id => {
                  const f = friends.find(x => x.id === id);
                  if (!f) return null;
                  return <Avatar key={id} tone={f.tone || 'sky'} init={f.init} size={18} />;
                })}
              </div>
              <b>{formatTagged(p.tagged, friends)}</b>
            </div>
          )}
        </div>
        <div className="ts">{timeAgo(p.created_at)}</div>
      </div>

      <div className="swipe">
        <CardArt card={{ id: p.card_id }} size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="lab">swiped</div>
          <div className="name">{p.card_name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="rate">{p.rate}×</div>
          <div className="cat-tag">{categoryLabel(p.category)}</div>
        </div>
      </div>

      {(p.emoji || p.caption) && (
        <div className="body">
          {p.emoji && <span className="em">{p.emoji}</span>}
          {p.caption}
        </div>
      )}

      <div className="actions">
        <span className="a"><span style={{ fontSize: 18, lineHeight: 1 }}>♡</span>{p.likes ?? 0}</span>
        <span className="a"><span style={{ fontSize: 14 }}>💬</span>{p.comments ?? 0}</span>
      </div>
    </div>
  );
}

export default function FriendsScreen({ feed, go, onRefresh }) {
  const [filter, setFilter] = useState('all');
  const friends = feed.friends || [];
  const pending = feed.pending || [];
  const posts = feed.posts || [];

  const dayAgo = Date.now() - 24 * 3600 * 1000;
  const visible = posts.filter(p => {
    if (filter === 'you') return p.is_you;
    if (filter === 'today') return p.created_at >= dayAgo;
    return true;
  });

  async function shareNow(pending) {
    await api.createPost({
      swipe_id: pending.swipe_id,
      card_id: pending.card_id,
      merchant: pending.merchant,
      location: pending.location,
      category: pending.category,
      rate: pending.rate,
      emoji: null,
      caption: null,
      tagged: [],
      visibility: 'friends',
    });
    onRefresh?.();
  }

  function shareEdit(pending) {
    go('compose', {
      swipe_id: pending.swipe_id,
      card_id: pending.card_id,
      card_name: pending.card_name,
      merchant: pending.merchant,
      location: pending.location,
      category: pending.category,
      rate: pending.rate,
    });
  }

  async function dismiss(id) {
    await api.dismissPending(id);
    onRefresh?.();
  }

  return (
    <div className="screen">
      <ScreenHeader eyebrow="Live · just now" title="The wallet diary." right={<Folio n={10} />} />

      <div className="pill-row" style={{ marginBottom: 14 }}>
        {[
          { id: 'all',   l: 'All' },
          { id: 'today', l: 'Today' },
          { id: 'you',   l: 'You' },
        ].map(f => (
          <button
            key={f.id}
            className={filter === f.id ? 'active' : ''}
            onClick={() => setFilter(f.id)}
          >
            {f.l}
          </button>
        ))}
        <button
          style={{ marginLeft: 'auto', background: 'var(--lemon)', boxShadow: 'var(--shadow-chunky)' }}
          onClick={() => go('compose', null)}
        >
          + post
        </button>
      </div>

      <div className="feed-list">
        {pending.map(p => (
          <PendingSwipeCard
            key={p.id} pending={p}
            onShareNow={() => shareNow(p)}
            onShareEdit={() => shareEdit(p)}
            onDismiss={() => dismiss(p.id)}
          />
        ))}
        {visible.length === 0 && pending.length === 0 && (
          <div className="result-empty">
            ❋ no posts yet ❋<br />
            <span style={{ fontSize: 11 }}>tap "+ post" to share your first swipe</span>
          </div>
        )}
        {visible.map(p => <FeedPost key={p.id} p={p} friends={friends} />)}
        {visible.length > 0 && (
          <div className="marginalia" style={{ textAlign: 'center', padding: 14, color: 'var(--dim)' }}>
            ❋ caught up ❋
          </div>
        )}
      </div>
    </div>
  );
}
