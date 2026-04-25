// apps/client/src/app/products/page.tsx
import { Suspense } from 'react'
import ProductsContent from './ProductsContent'

export const metadata = { title: 'All Products' }

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-stone-400">Loading products…</div>}>
      <ProductsContent />
    </Suspense>
  )
}
