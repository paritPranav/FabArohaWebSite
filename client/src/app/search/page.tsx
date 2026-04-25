'use client'
// apps/client/src/app/search/page.tsx
import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import ProductCard from '@/components/ui/ProductCard'
import { productAPI } from '@/lib/api'
import { useDebounce } from '@/lib/useDebounce'

export default function SearchPage() {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<any[]>([])
  const [loading, setLoading]   = useState(false)
  const debouncedQuery          = useDebounce(query, 400)

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return }
    setLoading(true)
    productAPI.list({ search: debouncedQuery, limit: 20 })
      .then(r => setResults(r.data.products || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-14">
      <h1 className="font-display text-4xl text-bark mb-8">Search</h1>

      <div className="relative mb-10">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          autoFocus
          type="search"
          placeholder="Search for styles, colours, fabrics…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="input pl-12 py-4 text-base rounded-2xl"
        />
      </div>

      {loading && <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />)}</div>}

      {!loading && results.length > 0 && (
        <>
          <p className="text-sm text-stone-400 mb-5">{results.length} results for "<span className="text-bark">{debouncedQuery}</span>"</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {results.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </>
      )}

      {!loading && query && results.length === 0 && (
        <div className="text-center py-20">
          <p className="font-display text-3xl text-bark mb-2">No results found</p>
          <p className="text-stone-400 text-sm">Try a different search — perhaps a colour, fabric, or style.</p>
        </div>
      )}

      {!query && (
        <div className="text-center py-20 text-stone-400">
          <Search size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">Start typing to discover FabAroha pieces</p>
        </div>
      )}
    </div>
  )
}
