// apps/client/src/app/track/page.tsx
import type { Metadata } from 'next'
import TrackOrderClient from './TrackOrderClient'

export const metadata: Metadata = {
  title: 'Track Order — Fab Aroha',
  description: 'Track your Fab Aroha order status and delivery information.',
}

export default function TrackOrderPage() {
  return <TrackOrderClient />
}
