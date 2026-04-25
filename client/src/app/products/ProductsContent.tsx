'use client'
// apps/client/src/app/products/ProductsContent.tsx
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import ProductCard, { Product } from '@/components/ui/ProductCard'
import { productAPI } from '@/lib/api'
import clsx from 'clsx'

const CATEGORIES = ['Women', 'Men', 'Unisex', 'Kids', 'Accessories']
const SIZES      = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const SORT_OPTIONS = [
  { label: 'Newest',      value: '-createdAt' },
  { label: 'Price: Low',  value: 'price' },
  { label: 'Price: High', value: '-price' },
  { label: 'Most Rated',  value: '-rating' },
]

function ProductSkeleton() {
  return (
    <div className="space-y-3">
      <div className="skeleton aspect-[3/4] rounded-2xl" />
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-4 w-1/2 rounded" />
    </div>
  )
}

export default function ProductsContent() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const pathname      = usePathname()

  const [products, setProducts]   = useState<Product[]>([])
  const [loading, setLoading]     = useState(true)
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Filter state — sync with URL
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    size:     searchParams.get('size')     || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort:     searchParams.get('sort')     || '-createdAt',
    search:   searchParams.get('search')   || '',
    trending: searchParams.get('trending') || '',
    tag:      searchParams.get('tag')      || '',
  })

  // Re-sync filters whenever the URL search params change (e.g. navbar links)
  useEffect(() => {
    setFilters({
      category: searchParams.get('category') || '',
      size:     searchParams.get('size')     || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      sort:     searchParams.get('sort')     || '-createdAt',
      search:   searchParams.get('search')   || '',
      trending: searchParams.get('trending') || '',
      tag:      searchParams.get('tag')      || '',
    })
    setPage(1)
  }, [searchParams])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit: 16, sort: filters.sort }
      if (filters.category) params.category = filters.category
      if (filters.size)     params.size     = filters.size
      if (filters.minPrice) params.minPrice = filters.minPrice
      if (filters.maxPrice) params.maxPrice = filters.maxPrice
      if (filters.search)   params.search   = filters.search
      if (filters.trending) params.trending = 'true'
      if (filters.tag)      params.tag      = filters.tag

      const res = await productAPI.list(params)
      setProducts(res.data.products)
      setTotal(res.data.pagination.total)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ category: '', size: '', minPrice: '', maxPrice: '', sort: '-createdAt', search: '', trending: '', tag: '' })
    setPage(1)
  }

  const activeFilterCount = [filters.category, filters.size, filters.minPrice, filters.maxPrice].filter(Boolean).length

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-bark">
            {filters.category || filters.tag || 'All Products'}
          </h1>
          <p className="text-sm text-stone-400 mt-1">{total} pieces found</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="relative">
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="input pr-8 py-2 text-xs appearance-none cursor-pointer min-w-[140px]"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={clsx('btn-outline flex items-center gap-2 py-2 text-xs', filtersOpen && 'bg-bark text-cream')}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-sage text-white w-4 h-4 rounded-full text-2xs flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <aside className={clsx(
          'w-64 flex-shrink-0 transition-all duration-300',
          filtersOpen ? 'block' : 'hidden md:block'
        )}>
          <div className="sticky top-24 space-y-6">
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-blush flex items-center gap-1 hover:text-bark transition-colors">
                <X size={12} /> Clear all filters
              </button>
            )}

            {/* Category */}
            <div>
              <p className="label">Category</p>
              <div className="space-y-1.5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => updateFilter('category', filters.category === cat ? '' : cat)}
                    className={clsx(
                      'w-full text-left text-sm px-3 py-2 rounded-xl transition-all',
                      filters.category === cat
                        ? 'bg-bark text-cream font-medium'
                        : 'text-stone-400 hover:bg-cream-200 hover:text-bark'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <p className="label">Size</p>
              <div className="flex flex-wrap gap-2">
                {SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => updateFilter('size', filters.size === s ? '' : s)}
                    className={clsx(
                      'w-10 h-10 rounded-xl text-xs font-medium transition-all border',
                      filters.size === s
                        ? 'bg-bark text-cream border-bark'
                        : 'border-cream-300 text-stone-400 hover:border-bark hover:text-bark'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <p className="label">Price (₹)</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter('minPrice', e.target.value)}
                  className="input py-2 text-xs w-full"
                />
                <span className="text-stone-400 text-sm">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)}
                  className="input py-2 text-xs w-full"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="font-display text-3xl text-bark mb-3">No products found</p>
              <p className="text-stone-400 text-sm mb-6">Try adjusting your filters or browsing all products.</p>
              <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>

              {/* Pagination */}
              {total > 16 && (
                <div className="flex justify-center gap-2 mt-12">
                  {Array.from({ length: Math.ceil(total / 16) }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={clsx(
                        'w-10 h-10 rounded-full text-sm transition-all',
                        page === p ? 'bg-bark text-cream' : 'text-stone-400 hover:bg-cream-200'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
