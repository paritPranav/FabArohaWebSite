'use client'
// apps/admin/src/app/dashboard/layout.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { useAdminStore } from '@/lib/store'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router       = useRouter()
  const admin        = useAdminStore(s => s.admin)
  const hasHydrated  = useAdminStore(s => s._hasHydrated)

  useEffect(() => {
    if (hasHydrated && !admin) router.push('/login')
  }, [hasHydrated, admin])

  // Wait for localStorage to rehydrate before deciding — prevents flash-redirect on refresh
  if (!hasHydrated) return (
    <div className="flex min-h-screen items-center justify-center bg-parchment">
      <div className="w-8 h-8 rounded-full border-2 border-sage border-t-transparent animate-spin" />
    </div>
  )

  if (!admin) return null

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1 p-8 min-h-screen bg-parchment">{children}</main>
    </div>
  )
}
