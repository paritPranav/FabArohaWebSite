'use client'
// apps/client/src/app/track/TrackOrderClient.tsx
import { useState } from 'react'
import { Package, Truck, CheckCircle, Clock, XCircle, ExternalLink } from 'lucide-react'
import clsx from 'clsx'

const STATUS_STEPS = ['placed', 'confirmed', 'processing', 'shipped', 'delivered']

const STATUS_META: Record<string, { label: string; icon: any; color: string }> = {
  placed:     { label: 'Order Placed',    icon: Clock,       color: 'text-sand' },
  confirmed:  { label: 'Confirmed',       icon: CheckCircle, color: 'text-sage' },
  processing: { label: 'Processing',      icon: Package,     color: 'text-stone-400' },
  shipped:    { label: 'Shipped',          icon: Truck,       color: 'text-blue-500' },
  delivered:  { label: 'Delivered',       icon: CheckCircle, color: 'text-sage' },
  cancelled:  { label: 'Cancelled',       icon: XCircle,     color: 'text-blush' },
}

export default function TrackOrderClient() {
  const [orderId, setOrderId] = useState('')
  const [phone, setPhone]     = useState('')
  const [order, setOrder]     = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setOrder(null)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/track?orderId=${orderId.trim()}&phone=${phone.trim()}`
      )
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Order not found'); return }
      setOrder(data.order)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const currentStep = order ? STATUS_STEPS.indexOf(order.orderStatus) : -1

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-16">
      <div className="text-center mb-12">
        <p className="section-subtitle text-sage mb-3">Where's My Order?</p>
        <h1 className="font-display text-5xl text-bark">Track Order</h1>
        <p className="text-stone-400 text-sm mt-4">
          Enter your Order ID and the phone number used at checkout.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleTrack} className="bg-white rounded-3xl shadow-soft border border-cream-200 p-8 mb-8">
        <div className="space-y-4">
          <div>
            <label className="label">Order ID</label>
            <input
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              className="input"
              placeholder="e.g. 6643abc123def456…"
              required
            />
            <p className="text-xs text-stone-400 mt-1">Find your Order ID in your profile under My Orders.</p>
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="input"
              placeholder="10-digit number used at checkout"
              required
            />
          </div>
        </div>
        {error && <p className="text-sm text-blush mt-4">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full mt-6 py-3">
          {loading ? 'Tracking…' : 'Track My Order'}
        </button>
      </form>

      {/* Result */}
      {order && (
        <div className="space-y-6">
          {/* Status tracker */}
          {order.orderStatus !== 'cancelled' && (
            <div className="bg-white rounded-3xl border border-cream-200 shadow-soft p-8">
              <h2 className="font-display text-2xl text-bark mb-6">Order Progress</h2>
              <div className="relative flex items-start justify-between">
                {/* Progress line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-cream-200 -z-0">
                  <div
                    className="h-full bg-sage transition-all duration-500"
                    style={{ width: `${Math.max(0, (currentStep / (STATUS_STEPS.length - 1)) * 100)}%` }}
                  />
                </div>
                {STATUS_STEPS.map((step, i) => {
                  const done    = i <= currentStep
                  const current = i === currentStep
                  return (
                    <div key={step} className="flex flex-col items-center gap-2 z-10 flex-1">
                      <div className={clsx(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                        done
                          ? 'bg-sage border-sage text-white'
                          : 'bg-white border-cream-300 text-stone-300',
                        current && 'ring-4 ring-sage/20'
                      )}>
                        {done ? <CheckCircle size={16}/> : <span className="text-xs">{i + 1}</span>}
                      </div>
                      <p className={clsx('text-2xs text-center capitalize leading-tight', done ? 'text-bark font-medium' : 'text-stone-300')}>
                        {step}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {order.orderStatus === 'cancelled' && (
            <div className="bg-blush-50 rounded-2xl p-5 text-center">
              <XCircle size={32} className="text-blush mx-auto mb-2"/>
              <p className="font-medium text-bark">This order has been cancelled.</p>
            </div>
          )}

          {/* Tracking info */}
          {(order.trackingNumber || order.estimatedDelivery) && (
            <div className="bg-white rounded-3xl border border-cream-200 shadow-soft p-6">
              <h2 className="font-display text-xl text-bark mb-4 flex items-center gap-2">
                <Truck size={18}/> Shipping Info
              </h2>
              <div className="space-y-3 text-sm">
                {order.trackingNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Tracking Number</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-bark font-medium">{order.trackingNumber}</span>
                      {order.trackingUrl && (
                        <a href={order.trackingUrl} target="_blank" rel="noreferrer"
                          className="text-sage hover:text-bark transition-colors">
                          <ExternalLink size={14}/>
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {order.estimatedDelivery && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Estimated Delivery</span>
                    <span className="text-bark font-medium">
                      {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {order.shippingAddress && (
                  <div className="flex items-start justify-between gap-4 pt-2 border-t border-cream-200">
                    <span className="text-stone-400 flex-shrink-0">Delivering to</span>
                    <p className="text-bark text-right text-xs">
                      {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-white rounded-3xl border border-cream-200 shadow-soft p-6">
            <h2 className="font-display text-xl text-bark mb-4">Items Ordered</h2>
            <div className="space-y-3">
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  {item.product?.images?.[0] && (
                    <img src={item.product.images[0]} alt="" className="w-12 h-14 rounded-xl object-cover flex-shrink-0 bg-cream-100"/>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-bark truncate">{item.product?.title || item.title}</p>
                    <p className="text-xs text-stone-400">Size: {item.size} · Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm text-bark">₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
              <div className="flex justify-between pt-3 border-t border-cream-200 text-sm font-medium">
                <span className="text-stone-400">Total</span>
                <span className="text-bark">₹{order.totalAmount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
