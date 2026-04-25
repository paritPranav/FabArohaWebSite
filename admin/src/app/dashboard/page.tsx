'use client'
// apps/admin/src/app/dashboard/page.tsx
import { useEffect, useState } from 'react'
import { Users, ShoppingBag, IndianRupee, Package } from 'lucide-react'
import { orderAPI } from '@/lib/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function DashboardPage() {
  const [stats, setStats]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orderAPI.stats().then(r => setStats(r.data.stats)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const CARDS = [
    { label: 'Total Orders',   value: stats?.totalOrders   ?? '—', icon: ShoppingBag,  color: 'bg-sage-50   text-sage' },
    { label: 'Total Revenue',  value: stats?.totalRevenue ? `₹${(stats.totalRevenue/1000).toFixed(1)}k` : '—', icon: IndianRupee, color: 'bg-sand-50 text-sand' },
    { label: 'Total Users',    value: stats?.totalUsers    ?? '—', icon: Users,         color: 'bg-blush-50  text-blush' },
    { label: 'Active Products',value: stats?.totalProducts ?? '—', icon: Package,       color: 'bg-cream-200 text-stone-500' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl text-bark">Dashboard</h1>
        <p className="text-sm text-stone-400 mt-1">Welcome back — here's how FabAroha is doing.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-display text-bark">{loading ? '…' : value}</p>
            <p className="text-xs text-stone-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      {stats?.revenueByMonth?.length > 0 && (
        <div className="card mb-10">
          <h2 className="font-display text-xl text-bark mb-4">Revenue Overview</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.revenueByMonth}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8FAF89" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8FAF89" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DFD2" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#8C8378' }} />
              <YAxis tick={{ fontSize: 11, fill: '#8C8378' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E8DFD2', background: '#FAF7F2', fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#8FAF89" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent orders */}
      {stats?.recentOrders?.length > 0 && (
        <div className="card">
          <h2 className="font-display text-xl text-bark mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {stats.recentOrders.map((o: any) => (
              <div key={o._id} className="flex items-center justify-between py-2 border-b border-cream-200 last:border-0">
                <div>
                  <p className="text-sm font-medium text-bark">{o.user?.name || 'Customer'}</p>
                  <p className="text-xs text-stone-400">#{o._id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-bark">₹{o.totalAmount?.toLocaleString()}</p>
                  <p className="text-xs text-stone-400 capitalize">{o.orderStatus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
