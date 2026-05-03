'use client'
// apps/admin/src/components/layout/Sidebar.tsx
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, Layers, ShoppingBag, Users, LogOut, Sparkles, Star, Ticket, BarChart2 } from 'lucide-react'
import { useAdminStore } from '@/lib/store'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const NAV = [
  { href: '/dashboard',             icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/analytics',   icon: BarChart2,       label: 'Analytics'  },
  { href: '/dashboard/products',    icon: Package,         label: 'Products' },
  { href: '/dashboard/collections', icon: Layers,          label: 'Collections' },
  { href: '/dashboard/orders',      icon: ShoppingBag,     label: 'Orders' },
  { href: '/dashboard/users',        icon: Users,           label: 'Users' },
  { href: '/dashboard/testimonials', icon: Star,            label: 'Testimonials' },
  { href: '/dashboard/coupons',      icon: Ticket,          label: 'Coupons' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const logout   = useAdminStore(s => s.logout)
  const handleLogout = () => { logout(); toast.success('Signed out'); router.push('/login') }

  return (
    <aside className="w-60 min-h-screen bg-bark flex flex-col py-6 px-4 fixed top-0 left-0">
      <div className="mb-8 px-2">
        <p className="font-display text-2xl text-cream-100">FabAroha</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Sparkles size={10} className="text-sand opacity-70" />
          <p className="text-xs text-sand opacity-70 italic">Admin Panel</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all', active ? 'bg-white/15 text-cream-100 font-medium' : 'text-cream-200 hover:bg-white/10 hover:text-cream-100')}>
              <Icon size={17} />{label}
            </Link>
          )
        })}
      </nav>
      <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-cream-200 hover:bg-white/10 hover:text-cream-100 transition-all mt-4">
        <LogOut size={17} /> Sign Out
      </button>
    </aside>
  )
}
