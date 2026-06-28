'use client'
// apps/client/src/app/login/page.tsx
// OTP-only auth — no Firebase, no reCAPTCHA.
// Step 1: Enter phone → backend sends OTP via Fast2SMS
// Step 2: Enter OTP → backend verifies → login / create account
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Phone, Lock, Sparkles, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/store'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

type Step = 'phone' | 'otp'

export default function LoginPage() {
  const router  = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [step, setStep]           = useState<Step>('phone')
  const [phone, setPhone]         = useState('')
  const [otp, setOtp]             = useState('')
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [sending, setSending]     = useState(false)
  const [verifying, setVerifying] = useState(false)

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) { toast.error('Enter a valid 10-digit mobile number'); return }

    setSending(true)
    try {
      await authAPI.sendOtp({ phone: digits })
      setStep('otp')
      toast.success(`OTP sent to +91 ${digits}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Try again.')
    } finally {
      setSending(false)
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return }
    if (isNewUser && !name.trim()) { toast.error('Please enter your name'); return }

    setVerifying(true)
    try {
      const digits    = phone.replace(/\D/g, '')
      const { data }  = await authAPI.verifyOtp({
        phone: digits,
        otp,
        name:  name.trim() || undefined,
        email: email.trim() || undefined,
      })

      if (data.success) {
        if (data.needsName) {
          setIsNewUser(true)
          setVerifying(false)
          toast('Welcome! Enter your name to finish signing up.', { icon: '👋' })
          return
        }
        setAuth(data.user, data.token)
        toast.success(data.isNewUser ? `Welcome to FabAroha, ${data.user.name}! ✨` : `Welcome back, ${data.user.name}! ✨`)
        router.push('/')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification failed. Try again.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-3xl text-bark">FabAroha</Link>
          <div className="flex items-center justify-center gap-1.5 mt-1 mb-6">
            <Sparkles size={11} className="text-sand-400" />
            <p className="text-xs text-stone-400 italic">style · comfort · elegance</p>
          </div>
          <h1 className="font-display text-4xl text-bark">
            {step === 'phone' ? 'Sign In / Sign Up' : 'Verify OTP'}
          </h1>
          <p className="text-sm text-stone-400 mt-2">
            {step === 'phone'
              ? 'Enter your mobile number to continue'
              : `OTP sent to +91 ${phone}`}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-card p-8">
          <AnimatePresence mode="wait">

            {/* ── Phone step ── */}
            {step === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div>
                  <label className="label">Mobile Number</label>
                  <div className="flex gap-2">
                    <span className="input w-16 flex-shrink-0 flex items-center justify-center bg-cream-100 text-stone-500 text-sm">+91</span>
                    <div className="relative flex-1">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="98765 43210"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                        className="input pl-10"
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSendOTP}
                  disabled={sending || phone.replace(/\D/g, '').length !== 10}
                  className="btn-primary w-full py-4 flex items-center justify-center gap-2 mt-2"
                >
                  {sending ? 'Sending OTP…' : 'Get OTP'}
                </button>

                <p className="text-xs text-stone-400 text-center pt-1">
                  New or existing — same flow. OTP sent via SMS.
                </p>
              </motion.div>
            )}

            {/* ── OTP step ── */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="label">6-digit OTP</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={e => e.key === 'Enter' && !isNewUser && handleVerifyOTP()}
                      className="input pl-10 text-center tracking-[0.4em] text-lg font-medium"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Name + Email — shown for new users */}
                <AnimatePresence>
                  {isNewUser && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3"
                    >
                      <div className="bg-sage/10 rounded-2xl px-4 py-3">
                        <p className="text-xs text-sage font-medium">Welcome! Just a few details to set up your account.</p>
                      </div>
                      <div>
                        <label className="label">Your Name</label>
                        <input
                          type="text"
                          placeholder="Priya Sharma"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="input"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="label">Email <span className="font-normal text-stone-400">(for order updates)</span></label>
                        <input
                          type="email"
                          placeholder="priya@email.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="input"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleVerifyOTP}
                  disabled={verifying || otp.length !== 6 || (isNewUser && !name.trim())}
                  className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                >
                  {verifying ? 'Verifying…' : isNewUser ? 'Complete Sign Up' : 'Verify & Login'}
                </button>

                <button
                  onClick={() => { setStep('phone'); setOtp(''); setIsNewUser(false) }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-stone-400 hover:text-bark transition-colors py-1"
                >
                  <ArrowLeft size={12} /> Change number / Resend OTP
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
