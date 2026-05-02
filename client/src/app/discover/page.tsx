// apps/client/src/app/discover/page.tsx
import type { Metadata } from 'next'
import DiscoverClient from './DiscoverClient'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fabaroha.com'
const API_URL  = process.env.NEXT_PUBLIC_API_URL  ?? 'http://localhost:4000/api'

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Discover New Arrivals & Trending Styles | FabAroha',
  description:
    'Swipe through the latest fashion at FabAroha. Discover new arrivals, trending clothing and handpicked styles for women, men and kids. Swipe right to wishlist your favourites.',
  alternates: { canonical: `${SITE_URL}/discover` },
  keywords: [
    'discover fashion India',
    'new arrivals clothing online',
    'trending fashion FabAroha',
    'swipe fashion app',
    'latest styles women men',
    'buy new clothes online India',
    'FabAroha new arrivals',
    'earthwear trending',
  ],
  openGraph: {
    title: 'Discover What\'s New at FabAroha',
    description:
      'Swipe through the latest styles. Swipe right to wishlist, left to skip. New arrivals and trending fashion — discover it all at FabAroha.',
    url:      `${SITE_URL}/discover`,
    siteName: 'FabAroha',
    type:     'website',
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'Discover new fashion at FabAroha' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Discover What\'s New at FabAroha',
    description: 'Swipe through the latest trends — wishlist your favourites instantly.',
    images:      [`${SITE_URL}/og-image.jpg`],
  },
}

// ── Server-side data fetch ────────────────────────────────────────────────────
async function getDiscoverData() {
  try {
    const [productsRes, colRes] = await Promise.all([
      fetch(`${API_URL}/products?sort=-createdAt&limit=100`, { next: { revalidate: 300 } }),
      fetch(`${API_URL}/collections`,                        { next: { revalidate: 300 } }),
    ])
    const [pd, cd] = await Promise.all([
      productsRes.ok ? productsRes.json() : { products: [] },
      colRes.ok      ? colRes.json()      : { collections: [] },
    ])
    return {
      products:    pd.products    ?? [],
      collections: cd.collections ?? [],
    }
  } catch {
    return { products: [], collections: [] }
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function DiscoverPage() {
  const { products, collections } = await getDiscoverData()

  // ── Schema.org JSON-LD ────────────────────────────────────────────────────
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type':    'ItemList',
    name:        'Discover — New Arrivals & Trending Fashion at FabAroha',
    description: 'Browse the latest new arrivals and trending clothing from FabAroha Earthwear.',
    url:         `${SITE_URL}/discover`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 50).map((p: Record<string, unknown>, i: number) => ({
      '@type':    'ListItem',
      position:   i + 1,
      item: {
        '@type': 'Product',
        name:    p.title,
        url:     `${SITE_URL}/products/${p.slug}`,
        image:   (p.images as string[])?.[0] ?? '',
        sku:     p.sku,
        brand:   { '@type': 'Brand', name: 'FabAroha' },
        offers: {
          '@type':        'Offer',
          priceCurrency:  'INR',
          price:          String((p.discountedPrice as number) ?? (p.price as number)),
          availability:   ((p.totalStock as number) ?? 1) > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
      },
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',     item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Discover', item: `${SITE_URL}/discover` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <DiscoverClient initialProducts={products} collections={collections} />
    </>
  )
}
