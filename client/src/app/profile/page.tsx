'use client'
// apps/client/src/app/profile/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package, Heart, LogOut, User, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store'
import { orderAPI } from '@/lib/api'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-sand-50 text-sand-500',
  confirmed: 'bg-sage-50 text-sage',
  processing: 'bg-cream-200 text-stone-500',
  shipped: 'bg-blue-50 text-blue-500',
  delivered: 'bg-sage-50 text-sage',
  cancelled: 'bg-blush-50 text-blush',
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return }
    orderAPI.myOrders().then(r => setOrders(r.data.orders || [])).catch(() => {}).finally(() => setLoading(false))
  }, [isAuthenticated])

  const handleLogout = () => { logout(); toast.success('Signed out'); router.push('/') }

  if (!isAuthenticated) return null

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-sage-50 border-2 border-sage flex items-center justify-center">
            <User size={28} className="text-sage" />
          </div>
          <div>
            <h1 className="font-display text-3xl text-bark">{user?.name}</h1>
            <p className="text-sm text-stone-400">{user?.phone}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-ghost flex items-center gap-2 text-blush hover:text-bark">
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {[
          { href: '/profile/orders', icon: Package, label: 'My Orders', sub: `${orders.length} orders` },
          { href: '/wishlist',       icon: Heart,   label: 'Wishlist',   sub: 'Saved items' },
        ].map(({ href, icon: Icon, label, sub }) => (
          <Link key={href} href={href}
            className="bg-white rounded-2xl shadow-soft p-5 flex items-center justify-between hover:shadow-card transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cream-100 flex items-center justify-center">
                <Icon size={18} className="text-sage" />
              </div>
              <div>
                <p className="font-medium text-sm text-bark">{label}</p>
                <p className="text-xs text-stone-400">{sub}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-stone-400" />
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <h2 className="font-display text-2xl text-bark mb-5">Recent Orders</h2>
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl shadow-soft">
          <Package size={40} className="text-cream-300 mx-auto mb-3" />
          <p className="font-display text-2xl text-bark mb-2">No orders yet</p>
          <p className="text-stone-400 text-sm mb-5">Your FabAroha pieces are waiting for you.</p>
          <Link href="/products" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.slice(0, 5).map((order: any) => (
            <Link key={order._id} href={`/profile/orders/${order._id}`}
              className="block bg-white rounded-2xl shadow-soft p-5 hover:shadow-card transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-400 mb-1">Order #{order._id.slice(-8).toUpperCase()}</p>
                  <p className="font-medium text-sm text-bark">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className={`badge px-3 py-1 rounded-full text-xs capitalize ${STATUS_COLORS[order.orderStatus] || 'bg-cream-200 text-stone-500'}`}>
                    {order.orderStatus}
                  </span>
                  <p className="font-medium text-sm text-bark">₹{order.totalAmount?.toLocaleString()}</p>
                </div>
              </div>
            </Link>
          ))}
          {orders.length > 5 && (
            <Link href="/profile/orders" className="block text-center text-sm text-stone-400 hover:text-bark py-2 transition-colors">
              View all {orders.length} orders →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
