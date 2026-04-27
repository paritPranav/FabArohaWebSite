'use client'
// apps/client/src/app/cart/page.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Plus, Minus, ArrowRight, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import { useCartStore } from '@/store'
import { paymentAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface PublicCoupon {
  code: string
  description?: string
  discountType: 'percent' | 'flat'
  discountValue: number
  minOrderValue: number
  maxDiscount?: number
  expiresAt?: string
}

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal, total, coupon, setCoupon } = useCartStore()
  const [couponInput, setCouponInput]     = useState('')
  const [applying, setApplying]           = useState(false)
  const [publicCoupons, setPublicCoupons] = useState<PublicCoupon[]>([])
  const [showCoupons, setShowCoupons]     = useState(false)

  useEffect(() => {
    paymentAPI.publicCoupons().then(r => setPublicCoupons(r.data.coupons || [])).catch(() => {})
  }, [])

  const applyCouponCode = async (code: string) => {
    if (applying) return
    setApplying(true)
    try {
      const res = await paymentAPI.validateCoupon({ code, cartTotal: subtotal() })
      const c = res.data.coupon
      setCoupon({ code: c.code, discount: c.discount })
      setCouponInput('')
      setShowCoupons(false)
      toast.success(`Coupon applied! You save ₹${c.discount.toLocaleString()}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon')
    } finally {
      setApplying(false)
    }
  }

  const handleApplyCoupon = () => applyCouponCode(couponInput.trim())

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-24 h-24 rounded-full bg-cream-200 flex items-center justify-center mb-6">
          <span className="text-4xl">🛍️</span>
        </div>
        <h2 className="font-display text-3xl text-bark mb-2">Your cart is empty</h2>
        <p className="text-stone-400 text-sm mb-8">Looks like you haven't added anything yet.</p>
        <Link href="/products" className="btn-primary">Start Shopping</Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <h1 className="font-display text-4xl text-bark mb-10">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={`${item.productId}-${item.size}`}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex gap-4 bg-white rounded-2xl p-4 shadow-soft"
              >
                {/* Image */}
                <Link href={`/products/${item.slug}`} className="flex-shrink-0">
                  <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-cream-200">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.slug}`}>
                    <h3 className="font-medium text-sm text-bark hover:text-clay transition-colors line-clamp-2">{item.title}</h3>
                  </Link>
                  <p className="text-xs text-stone-400 mt-1">Size: {item.size}</p>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity */}
                    <div className="flex items-center border border-cream-300 rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQty(item.productId, item.size, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-stone-400 hover:bg-cream-200 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs font-medium text-bark">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId, item.size, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-stone-400 hover:bg-cream-200 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-medium text-sm text-bark">
                        ₹{((item.discountedPrice ?? item.price) * item.quantity).toLocaleString()}
                      </p>
                      {item.discountedPrice && (
                        <p className="text-xs text-stone-400 line-through">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.productId, item.size)}
                  className="self-start p-2 text-stone-400 hover:text-blush transition-colors"
                  aria-label="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-3xl shadow-card p-6 sticky top-24">
          <h2 className="font-display text-2xl text-bark mb-6">Order Summary</h2>

          {/* Coupon */}
          <div className="mb-6">
            {coupon ? (
              <div className="flex items-center justify-between bg-sage-50 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2 text-sage text-sm">
                  <Tag size={14} />
                  <span className="font-medium">{coupon.code}</span>
                  <span className="text-xs">(-₹{(coupon.discount ?? 0).toLocaleString()})</span>
                </div>
                <button onClick={() => setCoupon(null)} className="text-xs text-stone-400 hover:text-bark">Remove</button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="input flex-1 py-2 text-xs uppercase tracking-widest"
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applying || !couponInput.trim()}
                    className="btn-outline py-2 px-3 text-xs disabled:opacity-40"
                  >
                    {applying ? '…' : 'Apply'}
                  </button>
                </div>

                {/* Public coupons toggle */}
                {publicCoupons.length > 0 && (
                  <div className="mt-2">
                    <button
                      onClick={() => setShowCoupons(v => !v)}
                      className="flex items-center gap-1 text-xs text-sage hover:text-bark transition-colors"
                    >
                      {showCoupons ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {showCoupons ? 'Hide coupons' : `View ${publicCoupons.length} available coupon${publicCoupons.length > 1 ? 's' : ''}`}
                    </button>

                    <AnimatePresence>
                      {showCoupons && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 space-y-2">
                            {publicCoupons.map(c => (
                              <div key={c.code} className="flex items-center justify-between bg-cream-50 border border-cream-200 rounded-xl px-3 py-2.5 gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-bark tracking-wider">{c.code}</span>
                                    <span className="text-xs text-sage font-medium">
                                      {c.discountType === 'percent'
                                        ? `${c.discountValue}% off${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}`
                                        : `₹${c.discountValue} off`}
                                    </span>
                                  </div>
                                  {c.description && <p className="text-2xs text-stone-400 truncate mt-0.5">{c.description}</p>}
                                  {c.minOrderValue > 0 && (
                                    <p className="text-2xs text-stone-400 mt-0.5">Min order ₹{c.minOrderValue.toLocaleString()}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => applyCouponCode(c.code)}
                                  disabled={applying}
                                  className="flex-shrink-0 text-xs border border-sage text-sage rounded-lg px-2.5 py-1 hover:bg-sage hover:text-white transition-colors disabled:opacity-40"
                                >
                                  Apply
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-3 text-sm border-t border-cream-300 pt-5">
            <div className="flex justify-between text-stone-400">
              <span>Subtotal</span><span>₹{subtotal().toLocaleString()}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-sage">
                <span>Discount</span><span>-₹{(coupon.discount ?? 0).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sage">
              <span>Delivery</span><span>Free</span>
            </div>
            <div className="flex justify-between font-medium text-bark text-base pt-3 border-t border-cream-300">
              <span>Total</span><span>₹{total().toLocaleString()}</span>
            </div>
          </div>

          <Link href="/checkout" className="btn-primary w-full flex items-center justify-center gap-2 mt-6 py-4">
            Proceed to Checkout <ArrowRight size={16} />
          </Link>

          <Link href="/products" className="block text-center text-xs text-stone-400 hover:text-bark mt-4 transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
