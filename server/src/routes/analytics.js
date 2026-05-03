// server/src/routes/analytics.js
const express  = require('express');
const router   = express.Router();
const Analytics = require('../models/Analytics');
const { protect, adminOnly } = require('../middleware/auth');

// ── POST /api/analytics/event ─────────────────────────────────────────────────
// Public — receives tracking events from the storefront (fire-and-forget)
router.post('/event', async (req, res) => {
  // Always respond 204 immediately so the client never waits
  res.status(204).end();

  const { event, sessionId, productId, productSlug, productTitle, productImage, price, quantity } = req.body;
  if (!event || !sessionId) return;

  try {
    await Analytics.create({ event, sessionId, productId, productSlug, productTitle, productImage, price, quantity: quantity || 1 });
  } catch {
    // Swallow silently — analytics failures must never affect the storefront
  }
});

// ── GET /api/analytics/dashboard?period=30 ────────────────────────────────────
// Admin only — returns all dashboard data in a single call
router.get('/dashboard', protect, adminOnly, async (req, res, next) => {
  try {
    const period = Math.max(1, Math.min(90, Number(req.query.period) || 30));
    const now    = new Date();
    const start  = new Date(now - period * 24 * 60 * 60 * 1000);
    const prevStart = new Date(now - 2 * period * 24 * 60 * 60 * 1000);

    // ── 1. Overview counts (current period) ──────────────────────────────────
    const [curCounts, prevCounts] = await Promise.all([
      Analytics.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: '$event', count: { $sum: 1 }, sessions: { $addToSet: '$sessionId' } } },
      ]),
      Analytics.aggregate([
        { $match: { createdAt: { $gte: prevStart, $lt: start } } },
        { $group: { _id: '$event', count: { $sum: 1 } } },
      ]),
    ]);

    const cur  = Object.fromEntries(curCounts.map(r => [r._id, { count: r.count, sessions: r.sessions.length }]));
    const prev = Object.fromEntries(prevCounts.map(r => [r._id, r.count]));

    const trend = (key) => {
      const c = cur[key]?.count || 0;
      const p = prev[key] || 0;
      if (p === 0) return c > 0 ? 100 : 0;
      return Math.round(((c - p) / p) * 100);
    };

    const views     = cur['product_view']?.count  || 0;
    const cart      = cur['add_to_cart']?.count   || 0;
    const wishlists = cur['wishlist_add']?.count  || 0;
    const purchases = cur['purchase']?.count      || 0;

    // Unique sessions = union of sessionIds across all event types
    const allSessions = await Analytics.distinct('sessionId', { createdAt: { $gte: start } });
    const sessions = allSessions.length;

    const overview = {
      sessions,
      productViews:        views,
      addToCart:           cart,
      wishlists,
      purchases,
      conversionRate:      views > 0 ? +((purchases / views) * 100).toFixed(2) : 0,
      cartConversionRate:  cart  > 0 ? +((purchases / cart)  * 100).toFixed(2) : 0,
      viewToCartRate:      views > 0 ? +((cart     / views)  * 100).toFixed(2) : 0,
      trends: {
        sessions:     trend('product_view'), // proxy: sessions saw product pages
        productViews: trend('product_view'),
        addToCart:    trend('add_to_cart'),
        wishlists:    trend('wishlist_add'),
        purchases:    trend('purchase'),
      },
    };

    // ── 2. Funnel ─────────────────────────────────────────────────────────────
    const funnel = [
      { stage: 'Sessions',       count: sessions,  pct: 100 },
      { stage: 'Product Views',  count: views,     pct: sessions > 0 ? +((views / sessions) * 100).toFixed(1) : 0 },
      { stage: 'Add to Cart',    count: cart,       pct: views   > 0 ? +((cart  / views)    * 100).toFixed(1) : 0 },
      { stage: 'Purchases',      count: purchases,  pct: cart    > 0 ? +((purchases / cart) * 100).toFixed(1) : 0 },
    ];

    // ── 3. Daily trends (last `period` days) ──────────────────────────────────
    const dailyRaw = await Analytics.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: {
            date:  { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            event: '$event',
          },
          count:    { $sum: 1 },
          sessions: { $addToSet: '$sessionId' },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Build a map: date → { views, cart, wishlist, purchases, sessions }
    const dailyMap = {};
    for (let d = 0; d < period; d++) {
      const dt = new Date(start.getTime() + d * 24 * 60 * 60 * 1000);
      const key = dt.toISOString().slice(0, 10);
      dailyMap[key] = { date: key, views: 0, cart: 0, wishlist: 0, purchases: 0, sessions: 0 };
    }
    dailyRaw.forEach(r => {
      const key = r._id.date;
      if (!dailyMap[key]) return;
      if (r._id.event === 'product_view')  { dailyMap[key].views    += r.count; dailyMap[key].sessions += r.sessions.length; }
      if (r._id.event === 'add_to_cart')   { dailyMap[key].cart     += r.count; }
      if (r._id.event === 'wishlist_add')  { dailyMap[key].wishlist += r.count; }
      if (r._id.event === 'purchase')      { dailyMap[key].purchases += r.count; }
    });
    const daily = Object.values(dailyMap);

    // ── 4. Top products ───────────────────────────────────────────────────────
    const [topViewed, topCarted, topPurchased] = await Promise.all([
      Analytics.aggregate([
        { $match: { event: 'product_view', createdAt: { $gte: start }, productId: { $exists: true } } },
        { $group: { _id: '$productId', title: { $first: '$productTitle' }, slug: { $first: '$productSlug' }, image: { $first: '$productImage' }, count: { $sum: 1 }, sessions: { $addToSet: '$sessionId' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Analytics.aggregate([
        { $match: { event: 'add_to_cart', createdAt: { $gte: start }, productId: { $exists: true } } },
        { $group: { _id: '$productId', title: { $first: '$productTitle' }, slug: { $first: '$productSlug' }, image: { $first: '$productImage' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Analytics.aggregate([
        { $match: { event: 'purchase', createdAt: { $gte: start }, productId: { $exists: true } } },
        { $group: { _id: '$productId', title: { $first: '$productTitle' }, slug: { $first: '$productSlug' }, image: { $first: '$productImage' }, count: { $sum: '$quantity' }, revenue: { $sum: { $multiply: ['$price', '$quantity'] } } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Enrich topViewed with cart+purchase counts for per-product conversion
    const viewIds = topViewed.map(p => p._id?.toString());
    const [cartByProduct, purchaseByProduct] = await Promise.all([
      Analytics.aggregate([
        { $match: { event: 'add_to_cart', productId: { $in: topViewed.map(p => p._id) }, createdAt: { $gte: start } } },
        { $group: { _id: '$productId', count: { $sum: 1 } } },
      ]),
      Analytics.aggregate([
        { $match: { event: 'purchase', productId: { $in: topViewed.map(p => p._id) }, createdAt: { $gte: start } } },
        { $group: { _id: '$productId', count: { $sum: '$quantity' } } },
      ]),
    ]);
    const cartMap     = Object.fromEntries(cartByProduct.map(r => [r._id?.toString(), r.count]));
    const purchaseMap = Object.fromEntries(purchaseByProduct.map(r => [r._id?.toString(), r.count]));

    const topProducts = {
      byViews: topViewed.map(p => ({
        id: p._id, title: p.title, slug: p.slug, image: p.image,
        views: p.count, uniqueVisitors: p.sessions.length,
        cartAdds: cartMap[p._id?.toString()] || 0,
        purchases: purchaseMap[p._id?.toString()] || 0,
        conversionRate: p.count > 0 ? +((( purchaseMap[p._id?.toString()] || 0) / p.count) * 100).toFixed(1) : 0,
      })),
      byCart:      topCarted.map(p => ({ id: p._id, title: p.title, slug: p.slug, image: p.image, count: p.count })),
      byPurchases: topPurchased.map(p => ({ id: p._id, title: p.title, slug: p.slug, image: p.image, count: p.count, revenue: p.revenue })),
    };

    res.json({ success: true, period, overview, funnel, daily, topProducts });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
