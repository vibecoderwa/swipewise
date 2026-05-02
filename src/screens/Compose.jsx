// Compose — quick-emoji + caption + visibility + friend tagging.
// Reachable from Friends ("+ post" or "+ vibe" on a pending swipe), and
// from the Win Moment "Brag a little" CTA.
import { useState } from 'react';
import { api } from '../lib/api.js';
import Avatar from '../components/Avatar.jsx';
import CardArt from '../components/CardArt.jsx';
import Folio from '../components/Folio.jsx';
import { categoryLabel } from '../lib/merchantInfer.js';

const QUICK_EMOJIS = ['🌮', '☕', '🔥', '✨', '💸', '🥐', '🍷', '🛒', '✈︎'];

const VISIBILITIES = [
  { id: 'friends', l: 'Friends', em: '👥' },
  { id: 'public',  l: 'Public',  em: '🌐' },
  { id: 'private', l: 'Private', em: '🔒' },
];

function formatTagged(ids, friends) {
  const names = ids
    .map(id => friends.find(f => f.id === id)?.name.split(' ')[0])
    .filter(Boolean);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]} & ${names.length - 1} others`;
}

export default function ComposeScreen({ ctx, friends = [], go, back, onPosted }) {
  const draft = ctx || {
    merchant: 'a recent swipe',
    location: '',
    card_id: null,
    card_name: 'your card',
    category: 'other',
    rate: 1,
  };
  const [emoji, setEmoji] = useState(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('friends');
  const [tagged, setTagged] = useState([]);
  const [posting, setPosting] = useState(false);

  function toggleTag(id) {
    setTagged(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id]);
  }

  async function submit() {
    if (posting || !draft.card_id) {
      // No card_id means we don't have a real swipe to attach — bail to feed.
      go('friends');
      return;
    }
    setPosting(true);
    try {
      await api.createPost({
        swipe_id: draft.swipe_id || null,
        card_id: draft.card_id,
        merchant: draft.merchant,
        location: draft.location,
        category: draft.category,
        rate: draft.rate,
        emoji,
        caption: caption.trim() || null,
        tagged,
        visibility,
      });
      onPosted?.();
      go('friends');
    } catch (e) {
      setPosting(false);
    }
  }

  return (
    <div className="compose-screen">
      <div className="screen-header" style={{ marginTop: 28 }}>
        <div className="eyebrow">Share your swipe</div>
        <h1 style={{ fontSize: 36, marginBottom: 0 }}>What you<br /><em>just swiped.</em></h1>
        <div className="topright"><Folio n={11} /></div>
      </div>

      {/* Preview */}
      <div className="compose-preview">
        <div className="top">
          <Avatar tone="plum" init="Y" size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="who">You</div>
            <div className="place">
              at <b>{draft.merchant}{draft.location ? ` · ${draft.location}` : ''}</b>
            </div>
            {tagged.length > 0 && (
              <div className="place">
                with <b>{formatTagged(tagged, friends)}</b>
              </div>
            )}
          </div>
          <div className="preview-tag">preview</div>
        </div>
        <div className="swipe">
          <CardArt card={{ id: draft.card_id }} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="lab" style={{ fontSize: 9.5, color: 'var(--dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7 }}>swiped</div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>{draft.card_name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{draft.rate}×</div>
            <div style={{ fontSize: 9.5, color: 'var(--mint-dk)', fontWeight: 800, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {categoryLabel(draft.category)}
            </div>
          </div>
        </div>
        {(emoji || caption) && (
          <div className="body">
            {emoji && <span style={{ marginRight: 6, fontSize: 16 }}>{emoji}</span>}
            {caption || <i>say something? optional</i>}
          </div>
        )}
      </div>

      {/* Vibe */}
      <div className="compose-section">
        <div className="section-label">Add a vibe (optional)</div>
        <div className="emoji-row">
          {QUICK_EMOJIS.map(em => (
            <button
              key={em}
              className={emoji === em ? 'on' : ''}
              onClick={() => setEmoji(emoji === em ? null : em)}
            >
              {em}
            </button>
          ))}
        </div>
        <input
          className="compose-input"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="say something? (optional)"
          maxLength={60}
        />
      </div>

      {/* Tags */}
      {friends.length > 0 && (
        <div className="compose-section">
          <div className="section-label">Tag people (optional)</div>
          <div className="tag-row">
            {friends.map(f => {
              const isSel = tagged.includes(f.id);
              return (
                <div
                  key={f.id}
                  className={`friend ${isSel ? 'on' : ''}`}
                  onClick={() => toggleTag(f.id)}
                >
                  <div className="wrap">
                    <Avatar tone={f.tone || 'sky'} init={f.init} size={42} />
                    {isSel && <span className="check">✓</span>}
                  </div>
                  <div className="label">{f.name.split(' ')[0]}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visibility */}
      <div className="compose-section">
        <div className="section-label">Who can see</div>
        <div className="vis-chips">
          {VISIBILITIES.map(v => (
            <button
              key={v.id}
              className={visibility === v.id ? 'on' : ''}
              onClick={() => setVisibility(v.id)}
            >
              <span>{v.em}</span>{v.l}
            </button>
          ))}
        </div>
      </div>

      <div className="compose-cta">
        <button className="btn accent" onClick={submit} disabled={posting}>
          {posting ? 'Posting…' : 'Post the swipe'}
        </button>
        <div className="fineprint">Amount hidden. Just the swipe + the win.</div>
      </div>
    </div>
  );
}
