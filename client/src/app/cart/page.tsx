'use client'
// apps/client/src/app/cart/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Plus, Minus, ArrowRight, Tag } from 'lucide-react'
import { useCartStore } from '@/store'
import { paymentAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal, total, shippingCharge, coupon, setCoupon } = useCartStore()
  const [couponInput, setCouponInput] = useState('')
  const [applying, setApplying] = useState(false)

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setApplying(true)
    try {
      const res = await paymentAPI.validateCoupon({ code: couponInput, orderValue: subtotal() })
      setCoupon({ code: couponInput.toUpperCase(), discount: res.data.discount })
      toast.success(`Coupon applied! Saved ₹${res.data.discount}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon')
    } finally {
      setApplying(false)
    }
  }

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
                  <span className="text-xs">(-₹{coupon.discount})</span>
                </div>
                <button onClick={() => setCoupon(null)} className="text-xs text-stone-400 hover:text-bark">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  placeholder="Coupon code"
                  className="input flex-1 py-2 text-xs uppercase"
                  onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={applying}
                  className="btn-outline py-2 px-3 text-xs"
                >
                  {applying ? '…' : 'Apply'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3 text-sm border-t border-cream-300 pt-5">
            <div className="flex justify-between text-stone-400">
              <span>Subtotal</span><span>₹{subtotal().toLocaleString()}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-sage">
                <span>Discount</span><span>-₹{coupon.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-400">
              <span>Shipping</span>
              <span>{shippingCharge() === 0 ? <span className="text-sage">Free</span> : `₹${shippingCharge()}`}</span>
            </div>
            {shippingCharge() > 0 && (
              <p className="text-2xs text-stone-400">Add ₹{(999 - (subtotal() - (coupon?.discount || 0))).toLocaleString()} more for free shipping</p>
            )}
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
