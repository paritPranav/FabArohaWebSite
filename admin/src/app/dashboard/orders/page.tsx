'use client'
// apps/admin/src/app/dashboard/orders/page.tsx
import { useEffect, useState } from 'react'
import { orderAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { X, Truck, Package, MapPin } from 'lucide-react'

const STATUSES = ['placed','confirmed','processing','shipped','delivered','cancelled']
const STATUS_COLORS: Record<string,string> = {
  placed:     'bg-sand-50 text-sand',
  confirmed:  'bg-sage-50 text-sage',
  processing: 'bg-cream-200 text-stone-500',
  shipped:    'bg-blue-50 text-blue-500',
  delivered:  'bg-sage-50 text-sage',
  cancelled:  'bg-blush-50 text-blush',
}

export default function OrdersPage() {
  const [orders, setOrders]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('')
  const [selected, setSelected]   = useState<any>(null)
  const [fullOrder, setFullOrder] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [form, setForm] = useState({ orderStatus: '', paymentStatus: '', trackingNumber: '', trackingUrl: '', estimatedDelivery: '' })
  const [saving, setSaving] = useState(false)

  const load = (status?: string) => {
    setLoading(true)
    orderAPI.list(status ? { status } : {})
      .then(r => setOrders(r.data.orders || []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openDetail = async (o: any) => {
    setSelected(o)
    setFullOrder(null)
    setForm({
      orderStatus:       o.orderStatus || 'placed',
      paymentStatus:     o.paymentStatus || 'pending',
      trackingNumber:    o.trackingNumber  || '',
      trackingUrl:       o.trackingUrl     || '',
      estimatedDelivery: o.estimatedDelivery
        ? new Date(o.estimatedDelivery).toISOString().split('T')[0]
        : '',
    })
    setDetailLoading(true)
    try {
      const res = await orderAPI.get(o._id)
      setFullOrder(res.data.order)
    } catch {} finally { setDetailLoading(false) }
  }

  const handleUpdate = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await orderAPI.updateStatus(selected._id, form)
      toast.success('Order updated')
      setSelected(null); setFullOrder(null)
      load(filter || undefined)
    } catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-bark">Orders</h1>
        <p className="text-sm text-stone-400 mt-0.5">{orders.length} orders</p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['', ...STATUSES].map(s => (
          <button key={s} onClick={() => { setFilter(s); load(s || undefined) }}
            className={clsx('px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all',
              filter === s ? 'bg-bark text-cream-100' : 'bg-white border border-cream-200 text-stone-400 hover:border-bark')}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 border-b border-cream-200">
              <tr>
                {['Order ID','Customer','Items','Total','Payment','Status','Tracking','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {loading ? [...Array(5)].map((_,i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-8 bg-cream-100 rounded animate-pulse"/></td></tr>
              )) : orders.map(o => (
                <tr key={o._id} className="hover:bg-cream-50 cursor-pointer transition-colors" onClick={() => openDetail(o)}>
                  <td className="px-4 py-3 text-stone-400 font-mono text-xs">#{o._id.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-bark text-xs">{o.user?.name || '—'}</p>
                    <p className="text-2xs text-stone-400">{o.user?.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 font-medium text-bark text-xs">₹{o.totalAmount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={clsx('badge px-2 py-0.5 rounded-full capitalize',
                      o.paymentStatus === 'paid' ? 'bg-sage-50 text-sage' : 'bg-blush-50 text-blush')}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge px-2 py-0.5 rounded-full text-xs capitalize', STATUS_COLORS[o.orderStatus] || '')}>
                      {o.orderStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-400 font-mono">
                    {o.trackingNumber || <span className="text-stone-300">—</span>}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openDetail(o)} title="Update order & tracking"
                      className="btn-ghost p-1.5 rounded-lg text-stone-400 hover:text-bark">
                      <Truck size={14}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bark/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-2xl text-bark">Order Details</h2>
                <p className="text-xs text-stone-400 font-mono mt-0.5">
                  #{selected._id.slice(-8).toUpperCase()} · {new Date(selected.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="btn-ghost p-1.5 rounded-full"><X size={18}/></button>
            </div>

            {/* Customer summary */}
            <div className="bg-cream-50 rounded-2xl p-4 mb-4 text-sm">
              <p className="font-medium text-bark">{selected.user?.name || fullOrder?.user?.name || '—'}</p>
              <p className="text-xs text-stone-400">{selected.user?.phone || fullOrder?.user?.phone}</p>
              {fullOrder?.user?.email && <p className="text-xs text-stone-400">{fullOrder.user.email}</p>}
              <p className="text-xs text-stone-400 mt-1">
                {selected.items?.length} item(s) · ₹{selected.totalAmount?.toLocaleString()}
                {' · '}<span className="capitalize">{selected.paymentMethod === 'cod' ? 'COD' : 'Online'}</span>
              </p>
            </div>

            {/* Items */}
            <div className="border border-cream-200 rounded-2xl overflow-hidden mb-4">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest px-3 py-2 bg-cream-50 flex items-center gap-1.5">
                <Package size={11}/> Items
              </p>
              {detailLoading ? (
                <div className="p-4 space-y-2">{[...Array(2)].map((_,i) => <div key={i} className="skeleton h-10 rounded-lg"/>)}</div>
              ) : (
                <div className="divide-y divide-cream-100 max-h-40 overflow-y-auto">
                  {(fullOrder?.items || selected.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2">
                      {(item.product?.images?.[0] || item.image) && (
                        <img src={item.product?.images?.[0] || item.image} alt="" className="w-9 h-10 rounded-lg object-cover flex-shrink-0 bg-cream-100"/>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-bark truncate">{item.product?.title || item.title || '—'}</p>
                        <p className="text-2xs text-stone-400">Size: {item.size} · Qty: {item.quantity} · ₹{item.price?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shipping address */}
            {(fullOrder?.shippingAddress) && (
              <div className="border border-cream-200 rounded-2xl px-3 py-2.5 mb-4 text-xs text-stone-500">
                <p className="font-semibold text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <MapPin size={11}/> Shipping Address
                </p>
                <p className="text-bark">{fullOrder.shippingAddress.name}</p>
                <p>{fullOrder.shippingAddress.line1}{fullOrder.shippingAddress.line2 ? `, ${fullOrder.shippingAddress.line2}` : ''}</p>
                <p>{fullOrder.shippingAddress.city}, {fullOrder.shippingAddress.state} — {fullOrder.shippingAddress.pincode}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="label">Order Status</label>
                <select value={form.orderStatus}
                  onChange={e => setForm(f => ({...f, orderStatus: e.target.value}))}
                  className="input">
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Payment Status</label>
                <select value={form.paymentStatus}
                  onChange={e => setForm(f => ({...f, paymentStatus: e.target.value}))}
                  className="input">
                  {['pending','paid','failed','refunded'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tracking Number / AWB</label>
                <input value={form.trackingNumber}
                  onChange={e => setForm(f => ({...f, trackingNumber: e.target.value}))}
                  className="input" placeholder="e.g. DTDC1234567890"/>
              </div>
              <div>
                <label className="label">Tracking URL</label>
                <input value={form.trackingUrl}
                  onChange={e => setForm(f => ({...f, trackingUrl: e.target.value}))}
                  className="input" placeholder="https://track.dtdc.com/..."/>
              </div>
              <div>
                <label className="label">Estimated Delivery Date</label>
                <input type="date" value={form.estimatedDelivery}
                  onChange={e => setForm(f => ({...f, estimatedDelivery: e.target.value}))}
                  className="input"/>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setSelected(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleUpdate} disabled={saving} className="btn-primary px-6">
                {saving ? 'Saving…' : 'Update Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
