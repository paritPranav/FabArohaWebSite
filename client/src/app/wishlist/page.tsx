'use client'
// apps/client/src/app/wishlist/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import ProductCard from '@/components/ui/ProductCard'
import { useAuthStore, useWishlistStore } from '@/store'
import { userAPI } from '@/lib/api'

export default function WishlistPage() {
  const { isAuthenticated } = useAuthStore()
  const { ids } = useWishlistStore()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (isAuthenticated) {
          const res = await userAPI.wishlist()
          setProducts(res.data.wishlist)
        }
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Heart size={48} className="text-blush mb-4" />
        <h2 className="font-display text-3xl text-bark mb-2">Your Wishlist</h2>
        <p className="text-stone-400 text-sm mb-6">Sign in to save your favourite pieces.</p>
        <Link href="/login" className="btn-primary">Sign In</Link>
      </div>
    )
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-14">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-14">
      <div className="flex items-center gap-3 mb-10">
        <Heart size={28} className="text-blush fill-blush" />
        <h1 className="font-display text-4xl text-bark">My Wishlist</h1>
        <span className="text-stone-400 text-sm">({products.length} items)</span>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="font-display text-3xl text-bark mb-3">Nothing saved yet</p>
          <p className="text-stone-400 text-sm mb-6">Browse our collections and heart the pieces you love.</p>
          <Link href="/products" className="btn-primary">Explore Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  )
}
