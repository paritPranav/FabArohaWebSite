'use client'
// apps/admin/src/app/dashboard/coupons/page.tsx
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Ticket, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { couponAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Coupon {
  _id: string
  code: string
  description: string
  discountType: 'percent' | 'flat'
  discountValue: number
  minOrderValue: number
  maxDiscount?: number
  usageLimit?: number
  userUsageLimit: number
  usedCount: number
  isActive: boolean
  isSecret: boolean
  expiresAt?: string
  createdAt: string
}

const EMPTY_FORM = {
  code: '', description: '', discountType: 'percent' as 'percent' | 'flat',
  discountValue: '', minOrderValue: '', maxDiscount: '', usageLimit: '',
  userUsageLimit: '1', isActive: true, isSecret: false, expiresAt: '',
}

export default function CouponsPage() {
  const [coupons, setCoupons]   = useState<Coupon[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Coupon | null>(null)
  const [form, setForm]         = useState({ ...EMPTY_FORM })
  const [saving, setSaving]     = useState(false)
  const [copied, setCopied]     = useState<string | null>(null)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const load = async () => {
    try {
      const { data } = await couponAPI.list()
      setCoupons(data.coupons)
    } catch { toast.error('Failed to load coupons') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setShowForm(true)
  }

  const openEdit = (c: Coupon) => {
    setEditing(c)
    setForm({
      code:           c.code,
      description:    c.description || '',
      discountType:   c.discountType,
      discountValue:  String(c.discountValue),
      minOrderValue:  String(c.minOrderValue || ''),
      maxDiscount:    c.maxDiscount ? String(c.maxDiscount) : '',
      usageLimit:     c.usageLimit  ? String(c.usageLimit)  : '',
      userUsageLimit: String(c.userUsageLimit || 1),
      isActive:       c.isActive,
      isSecret:       c.isSecret,
      expiresAt:      c.expiresAt ? c.expiresAt.slice(0, 10) : '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        code:           form.code.trim().toUpperCase(),
        description:    form.description,
        discountType:   form.discountType,
        discountValue:  Number(form.discountValue),
        minOrderValue:  Number(form.minOrderValue) || 0,
        maxDiscount:    form.maxDiscount  ? Number(form.maxDiscount)  : null,
        usageLimit:     form.usageLimit   ? Number(form.usageLimit)   : null,
        userUsageLimit: Number(form.userUsageLimit) || 1,
        isActive:       form.isActive,
        isSecret:       form.isSecret,
        expiresAt:      form.expiresAt || null,
      }
      if (editing) {
        await couponAPI.update(editing._id, payload)
        toast.success('Coupon updated')
      } else {
        await couponAPI.create(payload)
        toast.success('Coupon created')
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save coupon')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return
    try {
      await couponAPI.delete(id)
      toast.success('Coupon deleted')
      setCoupons(c => c.filter(x => x._id !== id))
    } catch { toast.error('Failed to delete') }
  }

  const toggleActive = async (c: Coupon) => {
    try {
      await couponAPI.update(c._id, { isActive: !c.isActive })
      setCoupons(cs => cs.map(x => x._id === c._id ? { ...x, isActive: !c.isActive } : x))
    } catch { toast.error('Failed to update') }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-bark">Coupons</h1>
          <p className="text-sm text-stone-400 mt-0.5">Create and manage discount codes</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-bark text-cream-100 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-clay transition-colors">
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-sage border-t-transparent animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-24 text-stone-400">
          <Ticket size={40} className="mx-auto mb-3 opacity-30" />
          <p>No coupons yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {coupons.map(c => (
            <div key={c._id} className={clsx('bg-white rounded-2xl border p-5 flex items-center gap-5', c.isActive ? 'border-cream-200' : 'border-cream-200 opacity-60')}>
              {/* Badge */}
              <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', c.isActive ? 'bg-sage-50 text-sage' : 'bg-cream-100 text-stone-400')}>
                <Ticket size={20} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => copyCode(c.code)}
                    className="font-mono font-bold text-bark text-sm tracking-wider hover:text-sage transition-colors flex items-center gap-1"
                  >
                    {c.code}
                    {copied === c.code ? <Check size={13} className="text-sage" /> : <Copy size={12} className="opacity-40" />}
                  </button>
                  {c.isSecret && (
                    <span className="text-xs bg-sand/20 text-sand-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <EyeOff size={10} /> Secret
                    </span>
                  )}
                  {!c.isActive && (
                    <span className="text-xs bg-cream-100 text-stone-400 px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                  {c.expiresAt && new Date(c.expiresAt) < new Date() && (
                    <span className="text-xs bg-red-50 text-red-400 px-2 py-0.5 rounded-full">Expired</span>
                  )}
                </div>
                {c.description && <p className="text-xs text-stone-400 mt-0.5 truncate">{c.description}</p>}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-stone-400">
                  <span className="font-medium text-bark">
                    {c.discountType === 'percent' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                    {c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}
                  </span>
                  {c.minOrderValue > 0 && <span>Min ₹{c.minOrderValue.toLocaleString('en-IN')}</span>}
                  <span>{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''} uses</span>
                  {c.expiresAt && <span>Expires {new Date(c.expiresAt).toLocaleDateString('en-IN')}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(c)}
                  title={c.isActive ? 'Deactivate' : 'Activate'}
                  className={clsx('p-2 rounded-lg transition-colors', c.isActive ? 'text-sage hover:bg-sage-50' : 'text-stone-400 hover:bg-cream-100')}
                >
                  {c.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-stone-400 hover:text-bark hover:bg-cream-100 transition-colors">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(c._id, c.code)} className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bark/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-4 border-b border-cream-200 flex items-center justify-between">
              <h2 className="font-bold text-bark text-lg">{editing ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-bark text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Coupon Code *</label>
                <input
                  required value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                  placeholder="e.g. SAVE20"
                  className="w-full border border-cream-300 rounded-xl px-3 py-2.5 text-sm font-mono uppercase tracking-widest focus:outline-none focus:border-sage"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Description</label>
                <input
                  value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="e.g. 20% off on all orders above ₹999"
                  className="w-full border border-cream-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sage"
                />
              </div>

              {/* Discount Type + Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Discount Type *</label>
                  <select
                    value={form.discountType} onChange={e => set('discountType', e.target.value)}
                    className="w-full border border-cream-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sage bg-white"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    {form.discountType === 'percent' ? 'Percentage *' : 'Amount (₹) *'}
                  </label>
                  <input
                    required type="number" min="1" value={form.discountValue} onChange={e => set('discountValue', e.target.value)}
                    placeholder={form.discountType === 'percent' ? '20' : '100'}
                    className="w-full border border-cream-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sage"
                  />
                </div>
              </div>

              {/* Max Discount (only for percent) */}
              {form.discountType === 'percent' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Max Discount Cap (₹) <span className="text-stone-400 normal-case font-normal">optional</span></label>
                  <input
                    type="number" min="1" value={form.maxDiscount} onChange={e => set('maxDiscount', e.target.value)}
                    placeholder="e.g. 500 — cap the savings"
                    className="w-full border border-cream-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sage"
                  />
                </div>
              )}

              {/* Min Order */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Minimum Order Amount (₹)</label>
                <input
                  type="number" min="0" value={form.minOrderValue} onChange={e => set('minOrderValue', e.target.value)}
                  placeholder="0 — no minimum"
                  className="w-full border border-cream-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sage"
                />
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Total Uses <span className="text-stone-400 normal-case font-normal">optional</span></label>
                  <input
                    type="number" min="1" value={form.usageLimit} onChange={e => set('usageLimit', e.target.value)}
                    placeholder="Unlimited"
                    className="w-full border border-cream-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sage"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Per User Limit</label>
                  <input
                    type="number" min="1" value={form.userUsageLimit} onChange={e => set('userUsageLimit', e.target.value)}
                    placeholder="1"
                    className="w-full border border-cream-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sage"
                  />
                </div>
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Expiry Date <span className="text-stone-400 normal-case font-normal">optional</span></label>
                <input
                  type="date" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)}
                  className="w-full border border-cream-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sage"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3 pt-1">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div>
                    <p className="text-sm font-medium text-bark">Active</p>
                    <p className="text-xs text-stone-400">Coupon can be applied at checkout</p>
                  </div>
                  <div
                    onClick={() => set('isActive', !form.isActive)}
                    className={clsx('w-10 h-6 rounded-full transition-colors relative cursor-pointer', form.isActive ? 'bg-sage' : 'bg-cream-300')}
                  >
                    <span className={clsx('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all', form.isActive ? 'left-5' : 'left-1')} />
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div>
                    <p className="text-sm font-medium text-bark">Secret / VIP Coupon</p>
                    <p className="text-xs text-stone-400">Not shown on public listing — share privately</p>
                  </div>
                  <div
                    onClick={() => set('isSecret', !form.isSecret)}
                    className={clsx('w-10 h-6 rounded-full transition-colors relative cursor-pointer', form.isSecret ? 'bg-sand-400' : 'bg-cream-300')}
                  >
                    <span className={clsx('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all', form.isSecret ? 'left-5' : 'left-1')} />
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-cream-300 text-stone-500 rounded-xl py-3 text-sm hover:bg-cream-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-bark text-cream-100 rounded-xl py-3 text-sm font-medium hover:bg-clay transition-colors disabled:opacity-60">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
