'use client'
// admin/src/app/dashboard/virtual-wardrobe/page.tsx
// Exhibition / showcase mode — full-screen product viewer for in-store demos
import { useEffect, useState, useCallback, useRef } from 'react'
import { productAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Search, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut,
  Layers, Tag, Maximize2, Minimize2, Heart, ShoppingCart,
} from 'lucide-react'
import clsx from 'clsx'

type Product = {
  _id: string; title: string; images: string[]; price: number; discountedPrice?: number;
  category: string; subCategory?: string; description?: string;
  sizes: { label: string; stock: number }[];
  colors: { name: string; hex: string }[];
  material?: string; tags?: string[];
}

function inr(n: number) {
  return '₹' + Number(n || 0).toLocaleString('en-IN')
}

const CATEGORIES = ['All', 'Men', 'Women', 'Unisex', 'Kids', 'Accessories']

export default function VirtualWardrobePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('All')

  // Showcase mode state
  const [showcaseIdx, setShowcaseIdx]   = useState<number | null>(null)
  const [imgIdx, setImgIdx]             = useState(0)
  const [fullscreen, setFullscreen]     = useState(false)
  const [zoomed, setZoomed]             = useState(false)
  const [liked, setLiked]               = useState<Set<string>>(new Set())

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    productAPI.list({ limit: 300, isActive: true })
      .then(r => setProducts(r.data.products || []))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => {
    const catMatch = category === 'All' || p.category === category
    const searchMatch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
    return catMatch && searchMatch
  })

  const openShowcase = (idx: number) => {
    setShowcaseIdx(idx)
    setImgIdx(0)
    setZoomed(false)
  }

  const closeShowcase = () => {
    setShowcaseIdx(null)
    setFullscreen(false)
    setZoomed(false)
  }

  const showcaseProduct = showcaseIdx !== null ? filtered[showcaseIdx] : null

  const nextProduct = useCallback(() => {
    if (showcaseIdx === null) return
    setShowcaseIdx((showcaseIdx + 1) % filtered.length)
    setImgIdx(0); setZoomed(false)
  }, [showcaseIdx, filtered.length])

  const prevProduct = useCallback(() => {
    if (showcaseIdx === null) return
    setShowcaseIdx((showcaseIdx - 1 + filtered.length) % filtered.length)
    setImgIdx(0); setZoomed(false)
  }, [showcaseIdx, filtered.length])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showcaseIdx === null) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextProduct()
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   prevProduct()
      if (e.key === 'Escape') closeShowcase()
      if (e.key === 'f' || e.key === 'F') setFullscreen(f => !f)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showcaseIdx, nextProduct, prevProduct])

  const toggleLike = (id: string) =>
    setLiked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  // ── Fullscreen Showcase Overlay ─────────────────────────────────────────────
  if (showcaseProduct && fullscreen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex" ref={containerRef}>
        {/* Main image */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden"
          onClick={() => setZoomed(z => !z)}>
          <img
            src={showcaseProduct.images[imgIdx] || ''}
            alt={showcaseProduct.title}
            className={clsx('max-h-full max-w-full object-contain transition-transform duration-300 cursor-zoom-in',
              zoomed ? 'scale-150 cursor-zoom-out' : 'scale-100')}
          />

          {/* Image nav */}
          {showcaseProduct.images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setImgIdx(i => Math.max(0, i - 1)) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30">
                <ChevronLeft size={20} />
              </button>
              <button onClick={e => { e.stopPropagation(); setImgIdx(i => Math.min(showcaseProduct.images.length - 1, i + 1)) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30">
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {showcaseProduct.images.map((_, i) => (
                  <button key={i} onClick={e => { e.stopPropagation(); setImgIdx(i) }}
                    className={clsx('w-1.5 h-1.5 rounded-full transition-all', i === imgIdx ? 'bg-white w-4' : 'bg-white/40')} />
                ))}
              </div>
            </>
          )}

          {/* Product nav arrows */}
          <button onClick={e => { e.stopPropagation(); prevProduct() }}
            className="absolute left-0 top-1/3 -translate-y-1/2 h-32 w-12 bg-gradient-to-r from-black/30 to-transparent flex items-center justify-start pl-2 text-white/70 hover:text-white transition-colors">
            <ChevronLeft size={28} />
          </button>
          <button onClick={e => { e.stopPropagation(); nextProduct() }}
            className="absolute right-0 top-1/3 -translate-y-1/2 h-32 w-12 bg-gradient-to-l from-black/30 to-transparent flex items-center justify-end pr-2 text-white/70 hover:text-white transition-colors">
            <ChevronRight size={28} />
          </button>
        </div>

        {/* Right info panel */}
        <div className="w-80 bg-[#1A1410] flex flex-col p-6 text-white overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs text-white/40 uppercase tracking-widest">Virtual Wardrobe</span>
            <button onClick={closeShowcase} className="text-white/50 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{showcaseProduct.category}</p>
          <h2 className="font-display text-2xl text-white mb-3 leading-tight">{showcaseProduct.title}</h2>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-2xl font-bold text-[#C5B8A8]">
              {inr(showcaseProduct.discountedPrice || showcaseProduct.price)}
            </span>
            {showcaseProduct.discountedPrice && showcaseProduct.discountedPrice < showcaseProduct.price && (
              <span className="text-white/40 line-through text-sm">{inr(showcaseProduct.price)}</span>
            )}
          </div>

          {showcaseProduct.description && (
            <p className="text-white/60 text-sm leading-relaxed mb-5">{showcaseProduct.description}</p>
          )}

          {/* Sizes */}
          {showcaseProduct.sizes?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Available Sizes</p>
              <div className="flex flex-wrap gap-2">
                {showcaseProduct.sizes.filter(s => s.stock > 0).map(s => (
                  <span key={s.label} className="px-3 py-1 border border-white/20 rounded-lg text-xs text-white/80">
                    {s.label}
                  </span>
                ))}
                {showcaseProduct.sizes.filter(s => s.stock === 0).map(s => (
                  <span key={s.label} className="px-3 py-1 border border-white/10 rounded-lg text-xs text-white/30 line-through">
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {showcaseProduct.colors?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Colors</p>
              <div className="flex gap-2">
                {showcaseProduct.colors.map(c => (
                  <div key={c.name} title={c.name}
                    className="w-7 h-7 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: c.hex || '#ccc' }} />
                ))}
              </div>
            </div>
          )}

          {/* Material */}
          {showcaseProduct.material && (
            <div className="mb-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Material</p>
              <p className="text-sm text-white/70">{showcaseProduct.material}</p>
            </div>
          )}

          {/* Tags */}
          {showcaseProduct.tags && showcaseProduct.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {showcaseProduct.tags.map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">{t}</span>
              ))}
            </div>
          )}

          <div className="mt-auto">
            {/* Thumbnails */}
            {showcaseProduct.images.length > 1 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {showcaseProduct.images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={clsx('flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all',
                      i === imgIdx ? 'border-[#C5B8A8]' : 'border-white/10')}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Navigation hint */}
            <p className="text-xs text-white/30 text-center">
              ← → Arrow keys to navigate · F for fullscreen · ESC to close
            </p>
            <p className="text-xs text-white/20 text-center mt-0.5">
              {(showcaseIdx ?? 0) + 1} of {filtered.length}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute top-4 left-4 flex gap-2">
          <button onClick={() => setZoomed(z => !z)}
            className="w-9 h-9 bg-white/10 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/20">
            {zoomed ? <ZoomOut size={15} /> : <ZoomIn size={15} />}
          </button>
          <button onClick={() => { setFullscreen(false) }}
            className="w-9 h-9 bg-white/10 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/20">
            <Minimize2 size={15} />
          </button>
          <button onClick={() => toggleLike(showcaseProduct._id)}
            className={clsx('w-9 h-9 backdrop-blur rounded-full flex items-center justify-center transition-colors',
              liked.has(showcaseProduct._id) ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20')}>
            <Heart size={15} fill={liked.has(showcaseProduct._id) ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    )
  }

  // ── Normal Showcase Modal (non-fullscreen) ──────────────────────────────────
  if (showcaseProduct && !fullscreen) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl overflow-hidden max-w-3xl w-full flex max-h-[90vh]">
          {/* Image side */}
          <div className="flex-1 relative bg-cream-100 overflow-hidden">
            <img src={showcaseProduct.images[imgIdx] || ''} alt={showcaseProduct.title}
              className="w-full h-full object-cover" />

            {showcaseProduct.images.length > 1 && (
              <>
                <button onClick={() => setImgIdx(i => Math.max(0, i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setImgIdx(i => Math.min(showcaseProduct.images.length - 1, i + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow">
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            {/* Product arrows */}
            <button onClick={prevProduct}
              className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center bg-gradient-to-r from-black/10 to-transparent text-white hover:from-black/20">
              <ChevronLeft size={22} />
            </button>
            <button onClick={nextProduct}
              className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center bg-gradient-to-l from-black/10 to-transparent text-white hover:from-black/20">
              <ChevronRight size={22} />
            </button>

            <div className="absolute top-3 left-3 flex gap-1.5">
              <button onClick={() => setFullscreen(true)}
                className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow text-bark hover:bg-white">
                <Maximize2 size={14} />
              </button>
              <button onClick={() => toggleLike(showcaseProduct._id)}
                className={clsx('w-8 h-8 rounded-full flex items-center justify-center shadow transition-colors',
                  liked.has(showcaseProduct._id) ? 'bg-red-500 text-white' : 'bg-white/90 text-bark hover:bg-white')}>
                <Heart size={14} fill={liked.has(showcaseProduct._id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Counter */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur text-white text-xs px-3 py-1 rounded-full">
              {(showcaseIdx ?? 0) + 1} / {filtered.length}
            </div>
          </div>

          {/* Info side */}
          <div className="w-72 p-6 overflow-y-auto flex flex-col">
            <div className="flex items-start justify-between mb-1">
              <span className="text-xs text-stone-400 uppercase tracking-wider">{showcaseProduct.category}</span>
              <button onClick={closeShowcase} className="text-stone-400 hover:text-stone-600 -mt-0.5">
                <X size={16} />
              </button>
            </div>

            <h2 className="font-display text-xl text-bark mb-3">{showcaseProduct.title}</h2>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-xl font-bold text-bark">
                {inr(showcaseProduct.discountedPrice || showcaseProduct.price)}
              </span>
              {showcaseProduct.discountedPrice && showcaseProduct.discountedPrice < showcaseProduct.price && (
                <span className="text-stone-400 line-through text-sm">{inr(showcaseProduct.price)}</span>
              )}
            </div>

            {showcaseProduct.description && (
              <p className="text-stone-500 text-sm leading-relaxed mb-4">{showcaseProduct.description}</p>
            )}

            {showcaseProduct.sizes?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Sizes</p>
                <div className="flex flex-wrap gap-1.5">
                  {showcaseProduct.sizes.filter(s => s.stock > 0).map(s => (
                    <span key={s.label} className="px-2.5 py-1 border border-cream-200 rounded-lg text-xs text-bark">{s.label}</span>
                  ))}
                </div>
              </div>
            )}

            {showcaseProduct.colors?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Colors</p>
                <div className="flex gap-2">
                  {showcaseProduct.colors.map(c => (
                    <div key={c.name} title={c.name}
                      className="w-6 h-6 rounded-full border border-cream-200"
                      style={{ backgroundColor: c.hex || '#ccc' }} />
                  ))}
                </div>
              </div>
            )}

            {showcaseProduct.material && (
              <div className="mb-4">
                <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Material</p>
                <p className="text-sm text-bark">{showcaseProduct.material}</p>
              </div>
            )}

            {/* Thumbnails */}
            {showcaseProduct.images.length > 1 && (
              <div className="mt-auto pt-4">
                <div className="flex gap-1.5 overflow-x-auto">
                  {showcaseProduct.images.map((img, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={clsx('flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all',
                        i === imgIdx ? 'border-bark' : 'border-cream-200')}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-stone-300 text-center mt-3">← → Arrow keys to navigate</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Product Grid ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl text-bark">Virtual Wardrobe</h1>
          <p className="text-stone-400 text-sm mt-0.5">Exhibition & showcase mode — click any product to present it</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-400">{filtered.length} products</p>
          <p className="text-xs text-stone-300">Press F for fullscreen in showcase</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-cream-200 text-sm focus:outline-none focus:border-bark bg-white" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={clsx('px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                category === cat ? 'bg-bark text-cream-100' : 'bg-white border border-cream-200 text-stone-500 hover:border-bark')}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-cream-200 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((product, idx) => (
            <button key={product._id} onClick={() => openShowcase(idx)}
              className="group relative bg-white rounded-2xl overflow-hidden border border-cream-200 hover:shadow-lg hover:border-cream-300 transition-all text-left">
              {/* Image */}
              <div className="aspect-[3/4] bg-cream-100 overflow-hidden">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-200">
                    <Layers size={32} />
                  </div>
                )}
              </div>

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-bark/0 group-hover:bg-bark/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-white/90 backdrop-blur rounded-full px-4 py-1.5 text-xs font-medium text-bark">
                  View
                </div>
              </div>

              {/* Liked badge */}
              {liked.has(product._id) && (
                <div className="absolute top-2 right-2">
                  <Heart size={16} className="text-red-500 fill-red-500" />
                </div>
              )}

              {/* Sale badge */}
              {product.discountedPrice && product.discountedPrice < product.price && (
                <div className="absolute top-2 left-2 bg-blush text-white text-xs px-1.5 py-0.5 rounded-md font-medium">
                  SALE
                </div>
              )}

              {/* Info */}
              <div className="p-3">
                <p className="text-xs text-stone-400 mb-0.5">{product.category}</p>
                <p className="text-sm font-medium text-bark line-clamp-2 leading-tight mb-1">{product.title}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-bark">
                    {inr(product.discountedPrice || product.price)}
                  </span>
                  {product.discountedPrice && product.discountedPrice < product.price && (
                    <span className="text-xs text-stone-400 line-through">{inr(product.price)}</span>
                  )}
                </div>
                {product.colors?.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {product.colors.slice(0, 4).map(c => (
                      <div key={c.name} className="w-3 h-3 rounded-full border border-cream-200"
                        style={{ backgroundColor: c.hex || '#ccc' }} />
                    ))}
                    {product.colors.length > 4 && (
                      <span className="text-xs text-stone-400">+{product.colors.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-stone-400">
              <Layers size={48} className="mx-auto mb-3 opacity-20" />
              <p>No products found</p>
            </div>
          )}
        </div>
      )}

      {/* Exhibition tip */}
      {!loading && filtered.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-xs text-stone-300">
            Click any product → Press <kbd className="px-1.5 py-0.5 rounded bg-cream-200 text-stone-500 font-mono text-xs">F</kbd> for fullscreen showcase mode
            · Use <kbd className="px-1.5 py-0.5 rounded bg-cream-200 text-stone-500 font-mono text-xs">← →</kbd> to browse
          </p>
        </div>
      )}
    </div>
  )
}
