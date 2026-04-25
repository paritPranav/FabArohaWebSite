'use client'
// apps/client/src/components/home/CollectionGrid.tsx
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface Collection {
  _id: string; name: string; slug: string; description?: string; bannerImage?: string; products: { images: string[] }[]
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80',
]

export function CollectionGrid({ collections }: { collections: Collection[] }) {
  const items = collections.length ? collections : [
    { _id: '1', name: 'The Summer Edit', slug: 'summer', description: 'Linen and cotton kissed by warm sun. Breathe, flow, love.', bannerImage: FALLBACK_IMAGES[0], products: [] },
    { _id: '2', name: 'The Clay Edit',  slug: 'clay',   description: 'Terracotta and dust — fabric in its most honest form.',   bannerImage: FALLBACK_IMAGES[1], products: [] },
    { _id: '3', name: 'Sage & Serenity',      slug: 'sage',   description: 'Forest-floor greens for quiet, intentional dressing.',   bannerImage: FALLBACK_IMAGES[2], products: [] },
  ]

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="section-subtitle text-sage mb-2">Loved Collections</p>
          <h2 className="section-title">Fabric Stories</h2>
        </div>
        <Link href="/collections" className="hidden md:flex items-center gap-2 text-sm text-stone-400 hover:text-bark transition-colors">
          All Collections <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {items.slice(0, 3).map((col, i) => (
          <motion.div
            key={col._id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: i * 0.1 }}
          >
            <Link href={`/collections/${col.slug}`} className="group block relative rounded-3xl overflow-hidden aspect-[3/4] bg-cream-200">
              <Image
                src={col.bannerImage || FALLBACK_IMAGES[i % 3]}
                alt={col.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bark/65 via-bark/15 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="font-display text-2xl">{col.name}</p>
                {col.description && (
                  <p className="text-sm text-white/70 mt-1.5 line-clamp-2 leading-relaxed">{col.description}</p>
                )}
                <p className="text-xs mt-3 flex items-center gap-1.5 opacity-80 font-medium tracking-wide uppercase">
                  Explore Collection <ArrowRight size={11} />
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default CollectionGrid
