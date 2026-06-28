'use client'
// admin/src/app/dashboard/slideshow/page.tsx
// Exhibition-ready animated slideshow — collections + Men / Women category decks
import { useEffect, useState, useCallback, useRef } from 'react'
import { collectionAPI, productAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Play, Pause, ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Layers, Timer, RefreshCw,
} from 'lucide-react'
import clsx from 'clsx'

// ── Types ──────────────────────────────────────────────────────────────────────
type Product = {
  _id: string; title: string; images: string[]; price: number
  discountedPrice?: number; styleFor?: string; category: string
  colors?: { name: string; hex: string }[]
  sizes?: { label: string; stock: number }[]
}
type Collection = {
  _id: string; name: string; slug: string; bannerImage?: string
  tagline?: string; occasion?: string; keyHighlights?: string[]
  products: Product[]
}

// ── Slide types ────────────────────────────────────────────────────────────────
type SlideIntro = { type: 'intro'; collection?: Collection; category?: string; products: Product[] }
type SlideProduct = { type: 'product'; product: Product; collection?: Collection }
type Slide = SlideIntro | SlideProduct

type Deck = { id: string; label: string; slides: Slide[] }

function inr(n: number) {
  return '₹' + Number(n || 0).toLocaleString('en-IN')
}

// ── Build decks ────────────────────────────────────────────────────────────────
function buildDecks(collections: Collection[], allProducts: Product[]): Deck[] {
  const decks: Deck[] = []

  // Per-collection decks
  for (const col of collections) {
    if (!col.products || col.products.length === 0) continue
    const slides: Slide[] = [
      { type: 'intro', collection: col, products: col.products },
      ...col.products.map(p => ({ type: 'product' as const, product: p, collection: col })),
    ]
    decks.push({ id: col._id, label: col.name, slides })
  }

  // Category decks
  for (const cat of ['Men', 'Women', 'Unisex', 'Kids', 'Accessories']) {
    const prods = allProducts.filter(p => p.category === cat)
    if (prods.length === 0) continue
    const slides: Slide[] = [
      { type: 'intro', category: cat, products: prods },
      ...prods.map(p => ({ type: 'product' as const, product: p })),
    ]
    decks.push({ id: `cat-${cat}`, label: cat, slides })
  }

  return decks
}

// ── Preload images ─────────────────────────────────────────────────────────────
function preloadImages(urls: string[]) {
  urls.forEach(src => { if (src) { const img = new Image(); img.src = src } })
}

// ── Slide Components ───────────────────────────────────────────────────────────

