'use client'
// apps/client/src/app/products/[slug]/ProductDetailClient.tsx
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Heart, ShoppingBag, Star, Truck, RotateCcw, Shield, Ruler, X, Share2, Link2, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore, useWishlistStore, useAuthStore } from '@/store'
import { productAPI } from '@/lib/api'
import { analytics } from '@/lib/analytics'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fabaroha.com'

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
  const [shareOpen, setShareOpen]         = useState(false)
  const [copied, setCopied]               = useState(false)
  const shareRef                          = useRef<HTMLDivElement>(null)

  const addItem = useCartStore(s => s.addItem)
  const { has, toggle } = useWishlistStore()
  const { isAuthenticated } = useAuthStore()

  // Track product view once on mount
  useEffect(() => { analytics.productView(product) }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    analytics.addToCart({ _id: product._id, slug: product.slug, title: product.title, image: product.images[0], discountedPrice: product.discountedPrice, price: product.price }, quantity)
    toast.success('Added to bag ✨ 🛍️')
  }

  const handleWishlist = async () => {
    const wasWishlisted = isWishlisted
    toggle(product._id)
    if (!wasWishlisted) analytics.wishlistAdd({ _id: product._id, slug: product.slug, title: product.title, images: product.images })
    if (isAuthenticated) { try { await productAPI.toggleWishlist(product._id) } catch {} }
    toast.success(wasWishlisted ? 'Removed from wishlist' : 'Added to wishlist ♡')
  }

  const productUrl = `${SITE_URL}/products/${product.slug}`
  const shareText  = `${product.title} — ₹${(product.discountedPrice ?? product.price).toLocaleString()} on FabAroha`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product.title, text: shareText, url: productUrl })
      } catch {}
    } else {
      setShareOpen(v => !v)
    }
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(productUrl)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => { setCopied(false); setShareOpen(false) }, 2000)
  }

  // Close share dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

            {/* Share */}
            <div className="relative" ref={shareRef}>
              <button
                onClick={handleShare}
                className="w-14 h-14 rounded-full border-2 border-cream-300 flex items-center justify-center text-stone-400 hover:border-sage hover:text-sage transition-all"
                aria-label="Share product"
              >
                <Share2 size={18} />
              </button>

              <AnimatePresence>
                {shareOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 bottom-16 z-20 bg-white rounded-2xl shadow-xl border border-cream-200 p-2 w-48"
                  >
                    <p className="text-2xs text-stone-400 uppercase tracking-widest px-3 pt-1 pb-2">Share via</p>

                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + productUrl)}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-100 transition-colors text-sm text-bark"
                      onClick={() => setShareOpen(false)}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </a>

                    {/* Twitter / X */}
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-100 transition-colors text-sm text-bark"
                      onClick={() => setShareOpen(false)}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      X (Twitter)
                    </a>

                    {/* Facebook */}
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-100 transition-colors text-sm text-bark"
                      onClick={() => setShareOpen(false)}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#1877F2]"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      Facebook
                    </a>

                    {/* Instagram — native share on mobile, copy link on desktop */}
                    <button
                      onClick={async () => {
                        if (navigator.share) {
                          setShareOpen(false)
                          try { await navigator.share({ title: product.title, text: shareText, url: productUrl }) } catch {}
                        } else {
                          await handleCopyLink()
                        }
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-100 transition-colors text-sm text-bark w-full"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ fill: 'url(#ig-grad)' }}>
                        <defs>
                          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f09433"/>
                            <stop offset="25%" stopColor="#e6683c"/>
                            <stop offset="50%" stopColor="#dc2743"/>
                            <stop offset="75%" stopColor="#cc2366"/>
                            <stop offset="100%" stopColor="#bc1888"/>
                          </linearGradient>
                        </defs>
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      Instagram
                    </button>

                    <div className="border-t border-cream-200 my-1" />

                    {/* Copy link */}
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-100 transition-colors text-sm text-bark w-full"
                    >
                      {copied ? <Check size={16} className="text-sage" /> : <Link2 size={16} />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[
              { icon: Truck,     text: 'Free delivery on all orders' },
              { icon: RotateCcw, text: '7-day easy returns' },
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
