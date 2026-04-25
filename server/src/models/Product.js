// apps/server/src/models/Product.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:    { type: String, required: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    price:       { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number },               // sale price
    images:      [{ type: String }],                 // S3 URLs
    category:    {
      type: String,
      required: true,
      enum: ['Men', 'Women', 'Unisex', 'Kids', 'Accessories'],
    },
    subCategory: { type: String },                   // e.g. Tops, Bottoms, Dresses
    collection:  { type: mongoose.Schema.Types.ObjectId, ref: 'Collection' },
    tags:        [{ type: String }],                 // ["summer","casual","fab-aroha"]
    sizes: [
      {
        label: { type: String, enum: ['XS','S','M','L','XL','XXL','XXXL'] },
        stock: { type: Number, default: 0 },
      },
    ],
    colors: [
      {
        name: { type: String },                      // "Sage Green"
        hex:  { type: String },                      // "#8FAF89"
      },
    ],
    totalStock:  { type: Number, default: 0 },
    isFeatured:  { type: Boolean, default: false },
    isTrending:  { type: Boolean, default: false },
    isActive:    { type: Boolean, default: true },
    reviews:     [reviewSchema],
    rating:      { type: Number, default: 0 },
    numReviews:  { type: Number, default: 0 },
    sku:         { type: String, unique: true },
    weight:      { type: Number },                   // grams — for shipping
    material:    { type: String },
    careInstructions: { type: String },
    sizeChart:   { type: String },                    // S3 URL of size chart image
  },
  { timestamps: true }
);

// Auto-compute totalStock from sizes
productSchema.pre('save', function (next) {
  this.totalStock = this.sizes.reduce((acc, s) => acc + s.stock, 0);
  next();
});

// Auto-compute average rating
productSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    this.numReviews = this.reviews.length;
    this.rating =
      this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.numReviews;
  }
};

// Text search index
productSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
