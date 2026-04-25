// apps/server/src/routes/testimonials.js
const express = require('express');
const router  = express.Router();
const Testimonial = require('../models/Testimonial');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/testimonials — public: list active testimonials
router.get('/', async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 });
    res.json({ success: true, testimonials });
  } catch (err) { next(err); }
});

// GET /api/testimonials/admin/all — admin: list all (including inactive)
router.get('/admin/all', protect, adminOnly, async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json({ success: true, testimonials });
  } catch (err) { next(err); }
});

// POST /api/testimonials — admin: create
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    res.status(201).json({ success: true, testimonial });
  } catch (err) { next(err); }
});

// PUT /api/testimonials/:id — admin: update
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!testimonial) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, testimonial });
  } catch (err) { next(err); }
});

// DELETE /api/testimonials/:id — admin: delete
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
