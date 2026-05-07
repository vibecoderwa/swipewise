import { useState } from 'react';
import { imagePathFor, svgFallbackFor } from '../lib/cardArt.js';

export default function CardArt({ card, size = 'sm' }) {
  const [failed, setFailed] = useState(false);
  if (!card) return null;

  const klass = `card-art card-art-${size}`;
  const realImg = imagePathFor(card);

  if (realImg && !failed) {
    return (
      <img
        className={klass}
        src={realImg}
        alt={card.name}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  const svg = svgFallbackFor(card);
  const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return <img className={klass} src={dataUri} alt={card.name} />;
}
