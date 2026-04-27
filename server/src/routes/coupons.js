// apps/server/src/routes/coupons.js
const express = require('express');
const router  = express.Router();
const Coupon  = require('../models/Coupon');
const { protect, adminOnly } = require('../middleware/auth');

// ── GET /api/coupons/public ────────────────────────────────────────────────
// Public: return non-secret, active coupons for display in cart
router.get('/public', async (req, res, next) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      isSecret: false,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .select('code description discountType discountValue minOrderValue maxDiscount expiresAt')
      .sort('-createdAt')
      .lean();
    res.json({ success: true, coupons });
  } catch (err) { next(err); }
});

// ── POST /api/coupons/validate ─────────────────────────────────────────────
// Client-facing: validate a coupon code against a cart total
router.post('/validate', protect, async (req, res, next) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), isActive: true });

    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    if (coupon.expiresAt && coupon.expiresAt < new Date())
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    if (cartTotal < coupon.minOrderValue)
      return res.status(400).json({ success: false, message: `Minimum order of ₹${coupon.minOrderValue.toLocaleString('en-IN')} required` });

    const userUsed = coupon.usedBy.filter(id => id.toString() === req.user._id.toString()).length;
    if (userUsed >= coupon.userUsageLimit)
      return res.status(400).json({ success: false, message: 'You have already used this coupon' });

    const discount = coupon.discountType === 'percent'
      ? Math.min(Math.round((cartTotal * coupon.discountValue) / 100), coupon.maxDiscount || Infinity)
      : coupon.discountValue;

    res.json({
      success: true,
      coupon: {
        code:          coupon.code,
        description:   coupon.description,
        discountType:  coupon.discountType,
        discountValue: coupon.discountValue,
        discount,      // actual ₹ amount saved
      },
    });
  } catch (err) { next(err); }
});

// ── GET /api/coupons (admin) ───────────────────────────────────────────────
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt');
    res.json({ success: true, coupons });
  } catch (err) { next(err); }
});

// ── POST /api/coupons (admin) ──────────────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const {
      code, description, discountType, discountValue,
      minOrderValue, maxDiscount, usageLimit, userUsageLimit,
      isActive, isSecret, expiresAt,
    } = req.body;

    const coupon = await Coupon.create({
      code:           code.trim().toUpperCase(),
      description,
      discountType,
      discountValue:  Number(discountValue),
      minOrderValue:  Number(minOrderValue)  || 0,
      maxDiscount:    maxDiscount ? Number(maxDiscount) : undefined,
      usageLimit:     usageLimit  ? Number(usageLimit)  : undefined,
      userUsageLimit: Number(userUsageLimit) || 1,
      isActive:       isActive  !== false,
      isSecret:       Boolean(isSecret),
      expiresAt:      expiresAt || undefined,
    });

    res.status(201).json({ success: true, coupon });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Coupon code already exists' });
    next(err);
  }
});

// ── PUT /api/coupons/:id (admin) ───────────────────────────────────────────
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const {
      code, description, discountType, discountValue,
      minOrderValue, maxDiscount, usageLimit, userUsageLimit,
      isActive, isSecret, expiresAt,
    } = req.body;

    const update = {
      ...(code           && { code: code.trim().toUpperCase() }),
      ...(description    !== undefined && { description }),
      ...(discountType   && { discountType }),
      ...(discountValue  !== undefined && { discountValue: Number(discountValue) }),
      ...(minOrderValue  !== undefined && { minOrderValue: Number(minOrderValue) }),
      ...(maxDiscount    !== undefined && { maxDiscount: maxDiscount ? Number(maxDiscount) : null }),
      ...(usageLimit     !== undefined && { usageLimit: usageLimit ? Number(usageLimit) : null }),
      ...(userUsageLimit !== undefined && { userUsageLimit: Number(userUsageLimit) }),
      ...(isActive       !== undefined && { isActive }),
      ...(isSecret       !== undefined && { isSecret }),
      ...(expiresAt      !== undefined && { expiresAt: expiresAt || null }),
    };

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, coupon });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Coupon code already exists' });
    next(err);
  }
});

// ── DELETE /api/coupons/:id (admin) ───────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
