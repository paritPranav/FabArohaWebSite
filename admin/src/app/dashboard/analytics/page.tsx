'use client'
// apps/admin/src/app/dashboard/analytics/page.tsx
import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  Eye, ShoppingCart, Heart, ShoppingBag, Users, TrendingUp, TrendingDown,
  Minus, BarChart2, RefreshCw,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import clsx from 'clsx'
import api from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Overview {
  sessions: number; productViews: number; addToCart: number
  wishlists: number; purchases: number
  conversionRate: number; cartConversionRate: number; viewToCartRate: number
  trends: Record<string, number>
}
interface FunnelStep { stage: string; count: number; pct: number }
interface DailyPoint  { date: string; views: number; cart: number; wishlist: number; purchases: number; sessions: number }
interface ProductRow  { id: string; title: string; slug: string; image?: string; count?: number; views?: number; uniqueVisitors?: number; cartAdds?: number; purchases?: number; conversionRate?: number; revenue?: number }

const PERIODS = [
  { label: '7 days',  value: 7  },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
]

const FUNNEL_COLORS = ['#8FAF89', '#C8A97E', '#D4A5A5', '#9E7B65']

// ── Stat card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, trend, suffix = '' }: {
  label: string; value: number | string; icon: React.ElementType
  color: string; trend?: number; suffix?: string
}) {
  const trendPositive = (trend ?? 0) >= 0
  const trendZero     = trend === 0 || trend == null
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          <Icon size={18} />
        </div>
        {trend != null && (
          <span className={clsx('text-xs font-medium flex items-center gap-0.5 px-2 py-0.5 rounded-full',
            trendZero ? 'bg-cream-200 text-stone-400' :
            trendPositive ? 'bg-sage-50 text-sage-500' : 'bg-blush-50 text-blush-500'
          )}>
            {trendZero ? <Minus size={10} /> : trendPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="font-display text-2xl text-bark">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}{suffix}</p>
      <p className="text-xs text-stone-400 mt-1">{label}</p>
    </div>
  )
}

// ── Funnel bar ────────────────────────────────────────────────────────────────
function FunnelBar({ step, max, color, index }: { step: FunnelStep; max: number; color: string; index: number }) {
  const width = max > 0 ? Math.max(8, Math.round((step.count / max) * 100)) : 0
  return (
    <div className="flex items-center gap-4">
      <div className="w-28 text-right">
        <p className="text-xs font-medium text-bark">{step.stage}</p>
        <p className="text-xs text-stone-400">{step.count.toLocaleString('en-IN')}</p>
      </div>
      <div className="flex-1 bg-cream-200 rounded-full h-8 relative overflow-hidden">
        <div
          className="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700"
          style={{ width: `${width}%`, backgroundColor: color }}
        >
          {width > 15 && <span className="text-xs text-white font-medium">{step.pct}%</span>}
        </div>
      </div>
      {index > 0 && (
        <div className="w-14 text-right">
          <p className="text-xs text-stone-400">{step.pct}% of prev</p>
        </div>
      )}
    </div>
  )
}

// ── Tooltip formatter ─────────────────────────────────────────────────────────
const chartTooltipStyle = {
  borderRadius: '12px', border: '1px solid #E8DFD2',
  background: '#FAF7F2', fontSize: 12,
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period,  setPeriod]  = useState(30)
  const [data,    setData]    = useState<{ overview: Overview; funnel: FunnelStep[]; daily: DailyPoint[]; topProducts: { byViews: ProductRow[]; byCart: ProductRow[]; byPurchases: ProductRow[] } } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<'views' | 'cart' | 'purchases'>('views')

  const load = (p = period) => {
    setLoading(true)
    api.get(`/analytics/dashboard?period=${p}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(period) }, [period]) // eslint-disable-line react-hooks/exhaustive-deps

  const o = data?.overview

  const kpis = o ? [
    { label: 'Unique Sessions',   value: o.sessions,      icon: Users,        color: 'bg-sage-50 text-sage-500',    trend: o.trends.sessions },
    { label: 'Product Views',     value: o.productViews,  icon: Eye,          color: 'bg-sand-50 text-sand-400',    trend: o.trends.productViews },
    { label: 'Add to Cart',       value: o.addToCart,     icon: ShoppingCart, color: 'bg-blush-50 text-blush-400',  trend: o.trends.addToCart },
    { label: 'Wishlists',         value: o.wishlists,     icon: Heart,        color: 'bg-cream-200 text-stone-500', trend: o.trends.wishlists },
    { label: 'Purchases (items)', value: o.purchases,     icon: ShoppingBag,  color: 'bg-moss-50 text-moss-400',    trend: o.trends.purchases },
    { label: 'Conversion Rate',   value: o.conversionRate,icon: BarChart2,    color: 'bg-bark text-cream-100',      suffix: '%' },
  ] : []

  const topList: ProductRow[] = data
    ? tab === 'views'     ? data.topProducts.byViews
    : tab === 'cart'      ? data.topProducts.byCart
    : data.topProducts.byPurchases
    : []

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl text-bark">Analytics</h1>
          <p className="text-sm text-stone-400 mt-1">Views, funnels, conversions & trending products.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-cream-100 rounded-xl p-1 gap-1">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  period === p.value ? 'bg-bark text-cream-100 shadow-soft' : 'text-stone-400 hover:text-bark'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(period)}
            className="w-9 h-9 rounded-xl bg-cream-100 flex items-center justify-center text-stone-400 hover:text-bark hover:bg-cream-200 transition-all"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-5 h-28 skeleton" />
            ))
          : kpis.map(k => <KpiCard key={k.label} {...k} />)
        }
      </div>

      {/* ── Conversion rates row ── */}
      {!loading && o && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'View → Cart',         value: o.viewToCartRate,      desc: 'Of product viewers add to cart' },
            { label: 'Cart → Purchase',      value: o.cartConversionRate,  desc: 'Of cart adds convert to order' },
            { label: 'View → Purchase',      value: o.conversionRate,      desc: 'Overall conversion rate' },
          ].map(r => (
            <div key={r.label} className="card p-4 text-center">
              <p className="font-display text-3xl text-bark">{r.value}%</p>
              <p className="text-xs font-medium text-stone-500 mt-1">{r.label}</p>
              <p className="text-xs text-stone-400 mt-0.5">{r.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Funnel ── */}
      <div className="card mb-8">
        <h2 className="font-display text-xl text-bark mb-6">Conversion Funnel</h2>
        {loading ? (
          <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 skeleton rounded-full" />)}</div>
        ) : (
          <div className="space-y-4">
            {(data?.funnel ?? []).map((step, i) => (
              <FunnelBar
                key={step.stage}
                step={step}
                max={data!.funnel[0].count}
                color={FUNNEL_COLORS[i]}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Daily trend chart ── */}
      <div className="card mb-8">
        <h2 className="font-display text-xl text-bark mb-4">Daily Trends — Last {period} Days</h2>
        {loading ? (
          <div className="h-56 skeleton rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.daily ?? []} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DFD2" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#8C8378' }}
                tickFormatter={v => v.slice(5)} // show MM-DD
                interval={period <= 7 ? 0 : period <= 30 ? 4 : 8}
              />
              <YAxis tick={{ fontSize: 10, fill: '#8C8378' }} />
              <Tooltip contentStyle={chartTooltipStyle} labelFormatter={v => `Date: ${v}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="views"     name="Views"     stroke="#C8A97E" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cart"      name="Cart"      stroke="#D4A5A5" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="wishlist"  name="Wishlist"  stroke="#8FAF89" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="purchases" name="Purchases" stroke="#5C4A3A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Sessions bar ── */}
      <div className="card mb-8">
        <h2 className="font-display text-xl text-bark mb-4">Daily Sessions — Last {period} Days</h2>
        {loading ? (
          <div className="h-40 skeleton rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data?.daily ?? []} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DFD2" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8C8378' }} tickFormatter={v => v.slice(5)} interval={period <= 7 ? 0 : period <= 30 ? 4 : 8} />
              <YAxis tick={{ fontSize: 10, fill: '#8C8378' }} />
              <Tooltip contentStyle={chartTooltipStyle} labelFormatter={v => `Date: ${v}`} />
              <Bar dataKey="sessions" name="Sessions" fill="#8FAF89" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Top products ── */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h2 className="font-display text-xl text-bark">Top Products</h2>
          <div className="flex bg-cream-100 rounded-xl p-1 gap-1 text-xs">
            {([['views', 'By Views'], ['cart', 'By Cart'], ['purchases', 'By Purchases']] as const).map(([key, lbl]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={clsx('px-3 py-1.5 rounded-lg font-medium transition-all',
                  tab === key ? 'bg-bark text-cream-100 shadow-soft' : 'text-stone-400 hover:text-bark'
                )}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
        ) : topList.length === 0 ? (
          <p className="text-sm text-stone-400 py-8 text-center">No data yet for this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-cream-200">
                  <th className="pb-3 text-xs text-stone-400 font-medium w-6">#</th>
                  <th className="pb-3 text-xs text-stone-400 font-medium">Product</th>
                  {tab === 'views' && <>
                    <th className="pb-3 text-xs text-stone-400 font-medium text-right">Views</th>
                    <th className="pb-3 text-xs text-stone-400 font-medium text-right">Uniq.</th>
                    <th className="pb-3 text-xs text-stone-400 font-medium text-right">Cart</th>
                    <th className="pb-3 text-xs text-stone-400 font-medium text-right">Bought</th>
                    <th className="pb-3 text-xs text-stone-400 font-medium text-right">Conv.</th>
                  </>}
                  {tab === 'cart' && <>
                    <th className="pb-3 text-xs text-stone-400 font-medium text-right">Cart Adds</th>
                  </>}
                  {tab === 'purchases' && <>
                    <th className="pb-3 text-xs text-stone-400 font-medium text-right">Units Sold</th>
                    <th className="pb-3 text-xs text-stone-400 font-medium text-right">Revenue</th>
                  </>}
                </tr>
              </thead>
              <tbody>
                {topList.map((p, i) => (
                  <tr key={String(p.id)} className="border-b border-cream-100 last:border-0 hover:bg-cream-50 transition-colors">
                    <td className="py-3 text-xs text-stone-400">{i + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-cream-200">
                            <Image src={p.image} alt={p.title ?? ''} width={40} height={40} className="object-cover w-full h-full" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-cream-200 flex-shrink-0" />
                        )}
                        <p className="font-medium text-bark line-clamp-1 text-sm">{p.title ?? '—'}</p>
                      </div>
                    </td>
                    {tab === 'views' && <>
                      <td className="py-3 text-right text-bark font-medium">{(p.views ?? 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right text-stone-400">{(p.uniqueVisitors ?? 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right text-stone-400">{(p.cartAdds ?? 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right text-stone-400">{(p.purchases ?? 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right">
                        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full',
                          (p.conversionRate ?? 0) >= 5 ? 'bg-sage-50 text-sage-500' :
                          (p.conversionRate ?? 0) >= 2 ? 'bg-sand-50 text-sand-400' :
                          'bg-cream-200 text-stone-400'
                        )}>
                          {p.conversionRate ?? 0}%
                        </span>
                      </td>
                    </>}
                    {tab === 'cart' && (
                      <td className="py-3 text-right text-bark font-medium">{(p.count ?? 0).toLocaleString('en-IN')}</td>
                    )}
                    {tab === 'purchases' && <>
                      <td className="py-3 text-right text-bark font-medium">{(p.count ?? 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right text-sage-500 font-medium">₹{(p.revenue ?? 0).toLocaleString('en-IN')}</td>
                    </>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
