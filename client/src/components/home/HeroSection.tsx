'use client'
// apps/client/src/components/home/HeroSection.tsx
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=85'

export default function HeroSection({ featuredProduct }: { featuredProduct?: any }) {
  const heroImg  = featuredProduct?.images?.[0] || FALLBACK_IMG
  const cardName = featuredProduct?.title || 'New Arrival'
  const cardPrice = featuredProduct
    ? `₹${(featuredProduct.discountedPrice || featuredProduct.price)?.toLocaleString()}`
    : null
  const cardLink = featuredProduct ? `/products/${featuredProduct.slug}` : '/products'

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-bl from-sage-50 via-cream to-parchment" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-blush-50/60 to-transparent" />
        <div className="grain-overlay absolute inset-0" />
      </div>

      {/* Decorative rings */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-cream-300/80 hidden lg:block pointer-events-none" />
      <div className="absolute right-16 top-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-cream-300/60 hidden lg:block pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full grid lg:grid-cols-2 gap-10 items-center py-20">
        {/* Text */}
        <div>
          {/* Brand meaning pill */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-sand-50 border border-sand-200 rounded-full px-4 py-1.5 mb-6"
          >
            <Sparkles size={12} className="text-sand-400" />
            <span className="text-xs text-sand-500 font-medium tracking-wide">
              Fashion crafted with love &amp; elegance
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-6xl md:text-7xl xl:text-8xl text-bark leading-none"
          >
            Style that
            <br />
            <em className="italic text-sand-400">Moves</em>
            <br />
            with You.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 text-stone-400 text-base max-w-md leading-relaxed"
          >
            <strong className="text-bark font-medium">FabAroha</strong> is where comfort meets elegance.
            We design clothing for real life — pieces that feel as good as they look,
            built for the way you actually live.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center gap-4 mt-10"
          >
            <Link href="/collections" className="btn-primary flex items-center gap-2 px-8 py-3.5">
              Shop Collections <ArrowRight size={16} />
            </Link>
            <Link href="/about" className="btn-outline px-8 py-3.5">
              Our Story
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-8 mt-14"
          >
            {[
              ['300', 'Happy Customers'],
              ['4.8★', 'Avg. Rating'],
              ['30+', 'Curated Styles'],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-3xl text-bark">{n}</p>
                <p className="text-2xs text-stone-400 uppercase tracking-widest mt-0.5">{l}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="relative w-full aspect-[3/4] max-w-md ml-auto">
            <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden bg-cream-200">
              <Image
                src={heroImg}
                alt={cardName}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Floating product card */}
            <Link href={cardLink} className="absolute -left-14 bottom-20 bg-parchment rounded-2xl shadow-card p-4 w-48 hover:shadow-hover transition-shadow">
              <p className="text-2xs text-stone-400 uppercase tracking-widest">Most Loved</p>
              <p className="font-display text-lg text-bark mt-0.5 line-clamp-2 leading-tight">{cardName}</p>
              {cardPrice && <p className="text-sm font-medium text-sand-400 mt-1">{cardPrice}</p>}
            </Link>

            {/* Brand identity float card */}
            <div className="absolute -right-6 top-14 bg-parchment border border-cream-300 rounded-2xl px-4 py-3 shadow-soft text-center max-w-[140px]">
              <p className="font-display text-lg text-bark leading-tight">FabAroha</p>
              <div className="h-px bg-cream-300 my-2" />
              <p className="text-2xs text-stone-400 leading-relaxed">
                Style · Comfort · Elegance
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-stone-400">
        <span className="text-2xs uppercase tracking-[0.3em]">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-stone-400 to-transparent animate-pulse" />
      </div>
    </section>
  )
}
