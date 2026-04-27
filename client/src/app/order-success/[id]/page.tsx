'use client'
// apps/client/src/app/order-success/[id]/page.tsx
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, MapPin, Sparkles, Mail } from 'lucide-react'
import { useAuthStore } from '@/store'
import { orderAPI } from '@/lib/api'
import { motion } from 'framer-motion'

export default function OrderSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [order, setOrder] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (!isAuthenticated) { router.push('/login'); return }
    orderAPI.get(params.id as string)
      .then(r => setOrder(r.data.order))
      .catch(() => router.push('/'))
  }, [mounted, isAuthenticated, params.id])

  // Auto-redirect to discover after 8 seconds
  useEffect(() => {
    if (!order) return
    const t = setTimeout(() => router.push('/discover'), 8000)
    return () => clearTimeout(t)
  }, [order])

  if (!mounted || !order) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-sage border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-16">
      {/* Success header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-sage-50 flex items-center justify-center mx-auto mb-5"
        >
          <CheckCircle size={40} className="text-sage" />
        </motion.div>
        <h1 className="font-display text-4xl md:text-5xl text-bark mb-2">Order Placed!</h1>
        <p className="text-stone-400 text-sm">
          Thank you for shopping with FabAroha.{' '}
          {order.paymentMethod === 'cod'
            ? 'Pay when your order arrives.'
            : 'Your payment was successful.'}
        </p>
        <p className="text-xs text-stone-400 mt-1 font-mono">
          Order ID: #{order._id.slice(-10).toUpperCase()}
        </p>

        {/* Email notification status */}
        <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-xs ${
          user?.email
            ? 'bg-sage-50 text-sage'
            : 'bg-cream-100 text-stone-400'
        }`}>
          <Mail size={13} />
          {user?.email
            ? <>Confirmation sent to <span className="font-medium">{user.email}</span></>
            : <>Add your email in profile to receive order updates</>
          }
        </div>
      </motion.div>

      {/* Order summary card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl border border-cream-200 shadow-soft p-6 mb-4"
      >
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Package size={13} /> Items Ordered
        </h2>
        <div className="space-y-3">
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-14 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0">
                {(item.product?.images?.[0] || item.image) && (
                  <img src={item.product?.images?.[0] || item.image} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-bark truncate">{item.product?.title || item.title}</p>
                <p className="text-xs text-stone-400">Size: {item.size} · Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-medium text-bark">₹{(item.price * item.quantity).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-cream-200 mt-4 pt-4 space-y-1.5 text-sm">
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
          <div className="flex justify-between font-semibold text-bark text-base pt-2 border-t border-cream-200">
            <span>Total Paid</span><span>₹{order.totalAmount?.toLocaleString()}</span>
          </div>
        </div>
      </motion.div>

      {/* Shipping address */}
      {order.shippingAddress && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl border border-cream-200 shadow-soft px-5 py-4 mb-8"
        >
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <MapPin size={11} /> Delivering to
          </p>
          <p className="text-sm font-medium text-bark">{order.shippingAddress.fullName}</p>
          <p className="text-xs text-stone-400">
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''},&nbsp;
            {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
          </p>
        </motion.div>
      )}

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Link
          href="/discover"
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-4"
        >
          <Sparkles size={16} /> Explore More
        </Link>
        <Link
          href={`/profile/orders/${order._id}`}
          className="btn-outline flex-1 flex items-center justify-center gap-2 py-4"
        >
          View Order Details
        </Link>
      </motion.div>

      <p className="text-center text-xs text-stone-400 mt-6">
        Redirecting to discover page in a few seconds…
      </p>
    </div>
  )
}
