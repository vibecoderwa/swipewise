// PaperTexture — very subtle SVG noise overlay, applied via mix-blend-mode
// to give light surfaces a tactile, magazine-paper feel. Sits absolutely
// at inset 0 of its container; the container should be `position: relative`.
export default function PaperTexture({ opacity = 0.05 }) {
  return (
    <svg
      className="paper-texture"
      style={{ opacity }}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <filter id="swipewise-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#swipewise-grain)" />
    </svg>
  );
}
