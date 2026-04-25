// apps/admin/src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: { default: 'FabAroha Admin', template: '%s | FA Admin' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" toastOptions={{ style: { background: '#FAF7F2', color: '#3D2E22', border: '1px solid #E8DFD2', borderRadius: '12px' } }} />
      </body>
    </html>
  )
}
