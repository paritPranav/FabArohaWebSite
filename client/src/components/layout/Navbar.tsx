'use client'
// apps/client/src/components/layout/Navbar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ShoppingBag, Heart, User, Search, Menu, X } from 'lucide-react'
import { useCartStore, useAuthStore } from '@/store'
import clsx from 'clsx'

const NAV_LINKS = [
  { label: 'Collections', href: '/collections' },
  { label: 'Women',       href: '/products?category=Women' },
  { label: 'Men',         href: '/products?category=Men' },
  { label: 'Discover',    href: '/discover' },
  { label: 'Sale',        href: '/products?tag=sale' },
]

export default function Navbar() {
  const pathname  = usePathname()
  const itemCount = useCartStore((s) => s.itemCount())
  const { isAuthenticated } = useAuthStore()
  const [scrolled, setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted]     = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  return (
    <>
      <header
        className={clsx(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-parchment/95 backdrop-blur-md shadow-soft border-b border-cream-300'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <Link href="/" className="group flex flex-col leading-none hover:opacity-80 transition-opacity">
            <span className="font-display text-2xl md:text-3xl text-bark tracking-tight">FabAroha</span>
            <span className="hidden md:block text-stone-400 italic tracking-wide" style={{ fontSize: '0.58rem' }}>
              style · comfort · elegance
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'font-body text-sm tracking-wide transition-colors',
                  pathname === l.href
                    ? 'text-bark font-medium'
                    : 'text-stone-400 hover:text-bark'
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            <Link href="/search" className="btn-ghost p-2 rounded-full" aria-label="Search">
              <Search size={18} />
            </Link>
            <Link href="/wishlist" className="btn-ghost p-2 rounded-full" aria-label="Wishlist">
              <Heart size={18} />
            </Link>
            <Link href="/cart" className="btn-ghost p-2 rounded-full relative" aria-label="Cart">
              <ShoppingBag size={18} />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-sage text-white text-2xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
            {mounted && isAuthenticated ? (
              <Link href="/profile" className="btn-ghost p-2 rounded-full" aria-label="Profile">
                <User size={18} />
              </Link>
            ) : (
              <Link href="/login" className="btn-primary ml-2 hidden md:flex text-xs px-4 py-2">
                Sign In
              </Link>
            )}
            <button
              className="md:hidden btn-ghost p-2 rounded-full ml-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={clsx('fixed inset-0 z-40 md:hidden transition-all duration-300', mobileOpen ? 'visible' : 'invisible')}>
        <div
          className={clsx('absolute inset-0 bg-bark/20 backdrop-blur-sm transition-opacity duration-300', mobileOpen ? 'opacity-100' : 'opacity-0')}
          onClick={() => setMobileOpen(false)}
        />
        <nav className={clsx(
          'absolute top-0 right-0 h-full w-72 bg-parchment shadow-hover px-6 pt-20 pb-8 flex flex-col gap-4 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}>
          <div className="pb-4 border-b border-cream-300 mb-2">
            <p className="font-display text-2xl text-bark">FabAroha</p>
            <p className="text-xs text-stone-400 italic mt-0.5">
              style · comfort · elegance
            </p>
          </div>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="font-display text-2xl text-bark hover:text-clay transition-colors">
              {l.label}
            </Link>
          ))}
          <div className="h-px bg-cream-300 my-2" />
          {mounted && isAuthenticated ? (
            <>
              <Link href="/profile" className="font-body text-sm text-stone-400 hover:text-bark">Profile</Link>
              <Link href="/profile/orders" className="font-body text-sm text-stone-400 hover:text-bark">My Orders</Link>
            </>
          ) : (
            <Link href="/login" className="btn-primary text-center">Sign In</Link>
          )}
        </nav>
      </div>

      <div className="h-16 md:h-20" />
    </>
  )
}