function IntroSlide({ slide }: { slide: SlideIntro }) {
  const col = slide.collection
  const cat = slide.category
  const name = col?.name || cat || 'FabAroha'
  const previews = slide.products.slice(0, 6)

  return (
    <div className="relative w-full h-full flex overflow-hidden">
      {/* Background: mosaic of product images */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 opacity-30">
        {[...Array(6)].map((_, i) => {
          const img = previews[i]?.images?.[0]
          return img ? (
            <img key={i} src={img} alt="" className="w-full h-full object-cover" />
          ) : (
            <div key={i} className="bg-[#2A1F18]" />
          )
        })}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#1A110A] via-[#1A110A]/80 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center px-20 max-w-3xl">
        {/* Collection label */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-12 bg-[#C5B8A8]" />
          <span className="text-[#C5B8A8] text-xs uppercase tracking-[4px]">
            {col ? 'Collection' : 'Category'}
          </span>
        </div>

        {/* Name */}
        <h1
          className="font-serif text-white leading-none mb-6"
          style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)' }}
        >
          {name}
        </h1>

        {/* Tagline */}
        {col?.tagline && (
          <p className="text-[#C5B8A8] text-xl italic mb-8 leading-relaxed">
            "{col.tagline}"
          </p>
        )}

        {/* Occasion */}
        {col?.occasion && (
          <div className="flex items-center gap-3 mb-8">
            <span className="text-[#8FAF89] text-sm uppercase tracking-widest">Wear for</span>
            <span className="text-white/80 text-sm">{col.occasion}</span>
          </div>
        )}

        {/* Key highlights */}
        {col?.keyHighlights && col.keyHighlights.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-10">
            {col.keyHighlights.map((h, i) => (
              <span key={i}
                className="px-4 py-1.5 border border-[#C5B8A8]/40 text-[#C5B8A8] text-xs rounded-full tracking-wide">
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Product count */}
        <p className="text-white/40 text-sm">
          {slide.products.length} piece{slide.products.length !== 1 ? 's' : ''} in this {col ? 'collection' : 'category'}
        </p>
      </div>

      {/* Right: stacked preview images */}
      <div className="absolute right-0 top-0 bottom-0 w-2/5 flex items-center justify-end pr-16">
        <div className="relative w-64 h-80">
          {previews.slice(0, 3).reverse().map((p, i) => {
            const img = p.images?.[0]
            if (!img) return null
            const offsets = [
              'rotate-[-6deg] translate-x-[-20px]',
              'rotate-[2deg] translate-x-[10px] translate-y-[-10px]',
              'rotate-[-1deg]',
            ]
            return (
              <img key={p._id} src={img} alt={p.title}
                className={clsx(
                  'absolute inset-0 w-full h-full object-cover rounded-2xl shadow-2xl',
                  'transition-all duration-700',
                  offsets[i]
                )}
                style={{ zIndex: i }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ProductSlide({ slide }: { slide: SlideProduct }) {
  const { product, collection } = slide
  const [imgIdx, setImgIdx] = useState(0)
  const price = product.discountedPrice || product.price
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price

  // Cycle through product images every 3s
  useEffect(() => {
    if ((product.images?.length || 0) <= 1) return
    const t = setInterval(() => setImgIdx(i => (i + 1) % product.images.length), 3000)
    return () => clearInterval(t)
  }, [product.images?.length])

  return (
    <div className="relative w-full h-full flex">
      {/* Background blur */}
      {product.images?.[0] && (
        <div className="absolute inset-0 overflow-hidden">
          <img src={product.images[imgIdx] || product.images[0]} alt=""
            className="w-full h-full object-cover blur-2xl scale-110 opacity-20 transition-all duration-1000" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0E0A07] via-[#0E0A07]/70 to-[#0E0A07]/30" />

      {/* Left: Info panel */}
      <div className="relative z-10 flex flex-col justify-center px-16 w-[45%]">
        {/* Collection crumb */}
        {collection && (
          <p className="text-[#8FAF89] text-xs uppercase tracking-[3px] mb-4">
            {collection.name}
          </p>
        )}

        {/* Title */}
        <h2
          className="text-white font-serif leading-tight mb-4"
          style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)' }}
        >
          {product.title}
        </h2>

        {/* Style / Occasion */}
        {product.styleFor && (
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-px bg-[#8FAF89]" />
            <span className="text-[#8FAF89] text-sm italic">{product.styleFor}</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-3 mb-8">
          <span className="text-[#C5B8A8] font-light" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)' }}>
            {inr(price)}
          </span>
          {hasDiscount && (
            <span className="text-white/30 line-through text-lg">{inr(product.price)}</span>
          )}
        </div>

        {/* Sizes */}
        {product.sizes && product.sizes.filter(s => s.stock > 0).length > 0 && (
          <div className="mb-6">
            <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Sizes Available</p>
            <div className="flex gap-2 flex-wrap">
              {product.sizes.filter(s => s.stock > 0).map(s => (
                <span key={s.label}
                  className="px-3 py-1 border border-white/20 text-white/70 text-xs rounded-lg">
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Colors */}
        {product.colors && product.colors.length > 0 && (
          <div>
            <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Colors</p>
            <div className="flex gap-2">
              {product.colors.map(c => (
                <div key={c.name} title={c.name}
                  className="w-6 h-6 rounded-full border border-white/20"
                  style={{ backgroundColor: c.hex || '#ccc' }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Product image */}
      <div className="absolute right-0 top-0 bottom-0 w-[55%] flex items-center justify-center pr-12">
        <div className="relative h-[85%] aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
          {product.images?.[imgIdx] ? (
            <img
              key={imgIdx}
              src={product.images[imgIdx]}
              alt={product.title}
              className="w-full h-full object-cover animate-[fadeIn_0.6s_ease]"
            />
          ) : (
            <div className="w-full h-full bg-[#2A1F18]" />
          )}

          {/* Dot indicators */}
          {product.images?.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {product.images.map((_, i) => (
                <div key={i} className={clsx('h-1 rounded-full transition-all duration-500',
                  i === imgIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/30')} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function SlideshowPage() {
  const [decks, setDecks]             = useState<Deck[]>([])
  const [loading, setLoading]         = useState(true)
  const [activeDeck, setActiveDeck]   = useState(0)
  const [slideIdx, setSlideIdx]       = useState(0)
  const [playing, setPlaying]         = useState(false)
  const [fullscreen, setFullscreen]   = useState(false)
  const [speed, setSpeed]             = useState(5)  // seconds per slide
  const [transitioning, setTransitioning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load data
  useEffect(() => {
    Promise.all([
      collectionAPI.listAll(),
      productAPI.list({ limit: 500, isActive: true }),
    ]).then(([colRes, prodRes]) => {
      const cols  = colRes.data.collections  || []
      const prods = prodRes.data.products    || []
      const built = buildDecks(cols, prods)
      setDecks(built)

      // Preload first deck images immediately
      if (built[0]) {
        const urls = built[0].slides.flatMap(s =>
          s.type === 'product' ? (s.product.images || []) : (s.products.flatMap(p => p.images || []))
        )
        preloadImages(urls.slice(0, 20))
      }
    }).catch(() => toast.error('Failed to load slideshow data'))
      .finally(() => setLoading(false))
  }, [])

  const currentDeck   = decks[activeDeck]
  const currentSlides = currentDeck?.slides || []
  const currentSlide  = currentSlides[slideIdx]
  const totalSlides   = currentSlides.length

  // Animate transition
  const goTo = useCallback((idx: number) => {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setSlideIdx(idx)
      setTransitioning(false)
    }, 300)
  }, [transitioning])

  const next = useCallback(() => goTo((slideIdx + 1) % totalSlides), [slideIdx, totalSlides, goTo])
  const prev = useCallback(() => goTo((slideIdx - 1 + totalSlides) % totalSlides), [slideIdx, totalSlides, goTo])

  // Auto-play timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!playing) return
    timerRef.current = setInterval(next, speed * 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [playing, speed, next])

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev() }
      if (e.key === 'Escape')     setFullscreen(false)
      if (e.key === 'f' || e.key === 'F') setFullscreen(f => !f)
      if (e.key === 'p' || e.key === 'P') setPlaying(p => !p)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev])

  // Switch deck — reset slide
  const switchDeck = (idx: number) => {
    setActiveDeck(idx); setSlideIdx(0); setPlaying(false)
    // Preload new deck
    if (decks[idx]) {
      const urls = decks[idx].slides.flatMap(s =>
        s.type === 'product' ? (s.product.images || []) :
        (s.products.flatMap(p => p.images || []))
      )
      preloadImages(urls.slice(0, 20))
    }
  }

  // Progress bar width
  const progressPct = totalSlides > 1 ? ((slideIdx) / (totalSlides - 1)) * 100 : 0

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-2 border-bark border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (decks.length === 0) return (
    <div className="text-center py-20 text-stone-400">
      <Layers size={48} className="mx-auto mb-3 opacity-20" />
      <p className="mb-1">No collections or products found</p>
      <p className="text-sm">Add collections and products first, then come back here</p>
    </div>
  )

  // ── Full-screen presentation mode ──────────────────────────────────────────
  if (fullscreen) {
    return (
      <div ref={containerRef}
        className="fixed inset-0 bg-[#0E0A07] z-50 select-none overflow-hidden"
        style={{ fontFamily: 'Georgia, serif' }}>

        {/* CSS animation */}
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: scale(1.03); } to { opacity: 1; transform: scale(1); } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        {/* Slide */}
        <div
          className="w-full h-full"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? 'scale(0.98)' : 'scale(1)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}
        >
          {currentSlide?.type === 'intro'   && <IntroSlide   slide={currentSlide} />}
          {currentSlide?.type === 'product' && <ProductSlide slide={currentSlide} />}
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-3">
            <span className="text-[#C5B8A8] font-serif text-lg tracking-widest">FabAroha</span>
            <span className="text-white/30 text-xs">·</span>
            <span className="text-white/50 text-xs">{currentDeck?.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setPlaying(p => !p)}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              {playing ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button onClick={() => setFullscreen(false)}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <Minimize2 size={13} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
          <div className="h-full bg-[#8FAF89] transition-all duration-500"
            style={{ width: `${progressPct}%` }} />
        </div>

        {/* Slide counter */}
        <div className="absolute bottom-4 right-8 text-white/30 text-xs">
          {slideIdx + 1} / {totalSlides}
        </div>

        {/* Nav arrows */}
        <button onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-24 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors">
          <ChevronLeft size={32} />
        </button>
        <button onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-24 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors">
          <ChevronRight size={32} />
        </button>

        {/* Dot strip */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[60vw] flex-wrap justify-center">
          {currentSlides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={clsx('h-1 rounded-full transition-all duration-300',
                i === slideIdx ? 'w-6 bg-[#8FAF89]' : 'w-1.5 bg-white/20 hover:bg-white/40')} />
          ))}
        </div>

        {/* Keyboard hint (fades after 3s) */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/20 text-xs pointer-events-none">
          ← → navigate · Space next · P play/pause · F exit fullscreen
        </div>
      </div>
    )
  }

  // ── Normal view (with deck tabs + controls) ─────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl text-bark">Slideshow</h1>
          <p className="text-stone-400 text-sm mt-0.5">Exhibition presentations — collections &amp; categories</p>
        </div>
        <button onClick={() => setFullscreen(true)}
          className="flex items-center gap-2 bg-bark text-cream-100 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-opacity-90 transition-all">
          <Maximize2 size={14} /> Launch Fullscreen
        </button>
      </div>

      {/* Deck tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {decks.map((d, i) => (
          <button key={d.id} onClick={() => switchDeck(i)}
            className={clsx('px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              activeDeck === i
                ? 'bg-bark text-cream-100'
                : 'bg-white border border-cream-200 text-stone-500 hover:border-bark')}>
            {d.label}
            <span className="ml-1.5 text-[10px] opacity-60">{d.slides.length - 1} slides</span>
          </button>
        ))}
      </div>

      {/* Preview canvas */}
      <div className="relative bg-[#0E0A07] rounded-3xl overflow-hidden"
        style={{ height: '56vw', maxHeight: '65vh', fontFamily: 'Georgia, serif' }}>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: scale(1.03); } to { opacity: 1; transform: scale(1); } }
        `}</style>

        {/* Slide */}
        <div className="w-full h-full"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? 'scale(0.98)' : 'scale(1)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}>
          {currentSlide?.type === 'intro'   && <IntroSlide   slide={currentSlide} />}
          {currentSlide?.type === 'product' && <ProductSlide slide={currentSlide} />}
        </div>

        {/* Overlay arrows */}
        <button onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-20 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <button onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-20 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
          <ChevronRight size={24} />
        </button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
          <div className="h-full bg-[#8FAF89] transition-all duration-500"
            style={{ width: `${progressPct}%` }} />
        </div>

        {/* Counter */}
        <div className="absolute top-3 right-4 text-white/40 text-xs bg-black/30 px-2 py-1 rounded-full">
          {slideIdx + 1} / {totalSlides}
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between mt-4 bg-white rounded-2xl border border-cream-200 px-5 py-3">
        {/* Playback */}
        <div className="flex items-center gap-3">
          <button onClick={prev}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-cream-200 text-stone-500 hover:text-bark hover:border-bark transition-all">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setPlaying(p => !p)}
            className={clsx('w-9 h-9 flex items-center justify-center rounded-xl transition-all',
              playing ? 'bg-bark text-cream-100' : 'border border-cream-200 text-stone-500 hover:border-bark hover:text-bark')}>
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button onClick={next}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-cream-200 text-stone-500 hover:text-bark hover:border-bark transition-all">
            <ChevronRight size={16} />
          </button>
          <button onClick={() => { setSlideIdx(0); setPlaying(false) }}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-cream-200 text-stone-500 hover:text-bark hover:border-bark transition-all" title="Restart">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Slide dots */}
        <div className="flex gap-1.5 overflow-x-auto max-w-[40%]">
          {currentSlides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={clsx('flex-shrink-0 h-1.5 rounded-full transition-all duration-300',
                i === slideIdx ? 'w-6 bg-bark' : 'w-1.5 bg-cream-200 hover:bg-stone-300')} />
          ))}
        </div>

        {/* Speed + fullscreen */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <Timer size={13} />
            <input type="range" min={2} max={12} step={1} value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-20 accent-bark" />
            <span className="w-6">{speed}s</span>
          </div>
          <button onClick={() => setFullscreen(true)}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-bark border border-cream-200 hover:border-bark px-3 py-1.5 rounded-xl transition-all">
            <Maximize2 size={13} /> Fullscreen
          </button>
        </div>
      </div>

      {/* Slide strip */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
        {currentSlides.map((slide, i) => {
          const thumb = slide.type === 'product'
            ? slide.product.images?.[0]
            : (slide.collection?.bannerImage || slide.products[0]?.images?.[0])
          return (
            <button key={i} onClick={() => goTo(i)}
              className={clsx('flex-shrink-0 relative rounded-xl overflow-hidden transition-all',
                i === slideIdx ? 'ring-2 ring-bark' : 'opacity-60 hover:opacity-100')}>
              <div className="w-24 h-16 bg-[#1A110A]">
                {thumb
                  ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white/20"><Layers size={16} /></div>
                }
              </div>
              {slide.type === 'intro' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="text-white text-[9px] font-bold uppercase tracking-wider text-center px-1 leading-tight">
                    {slide.collection?.name || slide.category}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8FAF89]"
                style={{ opacity: i === slideIdx ? 1 : 0 }} />
            </button>
          )
        })}
      </div>

      {/* Tip */}
      <p className="text-center text-xs text-stone-300 mt-4">
        Press <kbd className="px-1.5 py-0.5 rounded bg-cream-200 text-stone-500 font-mono text-xs">F</kbd> for fullscreen ·{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-cream-200 text-stone-500 font-mono text-xs">← →</kbd> navigate ·{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-cream-200 text-stone-500 font-mono text-xs">Space</kbd> next ·{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-cream-200 text-stone-500 font-mono text-xs">P</kbd> play/pause
      </p>
    </div>
  )
}
