// apps/client/src/app/collections/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import ProductCard from '@/components/ui/ProductCard'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collections/${params.slug}`, { cache: 'no-store' })
    if (!res.ok) return { title: 'Collection' }
    const { collection } = await res.json()
    return { title: collection.name, description: collection.description }
  } catch { return { title: 'Collection' } }
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  let collection = null
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/collections/${params.slug}`, { cache: 'no-store' })
    if (res.ok) { const d = await res.json(); collection = d.collection }
  } catch {}
  if (!collection) notFound()

  return (
    <div>
      {/* Banner */}
      {collection.bannerImage && (
        <div className="relative w-full aspect-[16/6] bg-cream-200">
          <Image src={collection.bannerImage} alt={collection.name} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-bark/50 to-transparent" />
          <div className="absolute bottom-10 left-0 right-0 text-center text-white px-4">
            <h1 className="font-display text-5xl md:text-6xl">{collection.name}</h1>
            {collection.description && <p className="text-white/70 mt-3 text-sm max-w-xl mx-auto">{collection.description}</p>}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-14">
        {!collection.bannerImage && (
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl text-bark">{collection.name}</h1>
            {collection.description && <p className="text-stone-400 text-sm mt-3">{collection.description}</p>}
          </div>
        )}

        {collection.products?.length === 0 ? (
          <p className="text-center text-stone-400 py-20">No products in this collection yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {collection.products.map((p: any) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
