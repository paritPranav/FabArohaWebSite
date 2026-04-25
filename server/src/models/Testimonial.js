// apps/server/src/models/Testimonial.js
const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    image:       { type: String },                   // S3 URL — customer photo
    description: { type: String, required: true },   // review text
    rating:      { type: Number, required: true, min: 1, max: 5 },
    isActive:    { type: Boolean, default: true },
    sortOrder:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);
