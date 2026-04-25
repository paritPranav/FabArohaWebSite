'use client'
// apps/client/src/components/home/CategoryPreview.tsx
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

const CATS = [
  { label: 'Women',       href: '/products?category=Women',  img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=80', color: 'bg-blush-50' },
  { label: 'Men',         href: '/products?category=Men',    img: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=500&q=80', color: 'bg-cream-200' },
  { label: 'Summer',      href: '/products?tag=summer',      img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&q=80', color: 'bg-sage-50' },
  { label: 'Accessories', href: '/products?category=Accessories', img: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=500&q=80', color: 'bg-sand-50' },
]

export default function CategoryPreview() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-20">
      <div className="text-center mb-12">
        <p className="section-subtitle text-sand mb-2">Browse By</p>
        <h2 className="section-title">Shop Categories</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CATS.map((cat, i) => (
          <motion.div
            key={cat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Link
              href={cat.href}
              className="group block relative rounded-2xl overflow-hidden aspect-square"
            >
              <div className={`absolute inset-0 ${cat.color}`} />
              <Image
                src={cat.img}
                alt={cat.label}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-107"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-bark/30 group-hover:bg-bark/40 transition-colors" />
              <p className="absolute bottom-4 left-4 font-display text-2xl text-white">
                {cat.label}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
