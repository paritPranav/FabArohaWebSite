'use client'
// apps/client/src/app/quick-checkout/page.tsx
// Buy-Now quick checkout — no OTP required.
// Unauthenticated: collect name + phone + email + address → payment
// Authenticated: pre-fill from account → address → payment
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MapPin, CreditCard, Truck, CheckCircle, ArrowLeft, Zap } from 'lucide-react'
import { authAPI, orderAPI, paymentAPI } from '@/lib/api'
import { useAuthStore, useBuyNowStore } from '@/store'
import toast from 'react-hot-toast'
import clsx from 'clsx'

type PayMethod = 'razorpay' | 'cod'

export default function QuickCheckoutPage() {
  const router = useRouter()
  const { item, clear: clearBuyNow } = useBuyNowStore()
  const { user, isAuthenticated, setAuth } = useAuthStore()

  const [mounted, setMounted] = useState(false)

  // ── Guest contact details (only shown when not logged in) ─────────────────
  const [guestName,  setGuestName]  = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')

  // ── Address ───────────────────────────────────────────────────────────────
  const [address, setAddress] = useState({
    fullName: '', phone: '', line1: '', line2: '',
    city: '', state: '', pincode: '', country: 'India',
  })
  const [payMethod, setPayMethod] = useState<PayMethod>('razorpay')
  const [placingOrder, setPlacingOrder] = useState(false)
  const orderPlaced = useRef(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (!item) { router.replace('/discover'); return }
    if (isAuthenticated && user) {
      setAddress(a => ({ ...a, fullName: user.name || '', phone: user.phone || '' }))
    }
  }, [mounted, item, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  const setAddr = (k: string, v: string) => setAddress(a => ({ ...a, [k]: v }))

  // ── Place order (handles guest token acquisition first if needed) ──────────
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return

    // Basic validation for guests
    if (!isAuthenticated) {
      if (!guestName.trim()) { toast.error('Please enter your name'); return }
      const digits = guestPhone.replace(/\D/g, '')
      if (digits.length !== 10) { toast.error('Enter a valid 10-digit mobile number'); return }
    }

    setPlacingOrder(true)
    try {
      let authToken: string | null = null

      // If not logged in, create/find account silently
      if (!isAuthenticated) {
        const digits = guestPhone.replace(/\D/g, '')
        const { data: authData } = await authAPI.guestCheckout({
          name:  guestName.trim(),
          phone: digits,
          email: guestEmail.trim() || undefined,
        })
        setAuth(authData.user, authData.token)
        authToken = authData.token

        // Pre-fill address name/phone if empty
        setAddress(a => ({
          ...a,
          fullName: a.fullName || authData.user.name,
          phone:    a.phone    || digits,
        }))
      }

      const orderPayload = {
        items: [{
          product:  item.productId,
          title:    item.title,
          image:    item.image,
          price:    item.discountedPrice ?? item.price,
          size:     item.size,
          quantity: item.quantity,
        }],
        shippingAddress: {
          ...address,
          fullName: address.fullName || guestName.trim(),
          phone:    address.phone    || guestPhone.replace(/\D/g, ''),
        },
        paymentMethod: payMethod,
      }

      const { data } = await orderAPI.create(orderPayload)
      const order = data.order

      if (payMethod === 'cod') {
        orderPlaced.current = true
        router.push(`/order-success/${order._id}`)
        return
      }

      // Razorpay
      const { data: rzpData } = await paymentAPI.createOrder({ amount: order.totalAmount, orderId: order._id })
      const rzpOrder = rzpData.rzpOrder

      const options = {
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      rzpOrder.amount,
        currency:    'INR',
        name:        'FabAroha',
        description: item.title,
        order_id:    rzpOrder.id,
        handler: async (response: any) => {
          try {
            await paymentAPI.verify({ ...response, orderId: order._id })
            orderPlaced.current = true
            router.push(`/order-success/${order._id}`)
          } catch {
            toast.error('Payment verification failed')
          }
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
    } finally {
      setPlacingOrder(false)
    }
  }

  if (!mounted || !item) return null

  const displayPrice = item.discountedPrice ?? item.price
  const total        = displayPrice * item.quantity

  return (
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div className="min-h-screen bg-cream-50">
        {/* Header */}
        <header className="border-b border-cream-200 bg-white px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:bg-cream-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="font-display text-xl text-bark flex items-center gap-2">
            <Zap size={18} className="text-sage" /> Quick Checkout
          </span>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8 grid lg:grid-cols-5 gap-8 items-start">

          {/* ── Left: Form ──────────────────────────────────────────────────── */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-3 space-y-6">

            {/* Guest contact details — only shown when not authenticated */}
            {!isAuthenticated && (
              <div className="bg-white rounded-3xl shadow-card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-sage/10 flex items-center justify-center">
                    <Zap size={18} className="text-sage" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl text-bark">Your Details</h2>
                    <p className="text-xs text-stone-400 mt-0.5">No sign-up needed — just fill in your info</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label">Full Name</label>
                    <input
                      required
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      placeholder="Enter your full name"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Mobile Number</label>
                    <div className="flex gap-2">
                      <span className="input w-16 flex-shrink-0 text-center bg-cream-100 text-stone-500 flex items-center justify-center text-sm">+91</span>
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
                  <div>
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
              </div>
            )}

            {/* Delivery address */}
            <div className="bg-white rounded-3xl shadow-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-sage/10 flex items-center justify-center">
                  <MapPin size={18} className="text-sage" />
                </div>
                <h2 className="font-display text-xl text-bark">Delivery Address</h2>
              </div>

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

            {/* Payment */}
            <div className="bg-white rounded-3xl shadow-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-sage/10 flex items-center justify-center">
                  <CreditCard size={18} className="text-sage" />
                </div>
                <h2 className="font-display text-xl text-bark">Payment</h2>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'razorpay', label: 'Pay Online', sub: 'UPI, Cards, Net Banking — Razorpay', icon: CreditCard },
                  { id: 'cod',      label: 'Cash on Delivery', sub: 'Pay when your order arrives', icon: Truck },
                ].map(({ id, label, sub, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPayMethod(id as PayMethod)}
                    className={clsx(
                      'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left',
                      payMethod === id ? 'border-sage bg-sage-50' : 'border-cream-300 hover:border-sage-200'
                    )}
                  >
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

              <button
                type="submit"
                disabled={placingOrder}
                className="btn-primary w-full mt-5 py-4 flex items-center justify-center gap-2"
              >
                {placingOrder
                  ? 'Processing…'
                  : payMethod === 'cod'
                    ? 'Place Order'
                    : `Pay ₹${total.toLocaleString()}`}
              </button>
            </div>
          </form>

          {/* ── Right: Product summary ───────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-card p-5 sticky top-6">
              <p className="font-display text-lg text-bark mb-4">Your Order</p>

              <div className="flex gap-4">
                <div className="relative w-20 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-cream-200">
                  {item.image && (
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-bark leading-snug">{item.title}</p>
                  <p className="text-xs text-stone-400 mt-1">Size: {item.size}</p>
                  <p className="text-xs text-stone-400">Qty: {item.quantity}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-medium text-sm text-bark">₹{displayPrice.toLocaleString()}</span>
                    {item.discountedPrice && item.price !== item.discountedPrice && (
                      <span className="text-xs text-stone-400 line-through">₹{item.price.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-cream-200 mt-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sage">
                  <span>Delivery</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between font-medium text-base text-bark pt-3 border-t border-cream-200">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              {!isAuthenticated && (
                <p className="text-xs text-stone-400 text-center mt-4 pt-4 border-t border-cream-200">
                  Already have an account?{' '}
                  <button onClick={() => router.push('/login')} className="text-bark underline underline-offset-2">
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
