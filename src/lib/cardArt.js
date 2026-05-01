// Real-image filenames live in /public/cards/{card.id}.{ext}.
// Default extension is .jpg; override below for cards stored as .png.
const IMAGE_EXT = {
  chase_freedom_unlimited: 'png',
};
const HAS_IMAGE = new Set([
  'chase_sapphire_preferred',
  'amex_gold',
  'amex_platinum',
  'capone_venture_x',
  'capone_savor',
  'bilt',
  'chase_freedom_unlimited',
]);

const ISSUER_THEMES = {
  'Chase':            { from: '#0a3d62', to: '#1e6091', text: '#ffffff', accent: '#5dade2' },
  'American Express': { from: '#222831', to: '#3b4350', text: '#e8c87a', accent: '#e8c87a' },
  'Citi':             { from: '#003b6f', to: '#0066b2', text: '#ffffff', accent: '#ee2e3a' },
  'Capital One':      { from: '#7a0000', to: '#c8102e', text: '#ffffff', accent: '#ffd24d' },
  'Discover':         { from: '#212121', to: '#444444', text: '#ffffff', accent: '#ff6b00' },
  'Wells Fargo':      { from: '#7a0000', to: '#b30000', text: '#ffffff', accent: '#ffcc00' },
  'Goldman Sachs':    { from: '#0c0c0c', to: '#2c2c2c', text: '#ffffff', accent: '#aaaaaa' },
  'U.S. Bank':        { from: '#0c2340', to: '#1f3b66', text: '#ffffff', accent: '#cc0000' },
};

function themeFor(card) {
  // Override per-card for known designs
  if (card.id === 'chase_sapphire_reserve') return { from: '#0a1f3d', to: '#0a3d62', text: '#ffffff', accent: '#7c5cff' };
  if (card.id === 'amex_bcp')              return { from: '#0a4d8c', to: '#1e6091', text: '#ffffff', accent: '#ffffff' };
  if (card.id === 'amex_bce')              return { from: '#1e90ff', to: '#3b86c4', text: '#ffffff', accent: '#ffffff' };
  if (card.id === 'amex_marriott_bonvoy')  return { from: '#1a1a1a', to: '#2c2c2c', text: '#d4af37', accent: '#d4af37' };
  if (card.id === 'apple_card')            return { from: '#f5f5f7', to: '#e8e8ed', text: '#1c1c1e', accent: '#86868b' };
  if (card.id === 'discover_it')           return { from: '#ee7c1b', to: '#ff9933', text: '#ffffff', accent: '#ffffff' };
  if (card.id === 'citi_custom_cash')      return { from: '#003b6f', to: '#005599', text: '#ffffff', accent: '#5dade2' };
  return ISSUER_THEMES[card.issuer] || { from: '#1c1c25', to: '#2a2a35', text: '#ffffff', accent: '#7c5cff' };
}

export function imagePathFor(card) {
  if (!HAS_IMAGE.has(card.id)) return null;
  const ext = IMAGE_EXT[card.id] || 'jpg';
  return `/cards/${card.id}.${ext}`;
}

export function svgFallbackFor(card) {
  const t = themeFor(card);
  const titleParts = card.name.split(' ');
  const line1 = titleParts.slice(0, Math.ceil(titleParts.length / 2)).join(' ');
  const line2 = titleParts.slice(Math.ceil(titleParts.length / 2)).join(' ');
  const id = `g_${card.id}`;
  return (
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 550" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${t.from}"/>
      <stop offset="100%" stop-color="${t.to}"/>
    </linearGradient>
  </defs>
  <rect width="880" height="550" rx="40" fill="url(#${id})"/>
  <g opacity="0.18" fill="${t.accent}">
    <circle cx="700" cy="120" r="180"/>
    <circle cx="780" cy="500" r="120"/>
  </g>
  <rect x="60" y="240" width="60" height="48" rx="8" fill="${t.accent}" opacity="0.55"/>
  <rect x="68" y="248" width="44" height="32" rx="3" fill="${t.from}" opacity="0.4"/>
  <text x="60" y="120" fill="${t.text}" font-family="-apple-system, system-ui, sans-serif" font-size="34" font-weight="700" letter-spacing="-0.5">${escapeXml(card.issuer.toUpperCase())}</text>
  <text x="60" y="430" fill="${t.text}" font-family="-apple-system, system-ui, sans-serif" font-size="56" font-weight="800" letter-spacing="-1.5">${escapeXml(line1)}</text>
  <text x="60" y="490" fill="${t.text}" font-family="-apple-system, system-ui, sans-serif" font-size="56" font-weight="800" letter-spacing="-1.5">${escapeXml(line2)}</text>
</svg>`
  );
}

function escapeXml(s) {
  return s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}
