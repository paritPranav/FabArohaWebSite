// apps/server/src/models/OrderCollection.js
const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    bannerImage: { type: String },
    products:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive:    { type: Boolean, default: true },
    isDeleted:   { type: Boolean, default: false },
    deletedAt:   { type: Date },
    sortOrder:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Collection = mongoose.model('Collection', collectionSchema);


// ─────────────────────────────────────────────────────────────────────────────
// apps/server/src/models/Order.js
const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title:    { type: String, required: true },        // snapshot at time of order
  image:    { type: String },
  price:    { type: Number, required: true },
  size:     { type: String },
  color:    { type: String },
  quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items:           [orderItemSchema],
    shippingAddress: {
      fullName: String,
      phone:    String,
      line1:    String,
      line2:    String,
      city:     String,
      state:    String,
      pincode:  String,
      country:  { type: String, default: 'India' },
    },
    subtotal:        { type: Number, required: true },
    discount:        { type: Number, default: 0 },
    couponCode:      { type: String },
    shippingCharge:  { type: Number, default: 0 },
    totalAmount:     { type: Number, required: true },

    paymentMethod:   { type: String, enum: ['razorpay', 'cod'], required: true },
    paymentStatus:   { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },

    orderStatus:     {
      type: String,
      enum: ['placed','confirmed','processing','shipped','delivered','cancelled','returned'],
      default: 'placed',
    },
    trackingNumber:  { type: String },
    trackingUrl:     { type: String },
    estimatedDelivery: { type: Date },

    timeline: [
      {
        status:    String,
        message:   String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    notes:           { type: String },
  },
  { timestamps: true }
);

// Auto-push status to timeline on change
orderSchema.pre('save', function (next) {
  if (this.isModified('orderStatus')) {
    this.timeline.push({ status: this.orderStatus, message: `Order ${this.orderStatus}` });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = { Order, Collection };
