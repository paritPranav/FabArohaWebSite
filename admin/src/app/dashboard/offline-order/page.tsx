'use client'
// admin/src/app/dashboard/offline-order/page.tsx
import { useEffect, useState } from 'react'
import { orderAPI, productAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { Search, UserCheck, UserPlus, Plus, Minus, Trash2, ShoppingCart, FileText, ChevronDown, ChevronUp, X } from 'lucide-react'
import clsx from 'clsx'

// ── Types ──────────────────────────────────────────────────────────────────────
type Product = {
  _id: string; title: string; images: string[]; price: number; discountedPrice?: number;
  sizes: { label: string; stock: number }[]; colors: { name: string; hex: string }[];
  category: string; sku?: string;
}
type CartItem = {
  product: string; title: string; image: string; price: number;
  size: string; color: string; quantity: number;
}
type CustomerInfo = {
  _id?: string; name: string; phone: string; email: string; isNew?: boolean; orderCount?: number;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card / POS' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'razorpay', label: 'Razorpay (Online)' },
]

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh',
]

// ── GST preview helper (mirrors server logic) ──────────────────────────────────
function gstBreakdown(finalPrice: number) {
  const rate      = finalPrice < 2500 ? 0.05 : 0.18
  const basePrice = finalPrice / (1 + rate)
  const gstAmount = finalPrice - basePrice
  return { basePrice, rate, gstAmount, cgst: gstAmount / 2, sgst: gstAmount / 2, ratePct: rate * 100 }
}

