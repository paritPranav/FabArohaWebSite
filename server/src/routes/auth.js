// apps/server/src/routes/auth.js
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');

// ── POST /api/auth/register ────────────────────────────────────────────────
// Register with phone number (primary identifier) + name + password
router.post('/register', async (req, res, next) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, phone, email and password are required' });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Phone number already registered' });
    }

    const emailTaken = await User.findOne({ email: email.toLowerCase() });
    if (emailTaken) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, phone, email, password });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id:   user._id,
        name:  user.name,
        phone: user.phone,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────
// Login with phone + password
router.post('/login', async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password are required' });
    }

    const user = await User.findOne({ phone });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid phone or password' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account blocked. Contact support.' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      token,
      user: {
        _id:   user._id,
        name:  user.name,
        phone: user.phone,
        email: user.email,
        role:  user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// ── PUT /api/auth/profile ──────────────────────────────────────────────────
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user._id);

    if (name)  user.name  = name;
    if (email) user.email = email;
    if (password) user.password = password;   // pre-save hook re-hashes

    await user.save();

    res.json({
      success: true,
      user: {
        _id:   user._id,
        name:  user.name,
        phone: user.phone,
        email: user.email,
        role:  user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/address ─────────────────────────────────────────────────
router.post('/address', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    // If new address is default, unset others
    if (req.body.isDefault) {
      user.addresses.forEach(a => (a.isDefault = false));
    }

    user.addresses.push(req.body);
    await user.save();

    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/auth/address/:id ──────────────────────────────────────────
router.delete('/address/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
