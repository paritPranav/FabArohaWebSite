// apps/client/src/app/collections/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Collections' }

async function getCollections() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collections`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.collections || []
  } catch { return [] }
}

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&q=80'

const FALLBACKS = [
  { _id: '1', name: 'The Summer Edit',  slug: 'summer', description: 'Light fabrics, easy silhouettes, golden warmth.', bannerImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&q=80', products: [] },
  { _id: '2', name: 'The Clay Edit',    slug: 'clay',   description: 'Terracotta, rust, and sun-baked earth. Grounded and beautiful.', bannerImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=700&q=80', products: [] },
  { _id: '3', name: 'Sage & Serenity',  slug: 'sage',   description: 'Forest-floor greens for quiet, intentional dressing.',          bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=700&q=80', products: [] },
  { _id: '4', name: 'The Blush Atelier',slug: 'blush',  description: 'Dusty rose, soft pinks — elegance in every thread.',            bannerImage: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=700&q=80', products: [] },
  { _id: '5', name: 'Neutral Ground',   slug: 'neutral',description: 'Ecru, cream, and oat — a wardrobe built to last.',               bannerImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&q=80', products: [] },
  { _id: '6', name: 'The Men\'s Edit',  slug: 'mens',   description: 'Relaxed, refined. Earthy menswear done right.',                  bannerImage: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=700&q=80', products: [] },
]

export default async function CollectionsPage() {
  const collections = await getCollections()
  const items = collections.length ? collections : FALLBACKS

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-14">
      {/* Header */}
      <div className="text-center mb-14">
        <p className="section-subtitle text-sage mb-3">Curated with Love</p>
        <h1 className="font-display text-5xl md:text-6xl text-bark">Our Collections</h1>
        <p className="text-stone-400 text-sm mt-4 max-w-lg mx-auto leading-relaxed">
          Each collection is a chapter — a mood, a season, a feeling. Browse them all and find the one that speaks to you.
        </p>
      </div>

      {/* Featured (first) */}
      {items[0] && (
        <Link href={`/collections/${items[0].slug}`} className="group block relative rounded-[2rem] overflow-hidden aspect-[16/7] mb-6 bg-cream-200">
          <Image src={items[0].bannerImage || DEFAULT_BANNER} alt={items[0].name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-bark/60 via-bark/20 to-transparent" />
          <div className="absolute left-10 top-1/2 -translate-y-1/2 text-white">
            <p className="text-xs uppercase tracking-widest opacity-70 mb-2">Featured Collection</p>
            <h2 className="font-display text-5xl mb-3">{items[0].name}</h2>
            <p className="text-white/70 text-sm max-w-xs mb-5">{items[0].description}</p>
            <span className="inline-flex items-center gap-2 text-sm font-medium border-b border-white/50 pb-0.5">
              Explore <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      )}

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.slice(1).map((col: any) => (
          <Link key={col._id} href={`/collections/${col.slug}`}
            className="group relative rounded-3xl overflow-hidden aspect-[4/5] bg-cream-200 block">
            <Image src={col.bannerImage || DEFAULT_BANNER} alt={col.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-bark/65 via-bark/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <h3 className="font-display text-2xl">{col.name}</h3>
              <p className="text-sm text-white/65 mt-1.5 line-clamp-2">{col.description}</p>
              <p className="text-xs mt-3 flex items-center gap-1.5 opacity-75 uppercase tracking-wide">
                Explore <ArrowRight size={11} />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