function inr(n: number) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function OfflineOrderPage() {
  // Products
  const [products, setProducts]       = useState<Product[]>([])
  const [prodSearch, setProdSearch]   = useState('')
  const [prodLoading, setProdLoading] = useState(true)

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedSizes, setSelectedSizes]   = useState<Record<string, string>>({})
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({})

  // Customer
  const [phoneInput, setPhoneInput]         = useState('')
  const [lookingUp, setLookingUp]           = useState(false)
  const [customer, setCustomer]             = useState<CustomerInfo | null>(null)
  const [newCustomer, setNewCustomer]       = useState({ name: '', email: '' })
  const [customerMode, setCustomerMode]     = useState<'lookup' | 'found' | 'new'>('lookup')

  // Address
  const [address, setAddress] = useState({
    fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India',
  })

  // Pricing / discount
  const [couponCode, setCouponCode]                 = useState('')
  const [additionalDiscount, setAdditionalDiscount] = useState('')
  const [additionalDiscountName, setAdditionalDiscountName] = useState('')

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentStatus, setPaymentStatus] = useState('paid')
  const [notes, setNotes] = useState('')

  // UI
  const [submitting, setSubmitting]         = useState(false)
  const [successOrder, setSuccessOrder]     = useState<any>(null)
  const [cartOpen, setCartOpen]             = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Load products
  useEffect(() => {
    productAPI.list({ limit: 200, isActive: true })
      .then(r => setProducts(r.data.products || []))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setProdLoading(false))
  }, [])

  // Customer lookup
  const lookupCustomer = async () => {
    if (!phoneInput || phoneInput.length < 10) {
      toast.error('Enter a valid 10-digit phone number'); return
    }
    setLookingUp(true)
    try {
      const res = await orderAPI.lookupCustomer(phoneInput)
      if (res.data.found) {
        setCustomer({ ...res.data.user, orderCount: res.data.orderCount, isNew: false })
        setAddress(a => ({ ...a, fullName: res.data.user.name, phone: phoneInput }))
        setCustomerMode('found')
        toast.success(`Found: ${res.data.user.name} (${res.data.orderCount} past orders)`)
      } else {
        setCustomer(null)
        setCustomerMode('new')
        setAddress(a => ({ ...a, phone: phoneInput }))
        toast(`New customer — fill in details below`, { icon: '👤' })
      }
    } catch { toast.error('Lookup failed') }
    finally { setLookingUp(false) }
  }

  // Cart operations
  const addToCart = (product: Product) => {
    const size  = selectedSizes[product._id]  || (product.sizes?.[0]?.label ?? '')
    const color = selectedColors[product._id] || (product.colors?.[0]?.name  ?? '')
    const price = product.discountedPrice || product.price

    setCart(prev => {
      const existing = prev.findIndex(i => i.product === product._id && i.size === size && i.color === color)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + 1 }
        return updated
      }
      return [...prev, {
        product: product._id,
        title:   product.title,
        image:   product.images?.[0] || '',
        price,
        size,
        color,
        quantity: 1,
      }]
    })
    toast.success(`${product.title} added to cart`)
  }

  const updateQty = (idx: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev]
      const newQty  = updated[idx].quantity + delta
      if (newQty <= 0) { updated.splice(idx, 1) } else { updated[idx] = { ...updated[idx], quantity: newQty } }
      return updated
    })
  }

  const removeFromCart = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx))

  // Totals
  const subtotal    = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const addDisc     = parseFloat(additionalDiscount) || 0
  const grandTotal  = Math.max(0, subtotal - addDisc)

  // GST preview
  const gstLines = cart.map(item => {
    const lineTotal = item.price * item.quantity
    const g = gstBreakdown(lineTotal)
    return { ...g, title: item.title }
  })
  const totalCgst = gstLines.reduce((s, g) => s + g.cgst, 0)
  const totalSgst = gstLines.reduce((s, g) => s + g.sgst, 0)
  const totalGst  = gstLines.reduce((s, g) => s + g.gstAmount, 0)

  // Submit
  const handleSubmit = async () => {
    if (cart.length === 0) { toast.error('Add at least one item to cart'); return }

    const finalPhone = customer?.phone || phoneInput
    const finalName  = customer?.name  || newCustomer.name || customerMode === 'found' ? customer?.name || '' : newCustomer.name

    if (!finalPhone) { toast.error('Customer phone is required'); return }
    if (customerMode === 'new' && !newCustomer.name) { toast.error('Customer name is required'); return }

    setSubmitting(true)
    try {
      const res = await orderAPI.createOffline({
        customerPhone: finalPhone,
        customerEmail: customer?.email || newCustomer.email || undefined,
        customerName:  customer?.name  || newCustomer.name,
        items:         cart,
        shippingAddress: {
          fullName: address.fullName || customer?.name || newCustomer.name,
          phone:    address.phone || finalPhone,
          line1:    address.line1,
          line2:    address.line2,
          city:     address.city,
          state:    address.state,
          pincode:  address.pincode,
          country:  address.country || 'India',
        },
        couponCode:             couponCode || undefined,
        additionalDiscount:     addDisc,
        additionalDiscountName: additionalDiscountName || undefined,
        paymentMethod,
        paymentStatus,
        notes,
      })

      setSuccessOrder(res.data.order)
      toast.success('Order created successfully!')

      // Reset form
      setCart([])
      setPhoneInput('')
      setCustomer(null)
      setCustomerMode('lookup')
      setNewCustomer({ name: '', email: '' })
      setAddress({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' })
      setCouponCode(''); setAdditionalDiscount(''); setAdditionalDiscountName('')
      setPaymentMethod('cash'); setPaymentStatus('paid'); setNotes('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create order')
    } finally {
      setSubmitting(false)
    }
  }

  // Download invoice
  const downloadInvoice = (orderId: string) => {
    const token = (() => {
      try { const raw = localStorage.getItem('fab-aroha-admin'); if (raw) { const { state } = JSON.parse(raw); return state?.token } } catch {}
    })()
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/orders/${orderId}/invoice`
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('Authorization', `Bearer ${token}`)
    // Fetch with auth header since browser can't add headers via anchor
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob)
        link.href = blobUrl
        link.download = `Invoice-${orderId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
      })
      .catch(() => toast.error('Failed to download invoice'))
  }

  // Filtered products
  const filtered = products.filter(p =>
    !prodSearch || p.title.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(prodSearch.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(prodSearch.toLowerCase())
  )

  // ── Success screen ──────────────────────────────────────────────────────────
  if (successOrder) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="w-16 h-16 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText size={32} className="text-sage" />
        </div>
        <h2 className="font-display text-2xl text-bark mb-2">Order Created!</h2>
        <p className="text-stone-500 text-sm mb-1">Order #{successOrder._id?.slice(-10).toUpperCase()}</p>
        <p className="text-stone-400 text-sm mb-6">Invoice PDF sent to customer email (if provided)</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => downloadInvoice(successOrder._id)}
            className="flex items-center gap-2 bg-bark text-cream-100 px-5 py-2.5 rounded-xl text-sm font-medium">
            <FileText size={15} /> Download Invoice
          </button>
          <button onClick={() => setSuccessOrder(null)}
            className="border border-cream-200 text-bark px-5 py-2.5 rounded-xl text-sm font-medium">
            Create Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-64px)]">

      {/* ── LEFT: Product Picker ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mb-5">
          <h1 className="font-display text-3xl text-bark">Offline Order</h1>
          <p className="text-stone-400 text-sm mt-0.5">In-store / exhibition order creation</p>
        </div>

        {/* Product search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={prodSearch} onChange={e => setProdSearch(e.target.value)}
            placeholder="Search products by name, category, SKU..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm focus:outline-none focus:border-bark" />
        </div>

        {/* Product grid */}
        {prodLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-52 rounded-xl bg-cream-200 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
            {filtered.map(product => {
              const price = product.discountedPrice || product.price
              const inCart = cart.filter(c => c.product === product._id).reduce((s, i) => s + i.quantity, 0)
              return (
                <div key={product._id}
                  className="bg-white rounded-xl border border-cream-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Image */}
                  <div className="relative aspect-square bg-cream-100 cursor-pointer"
                    onClick={() => setSelectedProduct(product)}>
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <ShoppingCart size={32} />
                      </div>
                    )}
                    {inCart > 0 && (
                      <div className="absolute top-2 right-2 bg-sage text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                        {inCart}
                      </div>
                    )}
                    {product.discountedPrice && product.discountedPrice < product.price && (
                      <div className="absolute top-2 left-2 bg-blush text-white text-xs px-1.5 py-0.5 rounded-md">
                        SALE
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="text-xs font-medium text-bark line-clamp-2 mb-1">{product.title}</p>
                    <p className="text-xs text-stone-400 mb-2">{product.category}</p>

                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-bold text-bark">{inr(price)}</span>
                        {product.discountedPrice && product.discountedPrice < product.price && (
                          <span className="text-xs line-through text-stone-400 ml-1">{inr(product.price)}</span>
                        )}
                      </div>
                    </div>

                    {/* Size selector */}
                    {product.sizes?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {product.sizes.filter(s => s.stock > 0).map(s => (
                          <button key={s.label} onClick={() => setSelectedSizes(prev => ({ ...prev, [product._id]: s.label }))}
                            className={clsx('text-xs px-1.5 py-0.5 rounded border transition-all',
                              selectedSizes[product._id] === s.label
                                ? 'bg-bark text-white border-bark'
                                : 'border-cream-200 text-stone-500 hover:border-bark')}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Color selector */}
                    {product.colors?.length > 0 && (
                      <div className="flex gap-1 mb-2">
                        {product.colors.map(c => (
                          <button key={c.name} title={c.name}
                            onClick={() => setSelectedColors(prev => ({ ...prev, [product._id]: c.name }))}
                            className={clsx('w-5 h-5 rounded-full border-2 transition-all',
                              selectedColors[product._id] === c.name ? 'border-bark scale-110' : 'border-transparent')}
                            style={{ backgroundColor: c.hex || '#ccc' }} />
                        ))}
                      </div>
                    )}

                    <button onClick={() => addToCart(product)}
                      className="w-full flex items-center justify-center gap-1.5 bg-bark text-cream-100 py-1.5 rounded-lg text-xs font-medium hover:bg-opacity-90 transition-all">
                      <Plus size={13} /> Add to Cart
                    </button>
                  </div>
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-stone-400">
                No products found for "{prodSearch}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT: Order Form ────────────────────────────────────────────────── */}
      <div className="w-96 flex flex-col gap-4 overflow-y-auto pb-4">

        {/* Cart */}
        <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
          <button onClick={() => setCartOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 font-medium text-bark">
            <span className="flex items-center gap-2">
              <ShoppingCart size={16} /> Cart ({cart.length} items)
            </span>
            {cartOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {cartOpen && (
            <div className="border-t border-cream-100 px-4 pb-3">
              {cart.length === 0 ? (
                <p className="text-center py-6 text-stone-400 text-sm">Add products from the left panel</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 py-2 border-b border-cream-100 last:border-0">
                      {item.image && (
                        <img src={item.image} alt={item.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-bark line-clamp-1">{item.title}</p>
                        <p className="text-xs text-stone-400">{[item.size, item.color].filter(Boolean).join(' · ')}</p>
                        <p className="text-xs font-bold text-bark mt-0.5">{inr(item.price * item.quantity)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => updateQty(idx, -1)} className="w-5 h-5 flex items-center justify-center rounded-full bg-cream-100 hover:bg-cream-200">
                          <Minus size={10} />
                        </button>
                        <span className="text-xs w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(idx, +1)} className="w-5 h-5 flex items-center justify-center rounded-full bg-cream-100 hover:bg-cream-200">
                          <Plus size={10} />
                        </button>
                        <button onClick={() => removeFromCart(idx)} className="ml-1 text-blush hover:text-red-600">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer Lookup */}
        <div className="bg-white rounded-2xl border border-cream-200 p-4">
          <h3 className="font-medium text-bark mb-3 flex items-center gap-2">
            {customerMode === 'found' ? <UserCheck size={16} className="text-sage" /> : <UserPlus size={16} />}
            Customer
          </h3>

          {customerMode === 'lookup' && (
            <div>
              <div className="flex gap-2">
                <input value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && lookupCustomer()}
                  placeholder="Customer phone number" maxLength={10}
                  className="flex-1 border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-bark" />
                <button onClick={lookupCustomer} disabled={lookingUp}
                  className="bg-bark text-cream-100 px-3 py-2 rounded-xl text-sm disabled:opacity-50">
                  {lookingUp ? '...' : <Search size={14} />}
                </button>
              </div>
              <p className="text-xs text-stone-400 mt-1">Search existing customer or register new</p>
            </div>
          )}

          {customerMode === 'found' && customer && (
            <div className="bg-sage/10 rounded-xl p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-bark text-sm">{customer.name}</p>
                  <p className="text-xs text-stone-500">{customer.phone}</p>
                  {customer.email && <p className="text-xs text-stone-400">{customer.email}</p>}
                  <p className="text-xs text-sage mt-1">{customer.orderCount} past orders</p>
                </div>
                <button onClick={() => { setCustomerMode('lookup'); setCustomer(null) }}
                  className="text-stone-400 hover:text-stone-600">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {customerMode === 'new' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-stone-400">Phone: <span className="font-medium text-bark">{phoneInput}</span></p>
                <button onClick={() => setCustomerMode('lookup')} className="text-xs text-stone-400 underline">Change</button>
              </div>
              <input value={newCustomer.name} onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))}
                placeholder="Full name *" required
                className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-bark" />
              <input value={newCustomer.email} onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))}
                placeholder="Email (optional — for invoice)"
                className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-bark" />
              <p className="text-xs text-stone-400">A new account will be created automatically</p>
            </div>
          )}
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-2xl border border-cream-200 p-4">
          <h3 className="font-medium text-bark mb-3">Shipping Address <span className="text-xs text-stone-400 font-normal">(optional for walk-in)</span></h3>
          <div className="space-y-2">
            <input value={address.fullName} onChange={e => setAddress(p => ({ ...p, fullName: e.target.value }))}
              placeholder="Full name"
              className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-bark" />
            <input value={address.phone} onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))}
              placeholder="Phone"
              className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-bark" />
            <input value={address.line1} onChange={e => setAddress(p => ({ ...p, line1: e.target.value }))}
              placeholder="Address line 1"
              className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-bark" />
            <input value={address.line2} onChange={e => setAddress(p => ({ ...p, line2: e.target.value }))}
              placeholder="Address line 2 (optional)"
              className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-bark" />
            <div className="flex gap-2">
              <input value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))}
                placeholder="City"
                className="flex-1 border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-bark" />
              <input value={address.pincode} onChange={e => setAddress(p => ({ ...p, pincode: e.target.value }))}
                placeholder="Pincode" maxLength={6}
                className="w-28 border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-bark" />
            </div>
            <select value={address.state} onChange={e => setAddress(p => ({ ...p, state: e.target.value }))}
              className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-bark bg-white">
              <option value="">Select state</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Discount */}
        <div className="bg-white rounded-2xl border border-cream-200 p-4">
          <h3 className="font-medium text-bark mb-3">Discount & Coupon</h3>
          <div className="space-y-2">
            <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Coupon code (optional)"
              className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-bark uppercase" />
            <div className="flex gap-2">
              <input value={additionalDiscount} onChange={e => setAdditionalDiscount(e.target.value)}
                type="number" min="0" placeholder="Extra discount ₹"
                className="flex-1 border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-bark" />
              <input value={additionalDiscountName} onChange={e => setAdditionalDiscountName(e.target.value)}
                placeholder="Label (e.g. Staff)"
                className="flex-1 border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-bark" />
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl border border-cream-200 p-4">
          <h3 className="font-medium text-bark mb-3">Payment</h3>
          <div className="space-y-2">
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
              className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-bark bg-white">
              {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setPaymentStatus('paid')}
                className={clsx('flex-1 py-2 rounded-xl text-sm font-medium border transition-all',
                  paymentStatus === 'paid' ? 'bg-sage text-white border-sage' : 'border-cream-200 text-stone-500')}>
                Paid
              </button>
              <button onClick={() => setPaymentStatus('pending')}
                className={clsx('flex-1 py-2 rounded-xl text-sm font-medium border transition-all',
                  paymentStatus === 'pending' ? 'bg-sand text-bark border-sand' : 'border-cream-200 text-stone-500')}>
                Unpaid / Due
              </button>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-cream-200 p-4">
          <h3 className="font-medium text-bark mb-2">Notes</h3>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Any special instructions or notes for this order..."
            rows={2} className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-bark resize-none" />
        </div>

        {/* GST Summary */}
        {cart.length > 0 && (
          <div className="bg-cream-50 rounded-2xl border border-cream-200 p-4 text-sm">
            <p className="font-medium text-bark mb-2">GST Preview</p>
            {[...new Set(gstLines.map(g => g.ratePct))].map(rate => {
              const slabItems = gstLines.filter(g => g.ratePct === rate)
              const slabTotal = slabItems.reduce((s, g) => s + g.gstAmount, 0)
              return (
                <div key={rate} className="flex justify-between text-xs text-stone-500 mb-1">
                  <span>GST @ {rate}%</span>
                  <span>{inr(slabTotal)}</span>
                </div>
              )
            })}
            <div className="border-t border-cream-200 mt-2 pt-2 space-y-1">
              <div className="flex justify-between text-xs text-stone-500">
                <span>Subtotal (incl. GST)</span><span>{inr(subtotal)}</span>
              </div>
              {addDisc > 0 && (
                <div className="flex justify-between text-xs text-sage">
                  <span>Extra Discount</span><span>− {inr(addDisc)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-bark text-sm pt-1 border-t border-cream-200">
                <span>Grand Total</span><span>{inr(grandTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={submitting || cart.length === 0}
          className="w-full bg-bark text-cream-100 py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-50 hover:bg-opacity-90 transition-all flex items-center justify-center gap-2">
          {submitting ? (
            <><div className="w-4 h-4 border-2 border-cream-100 border-t-transparent rounded-full animate-spin" /> Creating Order...</>
          ) : (
            <><FileText size={16} /> Create Order & Generate Invoice</>
          )}
        </button>
      </div>

      {/* ── Product Detail Modal ─────────────────────────────────────────────── */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            {selectedProduct.images?.[0] && (
              <img src={selectedProduct.images[0]} alt={selectedProduct.title}
                className="w-full aspect-square object-cover" />
            )}
            <div className="p-5">
              <h3 className="font-display text-xl text-bark mb-1">{selectedProduct.title}</h3>
              <p className="text-stone-400 text-sm mb-3">{selectedProduct.category}</p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl font-bold text-bark">
                  {inr(selectedProduct.discountedPrice || selectedProduct.price)}
                </span>
                {selectedProduct.discountedPrice && selectedProduct.discountedPrice < selectedProduct.price && (
                  <span className="text-stone-400 line-through text-sm">{inr(selectedProduct.price)}</span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null) }}
                  className="flex-1 bg-bark text-cream-100 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                  <Plus size={14} /> Add to Cart
                </button>
                <button onClick={() => setSelectedProduct(null)}
                  className="border border-cream-200 px-4 py-2.5 rounded-xl text-sm text-stone-500">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
