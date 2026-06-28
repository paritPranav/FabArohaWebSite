'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Package, MapPin, ShoppingBag, ChevronRight, Mail, Truck } from 'lucide-react'
import { useAuthStore, useCartStore, useBuyNowStore } from '@/store'
import { orderAPI } from '@/lib/api'
import { motion } from 'framer-motion'

// ── Confetti ──────────────────────────────────────────────────────────────────
// Each particle is a fixed element bursting from viewport centre in all directions
const PARTICLES = [
  { x: -140, y: -200, r:  320, s: 10, c: '#8FAF89', rect: true  },
  { x:  160, y: -220, r: -320, s:  9, c: '#F0C98A', rect: false },
  { x:  -80, y: -250, r:  180, s: 12, c: '#D4A5A5', rect: true  },
  { x:  100, y: -260, r:  200, s: 11, c: '#3D2E22', rect: false },
  { x: -200, y: -160, r:  260, s:  8, c: '#C5B8A8', rect: true  },
  { x:  220, y: -180, r: -240, s:  9, c: '#8FAF89', rect: false },
  { x:  -30, y: -300, r:  300, s: 10, c: '#F0C98A', rect: true  },
  { x:   60, y: -290, r: -160, s:  7, c: '#3D2E22', rect: false },
  { x: -280, y:  -80, r:  180, s:  9, c: '#D4A5A5', rect: true  },
  { x:  290, y:  -60, r: -180, s: 10, c: '#8FAF89', rect: false },
  { x: -250, y: -120, r: -220, s:  8, c: '#F0C98A', rect: true  },
  { x:  260, y: -100, r:  200, s:  7, c: '#C5B8A8', rect: false },
  { x: -170, y:  110, r: -300, s: 11, c: '#8FAF89', rect: true  },
  { x:  180, y:  120, r:  280, s:  9, c: '#D4A5A5', rect: false },
  { x: -110, y:  150, r:  220, s:  8, c: '#F0C98A', rect: true  },
  { x:  130, y:  160, r: -260, s:  7, c: '#3D2E22', rect: false },
  { x: -320, y: -140, r:  160, s:  7, c: '#8FAF89', rect: true  },
  { x:  310, y: -150, r: -200, s: 10, c: '#C5B8A8', rect: false },
  { x:  -60, y: -320, r:  380, s:  8, c: '#F0C98A', rect: true  },
  { x:   80, y: -280, r: -340, s: 11, c: '#8FAF89', rect: false },
  { x: -350, y:  -50, r:  240, s:  9, c: '#D4A5A5', rect: true  },
  { x:  340, y:  -70, r: -260, s:  7, c: '#3D2E22', rect: false },
  { x: -200, y:   60, r:  180, s: 10, c: '#8FAF89', rect: true  },
  { x:  220, y:   80, r: -200, s:  8, c: '#F0C98A', rect: false },
]

function ConfettiOverlay() {
  return (
    <>
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          style={{
            position:        'fixed',
            top:             '50%',
            left:            '50%',
            marginLeft:      -(p.rect ? p.s : p.s / 2),
            marginTop:       -(p.s / 2),
            width:           p.rect ? p.s * 2 : p.s,
            height:          p.s,
            backgroundColor: p.c,
            borderRadius:    p.rect ? 3 : '50%',
            pointerEvents:   'none',
            zIndex:          9999,
          }}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.r }}
          transition={{
            duration: 1.5,
            delay:    0.3 + i * 0.04,
            ease:     [0.15, 0.8, 0.35, 1],
          }}
        />
      ))}
    </>
  )
}

