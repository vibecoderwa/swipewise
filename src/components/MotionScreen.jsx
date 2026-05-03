// MotionScreen — wraps a screen and applies an entrance animation depending
// on direction (forward = slide-in-right, back = slide-in-left, sheet = slide-up).
// Re-renders / replays animation when the `key` changes (e.g. on screen change).
export default function MotionScreen({ direction = 'forward', mode = 'page', children }) {
  let anim;
  if (mode === 'sheet') anim = 'sheetUp 320ms cubic-bezier(.2,.7,.2,1)';
  else if (direction === 'back') anim = 'screenInLeft 280ms cubic-bezier(.2,.7,.2,1)';
  else anim = 'screenInRight 280ms cubic-bezier(.2,.7,.2,1)';
  return (
    <div className="motion-screen" style={{ animation: anim }}>
      {children}
    </div>
  );
}
