// apps/server/src/routes/payments.js
const express  = require('express');
const router   = express.Router();
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const { protect } = require('../middleware/auth');
const { Order } = require('../models/OrderCollection');

router.post('/create-order', protect, async (req, res, next) => {
  try {
    const { amount, orderId } = req.body;

    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('[payments] Razorpay keys not configured in .env');
      return res.status(500).json({ success: false, message: 'Payment gateway not configured' });
    }

    console.log('[payments] Using Razorpay key_id:', keyId);

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const rzpOrder = await razorpay.orders.create({
      amount:   Math.round(amount * 100),
      currency: 'INR',
      receipt:  orderId,
    });

    await Order.findByIdAndUpdate(orderId, { razorpayOrderId: rzpOrder.id });
    res.json({ success: true, rzpOrder });
  } catch (err) {
    // Razorpay SDK throws plain objects, not Error instances
    const rzpError = err?.error || err;
    console.error('[payments] Razorpay create-order error:', JSON.stringify(rzpError, null, 2));
    res.status(502).json({
      success: false,
      message: rzpError?.description || rzpError?.message || 'Payment gateway error. Please try again.',
    });
  }
});

router.post('/verify', protect, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
    if (expected !== razorpay_signature) return res.status(400).json({ success: false, message: 'Payment verification failed' });
    await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid', razorpayPaymentId: razorpay_payment_id, orderStatus: 'confirmed' });
    res.json({ success: true, message: 'Payment verified' });
  } catch (err) { next(err); }
});

// POST /api/payments/webhook — called by Razorpay, NO auth middleware
router.post('/webhook', async (req, res) => {
  const sig    = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[webhook] RAZORPAY_WEBHOOK_SECRET not set');
    return res.status(500).json({ message: 'Webhook secret not configured' });
  }

  // req.body is a raw Buffer here (express.raw applied in index.js for this path)
  const expected = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
  if (expected !== sig) {
    console.warn('[webhook] Invalid signature — possible spoofed request');
    return res.status(400).json({ message: 'Invalid signature' });
  }

  let event;
  try { event = JSON.parse(req.body.toString()); }
  catch { return res.status(400).json({ message: 'Invalid JSON' }); }

  const payment = event.payload?.payment?.entity;
  if (!payment) return res.json({ status: 'ignored' });

  try {
    if (event.event === 'payment.captured') {
      await Order.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        { paymentStatus: 'paid', razorpayPaymentId: payment.id, orderStatus: 'confirmed' }
      );
      console.log(`[webhook] payment.captured — order ${payment.order_id} marked paid`);
    } else if (event.event === 'payment.failed') {
      await Order.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        { paymentStatus: 'failed' }
      );
      console.log(`[webhook] payment.failed — order ${payment.order_id} marked failed`);
    }
  } catch (err) {
    // Log but return 200 so Razorpay doesn't retry on a DB glitch
    console.error('[webhook] DB update error:', err);
  }

  res.json({ status: 'ok' });
});

router.post('/validate-coupon', protect, async (req, res, next) => {
  try {
    const { code, orderValue } = req.body;
    const Coupon = require('../models/Coupon');
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ success: false, message: 'Coupon expired' });
    if (orderValue < coupon.minOrderValue) return res.status(400).json({ success: false, message: `Minimum order ₹${coupon.minOrderValue} required` });
    const discount = coupon.discountType === 'percent'
      ? Math.min((orderValue * coupon.discountValue) / 100, coupon.maxDiscount || Infinity)
      : coupon.discountValue;
    res.json({ success: true, discount });
  } catch (err) { next(err); }
});

module.exports = router;