// ── Animated success circle ───────────────────────────────────────────────────
function SuccessCircle() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-6">
      {/* Ripple 1 */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-sage"
        initial={{ scale: 0.8, opacity: 0.8 }}
        animate={{ scale: 2.2, opacity: 0 }}
        transition={{ duration: 1.0, delay: 0.4, ease: 'easeOut' }}
      />
      {/* Ripple 2 */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-sage"
        initial={{ scale: 0.8, opacity: 0.5 }}
        animate={{ scale: 2.6, opacity: 0 }}
        transition={{ duration: 1.2, delay: 0.55, ease: 'easeOut' }}
      />
      {/* Main green circle */}
      <motion.div
        className="absolute inset-0 rounded-full bg-sage shadow-lg flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.2 }}
      >
        {/* CSS-drawn checkmark — no framer-motion pathLength, max browser compat */}
        <style>{`
          @keyframes drawCheck {
            to { stroke-dashoffset: 0; }
          }
          .order-check {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
            animation: drawCheck 0.45s ease-out 0.62s forwards;
          }
        `}</style>
        <svg viewBox="0 0 56 56" fill="none" className="w-16 h-16">
          <path
            d="M16 29 L25 38 L40 20"
            stroke="white"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="order-check"
          />
        </svg>
      </motion.div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OrderSuccessPage() {
  const params         = useParams()
  const orderId        = params.id as string
  const { user }       = useAuthStore()
  const { clearCart }  = useCartStore()
  const { clear: clearBuyNow } = useBuyNowStore()

  const [order,        setOrder]        = useState<any>(null)
  const [mounted,      setMounted]      = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return

    // Clear cart & buy-now regardless of payment method
    clearCart()
    clearBuyNow()

    // Show confetti for 2.5 s
    setShowConfetti(true)
    const confettiTimer = setTimeout(() => setShowConfetti(false), 2500)

    // Fetch order details — retry once for guest token rehydration lag
    const doFetch = () => {
      orderAPI.get(orderId)
        .then(r => setOrder(r.data.order))
        .catch(() => {})
    }
    doFetch()
    const retryTimer = setTimeout(doFetch, 800)

    return () => {
      clearTimeout(confettiTimer)
      clearTimeout(retryTimer)
    }
  }, [mounted, orderId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-sage border-t-transparent animate-spin" />
      </div>
    )
  }

  const isCOD = order?.paymentMethod === 'cod'

  return (
    <>
      {showConfetti && <ConfettiOverlay />}

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-14">

        {/* ── Celebration header ───────────────────────────────────────────────── */}
        <div className="text-center mb-10">
          <SuccessCircle />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h1 className="font-display text-4xl md:text-5xl text-bark mb-2">
              Order Confirmed!
            </h1>
            <p className="text-stone-400 text-sm mb-1">
              {order
                ? isCOD
                  ? 'Your order is placed. Pay when it arrives at your door.'
                  : 'Payment successful — your order is being prepared.'
                : 'Thank you for shopping with FabAroha.'}
            </p>
            <p className="text-xs text-stone-300 font-mono mt-1">
              #{orderId.slice(-10).toUpperCase()}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="flex flex-wrap items-center justify-center gap-2 mt-4"
          >
            {user?.email && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-sage-50 text-sage">
                <Mail size={11} />
                Confirmation sent to <strong className="ml-0.5">{user.email}</strong>
              </span>
            )}
            {order && isCOD && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-amber-50 text-amber-600">
                <Truck size={11} /> Cash on Delivery
              </span>
            )}
          </motion.div>
        </div>

        {/* ── Order items — loads once API responds ────────────────────────────── */}
        {order ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white rounded-3xl border border-cream-200 shadow-soft p-6 mb-4"
            >
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Package size={13} /> Items Ordered
              </h2>

              <div className="space-y-4">
                {order.items?.map((item: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.85 + i * 0.07 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-14 h-16 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0">
                      {(item.product?.images?.[0] || item.image) && (
                        <img
                          src={item.product?.images?.[0] || item.image}
                          alt={item.product?.title || item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-bark truncate">
                        {item.product?.title || item.title}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Size: {item.size} · Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-bark flex-shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Price summary */}
              <div className="border-t border-cream-200 mt-4 pt-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal?.toLocaleString()}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sage">
                    <span>Discount</span>
                    <span>−₹{order.discount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sage">
                  <span>Delivery</span><span>Free</span>
                </div>
                <div className="flex justify-between font-semibold text-bark text-base pt-2 border-t border-cream-200">
                  <span>Total {isCOD ? 'Payable' : 'Paid'}</span>
                  <span>₹{order.totalAmount?.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>

            {/* Shipping address */}
            {order.shippingAddress && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.95 }}
                className="bg-white rounded-3xl border border-cream-200 shadow-soft px-5 py-4 mb-8"
              >
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <MapPin size={11} /> Delivering to
                </p>
                <p className="text-sm font-medium text-bark">
                  {order.shippingAddress.fullName}
                </p>
                <p className="text-xs text-stone-400 leading-relaxed mt-0.5">
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''},&nbsp;
                  {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                </p>
                {order.shippingAddress.phone && (
                  <p className="text-xs font-mono text-stone-400 mt-1 select-all">
                    {order.shippingAddress.phone}
                  </p>
                )}
              </motion.div>
            )}
          </>
        ) : (
          /* Skeleton while order loads */
          <div className="space-y-3 mb-8">
            <div className="h-52 bg-cream-100 rounded-3xl animate-pulse" />
            <div className="h-20 bg-cream-100 rounded-3xl animate-pulse" />
          </div>
        )}

        {/* ── CTAs ─────────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link
            href="/discover"
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-base"
          >
            <ShoppingBag size={18} /> Shop More
          </Link>

          {order && (
            <Link
              href={`/profile/orders/${order._id}`}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full border-2 border-bark text-bark font-medium text-sm hover:bg-bark hover:text-cream transition-all"
            >
              View Order Details <ChevronRight size={16} />
            </Link>
          )}
        </motion.div>
      </div>
    </>
  )
}
