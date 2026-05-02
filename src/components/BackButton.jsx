// Floating back button — universal navigation chrome.
// Sits absolutely positioned at top-left of every screen, just under the
// status bar. Adapts to dark/light surfaces. Hidden by App when there's
// no nav history to go back to.
//
// Visual reference: prototype `BackButton` — chunky-bordered chip with
// a hard offset shadow and a single ‹ glyph.

export default function BackButton({ onClick, dark = false }) {
  return (
    <button
      type="button"
      className={`back-fab ${dark ? 'dark' : ''}`}
      onClick={onClick}
      aria-label="Back"
    >
      ‹
    </button>
  );
}
