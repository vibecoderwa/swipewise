// Demo "nearby merchants" set used by the geo-list home view.
// Production-grade FR-GEO-05 (`GET /merchants/near?lat&lng`) is out of scope
// for the prototype — these are illustrative, with realistic San Francisco
// coordinates so distance numbers shift when the user grants location.

export const DEMO_MERCHANTS = [
  { id: 'wholefoods', name: 'Whole Foods', sub: 'Market', icon: '🛒', category: 'groceries', basket: 120, lat: 37.7886, lng: -122.4006 },
  { id: 'shell',      name: 'Shell',         sub: 'Gas station',     icon: '⛽', category: 'gas',             basket: 45,  lat: 37.7799, lng: -122.4194 },
  { id: 'bluebottle', name: 'Blue Bottle',   sub: 'Coffee',          icon: '☕', category: 'dining',          basket: 8,   lat: 37.7765, lng: -122.4233 },
  { id: 'sfo_delta',  name: 'Delta · SFO',   sub: 'Airline',         icon: '✈︎', category: 'travel',          basket: 412, lat: 37.6213, lng: -122.3790 },
  { id: 'tj',         name: "Trader Joe's",  sub: 'Market',          icon: '🛒', category: 'groceries',       basket: 90,  lat: 37.7848, lng: -122.4189 },
  { id: 'chipotle',   name: 'Chipotle',      sub: 'Fast casual',     icon: '🌯', category: 'dining',          basket: 14,  lat: 37.7873, lng: -122.4078 },
  { id: 'amazon',     name: 'Amazon',        sub: 'Online',          icon: '📦', category: 'online_shopping', basket: 65,  lat: null,    lng: null },
  { id: 'netflix',    name: 'Netflix',       sub: 'Streaming',       icon: '🎬', category: 'streaming',       basket: 23,  lat: null,    lng: null },
];

// Haversine (in miles) — used purely for the "0.2 mi" label.
function distMiles(a, b) {
  if (a.lat == null || b.lat == null) return null;
  const R = 3958.8;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function distanceLabel(userLoc, m) {
  if (!userLoc || m.lat == null) return m.sub || 'Online';
  const d = distMiles(userLoc, m);
  if (d == null) return m.sub || 'Online';
  if (d < 0.1) return `${Math.round(d * 5280)} ft`;
  return `${d.toFixed(1)} mi`;
}

// Default order without location: keep editorial order from DEMO_MERCHANTS.
// With location: sort by distance, then push merchants without coords to the end.
export function rankMerchants(userLoc) {
  if (!userLoc) return DEMO_MERCHANTS;
  return [...DEMO_MERCHANTS].sort((a, b) => {
    const da = a.lat == null ? Infinity : distMiles(userLoc, a);
    const db = b.lat == null ? Infinity : distMiles(userLoc, b);
    return da - db;
  });
}
