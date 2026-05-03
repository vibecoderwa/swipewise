// Marginalia — italic Fraunces aside pinned next to a thing, with a tiny
// arrow glyph indicating which direction it's pointing.
// Use absolute positioning via the `style` prop to anchor it in place.
export default function Marginalia({ children, dir = 'right', rotate = -3, style = {}, className = '' }) {
  const arrow = dir === 'left' ? '↘' : '↖';
  return (
    <div
      className={`marginalia-pin ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, ...style }}
    >
      {dir === 'left' && <span style={{ marginRight: 4 }}>{arrow}</span>}
      {children}
      {dir === 'right' && <span style={{ marginLeft: 4 }}>{arrow}</span>}
    </div>
  );
}
