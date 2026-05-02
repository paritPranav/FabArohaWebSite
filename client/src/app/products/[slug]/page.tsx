// apps/client/src/app/products/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductDetailClient from './ProductDetailClient'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fabaroha.com'
const API_URL  = process.env.NEXT_PUBLIC_API_URL  ?? 'http://localhost:4000/api'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/products/${params.slug}`, { next: { revalidate: 60 } })
    if (!res.ok) return { title: 'Product Not Found | FabAroha' }
    const { product } = await res.json()

    const title       = `${product.title} | FabAroha`
    const description = (product.description ?? '').slice(0, 160)
    const image       = product.images?.[0] ?? `${SITE_URL}/og-image.jpg`
    const url         = `${SITE_URL}/products/${product.slug}`
    const price       = (product.discountedPrice ?? product.price) as number

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        siteName: 'FabAroha',
        type: 'website',
        images: [{ url: image, width: 1200, height: 630, alt: product.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
      other: {
        // Product-specific structured signals for crawlers
        'og:price:amount':   String(price),
        'og:price:currency': 'INR',
        'product:price:amount':   String(price),
        'product:price:currency': 'INR',
      },
    }
  } catch {
    return { title: 'Product | FabAroha' }
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  let product = null
  try {
    const res = await fetch(`${API_URL}/products/${params.slug}`, { next: { revalidate: 60 } })
    if (res.ok) { const data = await res.json(); product = data.product }
  } catch {}

  if (!product) notFound()

  const price    = product.discountedPrice ?? product.price
  const inStock  = product.sizes?.some((s: { stock: number }) => s.stock > 0) ?? true
  const url      = `${SITE_URL}/products/${product.slug}`

  // Schema.org Product — enables Google Shopping cards + Rich Results
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.title,
    description: product.description ?? '',
    image: product.images ?? [],
    url,
    sku: product.sku,
    brand: { '@type': 'Brand', name: 'FabAroha' },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: String(price),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'FabAroha' },
    },
    ...(product.numReviews > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(product.rating ?? 0),
        reviewCount: String(product.numReviews),
        bestRating: '5',
        worstRating: '1',
      },
    }),
    ...(product.reviews?.length > 0 && {
      review: product.reviews.slice(0, 5).map((r: { name: string; rating: number; comment: string; createdAt: string }) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.name },
        reviewRating: { '@type': 'Rating', ratingValue: String(r.rating), bestRating: '5' },
        reviewBody: r.comment,
        datePublished: r.createdAt,
      })),
    }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} />
    </>
  )
}
