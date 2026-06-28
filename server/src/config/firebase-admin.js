// server/src/config/firebase-admin.js
const { initializeApp, getApps, getApp, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
if (!raw) {
  console.warn('[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON not set — phone OTP verify will not work')
} else if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(raw)
    initializeApp({ credential: cert(serviceAccount) })
    console.log('[firebase-admin] Initialized ✓')
  } catch (e) {
    console.error('[firebase-admin] Failed to initialize:', e.message)
  }
}

module.exports = { getAuth, getApps }
