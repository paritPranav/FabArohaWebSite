'use client'
// apps/client/src/app/discover/DiscoverClient.tsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion'
import { Heart, X, RotateCcw, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { productAPI } from '@/lib/api'
import { useWishlistStore } from '@/store'
import toast from 'react-hot-toast'

interface Product {
  _id: string
  title: string
  price: number
  discountedPrice?: number
  images: string[]
  category: string
  slug: string
  isTrending: boolean
  isFeatured: boolean
}

// ── Single swipeable card ──────────────────────────────────────────────────────
function SwipeCard({
  product,
  isTop,
  stackIndex,
  onSwipe,
  forceSwipe,
}: {
  product: Product
  isTop: boolean
  stackIndex: number   // 0 = top visible card, 1 = behind, 2 = furthest back
  onSwipe: (dir: 'left' | 'right') => void
  forceSwipe: 'left' | 'right' | null
}) {
  const x = useMotionValue(0)
  const rotate   = useTransform(x, [-260, 0, 260], [-22, 0, 22])
  const likeOpacity = useTransform(x, [30, 110], [0, 1])
  const nopeOpacity = useTransform(x, [-110, -30], [1, 0])

  // ref so animation callback always has the latest onSwipe
  const onSwipeRef = useRef(onSwipe)
  useEffect(() => { onSwipeRef.current = onSwipe }, [onSwipe])

  // programmatic swipe from buttons
  useEffect(() => {
    if (!isTop || !forceSwipe) return
    const target = forceSwipe === 'right' ? 650 : -650
    animate(x, target, { duration: 0.38, ease: 'easeIn' }).then(() => {
      onSwipeRef.current(forceSwipe)
    })
  }, [forceSwipe, isTop, x])

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info
    if (offset.x > 80 || velocity.x > 400) {
      animate(x, 650, { duration: 0.3, ease: 'easeIn' }).then(() => onSwipeRef.current('right'))
    } else if (offset.x < -80 || velocity.x < -400) {
      animate(x, -650, { duration: 0.3, ease: 'easeIn' }).then(() => onSwipeRef.current('left'))
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 28 })
    }
  }

  // back-card depth offsets
  const bgScale = 1 - stackIndex * 0.05
  const bgY     = stackIndex * 14

  return (
    <motion.div
      className="absolute inset-0 touch-none"
      style={{
        x:      isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale:  isTop ? 1 : bgScale,
        y:      isTop ? 0 : bgY,
        zIndex: 10 - stackIndex,
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={isTop ? handleDragEnd : undefined}
    >
      <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-cream-200 shadow-card cursor-grab active:cursor-grabbing select-none">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover pointer-events-none"
            priority={isTop}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-cream-200 to-cream-300" />
        )}

        {/* Dark gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-bark/88 via-bark/10 to-transparent" />

        {/* LIKE badge */}
        {isTop && (
          <motion.div
            className="absolute top-10 left-7 border-[3px] border-sage rounded-2xl px-4 py-1.5 -rotate-12"
            style={{ opacity: likeOpacity }}
          >
            <p className="font-display text-2xl text-sage font-bold tracking-wider">LIKE</p>
          </motion.div>
        )}

        {/* NOPE badge */}
        {isTop && (
          <motion.div
            className="absolute top-10 right-7 border-[3px] border-blush rounded-2xl px-4 py-1.5 rotate-12"
            style={{ opacity: nopeOpacity }}
          >
            <p className="font-display text-2xl text-blush font-bold tracking-wider">NOPE</p>
          </motion.div>
        )}

        {/* Product info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
          {product.isTrending && (
            <div className="inline-flex items-center gap-1.5 bg-sage text-white text-xs font-medium px-3 py-1 rounded-full mb-3">
              <Sparkles size={9} />
              Trending
            </div>
          )}
          {!product.isTrending && product.isFeatured && (
            <div className="inline-flex items-center gap-1.5 bg-sand-400 text-white text-xs font-medium px-3 py-1 rounded-full mb-3">
              <Sparkles size={9} />
              Featured
            </div>
          )}
          <h3 className="font-display text-xl md:text-2xl text-white leading-snug line-clamp-2">
            {product.title}
          </h3>
          <p className="text-white/55 text-xs uppercase tracking-widest mt-1">{product.category}</p>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl text-white">
                ₹{(product.discountedPrice || product.price).toLocaleString()}
              </span>
              {product.discountedPrice && (
                <span className="text-white/40 text-sm line-through">
                  ₹{product.price.toLocaleString()}
                </span>
              )}
            </div>
            <Link
              href={`/products/${product.slug}`}
              className="text-xs text-white/70 border border-white/25 rounded-full px-4 py-1.5 hover:bg-white/15 transition-colors backdrop-blur-sm"
              onClick={e => e.stopPropagation()}
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main discover client ───────────────────────────────────────────────────────
export default function DiscoverClient() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading]           = useState(true)
  const [forceSwipe, setForceSwipe]     = useState<'left' | 'right' | null>(null)
  const [isSwiping, setIsSwiping]       = useState(false)
  const { toggle, has } = useWishlistStore()

  useEffect(() => {
    productAPI.list({ limit: 100 }).then(r => {
      const products: Product[] = r.data.products || []
      const trending = products.filter(p => p.isTrending)
      const featured = products.filter(p => p.isFeatured && !p.isTrending)
      const rest     = products.filter(p => !p.isTrending && !p.isFeatured)
      // shuffle the rest for variety
      const shuffled = [...rest].sort(() => Math.random() - 0.5)
      setAllProducts([...trending, ...featured, ...shuffled])
    }).finally(() => setLoading(false))
  }, [])

  const handleSwipe = useCallback((dir: 'left' | 'right') => {
    const product = allProducts[currentIndex]
    if (dir === 'right' && product) {
      if (!has(product._id)) {
        toggle(product._id)
        // fire-and-forget server sync
        productAPI.toggleWishlist(product._id).catch(() => {})
        toast.success('Added to wishlist!', { icon: '❤️' })
      } else {
        toast('Already in wishlist', { icon: '✓' })
      }
    }
    setForceSwipe(null)
    setIsSwiping(false)
    setCurrentIndex(i => i + 1)
  }, [currentIndex, allProducts, toggle, has])

  const triggerSwipe = (dir: 'left' | 'right') => {
    if (isSwiping) return
    setIsSwiping(true)
    setForceSwipe(dir)
  }

  const restart = () => {
    setCurrentIndex(0)
    setForceSwipe(null)
    setIsSwiping(false)
  }

  // Cards to render: top card + 2 behind it, reversed so top is last in DOM (highest z-index)
  const visibleSlice = allProducts.slice(currentIndex, currentIndex + 3)
  const visibleCards = [...visibleSlice].reverse()

  const isDone = !loading && currentIndex >= allProducts.length
  const currentProduct = allProducts[currentIndex]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-sage border-t-transparent animate-spin mx-auto" />
          <p className="text-stone-400 text-sm mt-4">Loading styles…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-sm sm:max-w-md mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="section-subtitle text-blush mb-2">Discover</p>
        <h1 className="font-display text-4xl text-bark">Find Your Style</h1>
        <p className="text-stone-400 text-sm mt-2">
          Swipe <span className="text-sage font-medium">right</span> to wishlist ·{' '}
          <span className="text-blush font-medium">left</span> to skip
        </p>
      </div>

      {isDone ? (
        /* ── Empty / Done state ── */
        <div className="flex flex-col items-center justify-center min-h-[480px] text-center">
          <div className="w-20 h-20 rounded-full bg-cream-100 flex items-center justify-center mb-6">
            <RotateCcw size={32} className="text-stone-400" />
          </div>
          <h2 className="font-display text-3xl text-bark mb-2">You've seen it all!</h2>
          <p className="text-stone-400 text-sm mb-8 max-w-xs">
            You've swiped through every style. Check your wishlist or restart the deck.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <Link href="/wishlist" className="btn-primary flex-1 text-center py-3">
              View Wishlist
            </Link>
            <button onClick={restart} className="btn-outline flex-1 py-3 flex items-center justify-center gap-2">
              <RotateCcw size={14} /> Restart
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── Card stack ── */}
          <div className="relative h-[460px] sm:h-[520px] mb-6">
            {visibleCards.map((product) => {
              const stackIndex = visibleSlice.indexOf(product) // 0 = top
              const isTop = stackIndex === 0
              return (
                <SwipeCard
                  key={product._id}
                  product={product}
                  isTop={isTop}
                  stackIndex={stackIndex}
                  onSwipe={handleSwipe}
                  forceSwipe={isTop ? forceSwipe : null}
                />
              )
            })}
          </div>

          {/* Counter */}
          <p className="text-center text-xs text-stone-400 mb-6">
            {currentIndex + 1} of {allProducts.length}
          </p>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-10">
            <button
              onClick={() => triggerSwipe('left')}
              disabled={isSwiping}
              aria-label="Skip"
              className="w-16 h-16 rounded-full bg-white shadow-card border border-cream-200 flex items-center justify-center text-blush hover:scale-110 hover:shadow-hover transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={26} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => triggerSwipe('right')}
              disabled={isSwiping}
              aria-label="Add to Wishlist"
              className="w-16 h-16 rounded-full bg-sage shadow-card flex items-center justify-center text-white hover:scale-110 hover:shadow-hover transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Heart size={26} strokeWidth={2.5} />
            </button>
          </div>

          {/* Wishlist hint */}
          {currentProduct && has(currentProduct._id) && (
            <p className="text-center text-xs text-stone-400 mt-5">
              Already in your{' '}
              <Link href="/wishlist" className="text-sage underline underline-offset-2 hover:text-bark transition-colors">
                wishlist
              </Link>
            </p>
          )}
          {currentProduct && !has(currentProduct._id) && (
            <p className="text-center text-xs text-stone-400 mt-5">
              <Link href="/wishlist" className="hover:text-bark transition-colors underline underline-offset-2">
                View wishlist
              </Link>
            </p>
          )}
        </>
      )}
    </div>
  )
}
