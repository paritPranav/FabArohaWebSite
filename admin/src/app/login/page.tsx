'use client'
// apps/admin/src/app/login/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminStore } from '@/lib/store'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { Sparkles } from 'lucide-react'

export default function AdminLogin() {
  const router  = useRouter()
  const setAuth = useAdminStore(s => s.setAuth)
  const [form, setForm]     = useState({ phone: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.login(form)
      if (res.data.user.role !== 'admin') { toast.error('Admin access only'); return }
      setAuth(res.data.user, res.data.token)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display text-4xl text-bark">FabAroha</p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Sparkles size={12} className="text-sand" />
            <p className="text-xs text-stone-400 italic">Admin Panel</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-cream-200 p-8">
          <h1 className="font-display text-2xl text-bark mb-6">Sign In</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Phone Number</label>
              <input type="tel" required placeholder="+91 98765 43210"
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="input" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
