'use client'
// apps/admin/src/app/dashboard/users/page.tsx
import { useEffect, useState } from 'react'
import { userAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { X, MapPin, Heart, ShoppingBag, Phone, Mail, Calendar, User as UserIcon } from 'lucide-react'
import Image from 'next/image'

const STATUS_COLORS: Record<string, string> = {
  placed:     'bg-sand-50 text-sand-500',
  confirmed:  'bg-sage-50 text-sage',
  processing: 'bg-cream-200 text-stone-500',
  shipped:    'bg-blue-50 text-blue-500',
  delivered:  'bg-sage-50 text-sage',
  cancelled:  'bg-blush-50 text-blush',
}

export default function UsersPage() {
  const [users, setUsers]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [detail, setDetail]     = useState<any>(null)    // { user, orders }
  const [detailLoading, setDetailLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'info'|'orders'|'wishlist'|'addresses'>('info')

  const load = () => {
    setLoading(true)
    userAPI.list({ search: search || undefined })
      .then(r => setUsers(r.data.users || []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openDetail = async (u: any) => {
    setSelected(u)
    setDetail(null)
    setActiveTab('info')
    setDetailLoading(true)
    try {
      const res = await userAPI.get(u._id)
      setDetail(res.data)
    } catch { toast.error('Failed to load user details') }
    finally { setDetailLoading(false) }
  }

  const handleBlock = async (id: string, isBlocked: boolean) => {
    try {
      await userAPI.block(id, isBlocked)
      toast.success(isBlocked ? 'User blocked' : 'User unblocked')
      if (selected?._id === id) {
        setSelected((s: any) => ({ ...s, isBlocked }))
        setDetail((d: any) => d ? { ...d, user: { ...d.user, isBlocked } } : d)
      }
      load()
    } catch { toast.error('Failed') }
  }

  const closeModal = () => { setSelected(null); setDetail(null) }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-bark">Users</h1>
        <p className="text-sm text-stone-400 mt-0.5">{users.length} registered users</p>
      </div>

      <div className="flex gap-3 mb-5">
        <input
          placeholder="Search by name, phone or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          className="input max-w-sm py-2.5"
        />
        <button onClick={load} className="btn-primary px-5">Search</button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-cream-100 border-b border-cream-200">
            <tr>
              {['Name','Phone','Email','Joined','Status','Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100">
            {loading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-8 bg-cream-100 rounded animate-pulse"/></td></tr>
                ))
              : users.map(u => (
                  <tr
                    key={u._id}
                    className="hover:bg-cream-50 cursor-pointer transition-colors"
                    onClick={() => openDetail(u)}
                  >
                    <td className="px-4 py-3 font-medium text-bark">{u.name}</td>
                    <td className="px-4 py-3 text-stone-400">{u.phone}</td>
                    <td className="px-4 py-3 text-stone-400 text-xs">{u.email || '—'}</td>
                    <td className="px-4 py-3 text-stone-400 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('badge px-2 py-0.5 rounded-full text-xs', u.isBlocked ? 'bg-blush-50 text-blush' : 'bg-sage-50 text-sage')}>
                        {u.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleBlock(u._id, !u.isBlocked)}
                        className={clsx('text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                          u.isBlocked ? 'bg-sage-50 text-sage hover:bg-sage hover:text-white' : 'bg-blush-50 text-blush hover:bg-blush hover:text-white')}
                      >
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* ── User Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bark/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-cream-200 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-cream-200 flex items-center justify-center text-bark font-display text-2xl flex-shrink-0">
                  {selected.avatar
                    ? <Image src={selected.avatar} alt="" width={56} height={56} className="rounded-full object-cover w-14 h-14" />
                    : selected.name?.charAt(0).toUpperCase()
                  }
                </div>
                <div>
                  <h2 className="font-display text-2xl text-bark">{selected.name}</h2>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={clsx('badge px-2 py-0.5 rounded-full text-xs', selected.isBlocked ? 'bg-blush-50 text-blush' : 'bg-sage-50 text-sage')}>
                      {selected.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                    <span className="text-xs text-stone-400 font-mono">{selected._id.slice(-8).toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBlock(selected._id, !selected.isBlocked)}
                  className={clsx('text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                    selected.isBlocked ? 'bg-sage-50 text-sage hover:bg-sage hover:text-white' : 'bg-blush-50 text-blush hover:bg-blush hover:text-white')}
                >
                  {selected.isBlocked ? 'Unblock' : 'Block'}
                </button>
                <button onClick={closeModal} className="btn-ghost p-1.5 rounded-full ml-1">
                  <X size={18}/>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
              {([['info','Info'],['orders','Orders'],['wishlist','Wishlist'],['addresses','Addresses']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={clsx('px-4 py-2 rounded-full text-xs font-medium transition-all',
                    activeTab === key ? 'bg-bark text-cream' : 'text-stone-400 hover:text-bark')}
                >
                  {label}
                  {key === 'orders' && detail?.orders?.length ? ` (${detail.orders.length})` : ''}
                  {key === 'wishlist' && detail?.user?.wishlist?.length ? ` (${detail.user.wishlist.length})` : ''}
                  {key === 'addresses' && detail?.user?.addresses?.length ? ` (${detail.user.addresses.length})` : ''}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              {detailLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-cream-100 rounded-xl animate-pulse"/>)}
                </div>
              ) : !detail ? null : (

                <>
                  {/* ── Info tab ── */}
                  {activeTab === 'info' && (
                    <div className="space-y-3">
                      {[
                        { icon: UserIcon, label: 'Full Name',  value: detail.user.name },
                        { icon: Phone,    label: 'Phone',      value: detail.user.phone },
                        { icon: Mail,     label: 'Email',      value: detail.user.email || '—' },
                        { icon: Calendar, label: 'Joined',     value: new Date(detail.user.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) },
                        { icon: ShoppingBag, label: 'Total Orders', value: `${detail.orders.length} order${detail.orders.length !== 1 ? 's' : ''}` },
                        { icon: Heart,    label: 'Wishlist Items', value: `${detail.user.wishlist?.length || 0} item${detail.user.wishlist?.length !== 1 ? 's' : ''}` },
                        { icon: MapPin,   label: 'Saved Addresses', value: `${detail.user.addresses?.length || 0} address${detail.user.addresses?.length !== 1 ? 'es' : ''}` },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-4 bg-cream-50 rounded-2xl px-4 py-3">
                          <div className="w-8 h-8 rounded-xl bg-cream-200 flex items-center justify-center flex-shrink-0">
                            <Icon size={14} className="text-stone-400"/>
                          </div>
                          <div>
                            <p className="text-2xs text-stone-400 uppercase tracking-widest">{label}</p>
                            <p className="text-sm font-medium text-bark">{value}</p>
                          </div>
                        </div>
                      ))}

                      {/* Order value summary */}
                      {detail.orders.length > 0 && (
                        <div className="bg-sage-50 rounded-2xl px-4 py-3 flex items-center justify-between">
                          <p className="text-sm text-sage font-medium">Total Spent</p>
                          <p className="font-display text-xl text-sage">
                            ₹{detail.orders.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Orders tab ── */}
                  {activeTab === 'orders' && (
                    <div className="space-y-2">
                      {detail.orders.length === 0 ? (
                        <p className="text-stone-400 text-sm text-center py-8">No orders yet</p>
                      ) : detail.orders.map((o: any) => (
                        <div key={o._id} className="flex items-center justify-between bg-cream-50 rounded-2xl px-4 py-3">
                          <div>
                            <p className="text-xs font-mono text-stone-400">#{o._id.slice(-8).toUpperCase()}</p>
                            <p className="text-sm font-medium text-bark mt-0.5">₹{o.totalAmount?.toLocaleString()}</p>
                            <p className="text-2xs text-stone-400">{o.items?.length} item(s) · {new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={clsx('badge px-2 py-0.5 rounded-full text-xs capitalize', STATUS_COLORS[o.orderStatus] || 'bg-cream-100 text-stone-400')}>
                              {o.orderStatus}
                            </span>
                            <span className={clsx('badge px-2 py-0.5 rounded-full text-2xs capitalize',
                              o.paymentStatus === 'paid' ? 'bg-sage-50 text-sage' : 'bg-blush-50 text-blush')}>
                              {o.paymentStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Wishlist tab ── */}
                  {activeTab === 'wishlist' && (
                    <div>
                      {(!detail.user.wishlist || detail.user.wishlist.length === 0) ? (
                        <p className="text-stone-400 text-sm text-center py-8">Wishlist is empty</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {detail.user.wishlist.map((p: any) => (
                            <div key={p._id} className="flex items-center gap-3 bg-cream-50 rounded-2xl p-3">
                              {p.images?.[0] && (
                                <div className="w-12 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-cream-200">
                                  <Image src={p.images[0]} alt={p.title} width={48} height={56} className="object-cover w-full h-full"/>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-bark line-clamp-2">{p.title}</p>
                                <p className="text-2xs text-stone-400 mt-0.5">₹{p.price?.toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Addresses tab ── */}
                  {activeTab === 'addresses' && (
                    <div className="space-y-3">
                      {(!detail.user.addresses || detail.user.addresses.length === 0) ? (
                        <p className="text-stone-400 text-sm text-center py-8">No saved addresses</p>
                      ) : detail.user.addresses.map((a: any, i: number) => (
                        <div key={i} className="bg-cream-50 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-bark">{a.label || 'Home'}</span>
                            {a.isDefault && <span className="text-2xs bg-sage-50 text-sage px-2 py-0.5 rounded-full">Default</span>}
                          </div>
                          <p className="text-sm text-bark font-medium">{a.fullName}</p>
                          <p className="text-xs text-stone-400">{a.phone}</p>
                          <p className="text-xs text-stone-400 mt-0.5">
                            {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br/>
                            {a.city}, {a.state} — {a.pincode}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
