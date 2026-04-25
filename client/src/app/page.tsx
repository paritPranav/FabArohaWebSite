// apps/client/src/app/page.tsx
import type { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import CollectionGrid from '@/components/home/CollectionGrid'
import TrendingProducts from '@/components/home/TrendingProducts'
import BrandStory from '@/components/home/BrandStory'
import TestimonialsCarousel from '@/components/home/TestimonialsCarousel'
import api from '@/lib/api'

export const metadata: Metadata = {
  title: 'FabAroha — Style, Comfort & Elegance',
  description: 'FabAroha — fashion crafted with love. Quality clothing for style, comfort, and everyday confidence.',
}

// Server component — fetch data on the server
async function getHomeData() {
  try {
    const [colRes, trendRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/collections`, { next: { revalidate: 60 } }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?trending=true&limit=8`, { next: { revalidate: 60 } }),
    ])

    const [collections, trending] = await Promise.all([
      colRes.ok ? colRes.json() : { collections: [] },
      trendRes.ok ? trendRes.json() : { products: [] },
    ])

    return {
      collections: collections.collections || [],
      trending:    trending.products || [],
    }
  } catch {
    return { collections: [], trending: [] }
  }
}

export default async function HomePage() {
  const { collections, trending } = await getHomeData()

  // Pick a random trending product for the hero spotlight
  const heroProduct = trending.length
    ? trending[Math.floor(Math.random() * Math.min(trending.length, 4))]
    : null

  return (
    <div className="overflow-x-hidden">
      <HeroSection featuredProduct={heroProduct} />
      <CollectionGrid collections={collections} />
      <TrendingProducts products={trending} />
      <BrandStory />
      <TestimonialsCarousel />
    </div>
  )
}
