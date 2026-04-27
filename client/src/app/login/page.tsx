'use client'
// apps/client/src/app/login/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Phone, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [isRegister, setIsRegister] = useState(false)
  const [showPass, setShowPass]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = isRegister
        ? await authAPI.register({ name: form.name, phone: form.phone, email: form.email, password: form.password })
        : await authAPI.login({ phone: form.phone, password: form.password })

      setAuth(res.data.user, res.data.token)
      toast.success(isRegister ? 'Welcome to FabAroha ✨' : 'Welcome back ✨')
      router.push('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
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
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-stone-400 mt-2">
            {isRegister ? 'Join the FabAroha family' : 'Sign in to continue shopping'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text" placeholder="Your name" required
                  value={form.name} onChange={e => set('name', e.target.value)}
                  className="input"
                />
              </div>
            )}

            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="tel" placeholder="Enter mobile number" required
                  value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="label">
                  Email <span className="text-blush">*</span>
                </label>
                <input
                  type="email" placeholder="your@email.com" required
                  value={form.email} onChange={e => set('email', e.target.value)}
                  className="input"
                />
                <p className="text-xs text-stone-400 mt-1">Required to receive order confirmations & updates</p>
              </div>
            )}

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} placeholder="••••••••" required minLength={6}
                  value={form.password} onChange={e => set('password', e.target.value)}
                  className="input pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-bark">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2 mt-2">
              {loading ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-stone-400">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
              {' '}
              <button onClick={() => setIsRegister(!isRegister)}
                className="text-bark font-medium hover:text-clay transition-colors">
                {isRegister ? 'Sign In' : 'Create one'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
