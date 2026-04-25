// apps/server/src/routes/collections.js
const express    = require('express');
const router     = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { Collection } = require('../models/OrderCollection');
require('../models/Product'); // ensure Product is registered for populate()

const ACTIVE_FILTER  = { isActive: true,  isDeleted: { $ne: true } };
const PUBLIC_FILTER  = { isDeleted: { $ne: true } };

// ── Public ────────────────────────────────────────────────────────────────────

// GET /api/collections — active collections only (used by storefront)
router.get('/', async (req, res, next) => {
  try {
    const collections = await Collection.find(ACTIVE_FILTER)
      .populate('products', 'title price images slug discountedPrice rating')
      .sort('sortOrder')
      .lean();
    res.json({ success: true, collections });
  } catch (err) { next(err); }
});

// ── Admin-only (must be BEFORE /:slug to avoid slug matching "admin") ─────────

// GET /api/collections/admin/all — all non-deleted (active + deactivated)
router.get('/admin/all', protect, adminOnly, async (req, res, next) => {
  try {
    const collections = await Collection.find(PUBLIC_FILTER)
      .populate('products', 'title price images slug discountedPrice')
      .sort('sortOrder')
      .lean();
    res.json({ success: true, collections });
  } catch (err) { next(err); }
});

// POST /api/collections — create
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    if (!req.body.slug) {
      req.body.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    const collection = await Collection.create(req.body);
    res.status(201).json({ success: true, collection });
  } catch (err) { next(err); }
});

// PUT /api/collections/:id — update
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    // Strip immutable fields
    const { _id, __v, createdAt, ...update } = req.body;
    const collection = await Collection.findByIdAndUpdate(req.params.id, { $set: update }, { new: true })
      .populate('products', 'title price images slug discountedPrice');
    if (!collection) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, collection });
  } catch (err) { next(err); }
});

// PATCH /api/collections/:id/activate
router.patch('/:id/activate', protect, adminOnly, async (req, res, next) => {
  try {
    const collection = await Collection.findByIdAndUpdate(
      req.params.id, { isActive: true }, { new: true }
    );
    if (!collection) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, collection });
  } catch (err) { next(err); }
});

// PATCH /api/collections/:id/deactivate
router.patch('/:id/deactivate', protect, adminOnly, async (req, res, next) => {
  try {
    const collection = await Collection.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    );
    if (!collection) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, collection });
  } catch (err) { next(err); }
});

// DELETE /api/collections/:id — permanent delete (marks isDeleted)
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    await Collection.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() });
    res.json({ success: true, message: 'Collection deleted' });
  } catch (err) { next(err); }
});

// ── Public dynamic (keep LAST to avoid matching static segments above) ────────

// GET /api/collections/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const collection = await Collection.findOne({ slug: req.params.slug, ...ACTIVE_FILTER })
      .populate('products', 'title price discountedPrice images slug category sizes rating isTrending')
      .lean();
    if (!collection) return res.status(404).json({ success: false, message: 'Collection not found' });
    res.json({ success: true, collection });
  } catch (err) { next(err); }
});

module.exports = router;
