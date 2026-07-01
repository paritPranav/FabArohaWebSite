// apps/server/src/routes/auth.js
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');
const crypto  = require('crypto');
const axios   = require('axios');
const { getAuth, getApps } = require('../config/firebase-admin');

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

// ── POST /api/auth/send-otp ───────────────────────────────────────────────────
// Body: { phone: "9876543210" }
// Generates a 6-digit OTP, saves it to the user (creates one if new), sends SMS via Fast2SMS
router.post('/send-otp', async (req, res, next) => {
  try {
    const { phone } = req.body;
    const digits = String(phone || '').replace(/\D/g, '');
    console.log(`[OTP:send-otp] REQUEST  phone_raw="${phone}" digits="${digits}"`);

    if (digits.length !== 10) {
      console.warn(`[OTP:send-otp] REJECTED  invalid phone digits.length=${digits.length}`);
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number' });
    }

    // Generate 6-digit OTP
    const otp        = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry  = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log(`[OTP:send-otp] GENERATED  otp=${otp} expires=${otpExpiry.toISOString()}`);

    // Upsert: find existing user or prepare a placeholder (verified on verify-otp)
    let user = await User.findOne({ phone: digits });
    if (user) {
      console.log(`[OTP:send-otp] USER_FOUND  id=${user._id} name="${user.name}" isBlocked=${user.isBlocked}`);
      user.otp          = otp;
      user.otpExpiresAt = otpExpiry;
      await user.save();
      console.log(`[OTP:send-otp] OTP_SAVED  (existing user)`);
    } else {
      console.log(`[OTP:send-otp] USER_NOT_FOUND  creating pending user`);
      // Store OTP temporarily — user will be created on verify
      // Use a minimal doc; will be fleshed out on verification
      user = await User.findOneAndUpdate(
        { phone: digits },
        { $set: { otp, otpExpiresAt: otpExpiry, name: 'pending', password: crypto.randomBytes(20).toString('hex') } },
        { upsert: true, new: true }
      );
      console.log(`[OTP:send-otp] OTP_SAVED  (new pending user id=${user._id})`);
    }

    // ── Send SMS ─────────────────────────────────────────────────────────────
    const twofactorKey = process.env.TWOFACTOR_API_KEY;
    const fast2smsKey  = process.env.FAST2SMS_API_KEY;
    console.log(`[OTP:send-otp] SMS_PROVIDER  twofactor=${!!twofactorKey} fast2sms=${!!fast2smsKey}`);

    if (twofactorKey) {
      // 2Factor.in — simplest OTP API, no DLT or website verification needed
      try {
        const dialNumber = `91${digits}`;
        console.log(`[OTP:send-otp] 2FACTOR  calling API for ${dialNumber}`);
        const smsRes = await axios.get(
          `https://2factor.in/API/V1/${twofactorKey}/SMS/${dialNumber}/${otp}/OTP1`,
          { timeout: 10000 }
        );
        console.log('[OTP:send-otp] 2FACTOR_RESPONSE  status=%d data=%s', smsRes.status, JSON.stringify(smsRes.data));
        if (smsRes.data?.Status === 'Error') throw new Error(smsRes.data.Details);
      } catch (smsErr) {
        console.error('[OTP:send-otp] 2FACTOR_ERROR  message="%s" response=%s', smsErr.message, JSON.stringify(smsErr.response?.data));
        return res.status(502).json({ success: false, message: `SMS error: ${smsErr.message}` });
      }
    } else if (fast2smsKey) {
      // Fast2SMS (requires website verification in dashboard first)
      try {
        console.log(`[OTP:send-otp] FAST2SMS  calling API for ${digits}`);
        const smsRes = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
          params: { authorization: fast2smsKey, variables_values: otp, route: 'otp', numbers: digits },
          timeout: 10000,
        });
        console.log('[OTP:send-otp] FAST2SMS_RESPONSE  status=%d data=%s', smsRes.status, JSON.stringify(smsRes.data));
      } catch (smsErr) {
        const smsBody = smsErr.response?.data;
        console.error('[OTP:send-otp] FAST2SMS_ERROR  message="%s" response=%s', smsErr.message, JSON.stringify(smsBody));
        const msg = smsBody?.message?.[0] || smsBody?.message || smsErr.message || 'SMS delivery failed';
        return res.status(502).json({ success: false, message: `SMS error: ${msg}` });
      }
    } else {
      // No SMS key — dev mode, print OTP to console
      console.log(`\n[DEV] ============================`);
      console.log(`[DEV] OTP for ${digits}: ${otp}`);
      console.log(`[DEV] ============================\n`);
    }

    console.log(`[OTP:send-otp] SUCCESS  OTP sent to ${digits}`);
    res.json({ success: true, message: `OTP sent to ${digits}` });
  } catch (err) {
    console.error('[OTP:send-otp] UNHANDLED_ERROR  message="%s" stack=%s', err.message, err.stack);
    next(err);
  }
});

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
// Body: { phone, otp, name?, email? }
// Verifies OTP, creates account if new, returns JWT
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { phone, otp, name, email } = req.body;
    const digits = String(phone || '').replace(/\D/g, '');
    console.log(`[OTP:verify-otp] REQUEST  phone_raw="${phone}" digits="${digits}" otp_provided=${!!otp} name="${name}" email="${email}"`);

    if (!digits || !otp) {
      console.warn(`[OTP:verify-otp] REJECTED  missing digits=${!digits} otp=${!otp}`);
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const user = await User.findOne({ phone: digits });
    console.log(`[OTP:verify-otp] USER_LOOKUP  found=${!!user} hasOtp=${!!user?.otp} isBlocked=${user?.isBlocked}`);

    if (!user || !user.otp) {
      console.warn(`[OTP:verify-otp] REJECTED  user_not_found_or_no_otp`);
      return res.status(400).json({ success: false, message: 'OTP not sent or expired. Please request again.' });
    }

    const now = new Date();
    console.log(`[OTP:verify-otp] OTP_CHECK  stored="${user.otp}" provided="${String(otp)}" expiresAt=${user.otpExpiresAt?.toISOString()} now=${now.toISOString()} expired=${user.otpExpiresAt < now}`);

    if (user.otpExpiresAt < now) {
      console.warn(`[OTP:verify-otp] REJECTED  otp_expired`);
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    if (user.otp !== String(otp)) {
      console.warn(`[OTP:verify-otp] REJECTED  otp_mismatch stored="${user.otp}" provided="${String(otp)}"`);
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    // OTP valid — clear it
    const isNewUser = user.name === 'pending';
    console.log(`[OTP:verify-otp] OTP_VALID  isNewUser=${isNewUser}`);

    if (isNewUser) {
      if (!name?.trim()) {
        // Signal client to ask for name
        console.log(`[OTP:verify-otp] NEEDS_NAME  returning needsName=true`);
        return res.json({ success: true, isNewUser: true, needsName: true });
      }
      user.name = name.trim();
      if (email?.trim()) user.email = email.trim().toLowerCase();
    } else {
      // Returning user — optionally update email if newly provided
      if (email?.trim() && !user.email) user.email = email.trim().toLowerCase();
    }

    user.otp          = undefined;
    user.otpExpiresAt = undefined;
    if (user.isBlocked) {
      console.warn(`[OTP:verify-otp] REJECTED  account_blocked id=${user._id}`);
      return res.status(403).json({ success: false, message: 'Account blocked. Contact support.' });
    }
    await user.save();

    const token = generateToken(user._id, user.role);
    console.log(`[OTP:verify-otp] SUCCESS  id=${user._id} name="${user.name}" isNewUser=${isNewUser} role=${user.role}`);

    res.json({
      success: true,
      isNewUser,
      token,
      user: { _id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (err) {
    console.error('[OTP:verify-otp] UNHANDLED_ERROR  message="%s" stack=%s', err.message, err.stack);
    next(err);
  }
});

// ── POST /api/auth/guest-checkout ─────────────────────────────────────────────
// No OTP — used for Buy Now guest flow. Finds existing user by phone or creates one.
// Returns JWT so the caller can place an order immediately.
router.post('/guest-checkout', async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    const digits = String(phone || '').replace(/\D/g, '');

    if (!name?.trim() || digits.length !== 10) {
      return res.status(400).json({ success: false, message: 'Name and a valid 10-digit phone are required' });
    }

    let user = await User.findOne({ phone: digits });

    if (!user) {
      user = await User.create({
        name:     name.trim(),
        phone:    digits,
        email:    email?.trim().toLowerCase() || undefined,
        password: crypto.randomBytes(20).toString('hex'),
      });
    } else {
      if (user.isBlocked) {
        return res.status(403).json({ success: false, message: 'Account blocked. Contact support.' });
      }
      // Patch stale placeholder name / missing email
      if (user.name === 'pending') user.name = name.trim();
      if (email?.trim() && !user.email) user.email = email.trim().toLowerCase();
      await user.save();
    }

    const token = generateToken(user._id, user.role);
    res.json({
      success: true,
      token,
      user: { _id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/firebase-verify ────────────────────────────────────────────
// Called after client-side Firebase phone OTP is verified.
// Body: { idToken: string, name?: string, email?: string }
// Works for both login (returning user) and signup (new user) — no password needed.
router.post('/firebase-verify', async (req, res, next) => {
  try {
    const { idToken, name, email } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'idToken is required' });

    if (!getApps().length) {
      return res.status(503).json({ success: false, message: 'Firebase Admin not configured on server' });
    }

    // Verify with Firebase Admin
    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(idToken);
    } catch (fbErr) {
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP token' });
    }

    const firebasePhone = decoded.phone_number; // e.g. "+919876543210"
    if (!firebasePhone) {
      return res.status(400).json({ success: false, message: 'No phone number in Firebase token' });
    }

    // Normalize: strip +91 country code — store just 10 digits
    const normalizedPhone = firebasePhone.replace(/^\+91/, '').replace(/\D/g, '');

    let user = await User.findOne({ phone: normalizedPhone });
    let isNewUser = false;

    if (!user) {
      // New user — requires a name (fallback to last 4 digits if not provided yet)
      if (!name?.trim()) {
        // Signal to client that name is required before we can create account
        return res.json({ success: true, isNewUser: true, needsName: true });
      }

      const randomPass = crypto.randomBytes(20).toString('hex'); // never used — OTP auth only
      user = await User.create({
        name:     name.trim(),
        phone:    normalizedPhone,
        email:    email?.trim().toLowerCase() || undefined,
        password: randomPass,
      });
      isNewUser = true;
    } else {
      if (user.isBlocked) {
        return res.status(403).json({ success: false, message: 'Account blocked. Contact support.' });
      }
      // Update email if newly provided and not already set
      if (email?.trim() && !user.email) {
        user.email = email.trim().toLowerCase();
        await user.save();
      }
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success:  true,
      isNewUser,
      token,
      user: {
        _id:    user._id,
        name:   user.name,
        phone:  user.phone,
        email:  user.email,
        role:   user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
