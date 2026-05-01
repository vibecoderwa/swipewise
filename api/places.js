// Real-merchant lookup backed by OpenStreetMap's Overpass API.
// Free, no key, no signup. Categories are mapped from OSM `amenity` /
// `shop` / `tourism` tags into Swipewise's seven-bucket model.

// Multiple public Overpass endpoints — we fall through if one is busy or
// blocks us. Each is run by a different operator.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
];
// Overpass usage policy asks for a descriptive UA.
const USER_AGENT = 'Swipewise/0.1 (https://github.com/vibecoderwa/swipewise)';

// OSM tag → Swipewise category. Anything unmapped is dropped.
const TAG_TO_CATEGORY = {
  // amenity
  cafe:        'dining',
  restaurant:  'dining',
  fast_food:   'dining',
  food_court:  'dining',
  bar:         'dining',
  pub:         'dining',
  fuel:        'gas',
  cinema:      'other',
  pharmacy:    'other',
  // shop
  supermarket:    'groceries',
  convenience:    'groceries',
  greengrocer:    'groceries',
  butcher:        'groceries',
  bakery:         'groceries',
  alcohol:        'other',
  department_store: 'other',
  clothes:        'other',
  electronics:    'other',
  // tourism
  hotel:       'travel',
  motel:       'travel',
  guest_house: 'travel',
  hostel:      'travel',
};

// Visual icon per category (matches what the home list uses).
const ICONS = {
  groceries:       '🛒',
  dining:          '☕',
  gas:             '⛽',
  travel:          '✈︎',
  online_shopping: '📦',
  streaming:       '🎬',
  other:           '📍',
};

// Per-merchant median basket — used by the basket-aware uplift estimate
// when we don't have transaction history. Same numbers as the demo set.
const BASKET_BY_CATEGORY = {
  groceries: 90,
  dining:    18,
  gas:       45,
  travel:    180,
  other:     30,
};

// Build the Overpass query. We keep it tight (~1.5km) and capped to
// ~40 results per tag bucket so the response stays small.
function buildQuery(lat, lng, radiusMeters) {
  const around = `(around:${radiusMeters},${lat},${lng})`;
  return `[out:json][timeout:8];
(
  node["amenity"~"^(cafe|restaurant|fast_food|fuel|bar|pub|food_court|cinema|pharmacy)$"]${around};
  node["shop"~"^(supermarket|convenience|greengrocer|butcher|bakery|alcohol|department_store|clothes|electronics)$"]${around};
  node["tourism"~"^(hotel|motel|guest_house|hostel)$"]${around};
);
out body 80;`;
}

function categoryFor(tags) {
  if (tags.amenity && TAG_TO_CATEGORY[tags.amenity]) return TAG_TO_CATEGORY[tags.amenity];
  if (tags.shop && TAG_TO_CATEGORY[tags.shop]) return TAG_TO_CATEGORY[tags.shop];
  if (tags.tourism && TAG_TO_CATEGORY[tags.tourism]) return TAG_TO_CATEGORY[tags.tourism];
  return null;
}

function hasMiles(a, b) {
  const R = 3958.8;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function fetchOverpass(body) {
  let lastErr;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
        },
        body: `data=${encodeURIComponent(body)}`,
      });
      if (res.ok) return res.json();
      lastErr = new Error(`Overpass HTTP ${res.status} from ${endpoint}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('All Overpass endpoints failed');
}

export async function findMerchantsNear({ lat, lng, radiusMeters = 1500, limit = 25 }) {
  const body = buildQuery(lat, lng, radiusMeters);
  const data = await fetchOverpass(body);

  const seen = new Set();
  const out = [];

  for (const el of data.elements || []) {
    const tags = el.tags || {};
    const name = tags.name || tags['name:en'];
    if (!name) continue;

    const category = categoryFor(tags);
    if (!category) continue;

    // Dedupe by (name, category) — chains can show up twice within a small radius.
    const key = `${name.toLowerCase()}|${category}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (elLat == null || elLng == null) continue;

    const miles = hasMiles({ lat, lng }, { lat: elLat, lng: elLng });

    out.push({
      id: `osm_${el.type}_${el.id}`,
      name,
      sub: tags.cuisine ? capitalize(tags.cuisine.split(';')[0]) : prettyTag(tags),
      icon: ICONS[category] || '📍',
      category,
      basket: BASKET_BY_CATEGORY[category] ?? 30,
      lat: elLat,
      lng: elLng,
      distance_mi: Number(miles.toFixed(2)),
      brand: tags.brand || null,
    });
  }

  out.sort((a, b) => a.distance_mi - b.distance_mi);
  return out.slice(0, limit);
}

function prettyTag(tags) {
  if (tags.amenity === 'fuel') return 'Gas station';
  if (tags.amenity === 'cafe') return 'Coffee';
  if (tags.amenity === 'restaurant') return 'Restaurant';
  if (tags.amenity === 'fast_food') return 'Fast food';
  if (tags.amenity === 'bar' || tags.amenity === 'pub') return 'Bar';
  if (tags.amenity === 'cinema') return 'Cinema';
  if (tags.amenity === 'pharmacy') return 'Pharmacy';
  if (tags.shop === 'supermarket' || tags.shop === 'greengrocer') return 'Market';
  if (tags.shop === 'convenience') return 'Convenience';
  if (tags.shop === 'bakery') return 'Bakery';
  if (tags.shop === 'butcher') return 'Butcher';
  if (tags.shop === 'department_store') return 'Department store';
  if (tags.shop === 'clothes') return 'Clothing';
  if (tags.shop === 'electronics') return 'Electronics';
  if (tags.tourism === 'hotel' || tags.tourism === 'motel' || tags.tourism === 'guest_house' || tags.tourism === 'hostel') return 'Hotel';
  return capitalize(tags.amenity || tags.shop || tags.tourism || '');
}

function capitalize(s) {
  if (!s) return '';
  return s[0].toUpperCase() + s.slice(1).replace(/_/g, ' ');
}
