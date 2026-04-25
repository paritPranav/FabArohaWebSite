// apps/server/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label:    { type: String, default: 'Home' },       // Home / Work / Other
  fullName: { type: String, required: true },
  phone:    { type: String, required: true },
  line1:    { type: String, required: true },
  line2:    { type: String },
  city:     { type: String, required: true },
  state:    { type: String, required: true },
  pincode:  { type: String, required: true },
  country:  { type: String, default: 'India' },
  isDefault:{ type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    phone:       { type: String, required: true, unique: true, trim: true },
    email:       { type: String, trim: true, lowercase: true },
    password:    { type: String, required: true, minlength: 6 },
    role:        { type: String, enum: ['user', 'admin'], default: 'user' },
    isBlocked:   { type: Boolean, default: false },
    addresses:   [addressSchema],
    wishlist:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    avatar:      { type: String },                   // S3 URL
    // OTP for phone verification (optional bonus)
    otp:         { type: String },
    otpExpiresAt:{ type: Date },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
