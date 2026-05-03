// apps/server/src/routes/orders.js
const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const { protect, adminOnly } = require('../middleware/auth');
const { sendOrderPlacedEmail, sendOrderStatusEmail, sendAdminOrderNotification } = require('../utils/email');

// Lazy-load to avoid circular deps
const getOrder = () => require('../models/OrderCollection').Order;

// ── POST /api/orders ──────────────────────────────────────────────────────
router.post('/', protect, async (req, res, next) => {
  try {
    const Order = getOrder();
    const { items, shippingAddress, paymentMethod, couponCode } = req.body;

    let subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    let discount = 0;

    // Coupon validation
    if (couponCode) {
      const Coupon = require('../models/Coupon');
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
          subtotal >= coupon.minOrderValue &&
          (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit)) {

        const userUsed = coupon.usedBy.filter(id => id.toString() === req.user._id.toString()).length;
        if (userUsed < coupon.userUsageLimit) {
          discount = coupon.discountType === 'percent'
            ? Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscount || Infinity)
            : coupon.discountValue;
          coupon.usedCount += 1;
          coupon.usedBy.push(req.user._id);
          await coupon.save();
        }
      }
    }

    const shippingCharge = 0;
    const totalAmount = subtotal - discount;

    const order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress,
      subtotal,
      discount,
      couponCode,
      shippingCharge,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
    });

    res.status(201).json({ success: true, order });

    // Non-blocking: emails + purchase analytics events
    const User      = require('../models/User');
    const Analytics = require('../models/Analytics');
    const sessionId = req.headers['x-session-id'] || req.user._id.toString();

    User.findById(req.user._id).select('name email phone').then(user => {
      sendOrderPlacedEmail(order, user);
      sendAdminOrderNotification(order, user);
    }).catch(() => {});

    // One analytics event per line-item so product-level stats are accurate
    Promise.all(
      order.items.map(item =>
        Analytics.create({
          event:        'purchase',
          sessionId,
          productId:    item.product,
          productTitle: item.title,
          productImage: item.image,
          price:        item.price,
          quantity:     item.quantity,
        })
      )
    ).catch(() => {});
  } catch (err) {
    next(err);
  }
});

// ── GET /api/orders/track?orderId=xxx&phone=yyy — public, no auth ────────
router.get('/track', async (req, res, next) => {
  try {
    const { orderId, phone } = req.query;
    if (!orderId || !phone) return res.status(400).json({ success: false, message: 'Order ID and phone number are required' });

    const Order = getOrder();
    const order = await Order.findById(orderId)
      .populate('user', 'phone name')
      .populate('items.product', 'title images slug')
      .lean();

    if (!order) return res.status(404).json({ success: false, message: 'Order not found. Please check your Order ID.' });
    if (order.user?.phone !== phone) return res.status(403).json({ success: false, message: 'Phone number does not match this order.' });

    res.json({
      success: true,
      order: {
        _id:               order._id,
        orderStatus:       order.orderStatus,
        paymentStatus:     order.paymentStatus,
        trackingNumber:    order.trackingNumber || null,
        trackingUrl:       order.trackingUrl    || null,
        estimatedDelivery: order.estimatedDelivery || null,
        items:             order.items,
        totalAmount:       order.totalAmount,
        shippingAddress:   order.shippingAddress,
        createdAt:         order.createdAt,
      },
    });
  } catch (err) { next(err); }
});

// ── GET /api/orders/admin/stats ───────────────────────────────────────────
// Must be registered BEFORE /:id so Express doesn't treat "admin" as an id
router.get('/admin/stats', protect, adminOnly, async (req, res, next) => {
  try {
    const Order = getOrder();
    const User  = require('../models/User');
    const Product = require('../models/Product');

    const [totalOrders, totalRevenue, totalUsers, totalProducts, recentOrders, revenueByMonth] =
      await Promise.all([
        Order.countDocuments(),
        Order.aggregate([
          { $match: { paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
        User.countDocuments({ role: 'user' }),
        Product.countDocuments({ isActive: true }),
        Order.find().populate('user', 'name').sort('-createdAt').limit(5),
        Order.aggregate([
          { $match: { paymentStatus: 'paid' } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              revenue: { $sum: '$totalAmount' },
              orders:  { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $limit: 12 },
        ]),
      ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalUsers,
        totalProducts,
        recentOrders,
        revenueByMonth,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/orders/my ────────────────────────────────────────────────────
router.get('/my', protect, async (req, res, next) => {
  try {
    const Order = getOrder();
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'title images slug')
      .sort('-createdAt');
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/orders/:id ───────────────────────────────────────────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const Order = getOrder();
    const order = await Order.findById(req.params.id)
      .populate('user', 'name phone email')
      .populate('items.product', 'title images slug');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Only owner or admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/orders (admin) ───────────────────────────────────────────────
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const Order = getOrder();
    const { page = 1, limit = 20, status, paymentStatus } = req.query;
    const query = {};
    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name phone')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.json({ success: true, orders, total });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/orders/:id/status (admin) ────────────────────────────────────
router.put('/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const Order = getOrder();
    const { orderStatus, paymentStatus, trackingNumber, trackingUrl, estimatedDelivery } = req.body;
    const update = { orderStatus, trackingNumber, trackingUrl, estimatedDelivery };
    if (paymentStatus) update.paymentStatus = paymentStatus;
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, order });

    // Send status update email (non-blocking)
    const User = require('../models/User');
    User.findById(order.user).select('name email').then(user => {
      sendOrderStatusEmail(order, user);
    }).catch(() => {});
  } catch (err) {
    next(err);
  }
});

module.exports = router;


// ─────────────────────────────────────────────────────────────────────────────
// apps/server/src/routes/collections.js — export separately, share file for brevity
