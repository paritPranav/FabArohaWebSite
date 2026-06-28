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
    tagline:      { type: String },                      // e.g. "Effortless bohemian elegance"
    keyHighlights: [{ type: String }],                   // ["100% natural fabrics", "Limited edition"]
    occasion:     { type: String },                      // "Perfect for beach weddings & summer parties"
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

    paymentMethod:   { type: String, enum: ['razorpay', 'cod', 'cash', 'upi', 'card', 'bank_transfer'], required: true },
    paymentStatus:   { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },

    // Offline / in-store order fields
    isOfflineOrder:        { type: Boolean, default: false },
    additionalDiscount:    { type: Number, default: 0 },
    additionalDiscountName: { type: String },
    createdBy:             { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin who created

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
    invoiceNumber:   { type: String },  // auto-generated invoice number
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
