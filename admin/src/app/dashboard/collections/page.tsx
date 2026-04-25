'use client'
// apps/admin/src/app/dashboard/collections/page.tsx
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, X, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { collectionAPI, productAPI, uploadAPI } from '@/lib/api'
import toast from 'react-hot-toast'

const EMPTY = { name: '', description: '', bannerImage: '', isActive: true, sortOrder: 0, products: [] as string[] }

export default function CollectionsPage() {
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState(false)
  const [editing, setEditing]         = useState<any>(null)
  const [form, setForm]               = useState<any>(EMPTY)
  const [saving, setSaving]           = useState(false)

  const [allProducts, setAllProducts]     = useState<any[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [uploading, setUploading]         = useState(false)

  const load = () => {
    setLoading(true)
    collectionAPI.listAll()
      .then(r => setCollections(r.data.collections || []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const fetchProducts = () => {
    productAPI.list({ limit: 200 })
      .then(r => setAllProducts(r.data.products || []))
      .catch(() => {})
  }

  const openAdd = () => {
    setEditing(null); setForm(EMPTY); setProductSearch('')
    fetchProducts(); setModal(true)
  }

  const openEdit = (c: any) => {
    setEditing(c)
    const productIds = (c.products || []).map((p: any) => (typeof p === 'object' ? p._id : p))
    setForm({ ...c, products: productIds })
    setProductSearch(''); fetchProducts(); setModal(true)
  }

  const toggleProduct = (id: string) => {
    setForm((f: any) => ({
      ...f,
      products: f.products.includes(id)
        ? f.products.filter((pid: string) => pid !== id)
        : [...f.products, id],
    }))
  }

  const filteredProducts = allProducts.filter(p =>
    p.title.toLowerCase().includes(productSearch.toLowerCase())
  )

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { data } = await uploadAPI.presign({ fileName: file.name, fileType: file.type, folder: 'collections' })
      await fetch(data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      setForm((f: any) => ({ ...f, bannerImage: data.publicUrl }))
      toast.success('Banner uploaded')
    } catch { toast.error('Upload failed') } finally { setUploading(false); e.target.value = '' }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) { await collectionAPI.update(editing._id, form) }
      else { await collectionAPI.create(form) }
      toast.success(editing ? 'Collection updated' : 'Collection created')
      setModal(false); load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error')
    } finally { setSaving(false) }
  }

  const handleDeactivate = async (c: any) => {
    if (!confirm(`Deactivate "${c.name}"? It will be hidden from the storefront.`)) return
    try { await collectionAPI.deactivate(c._id); toast.success('Collection deactivated'); load() }
    catch { toast.error('Failed to deactivate') }
  }

  const handleActivate = async (c: any) => {
    try { await collectionAPI.activate(c._id); toast.success('Collection activated'); load() }
    catch { toast.error('Failed to activate') }
  }

  const handleDelete = async (c: any) => {
    if (!confirm(`Permanently delete "${c.name}"? This cannot be undone.`)) return
    try { await collectionAPI.delete(c._id); toast.success('Collection deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  const active      = collections.filter(c => c.isActive)
  const deactivated = collections.filter(c => !c.isActive)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-bark">Collections</h1>
          <p className="text-sm text-stone-400 mt-0.5">{active.length} active · {deactivated.length} deactivated</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16}/> New Collection
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_,i) => <div key={i} className="skeleton h-36 rounded-2xl"/>)}
        </div>
      ) : (
        <>
          {/* ── Active ────────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-bark uppercase tracking-widest mb-4 flex items-center gap-2">
              <Eye size={14} className="text-sage"/> Active ({active.length})
            </h2>
            {active.length === 0 ? (
              <p className="text-sm text-stone-400">No active collections. Create one above.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map(c => (
                  <div key={c._id} className="card relative border-l-4 border-sage">
                    {c.bannerImage && (
                      <div className="h-20 -mx-5 -mt-5 mb-4 rounded-t-2xl overflow-hidden">
                        <img src={c.bannerImage} alt="" className="w-full h-full object-cover opacity-60"/>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display text-xl text-bark truncate">{c.name}</p>
                        <p className="text-xs text-stone-400 mt-1 line-clamp-2">{c.description}</p>
                        <p className="text-xs text-stone-500 mt-2 font-medium">{c.products?.length || 0} products</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(c)} title="Edit" className="btn-ghost p-1.5 rounded-lg">
                          <Pencil size={14}/>
                        </button>
                        <button onClick={() => handleDeactivate(c)} title="Deactivate" className="btn-ghost p-1.5 rounded-lg text-amber-500">
                          <EyeOff size={14}/>
                        </button>
                        <button onClick={() => handleDelete(c)} title="Delete permanently" className="btn-ghost p-1.5 rounded-lg text-blush">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Deactivated ───────────────────────────────── */}
          {deactivated.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <EyeOff size={14}/> Deactivated ({deactivated.length})
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deactivated.map(c => (
                  <div key={c._id} className="card relative opacity-60 border-l-4 border-stone-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display text-xl text-stone-500 truncate">{c.name}</p>
                        <p className="text-xs text-stone-400 mt-1 line-clamp-2">{c.description}</p>
                        <p className="text-xs text-stone-400 mt-2">{c.products?.length || 0} products</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => handleActivate(c)} title="Activate" className="btn-ghost p-1.5 rounded-lg text-sage">
                          <RefreshCw size={14}/>
                        </button>
                        <button onClick={() => handleDelete(c)} title="Delete permanently" className="btn-ghost p-1.5 rounded-lg text-blush">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Modal ────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bark/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-2xl text-bark mb-6">
              {editing ? 'Edit Collection' : 'New Collection'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input value={form.name} onChange={e => setForm((f:any)=>({...f,name:e.target.value}))} className="input"/>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={e => setForm((f:any)=>({...f,description:e.target.value}))} className="input resize-none" rows={3}/>
              </div>
              <div>
                <label className="label">Banner Image</label>
                {form.bannerImage ? (
                  <div className="relative mt-1 rounded-xl overflow-hidden h-32 bg-cream-100">
                    <img src={form.bannerImage} alt="banner preview" className="w-full h-full object-cover"/>
                    <button
                      type="button"
                      onClick={() => setForm((f: any) => ({ ...f, bannerImage: '' }))}
                      className="absolute top-2 right-2 bg-bark/70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-bark transition-colors"
                    >
                      <X size={12}/>
                    </button>
                  </div>
                ) : (
                  <label className={`mt-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone-200 rounded-xl h-32 cursor-pointer hover:border-sage hover:bg-sage/5 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleBannerUpload} disabled={uploading}/>
                    {uploading ? (
                      <p className="text-sm text-stone-400 animate-pulse">Uploading…</p>
                    ) : (
                      <>
                        <span className="text-2xl text-stone-300">⬆</span>
                        <p className="text-sm text-stone-400">Click to browse &amp; upload banner</p>
                        <p className="text-xs text-stone-300">JPG, PNG, WebP · Max 10 MB</p>
                      </>
                    )}
                  </label>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={e => setForm((f:any)=>({...f,sortOrder:Number(e.target.value)}))} className="input"/>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm((f:any)=>({...f,isActive:e.target.checked}))} className="accent-sage"/>
                    <span className="text-sm text-bark">Active</span>
                  </label>
                </div>
              </div>

              {/* Products picker */}
              <div>
                <label className="label">
                  Products <span className="text-stone-400 font-normal">({form.products.length} selected)</span>
                </label>
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-stone-100 bg-stone-50">
                    <Search size={13} className="text-stone-400 flex-shrink-0"/>
                    <input
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      placeholder="Search products…"
                      className="text-sm outline-none w-full bg-transparent text-bark placeholder:text-stone-400"
                    />
                    {productSearch && (
                      <button onClick={() => setProductSearch('')}><X size={13} className="text-stone-400"/></button>
                    )}
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-stone-50">
                    {allProducts.length === 0 ? (
                      <p className="text-xs text-stone-400 text-center py-6">Loading products…</p>
                    ) : filteredProducts.length === 0 ? (
                      <p className="text-xs text-stone-400 text-center py-6">No products match</p>
                    ) : filteredProducts.map(p => (
                      <label key={p._id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-cream/40 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.products.includes(p._id)}
                          onChange={() => toggleProduct(p._id)}
                          className="accent-sage flex-shrink-0"
                        />
                        {p.images?.[0] && (
                          <img src={p.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0"/>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm text-bark truncate">{p.title}</p>
                          <p className="text-xs text-stone-400">₹{p.discountedPrice || p.price}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary px-6">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
