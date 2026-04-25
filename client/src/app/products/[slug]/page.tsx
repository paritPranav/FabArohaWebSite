// apps/client/src/app/products/[slug]/page.tsx
import { notFound } from 'next/navigation'
import ProductDetailClient from './ProductDetailClient'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${params.slug}`)
    if (!res.ok) return { title: 'Product Not Found' }
    const { product } = await res.json()
    return { title: product.title, description: product.description?.slice(0, 160) }
  } catch {
    return { title: 'Product' }
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  let product = null
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${params.slug}`, { next: { revalidate: 60 } })
    if (res.ok) { const data = await res.json(); product = data.product }
  } catch {}

  if (!product) notFound()

  return <ProductDetailClient product={product} />
}
