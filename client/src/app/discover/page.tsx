// apps/client/src/app/discover/page.tsx
import type { Metadata } from 'next'
import DiscoverClient from './DiscoverClient'

export const metadata: Metadata = {
  title: 'Discover — FabAroha',
  description: 'Swipe through styles you love. Swipe right to wishlist, left to skip. Find your next favourite on FabAroha.',
}

export default function DiscoverPage() {
  return <DiscoverClient />
}
