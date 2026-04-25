// apps/server/src/routes/users.js
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/users — admin
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { role: 'user' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).select('-password -otp').skip((page-1)*limit).limit(+limit).sort('-createdAt'),
      User.countDocuments(query),
    ]);

    res.json({ success: true, users, total });
  } catch (err) { next(err); }
});

// PUT /api/users/:id/block — admin
router.put('/:id/block', protect, adminOnly, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: req.body.isBlocked }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

// GET /api/users/wishlist — own wishlist
router.get('/wishlist', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', 'title price images slug discountedPrice');
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) { next(err); }
});

module.exports = router;


// ─────────────────────────────────────────────────────────────────────────────
// apps/server/src/routes/payments.js
const expressP = require('express');
const routerP  = expressP.Router();
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const { protect } = require('../middleware/auth');
const { Order } = require('../models/OrderCollection');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/create-order
routerP.post('/create-order', protect, async (req, res, next) => {
  try {
    const { amount, orderId } = req.body;   // amount in paise

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: orderId,
    });

    // Save razorpay order id to our order
    await Order.findByIdAndUpdate(orderId, { razorpayOrderId: rzpOrder.id });

    res.json({ success: true, rzpOrder });
  } catch (err) { next(err); }
});

// POST /api/payments/verify
routerP.post('/verify', protect, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      razorpayPaymentId: razorpay_payment_id,
      orderStatus: 'confirmed',
    });

    res.json({ success: true, message: 'Payment verified' });
  } catch (err) { next(err); }
});

// POST /api/payments/validate-coupon
routerP.post('/validate-coupon', protect, async (req, res, next) => {
  try {
    const { code, orderValue } = req.body;
    const Coupon = require('../models/Coupon');
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ success: false, message: 'Coupon expired' });
    if (orderValue < coupon.minOrderValue) return res.status(400).json({ success: false, message: `Minimum order ₹${coupon.minOrderValue} required` });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });

    const userUsed = coupon.usedBy.filter(id => id.toString() === req.user._id.toString()).length;
    if (userUsed >= coupon.userUsageLimit) return res.status(400).json({ success: false, message: 'You have already used this coupon' });

    const discount = coupon.discountType === 'percent'
      ? Math.min((orderValue * coupon.discountValue) / 100, coupon.maxDiscount || Infinity)
      : coupon.discountValue;

    res.json({ success: true, coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, discount } });
  } catch (err) { next(err); }
});

module.exports = { payments: routerP };


// ─────────────────────────────────────────────────────────────────────────────
// apps/server/src/routes/upload.js — S3 presigned URL generation
const expressU = require('express');
const routerU  = expressU.Router();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { protect: protectU, adminOnly: adminOnlyU } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const s3 = new S3Client({ region: process.env.AWS_REGION });

// POST /api/upload/presign — admin only
routerU.post('/presign', protectU, adminOnlyU, async (req, res, next) => {
  try {
    const { fileName, fileType, folder = 'products' } = req.body;
    const key = `${folder}/${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    res.json({
      success: true,
      uploadUrl,
      publicUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    });
  } catch (err) { next(err); }
});

module.exports = { upload: routerU };
