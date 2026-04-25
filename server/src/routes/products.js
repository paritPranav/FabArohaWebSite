// apps/server/src/routes/products.js
const express  = require('express');
const router   = express.Router();
const Product  = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// ── GET /api/products ─────────────────────────────────────────────────────
// Public: list products with filters, sorting, pagination
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      category, collection, size, color, minPrice, maxPrice,
      sort = '-createdAt', search, featured, trending, tag,
    } = req.query;

    const query = { isActive: true };

    if (category)   query.category   = category;
    if (collection) query.collection = collection;
    if (featured)   query.isFeatured = true;
    if (trending)   query.isTrending = true;
    if (tag)        query.tags = { $in: [tag] };
    if (size)       query['sizes.label'] = size;
    if (color)      query['colors.name'] = { $regex: color, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('collection', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/products/:slug ───────────────────────────────────────────────
router.get('/:slug', async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('collection', 'name slug')
      .populate('reviews.user', 'name avatar');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/products ────────────────────────────────────────────────────
// Admin: create product
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    // Auto-generate slug from title if not provided
    if (!req.body.slug) {
      req.body.slug = req.body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Auto-generate SKU
    if (!req.body.sku) {
      req.body.sku = `FA-${Date.now()}`;
    }

    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/products/:id ─────────────────────────────────────────────────
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/products/:id ──────────────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/products/:id/review ─────────────────────────────────────────
router.post('/:id/review', protect, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Check if user already reviewed
    const existing = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already reviewed this product' });
    }

    product.reviews.push({ user: req.user._id, name: req.user.name, rating, comment });
    product.updateRating();
    await product.save();

    res.status(201).json({ success: true, message: 'Review added' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/products/:id/wishlist ───────────────────────────────────────
router.post('/:id/wishlist', protect, async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    const pid  = req.params.id;

    const idx = user.wishlist.findIndex(id => id.toString() === pid);
    let action;
    if (idx > -1) {
      user.wishlist.splice(idx, 1);
      action = 'removed';
    } else {
      user.wishlist.push(pid);
      action = 'added';
    }

    await user.save();
    res.json({ success: true, action, wishlist: user.wishlist });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
