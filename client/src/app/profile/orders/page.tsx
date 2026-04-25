'use client'
// apps/client/src/app/profile/orders/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package } from 'lucide-react'
import { useAuthStore } from '@/store'
import { orderAPI } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-sand-50 text-sand-500', confirmed: 'bg-sage-50 text-sage',
  shipped: 'bg-blue-50 text-blue-500', delivered: 'bg-sage-50 text-sage',
  cancelled: 'bg-blush-50 text-blush', processing: 'bg-cream-200 text-stone-500',
}

export default function OrdersPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return }
    orderAPI.myOrders().then(r => setOrders(r.data.orders || [])).catch(() => {}).finally(() => setLoading(false))
  }, [isAuthenticated])

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-14">
      <h1 className="font-display text-4xl text-bark mb-10">My Orders</h1>
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24">
          <Package size={48} className="text-cream-300 mx-auto mb-4" />
          <p className="font-display text-3xl text-bark mb-3">No orders yet</p>
          <Link href="/products" className="btn-primary">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Link key={order._id} href={`/profile/orders/${order._id}`}
              className="block bg-white rounded-3xl shadow-soft p-6 hover:shadow-card transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-stone-400 mb-1">#{order._id.slice(-10).toUpperCase()}</p>
                  <p className="font-medium text-bark">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-stone-400 mt-1">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className={`badge px-3 py-1 rounded-full text-xs capitalize ${STATUS_COLORS[order.orderStatus] || ''}`}>
                    {order.orderStatus}
                  </span>
                  <p className="font-medium text-bark">₹{order.totalAmount?.toLocaleString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
