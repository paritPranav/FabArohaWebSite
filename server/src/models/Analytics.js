// server/src/models/Analytics.js
const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    event: {
      type:     String,
      required: true,
      enum:     ['product_view', 'add_to_cart', 'wishlist_add', 'purchase'],
      index:    true,
    },
    sessionId:    { type: String, required: true, index: true },
    productId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true, sparse: true },
    productSlug:  { type: String },
    productTitle: { type: String },
    productImage: { type: String },
    price:        { type: Number },
    quantity:     { type: Number, default: 1 },
    createdAt:    { type: Date, default: Date.now, index: true },
  },
  { timestamps: false, versionKey: false }
);

// Auto-delete after 90 days to keep the collection lean
analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('Analytics', analyticsSchema);
