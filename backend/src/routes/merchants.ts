import { Router } from 'express';
import pool from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { bestCardForMerchant } from '../core/rewards.js';
import { DEFAULT_CPP } from '../core/data.js';
import type { CardId, CategoryId } from '../core/data.js';

const router = Router();

const EARTH_RADIUS_KM = 6_371;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = EARTH_RADIUS_KM;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// GET /merchants/near?lat=&lng=&radius=500  (radius in metres, max 2000)
router.get('/near', requireAuth, async (req, res) => {
  const lat    = parseFloat(req.query.lat as string);
  const lng    = parseFloat(req.query.lng as string);
  const radius = Math.min(parseFloat(req.query.radius as string) || 500, 2_000);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  // Fetch user's top merchants within bounding box (fast pre-filter before haversine)
  const latDelta = (radius / 1_000) / EARTH_RADIUS_KM * (180 / Math.PI);
  const lngDelta = latDelta / Math.cos(lat * Math.PI / 180);

  const [settingsRes, cardsRes, merchantsRes] = await Promise.all([
    pool.query<{ cpp: Record<CardId,number> }>(
      `SELECT cpp FROM user_settings WHERE user_id = $1`, [req.userId],
    ),
    pool.query<{ card_id: CardId }>(
      `SELECT card_id FROM user_cards WHERE user_id = $1 AND active = TRUE`, [req.userId],
    ),
    pool.query<{ name: string; category: string; lat: number; lng: number }>(
      // Pull from user's transaction history — most visited merchants with coords
      `SELECT merchant_name AS name, category, AVG(merchant_lat) AS lat, AVG(merchant_lng) AS lng,
              COUNT(*) AS visit_count
       FROM transactions
       WHERE user_id = $1 AND removed = FALSE
         AND merchant_lat BETWEEN $2 AND $3
         AND merchant_lng BETWEEN $4 AND $5
       GROUP BY merchant_name, category
       ORDER BY visit_count DESC
       LIMIT 25`,
      [req.userId, lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta],
    ),
  ]);

  const cpp   = settingsRes.rows[0]?.cpp ?? DEFAULT_CPP;
  const owned = cardsRes.rows.map(r => r.card_id);

  const results = merchantsRes.rows
    .map(m => {
      const distM = haversineKm(lat, lng, m.lat, m.lng) * 1_000;
      if (distM > radius) return null;

      const reco = bestCardForMerchant(m.category as CategoryId, 40, cpp, owned);
      return {
        name:      m.name,
        category:  m.category,
        lat:       m.lat,
        lng:       m.lng,
        distanceM: Math.round(distM),
        bestCard:  reco.bestCard,
        multiplier:reco.multiplier,
        uplift:    reco.expectedReward,
        confidence:reco.confidence,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.uplift - a!.uplift);

  res.json(results);
});

// POST /merchants/rank  — rank cards for a single merchant
router.post('/rank', requireAuth, async (req, res) => {
  const { merchantName, category, basketAmount } = req.body as {
    merchantName?: string; category?: string; basketAmount?: number;
  };
  if (!category) return res.status(400).json({ error: 'category required' });

  const [settingsRes, cardsRes] = await Promise.all([
    pool.query<{ cpp: Record<CardId,number> }>(
      `SELECT cpp FROM user_settings WHERE user_id = $1`, [req.userId],
    ),
    pool.query<{ card_id: CardId }>(
      `SELECT card_id FROM user_cards WHERE user_id = $1 AND active = TRUE`, [req.userId],
    ),
  ]);

  const cpp    = settingsRes.rows[0]?.cpp ?? DEFAULT_CPP;
  const owned  = cardsRes.rows.map(r => r.card_id);
  const basket = basketAmount ?? 40;

  // Basket-aware estimate: use median historical spend at this merchant if available
  let medianBasket = basket;
  if (merchantName) {
    const { rows: hist } = await pool.query<{ median: string }>(
      `SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) AS median
       FROM transactions
       WHERE user_id = $1 AND merchant_name ILIKE $2 AND removed = FALSE`,
      [req.userId, merchantName],
    );
    if (hist[0]?.median) medianBasket = parseFloat(hist[0].median);
  }

  const reco = bestCardForMerchant(category as CategoryId, medianBasket, cpp, owned);
  res.json({ ...reco, medianBasket, merchantName });
});

// GET /merchants/geofence-seeds  — top merchants for geofence setup (FR-GEO-01)
router.get('/geofence-seeds', requireAuth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 20);

  const { rows } = await pool.query(
    `SELECT merchant_name AS name, category,
            AVG(merchant_lat) AS lat, AVG(merchant_lng) AS lng,
            COUNT(*) AS visit_count
     FROM transactions
     WHERE user_id = $1 AND removed = FALSE
       AND merchant_lat IS NOT NULL AND merchant_lng IS NOT NULL
     GROUP BY merchant_name, category
     ORDER BY visit_count DESC
     LIMIT $2`,
    [req.userId, limit],
  );

  res.json(rows);
});

export default router;
