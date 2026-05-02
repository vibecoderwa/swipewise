// Avatar — small ink-bordered initials disc, in one of the editorial tones.
// Used in feed posts, friend tagging, and the home friends-strip.
export default function Avatar({ tone = 'sky', init = '?', size = 36 }) {
  const fontSize = Math.round(size * 0.46);
  return (
    <span
      className={`avatar tone-${tone}`}
      style={{ width: size, height: size, fontSize }}
    >
      {init}
    </span>
  );
}
