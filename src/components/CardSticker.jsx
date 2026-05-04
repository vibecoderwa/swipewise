// CardSticker — the prototype's mini credit-card chit. Solid issuer-color
// background with chunky border + hard offset shadow, a chip rectangle, the
// issuer name, the masked PAN in JetBrains Mono, and the card name.
// Optional rotation — defaults to 0; pass e.g. -3 for the editorial tilt.
//
// Accepts either a real `card` from the API or just a `brand`/`name`/`last4`.
function brandKey(card) {
  if (!card) return 'amex';
  const id = card.id || '';
  if (id.startsWith('amex_')) return 'amex';
  if (id.startsWith('chase_')) return 'chase';
  if (id.startsWith('capone_')) return 'capone';
  if (id.startsWith('citi_')) return 'citi';
  if (id.startsWith('discover_')) return 'discover';
  return card.brand || 'amex';
}

function issuerName(card) {
  const issuer = (card?.issuer || '').toLowerCase();
  if (issuer.includes('american express')) return 'American Express';
  if (issuer.includes('chase')) return 'Chase';
  if (issuer.includes('capital one')) return 'Capital One';
  if (issuer.includes('citi')) return 'Citi';
  if (issuer.includes('discover')) return 'Discover';
  return card?.issuer || 'Card';
}

export default function CardSticker({ card, name, last4 = '••04', rotate = 0, scale = 1 }) {
  const brand = brandKey(card);
  const cardName = name || card?.name?.split(' ').slice(-2).join(' ') || 'Card';
  const number = String(last4).replace('••', '');
  return (
    <div
      className={`card-sticker ${brand}`}
      style={{
        transform: `rotate(${rotate}deg) scale(${scale})`,
        transformOrigin: 'left center',
      }}
    >
      <div className="chip-rect" />
      <div className="issuer">{issuerName(card)}</div>
      <div>
        <div className="pan">•••• •••• •••• {number}</div>
        <div className="name">{cardName}</div>
      </div>
    </div>
  );
}
