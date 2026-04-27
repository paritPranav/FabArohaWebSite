'use client'
// apps/client/src/app/checkout/page.tsx
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CreditCard, Truck, CheckCircle } from 'lucide-react'
import { useCartStore, useAuthStore } from '@/store'
import { orderAPI, paymentAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

type PayMethod = 'razorpay' | 'cod'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, total, coupon, clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const [payMethod, setPayMethod] = useState<PayMethod>('razorpay')
  const [loading, setLoading] = useState(false)
  const [address, setAddress] = useState({
    fullName: user?.name || '', phone: user?.phone || '',
    line1: '', line2: '', city: '', state: '', pincode: '', country: 'India',
  })

  const [mounted, setMounted] = useState(false)
  const orderPlaced = useRef(false)
  useEffect(() => { setMounted(true) }, [])

  const setAddr = (k: string, v: string) => setAddress(a => ({ ...a, [k]: v }))

  useEffect(() => {
    if (!mounted) return
    if (!isAuthenticated) router.push('/login')
    else if (items.length === 0 && !orderPlaced.current) router.push('/cart')
  }, [mounted, isAuthenticated, items.length, router])

  if (!mounted || !isAuthenticated || (items.length === 0 && !orderPlaced.current)) return null

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const orderPayload = {
        items: items.map(i => ({
          product: i.productId, title: i.title, image: i.image,
          price: i.discountedPrice ?? i.price, size: i.size, quantity: i.quantity,
        })),
        shippingAddress: address,
        paymentMethod: payMethod,
        couponCode: coupon?.code,
      }

      const { data } = await orderAPI.create(orderPayload)
      const order = data.order

      if (payMethod === 'cod') {
        orderPlaced.current = true
        clearCart()
        toast.success('Order placed successfully!')
        router.push('/discover')
        return
      }

      // Razorpay flow
      const { data: rzpData } = await paymentAPI.createOrder({ amount: order.totalAmount, orderId: order._id })
      const rzpOrder = rzpData.rzpOrder

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: rzpOrder.amount,
        currency: 'INR',
        name: 'FabAroha',
        description: 'Style, Comfort & Elegance — crafted with love',
        order_id: rzpOrder.id,
        handler: async (response: any) => {
          try {
            await paymentAPI.verify({ ...response, orderId: order._id })
            orderPlaced.current = true
            clearCart()
            toast.success('Payment successful!')
            router.push('/discover')
          } catch { toast.error('Payment verification failed') }
        },
        prefill: { name: user?.name, contact: user?.phone, email: user?.email },
        theme: { color: '#8FAF89' },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <>
      {/* Razorpay SDK */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <h1 className="font-display text-4xl text-bark mb-10">Checkout</h1>

        <form onSubmit={handleOrder} className="grid lg:grid-cols-5 gap-10 items-start">
          {/* Left — Address + Payment */}
          <div className="lg:col-span-3 space-y-8">

            {/* Shipping Address */}
            <div className="bg-white rounded-3xl shadow-card p-6">
              <h2 className="font-display text-2xl text-bark mb-5">Shipping Address</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="label">Full Name</label>
                  <input required value={address.fullName} onChange={e => setAddr('fullName', e.target.value)} className="input" placeholder="Priya Sharma" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="label">Phone</label>
                  <input required value={address.phone} onChange={e => setAddr('phone', e.target.value)} className="input" placeholder="+91 98765 43210" />
                </div>
                <div className="col-span-2">
                  <label className="label">Address Line 1</label>
                  <input required value={address.line1} onChange={e => setAddr('line1', e.target.value)} className="input" placeholder="Flat / House No., Building, Street" />
                </div>
                <div className="col-span-2">
                  <label className="label">Address Line 2 (optional)</label>
                  <input value={address.line2} onChange={e => setAddr('line2', e.target.value)} className="input" placeholder="Area, Landmark" />
                </div>
                <div>
                  <label className="label">City</label>
                  <input required value={address.city} onChange={e => setAddr('city', e.target.value)} className="input" placeholder="Mumbai" />
                </div>
                <div>
                  <label className="label">State</label>
                  <input required value={address.state} onChange={e => setAddr('state', e.target.value)} className="input" placeholder="Maharashtra" />
                </div>
                <div>
                  <label className="label">Pincode</label>
                  <input required value={address.pincode} onChange={e => setAddr('pincode', e.target.value)} className="input" placeholder="400001" maxLength={6} />
                </div>
                <div>
                  <label className="label">Country</label>
                  <input value={address.country} readOnly className="input bg-cream-100 cursor-default" />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-3xl shadow-card p-6">
              <h2 className="font-display text-2xl text-bark mb-5">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: 'razorpay', label: 'Pay Online', sub: 'UPI, Cards, Net Banking — powered by Razorpay', icon: CreditCard },
                  { id: 'cod',      label: 'Cash on Delivery', sub: 'Pay when your order arrives', icon: Truck },
                ].map(({ id, label, sub, icon: Icon }) => (
                  <button key={id} type="button" onClick={() => setPayMethod(id as PayMethod)}
                    className={clsx(
                      'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left',
                      payMethod === id ? 'border-sage bg-sage-50' : 'border-cream-300 hover:border-sage-200'
                    )}>
                    <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center',
                      payMethod === id ? 'bg-sage text-white' : 'bg-cream-200 text-stone-400')}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-bark">{label}</p>
                      <p className="text-xs text-stone-400">{sub}</p>
                    </div>
                    {payMethod === id && <CheckCircle size={18} className="text-sage ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Summary */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-card p-6 sticky top-24">
            <h2 className="font-display text-2xl text-bark mb-5">Order Summary</h2>

            <div className="space-y-3 max-h-60 overflow-y-auto mb-5">
              {items.map(item => (
                <div key={`${item.productId}-${item.size}`} className="flex gap-3">
                  <div className="relative w-14 h-18 flex-shrink-0 rounded-xl overflow-hidden bg-cream-200">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-bark line-clamp-1">{item.title}</p>
                    <p className="text-2xs text-stone-400 mt-0.5">Size: {item.size} · Qty: {item.quantity}</p>
                    <p className="text-xs font-medium text-bark mt-1">
                      ₹{((item.discountedPrice ?? item.price) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-cream-300 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-stone-400"><span>Subtotal</span><span>₹{subtotal().toLocaleString()}</span></div>
              {coupon && <div className="flex justify-between text-sage"><span>Discount</span><span>-₹{coupon.discount.toLocaleString()}</span></div>}
              <div className="flex justify-between text-sage">
                <span>Delivery</span><span>Free</span>
              </div>
              <div className="flex justify-between font-medium text-base text-bark pt-3 border-t border-cream-300">
                <span>Total</span><span>₹{total().toLocaleString()}</span>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full mt-6 py-4 flex items-center justify-center gap-2">
              {loading ? 'Processing…' : payMethod === 'cod' ? 'Place Order' : 'Pay Now'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
