// Sparkle — single ornament glyph (✦ ✧ ❋) that floats gently. Used
// decoratively on the landing page and in the Win Moment background.
export default function Sparkle({ ch = '✦', color, size = 18, delay = 0, style = {} }) {
  return (
    <span
      className="sparkle"
      style={{
        fontSize: size,
        color: color || 'var(--ink)',
        animationDelay: `${delay}ms`,
        ...style,
      }}
    >
      {ch}
    </span>
  );
}
