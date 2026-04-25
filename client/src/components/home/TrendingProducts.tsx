'use client'
// apps/client/src/components/home/TrendingProducts.tsx
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductCard, { Product } from '@/components/ui/ProductCard'
import { motion } from 'framer-motion'

export default function TrendingProducts({ products }: { products: Product[] }) {
  if (!products.length) return null

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="section-subtitle text-blush mb-2">Most Loved</p>
          <h2 className="section-title">Trending Now</h2>
        </div>
        <Link href="/products?trending=true" className="hidden md:flex items-center gap-2 text-sm text-stone-400 hover:text-bark transition-colors">
          View All <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.slice(0, 4).map((p, i) => (
          <motion.div
            key={p._id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
          >
            <ProductCard product={p} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
