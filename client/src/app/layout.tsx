// apps/client/src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fabaroha.com'),
  title: {
    default: 'FabAroha — Style, Comfort & Elegance',
    template: '%s | FabAroha',
  },
  description:
    'FabAroha is where comfort meets elegance. We design clothing for real life — quality pieces built for style, confidence, and everyday living.',
  keywords: ['FabAroha', 'fashion', 'clothing India', 'style', 'comfort', 'elegance', 'lifestyle fashion', 'quality clothing'],
  openGraph: {
    type: 'website',
    siteName: 'FabAroha',
    images: ['/og-image.jpg'],
  },
}

export const viewport: Viewport = {
  themeColor: '#FAF7F2',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-parchment">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster
          position="bottom-center"
          toastOptions={{
            className: 'font-body text-sm',
            style: {
              background: '#FAF7F2',
              color: '#3D2E22',
              border: '1px solid #E8DFD2',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 4px 32px rgba(92,74,58,0.12)',
            },
            success: { iconTheme: { primary: '#8FAF89', secondary: '#FAF7F2' } },
            error:   { iconTheme: { primary: '#D4A5A5', secondary: '#FAF7F2' } },
          }}
        />
      </body>
    </html>
  )
}
