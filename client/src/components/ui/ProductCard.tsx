'use client'
// apps/client/src/components/ui/ProductCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingBag, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore, useWishlistStore, useAuthStore } from '@/store'
import { productAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export interface Product {
  _id: string
  title: string
  slug: string
  price: number
  discountedPrice?: number
  images: string[]
  category: string
  sizes: { label: string; stock: number }[]
  colors?: { name: string; hex: string }[]
  rating?: number
  numReviews?: number
  isTrending?: boolean
  collection?: { name: string }
}

interface Props {
  product: Product
  className?: string
}

export default function ProductCard({ product, className }: Props) {
  const router              = useRouter()
  const addItem             = useCartStore((s) => s.addItem)
  const { has, toggle }     = useWishlistStore()
  const { isAuthenticated } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const isWishlisted = mounted && has(product._id)

  const discount = product.discountedPrice
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
    : 0

  const firstAvailableSize = product.sizes?.find(s => s.stock > 0)?.label

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!firstAvailableSize) return toast.error('Out of stock')
    addItem({
      productId: product._id,
      title:     product.title,
      image:     product.images?.[0] ?? '',
      price:     product.price,
      discountedPrice: product.discountedPrice,
      size:      firstAvailableSize,
      quantity:  1,
      slug:      product.slug,
    })
    toast.success('Added to cart')
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle(product._id)
    if (isAuthenticated) productAPI.toggleWishlist(product._id).catch(() => {})
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={() => router.push(`/products/${product.slug}`)}
      className={clsx('group relative cursor-pointer', className)}
    >

      {/* ── Image ── */}
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-cream-200">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-300 text-xs">
            No Image
          </div>
        )}

        {/* Hover second image */}
        {product.images?.[1] && (
          <Image
            src={product.images[1]}
            alt={product.title}
            fill
            className="object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        )}

        {/* Badges — pointer-events-none so link click-through works */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
          {discount > 0 && (
            <span className="badge bg-bark text-cream text-2xs px-2.5 py-1">
              -{discount}%
            </span>
          )}
          {product.isTrending && (
            <span className="badge bg-sage text-white text-2xs px-2.5 py-1">
              Trending
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={handleWishlist}
            className={clsx(
              'w-9 h-9 rounded-full flex items-center justify-center shadow-soft transition-all',
              isWishlisted
                ? 'bg-blush text-white'
                : 'bg-parchment text-stone-400 hover:bg-blush hover:text-white'
            )}
            aria-label="Add to wishlist"
          >
            <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Quick Add */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
          <button
            onClick={handleAddToCart}
            className="w-full bg-bark/90 backdrop-blur-sm text-cream text-sm py-3 flex items-center justify-center gap-2 hover:bg-bark transition-colors"
          >
            <ShoppingBag size={14} /> Quick Add
          </button>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="mt-3 px-1">
        {product.collection && (
          <p className="text-2xs text-stone-400 uppercase tracking-widest mb-1">
            {product.collection.name}
          </p>
        )}
        <h3 className="font-body text-sm font-medium text-bark line-clamp-1">{product.title}</h3>

        {product.rating != null && (product.numReviews ?? 0) > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={11} className="text-sand fill-sand" />
            <span className="text-2xs text-stone-400">
              {product.rating.toFixed(1)} ({product.numReviews})
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-1.5">
          {product.discountedPrice ? (
            <>
              <span className="font-medium text-sm text-bark">
                ₹{product.discountedPrice.toLocaleString()}
              </span>
              <span className="text-xs text-stone-400 line-through">
                ₹{product.price.toLocaleString()}
              </span>
            </>
          ) : (
            <span className="font-medium text-sm text-bark">
              ₹{product.price.toLocaleString()}
            </span>
          )}
        </div>

        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            {product.colors.slice(0, 4).map((c) => (
              <span
                key={c.hex}
                title={c.name}
                className="w-3.5 h-3.5 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-2xs text-stone-400">+{product.colors.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
