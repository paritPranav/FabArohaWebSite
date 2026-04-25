// apps/server/src/models/Coupon.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code:           { type: String, required: true, unique: true, uppercase: true },
    description:    { type: String },
    discountType:   { type: String, enum: ['percent', 'flat'], required: true },
    discountValue:  { type: Number, required: true },
    minOrderValue:  { type: Number, default: 0 },
    maxDiscount:    { type: Number },               // cap for percent discounts
    usageLimit:     { type: Number },               // total uses allowed
    usedCount:      { type: Number, default: 0 },
    userUsageLimit: { type: Number, default: 1 },   // per-user limit
    usedBy:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive:       { type: Boolean, default: true },
    expiresAt:      { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
