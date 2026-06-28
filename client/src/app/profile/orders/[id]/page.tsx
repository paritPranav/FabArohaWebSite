'use client'
// apps/client/src/app/profile/orders/[id]/page.tsx
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Package, Truck, XCircle, ExternalLink, MapPin, Star } from 'lucide-react'
import { useAuthStore } from '@/store'
import { orderAPI, productAPI } from '@/lib/api'
import toast from 'react-hot-toast'
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

// ── Inline review widget for a single order item ────────────────────────────
function ReviewWidget({ item }: { item: any }) {
  const productId = item.product?._id || item.product
  const [status, setStatus]       = useState<'checking'|'reviewed'|'prompt'|'form'>('checking')
  const [existingRating, setExistingRating] = useState(0)
  const [rating, setRating]       = useState(5)
  const [comment, setComment]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [hovered, setHovered]     = useState(0)

  useEffect(() => {
    if (!productId) { setStatus('prompt'); return }
    productAPI.myReview(productId)
      .then(r => {
        if (r.data.hasReviewed) {
          setExistingRating(r.data.review?.rating || 0)
          setStatus('reviewed')
        } else {
          setStatus('prompt')
        }
      })
      .catch(() => setStatus('prompt'))
  }, [productId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId) return
    setSubmitting(true)
    try {
      await productAPI.review(productId, { rating, comment })
      setExistingRating(rating)
      setStatus('reviewed')
      toast.success('Review submitted! Thank you ✨')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not submit review')
    } finally { setSubmitting(false) }
  }

  if (status === 'checking') return null

  if (status === 'reviewed') return (
    <div className="mt-3 flex items-center gap-2 bg-sage-50 rounded-xl px-4 py-2.5">
      <div className="flex">
        {[1,2,3,4,5].map(s => (
          <Star key={s} size={13} className={s <= existingRating ? 'text-sand fill-sand' : 'text-cream-300'} />
        ))}
      </div>
      <span className="text-xs text-sage font-medium">You reviewed this product</span>
    </div>
  )

  if (status === 'prompt') return (
    <button
      onClick={() => setStatus('form')}
      className="mt-3 flex items-center gap-2 text-xs text-stone-400 hover:text-bark transition-colors group"
    >
      <div className="flex">
        {[1,2,3,4,5].map(s => (
          <Star key={s} size={13} className="text-cream-300 group-hover:text-sand transition-colors" />
        ))}
      </div>
      <span className="underline underline-offset-2">Rate this product</span>
    </button>
  )

  // form state
  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-cream-50 rounded-2xl p-4 space-y-3 border border-cream-200">
      <p className="text-xs font-semibold text-bark">Write a Review</p>
      {/* Star picker */}
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map(s => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(s)}
            className="focus:outline-none"
          >
            <Star
              size={22}
              className={(hovered || rating) >= s ? 'text-sand fill-sand' : 'text-cream-300'}
            />
          </button>
        ))}
        <span className="ml-1.5 text-xs text-stone-400">{rating}/5</span>
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share your experience… (optional)"
        rows={2}
        className="input resize-none text-sm"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="btn-primary py-2 px-5 text-xs">
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
        <button type="button" onClick={() => setStatus('prompt')} className="text-xs text-stone-400 hover:text-bark">
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Main order detail page ──────────────────────────────────────────────────
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
  const isDelivered = order.orderStatus === 'delivered'

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

      {/* Items — with review widget for delivered orders */}
      <div className="bg-white rounded-3xl border border-cream-200 shadow-soft p-6 mb-5">
        <h2 className="text-sm font-semibold text-bark uppercase tracking-widest mb-4 flex items-center gap-2">
          <Package size={14}/> Items
        </h2>
        <div className="divide-y divide-cream-100">
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-4">
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
              {/* Review prompt — only for delivered orders */}
              {isDelivered && <ReviewWidget item={item} />}
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
          <div className="flex justify-between text-sage">
            <span>Delivery</span><span>Free</span>
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
