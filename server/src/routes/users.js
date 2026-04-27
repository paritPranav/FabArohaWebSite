// apps/server/src/routes/users.js
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/users — admin: list all users
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { role: 'user' };
    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const [users, total] = await Promise.all([
      User.find(query).select('-password -otp').skip((page - 1) * limit).limit(+limit).sort('-createdAt'),
      User.countDocuments(query),
    ]);
    res.json({ success: true, users, total });
  } catch (err) { next(err); }
});

// GET /api/users/wishlist — user's own wishlist  (must be BEFORE /:id)
router.get('/wishlist', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wishlist', 'title price images slug discountedPrice sizes isTrending rating numReviews colors collection');
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) { next(err); }
});

// GET /api/users/:id — admin: full user detail + order history
router.get('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const Order = require('../models/OrderCollection').Order;
    const [user, orders] = await Promise.all([
      User.findById(req.params.id).select('-password -otp -otpExpiresAt')
        .populate('wishlist', 'title images slug price'),
      Order.find({ user: req.params.id })
        .select('_id totalAmount orderStatus paymentStatus createdAt items')
        .sort('-createdAt')
        .limit(50),
    ]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user, orders });
  } catch (err) { next(err); }
});

// PUT /api/users/:id/block — admin: block or unblock user
router.put('/:id/block', protect, adminOnly, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: req.body.isBlocked },
      { new: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

module.exports = router;
