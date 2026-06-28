'use client'
// apps/client/src/app/checkout/page.tsx
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CreditCard, Truck, CheckCircle, Zap } from 'lucide-react'
import { useCartStore, useAuthStore } from '@/store'
import { authAPI, orderAPI, paymentAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

type PayMethod = 'razorpay' | 'cod'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, total, coupon, clearCart } = useCartStore()
  const { user, isAuthenticated, setAuth } = useAuthStore()

  const [payMethod, setPayMethod] = useState<PayMethod>('razorpay')
  const [loading, setLoading]     = useState(false)
  const [mounted, setMounted]     = useState(false)
  const orderPlaced = useRef(false)

  // ── Guest details (shown when not logged in) ────────────────────────────────
  const [guestName,  setGuestName]  = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')

  // ── Shipping address ────────────────────────────────────────────────────────
  const [address, setAddress] = useState({
    fullName: '', phone: '', line1: '', line2: '',
    city: '', state: '', pincode: '', country: 'India',
  })

  useEffect(() => { setMounted(true) }, [])

  // Pre-fill address from logged-in user
  useEffect(() => {
    if (isAuthenticated && user) {
      setAddress(a => ({
        ...a,
        fullName: a.fullName || user.name || '',
        phone:    a.phone    || user.phone || '',
      }))
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (!mounted) return
    if (items.length === 0 && !orderPlaced.current) router.push('/cart')
  }, [mounted, items.length, router])

  const setAddr = (k: string, v: string) => setAddress(a => ({ ...a, [k]: v }))

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // ── Guest: validate & get auth token ────────────────────────────────────
      if (!isAuthenticated) {
        if (!guestName.trim()) { toast.error('Please enter your name'); return }
        const digits = guestPhone.replace(/\D/g, '')
        if (digits.length !== 10) { toast.error('Enter a valid 10-digit mobile number'); return }

        const { data: authData } = await authAPI.guestCheckout({
          name:  guestName.trim(),
          phone: digits,
          email: guestEmail.trim() || undefined,
        })
        setAuth(authData.user, authData.token)

        // Pre-fill address if still empty
        setAddress(a => ({
          ...a,
          fullName: a.fullName || authData.user.name,
          phone:    a.phone    || digits,
        }))
      }

      const orderPayload = {
        items: items.map(i => ({
          product: i.productId, title: i.title, image: i.image,
          price: i.discountedPrice ?? i.price, size: i.size, quantity: i.quantity,
        })),
        shippingAddress: {
          ...address,
          fullName: address.fullName || guestName.trim(),
          phone:    address.phone    || guestPhone.replace(/\D/g, ''),
        },
        paymentMethod: payMethod,
        couponCode: coupon?.code,
      }

      const { data } = await orderAPI.create(orderPayload)
      const order = data.order

      if (payMethod === 'cod') {
        orderPlaced.current = true
        router.push(`/order-success/${order._id}`)
        return
      }

      // ── Razorpay ─────────────────────────────────────────────────────────────
      const { data: rzpData } = await paymentAPI.createOrder({ amount: order.totalAmount, orderId: order._id })
      const rzpOrder = rzpData.rzpOrder

      const options = {
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      rzpOrder.amount,
        currency:    'INR',
        name:        'FabAroha',
        description: 'Style, Comfort & Elegance — crafted with love',
        order_id:    rzpOrder.id,
        handler: async (response: any) => {
          try {
            await paymentAPI.verify({ ...response, orderId: order._id })
            orderPlaced.current = true
            router.push(`/order-success/${order._id}`)
          } catch { toast.error('Payment verification failed') }
        },
        prefill: {
          name:    address.fullName || guestName.trim(),
          contact: address.phone    || guestPhone,
          email:   guestEmail || user?.email || '',
        },
        theme: { color: '#8FAF89' },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.')
    } finally { setLoading(false) }
  }

  if (!mounted || (items.length === 0 && !orderPlaced.current)) return null

  return (
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <h1 className="font-display text-4xl text-bark mb-10">Checkout</h1>

        <form onSubmit={handleOrder} className="grid lg:grid-cols-5 gap-10 items-start">
          {/* ── Left ─────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-8">

            {/* Guest contact — only when not logged in */}
            {!isAuthenticated && (
              <div className="bg-white rounded-3xl shadow-card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-sage/10 flex items-center justify-center">
                    <Zap size={18} className="text-sage" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-bark">Your Details</h2>
                    <p className="text-xs text-stone-400 mt-0.5">No sign-up needed</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="label">Full Name</label>
                    <input
                      required
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      placeholder="Enter your full name"
                      className="input"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="label">Mobile Number</label>
                    <div className="flex gap-2">
                      <span className="input w-14 flex-shrink-0 text-center bg-cream-100 text-stone-500 text-sm flex items-center justify-center">+91</span>
                      <input
                        required
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={guestPhone}
                        onChange={e => setGuestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit mobile number"
                        className="input flex-1"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="label">Email <span className="font-normal text-stone-400">(for order updates)</span></label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="input"
                    />
                  </div>
                </div>

                <p className="text-xs text-stone-400 mt-4 pt-4 border-t border-cream-200">
                  Already have an account?{' '}
                  <button type="button" onClick={() => router.push('/login')} className="text-bark underline underline-offset-2">
                    Sign in
                  </button>
                </p>
              </div>
            )}

            {/* Shipping Address */}
            <div className="bg-white rounded-3xl shadow-card p-6">
              <h2 className="font-display text-2xl text-bark mb-5">Shipping Address</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="label">Full Name</label>
                  <input required value={address.fullName} onChange={e => setAddr('fullName', e.target.value)} className="input" placeholder="Full name" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="label">Phone</label>
                  <input required value={address.phone} onChange={e => setAddr('phone', e.target.value)} className="input" placeholder="Mobile number" />
                </div>
                <div className="col-span-2">
                  <label className="label">Address Line 1</label>
                  <input required value={address.line1} onChange={e => setAddr('line1', e.target.value)} className="input" placeholder="Flat / House No., Building, Street" />
                </div>
                <div className="col-span-2">
                  <label className="label">Address Line 2 <span className="font-normal text-stone-400">(optional)</span></label>
                  <input value={address.line2} onChange={e => setAddr('line2', e.target.value)} className="input" placeholder="Area, Landmark" />
                </div>
                <div>
                  <label className="label">City</label>
                  <input required value={address.city} onChange={e => setAddr('city', e.target.value)} className="input" placeholder="City" />
                </div>
                <div>
                  <label className="label">State</label>
                  <input required value={address.state} onChange={e => setAddr('state', e.target.value)} className="input" placeholder="State" />
                </div>
                <div>
                  <label className="label">Pincode</label>
                  <input required value={address.pincode} onChange={e => setAddr('pincode', e.target.value)} className="input" placeholder="6-digit pincode" maxLength={6} />
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
                  { id: 'razorpay', label: 'Pay Online',        sub: 'UPI, Cards, Net Banking — powered by Razorpay', icon: CreditCard },
                  { id: 'cod',      label: 'Cash on Delivery',  sub: 'Pay when your order arrives',                   icon: Truck },
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

          {/* ── Right: Order Summary ─────────────────────────────────────────── */}
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
              <div className="flex justify-between text-sage"><span>Delivery</span><span>Free</span></div>
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
