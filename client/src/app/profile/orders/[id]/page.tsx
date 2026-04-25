'use client'
// apps/client/src/app/profile/orders/[id]/page.tsx
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, Package, Truck, XCircle, ExternalLink, MapPin } from 'lucide-react'
import { useAuthStore } from '@/store'
import { orderAPI } from '@/lib/api'
import clsx from 'clsx'

const STATUS_STEPS = ['placed', 'confirmed', 'processing', 'shipped', 'delivered']
const STATUS_COLORS: Record<string, string> = {
  placed:     'bg-sand-50 text-sand-500',
  confirmed:  'bg-sage-50 text-sage',
  processing: 'bg-cream-200 text-stone-500',
  shipped:    'bg-blue-50 text-blue-500',
  delivered:  'bg-sage-50 text-sage',
  cancelled:  'bg-blush-50 text-blush',
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { isAuthenticated } = useAuthStore()
  const [order, setOrder]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return }
    orderAPI.get(params.id as string)
      .then(r => setOrder(r.data.order))
      .catch(() => router.push('/profile/orders'))
      .finally(() => setLoading(false))
  }, [isAuthenticated, params.id])

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-14">
      <div className="space-y-4">{[...Array(5)].map((_,i) => <div key={i} className="skeleton h-20 rounded-2xl"/>)}</div>
    </div>
  )

  if (!order) return null

  const currentStep = STATUS_STEPS.indexOf(order.orderStatus)

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-14">
      {/* Back */}
      <Link href="/profile/orders" className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-bark transition-colors mb-8">
        <ArrowLeft size={15}/> Back to Orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-bark">Order Details</h1>
          <p className="text-xs text-stone-400 font-mono mt-1">#{order._id.slice(-10).toUpperCase()}</p>
          <p className="text-xs text-stone-400 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={clsx('badge px-3 py-1.5 rounded-full text-xs capitalize font-medium', STATUS_COLORS[order.orderStatus] || '')}>
          {order.orderStatus}
        </span>
      </div>

      {/* Progress tracker */}
      {order.orderStatus !== 'cancelled' && (
        <div className="bg-white rounded-3xl border border-cream-200 shadow-soft p-6 mb-5">
          <h2 className="text-sm font-semibold text-bark uppercase tracking-widest mb-6">Order Progress</h2>
          <div className="relative flex items-start justify-between">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-cream-200">
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
                    done ? 'bg-sage border-sage text-white' : 'bg-white border-cream-300 text-stone-300',
                    current && 'ring-4 ring-sage/20'
                  )}>
                    {done ? <CheckCircle size={16}/> : <span className="text-xs font-medium">{i+1}</span>}
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
        <div className="bg-blush-50 border border-blush-100 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <XCircle size={20} className="text-blush flex-shrink-0"/>
          <p className="text-sm text-bark">This order has been cancelled.</p>
        </div>
      )}

      {/* Tracking info */}
      {(order.trackingNumber || order.estimatedDelivery) && (
        <div className="bg-white rounded-3xl border border-cream-200 shadow-soft p-6 mb-5">
          <h2 className="text-sm font-semibold text-bark uppercase tracking-widest mb-4 flex items-center gap-2">
            <Truck size={14}/> Shipping Info
          </h2>
          <div className="space-y-3 text-sm">
            {order.trackingNumber && (
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Tracking Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-bark font-medium">{order.trackingNumber}</span>
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-sage hover:text-bark">
                      <ExternalLink size={13}/>
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
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-3xl border border-cream-200 shadow-soft p-6 mb-5">
        <h2 className="text-sm font-semibold text-bark uppercase tracking-widest mb-4 flex items-center gap-2">
          <Package size={14}/> Items
        </h2>
        <div className="divide-y divide-cream-100">
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <div className="w-14 h-16 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0">
                {(item.product?.images?.[0] || item.image) && (
                  <img src={item.product?.images?.[0] || item.image} alt="" className="w-full h-full object-cover"/>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-bark text-sm truncate">{item.product?.title || item.title}</p>
                <p className="text-xs text-stone-400 mt-0.5">Size: {item.size} · Qty: {item.quantity}</p>
                <p className="text-xs text-stone-400">₹{item.price?.toLocaleString()} each</p>
              </div>
              <p className="font-medium text-bark text-sm flex-shrink-0">
                ₹{(item.price * item.quantity)?.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Price breakdown */}
        <div className="border-t border-cream-200 mt-3 pt-3 space-y-2 text-sm">
          <div className="flex justify-between text-stone-400">
            <span>Subtotal</span><span>₹{order.subtotal?.toLocaleString()}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sage">
              <span>Discount</span><span>−₹{order.discount?.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-stone-400">
            <span>Shipping</span>
            <span>{order.shippingCharge === 0 ? 'Free' : `₹${order.shippingCharge}`}</span>
          </div>
          <div className="flex justify-between font-semibold text-bark pt-1 border-t border-cream-200">
            <span>Total</span><span>₹{order.totalAmount?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      {order.shippingAddress && (
        <div className="bg-white rounded-3xl border border-cream-200 shadow-soft p-6 mb-5">
          <h2 className="text-sm font-semibold text-bark uppercase tracking-widest mb-3 flex items-center gap-2">
            <MapPin size={14}/> Delivery Address
          </h2>
          <div className="text-sm text-stone-500 space-y-0.5">
            {order.shippingAddress.name && <p className="font-medium text-bark">{order.shippingAddress.name}</p>}
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
            {order.shippingAddress.phone && <p className="pt-1 text-stone-400">{order.shippingAddress.phone}</p>}
          </div>
        </div>
      )}

      {/* Payment */}
      <div className="bg-white rounded-3xl border border-cream-200 shadow-soft p-6">
        <h2 className="text-sm font-semibold text-bark uppercase tracking-widest mb-3">Payment</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-400">Method</span>
          <span className="text-bark capitalize">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-stone-400">Status</span>
          <span className={clsx('badge px-2 py-0.5 rounded-full text-xs capitalize',
            order.paymentStatus === 'paid' ? 'bg-sage-50 text-sage' : 'bg-blush-50 text-blush')}>
            {order.paymentStatus}
          </span>
        </div>
        {order.razorpayPaymentId && (
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-stone-400">Payment ID</span>
            <span className="font-mono text-xs text-stone-400">{order.razorpayPaymentId}</span>
          </div>
        )}
      </div>
    </div>
  )
}
