'use client'
// apps/client/src/app/products/[slug]/ProductDetailClient.tsx
import { useState } from 'react'
import Image from 'next/image'
import { Heart, ShoppingBag, Star, Truck, RotateCcw, Shield, Ruler, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore, useWishlistStore, useAuthStore } from '@/store'
import { productAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Review { _id: string; name: string; rating: number; comment: string; createdAt: string }
interface ProductDetail {
  _id: string; title: string; slug: string; description: string; price: number; discountedPrice?: number
  images: string[]; category: string; sizes: { label: string; stock: number }[]
  colors?: { name: string; hex: string }[]; rating?: number; numReviews?: number
  reviews?: Review[]; collection?: { name: string; slug: string }
  material?: string; careInstructions?: string; isTrending?: boolean; sizeChart?: string
}

export default function ProductDetailClient({ product }: { product: ProductDetail }) {
  const [activeImg, setActiveImg]     = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity]       = useState(1)
  const [tab, setTab]                 = useState<'desc'|'care'|'reviews'>('desc')
  const [reviewForm, setReviewForm]   = useState({ rating: 5, comment: '' })
  const [submitting, setSubmitting]   = useState(false)
  const [sizeChartOpen, setSizeChartOpen] = useState(false)

  const addItem = useCartStore(s => s.addItem)
  const { has, toggle } = useWishlistStore()
  const { isAuthenticated } = useAuthStore()

  const isWishlisted = has(product._id)
  const discount = product.discountedPrice
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
    : 0

  const handleAddToCart = () => {
    if (!selectedSize) { toast.error('Please select a size'); return }
    const sizeObj = product.sizes.find(s => s.label === selectedSize)
    if (!sizeObj || sizeObj.stock < 1) { toast.error('Out of stock'); return }

    addItem({
      productId: product._id,
      title: product.title,
      image: product.images[0],
      price: product.price,
      discountedPrice: product.discountedPrice,
      size: selectedSize,
      quantity,
      slug: product.slug,
    })
    toast.success('Added to bag ✨ 🛍️')
  }

  const handleWishlist = async () => {
    toggle(product._id)
    if (isAuthenticated) { try { await productAPI.toggleWishlist(product._id) } catch {} }
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ♡')
  }

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) { toast.error('Please login to review'); return }
    setSubmitting(true)
    try {
      await productAPI.review(product._id, reviewForm)
      toast.success('Review submitted!')
      setReviewForm({ rating: 5, comment: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error submitting review')
    } finally { setSubmitting(false) }
  }

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
      <div className="grid lg:grid-cols-2 gap-12 xl:gap-20">
        {/* ── Image Gallery ───────────────────────────────────── */}
        <div className="flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[600px] md:w-20 flex-shrink-0">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={clsx(
                    'flex-shrink-0 w-16 h-20 md:w-20 md:h-24 rounded-xl overflow-hidden border-2 transition-all',
                    activeImg === i ? 'border-bark' : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <Image src={img} alt="" width={80} height={96} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}

          {/* Main image */}
          <div className="flex-1 relative aspect-[3/4] rounded-3xl overflow-hidden bg-cream-200">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImg}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Image
                  src={product.images[activeImg] || ''}
                  alt={product.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </motion.div>
            </AnimatePresence>

            {discount > 0 && (
              <div className="absolute top-4 left-4 badge bg-bark text-cream px-3 py-1">
                -{discount}% OFF
              </div>
            )}
          </div>
        </div>

        {/* ── Product Info ─────────────────────────────────────── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {product.collection && (
            <p className="section-subtitle text-sage mb-2">{product.collection.name}</p>
          )}
          <h1 className="font-display text-4xl md:text-5xl text-bark">{product.title}</h1>

          {/* Rating */}
          {!!product.numReviews && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={14}
                    className={s <= Math.round(product.rating || 0) ? 'text-sand fill-sand' : 'text-cream-300'} />
                ))}
              </div>
              <span className="text-sm text-stone-400">{product.rating?.toFixed(1)} ({product.numReviews} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 mt-4">
            <span className="font-display text-3xl text-bark">
              ₹{(product.discountedPrice ?? product.price).toLocaleString()}
            </span>
            {product.discountedPrice && (
              <span className="text-lg text-stone-400 line-through">₹{product.price.toLocaleString()}</span>
            )}
          </div>

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="mt-6">
              <p className="label">Color</p>
              <div className="flex items-center gap-2">
                {product.colors.map(c => (
                  <span key={c.hex} title={c.name}
                    className="w-6 h-6 rounded-full border-2 border-white shadow cursor-pointer ring-2 ring-transparent hover:ring-bark"
                    style={{ backgroundColor: c.hex }} />
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="label mb-0">Select Size</p>
              {product.sizeChart && (
                <button
                  onClick={() => setSizeChartOpen(true)}
                  className="flex items-center gap-1 text-xs text-stone-400 hover:text-bark transition-colors underline underline-offset-2"
                >
                  <Ruler size={11}/> Size Guide
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map(s => (
                <button
                  key={s.label}
                  disabled={s.stock < 1}
                  onClick={() => setSelectedSize(s.label)}
                  className={clsx(
                    'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                    s.stock < 1
                      ? 'border-cream-300 text-cream-300 cursor-not-allowed line-through'
                      : selectedSize === s.label
                        ? 'bg-bark text-cream border-bark'
                        : 'border-cream-300 text-stone-400 hover:border-bark hover:text-bark'
                  )}
                >
                  {s.label}
                  {s.stock < 4 && s.stock > 0 && (
                    <span className="ml-1 text-2xs text-blush">(only {s.stock})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-6">
            <p className="label">Quantity</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-cream-300 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-stone-400 hover:bg-cream-200 transition-colors">−</button>
                <span className="w-10 text-center text-sm font-medium text-bark">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-stone-400 hover:bg-cream-200 transition-colors">+</button>
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3 mt-8">
            <button onClick={handleAddToCart} className="btn-primary flex-1 flex items-center justify-center gap-2 py-4">
              <ShoppingBag size={18} /> Add to Cart
            </button>
            <button
              onClick={handleWishlist}
              className={clsx('w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all',
                isWishlisted ? 'bg-blush border-blush text-white' : 'border-cream-300 text-stone-400 hover:border-blush hover:text-blush')}
            >
              <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[
              { icon: Truck,     text: 'Free delivery above ₹999' },
              { icon: RotateCcw, text: '30-day easy returns' },
              { icon: Shield,    text: '100% authentic' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1.5 bg-cream-100 rounded-2xl p-3 text-center">
                <Icon size={16} className="text-sage" />
                <p className="text-2xs text-stone-400 leading-tight">{text}</p>
              </div>
            ))}
          </div>

          {/* Description Tabs */}
          <div className="mt-10 border-t border-cream-300 pt-6">
            <div className="flex gap-1 mb-5">
              {(['desc', 'care', 'reviews'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={clsx('px-4 py-2 rounded-full text-xs font-medium transition-all capitalize',
                    tab === t ? 'bg-bark text-cream' : 'text-stone-400 hover:text-bark')}>
                  {t === 'desc' ? 'Description' : t === 'care' ? 'Care' : `Reviews (${product.numReviews || 0})`}
                </button>
              ))}
            </div>

            {tab === 'desc' && <p className="text-sm text-stone-400 leading-relaxed">{product.description}</p>}
            {tab === 'care' && <p className="text-sm text-stone-400 leading-relaxed">{product.careInstructions || 'Machine wash cold. Gentle cycle. Do not bleach. Tumble dry low.'}</p>}
            {tab === 'reviews' && (
              <div className="space-y-6">
                {product.reviews?.map(r => (
                  <div key={r._id} className="border-b border-cream-300 pb-5">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-bark">{r.name}</p>
                      <p className="text-2xs text-stone-400">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="flex mt-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={12} className={s <= r.rating ? 'text-sand fill-sand' : 'text-cream-300'} />
                      ))}
                    </div>
                    <p className="text-sm text-stone-400 mt-2">{r.comment}</p>
                  </div>
                ))}

                {/* Review form */}
                <form onSubmit={handleReview} className="bg-cream-100 rounded-2xl p-5 space-y-3">
                  <p className="font-medium text-sm text-bark">Write a Review</p>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: s }))}>
                        <Star size={20} className={s <= reviewForm.rating ? 'text-sand fill-sand' : 'text-cream-300'} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="Share your experience…"
                    rows={3}
                    className="input resize-none"
                    required
                  />
                  <button type="submit" disabled={submitting} className="btn-primary py-2.5 text-xs">
                    {submitting ? 'Submitting…' : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* ── Size Chart Modal ── */}
      <AnimatePresence>
        {sizeChartOpen && product.sizeChart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bark/50 backdrop-blur-sm"
            onClick={() => setSizeChartOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative bg-white rounded-3xl shadow-xl p-4 max-w-lg w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-display text-xl text-bark flex items-center gap-2"><Ruler size={16}/> Size Guide</p>
                <button onClick={() => setSizeChartOpen(false)} className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center text-stone-400 hover:bg-cream-200 transition-colors">
                  <X size={16}/>
                </button>
              </div>
              <div className="relative w-full rounded-2xl overflow-hidden bg-cream-50">
                <Image
                  src={product.sizeChart}
                  alt="Size chart"
                  width={600}
                  height={400}
                  className="w-full h-auto object-contain"
                />
              </div>
              <p className="text-xs text-stone-400 text-center mt-3">Measurements are in inches (in)</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
