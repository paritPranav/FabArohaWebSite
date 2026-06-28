'use client'
// apps/admin/src/app/dashboard/products/page.tsx
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, Copy, Ruler, Star, MessageSquare, X } from 'lucide-react'
import { productAPI, uploadAPI, reviewAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import Image from 'next/image'

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

const EMPTY = {
  title: '', description: '', price: '', discountedPrice: '',
  category: 'Women', sizes: [] as { label: string; stock: number }[],
  colors: [] as { name: string; hex: string }[],
  images: [] as string[], material: '', careInstructions: '',
  isFeatured: false, isTrending: false, isActive: true,
  sizeChart: '' as string,
  neckType: '', fitType: '', pattern: '', sleeveType: '', countryOfOrigin: 'India',
}

export default function ProductsPage() {
  const [products, setProducts]   = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState<any>(null)
  const [form, setForm]           = useState<any>(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadingChart, setUploadingChart] = useState(false)
  const [newColorName, setNewColorName] = useState('')
  const [newColorHex,  setNewColorHex]  = useState('#000000')

  // ── Review modal state ─────────────────────────────────────────────────────
  const [reviewModal, setReviewModal]         = useState(false)
  const [reviewProduct, setReviewProduct]     = useState<any>(null)
  const [reviewList,   setReviewList]         = useState<any[]>([])
  const [reviewLoading, setReviewLoading]     = useState(false)
  const [savingReview,  setSavingReview]      = useState(false)
  const [uploadingReviewImg, setUploadingReviewImg] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    name: '', rating: 5, comment: '', image: '', date: new Date().toISOString().slice(0, 10),
  })

  const load = () => {
    setLoading(true)
    productAPI.list({ limit: 200 })
      .then(r => setProducts(r.data.products || []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setNewColorName(''); setNewColorHex('#000000'); setModal(true) }
  const openEdit = (p: any) => {
    setEditing(p)
    setForm({ ...p, price: String(p.price), discountedPrice: String(p.discountedPrice || ''), sizeChart: p.sizeChart || '', colors: p.colors || [] })
    setNewColorName(''); setNewColorHex('#000000')
    setModal(true)
  }

  // ── Image upload ────────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of files) {
        const { data } = await uploadAPI.presign({ fileName: file.name, fileType: file.type, folder: 'products' })
        await fetch(data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
        urls.push(data.publicUrl)
      }
      setForm((f: any) => ({ ...f, images: [...f.images, ...urls] }))
      toast.success(`${urls.length} image(s) uploaded`)
    } catch { toast.error('Upload failed') } finally { setUploading(false); e.target.value = '' }
  }

  // ── Size chart upload ───────────────────────────────────────────────────────
  const handleChartUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingChart(true)
    try {
      const { data } = await uploadAPI.presign({ fileName: file.name, fileType: file.type, folder: 'size-charts' })
      await fetch(data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      setForm((f: any) => ({ ...f, sizeChart: data.publicUrl }))
      toast.success('Size chart uploaded')
    } catch { toast.error('Upload failed') } finally { setUploadingChart(false); e.target.value = '' }
  }

  // ── Size toggle / stock ─────────────────────────────────────────────────────
  const toggleSize = (label: string) => {
    setForm((f: any) => {
      const exists = f.sizes.find((s: any) => s.label === label)
      if (exists) return { ...f, sizes: f.sizes.filter((s: any) => s.label !== label) }
      return { ...f, sizes: [...f.sizes, { label, stock: 10 }] }
    })
  }
  const updateStock = (label: string, stock: number) => {
    setForm((f: any) => ({ ...f, sizes: f.sizes.map((s: any) => s.label === label ? { ...s, stock } : s) }))
  }

  const addColor = () => {
    if (!newColorName.trim()) return
    setForm((f: any) => ({ ...f, colors: [...(f.colors || []), { name: newColorName.trim(), hex: newColorHex }] }))
    setNewColorName('')
    setNewColorHex('#000000')
  }
  const removeColor = (i: number) => {
    setForm((f: any) => ({ ...f, colors: f.colors.filter((_: any, j: number) => j !== i) }))
  }

  // ── Review modal ───────────────────────────────────────────────────────────
  const openReviewModal = async (p: any) => {
    setReviewProduct(p)
    setReviewList([])
    setReviewForm({ name: '', rating: 5, comment: '', image: '', date: new Date().toISOString().slice(0, 10) })
    setReviewModal(true)
    setReviewLoading(true)
    try {
      const { data } = await reviewAPI.getProduct(p._id)
      setReviewList(data.product?.reviews || [])
    } catch { toast.error('Failed to load reviews') }
    finally { setReviewLoading(false) }
  }

  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingReviewImg(true)
    try {
      const { data } = await uploadAPI.presign({ fileName: file.name, fileType: file.type, folder: 'reviews' })
      await fetch(data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      setReviewForm(f => ({ ...f, image: data.publicUrl }))
      toast.success('Image uploaded')
    } catch { toast.error('Upload failed') }
    finally { setUploadingReviewImg(false); e.target.value = '' }
  }

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewForm.name.trim()) { toast.error('Name is required'); return }
    setSavingReview(true)
    try {
      const { data } = await reviewAPI.addAdmin(reviewProduct._id, {
        name:    reviewForm.name.trim(),
        rating:  reviewForm.rating,
        comment: reviewForm.comment.trim(),
        image:   reviewForm.image || undefined,
        date:    reviewForm.date,
      })
      setReviewList(l => [...l, data.review])
      setReviewForm({ name: '', rating: 5, comment: '', image: '', date: new Date().toISOString().slice(0, 10) })
      // Update product rating shown in table
      load()
      toast.success('Review added')
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error') }
    finally { setSavingReview(false) }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Delete this review?')) return
    try {
      await reviewAPI.deleteReview(reviewProduct._id, reviewId)
      setReviewList(l => l.filter(r => r._id !== reviewId))
      load()
      toast.success('Review deleted')
    } catch { toast.error('Error deleting review') }
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        discountedPrice: form.discountedPrice ? Number(form.discountedPrice) : undefined,
      }
      if (editing) { await productAPI.update(editing._id, payload) } else { await productAPI.create(payload) }
      toast.success(editing ? 'Product updated' : 'Product created')
      setModal(false); load()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this product?')) return
    await productAPI.delete(id); toast.success('Product deactivated'); load()
  }

  const handleDuplicate = (p: any) => {
    const { _id, __v, createdAt, updatedAt, slug, sku, totalStock, rating, ...rest } = p
    const copy = { ...rest, title: `Copy of ${p.title}`, isActive: false, price: String(p.price), discountedPrice: String(p.discountedPrice || ''), sizeChart: p.sizeChart || '' }
    setEditing(null); setForm(copy); setModal(true)
  }

  const filtered = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-bark">Products</h1>
          <p className="text-sm text-stone-400 mt-0.5">{products.length} products total</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Product</button>
      </div>

      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} className="input pl-10 py-2.5" />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 border-b border-cream-200">
              <tr>
                {['Image','Title','Category','Price','Stock','Sizes','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {loading ? [...Array(5)].map((_,i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-8 bg-cream-100 rounded animate-pulse" /></td></tr>
              )) : filtered.map(p => (
                <tr key={p._id} className="hover:bg-cream-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-10 h-12 rounded-lg overflow-hidden bg-cream-200 flex-shrink-0">
                      {p.images?.[0] && <Image src={p.images[0]} alt={p.title} width={40} height={48} className="object-cover w-full h-full" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-bark max-w-[180px] truncate">{p.title}</td>
                  <td className="px-4 py-3 text-stone-400">{p.category}</td>
                  <td className="px-4 py-3 text-bark text-xs">
                    {p.discountedPrice
                      ? <><span className="font-medium">₹{p.discountedPrice}</span> <span className="line-through text-stone-400">₹{p.price}</span></>
                      : `₹${p.price}`}
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">{p.totalStock}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-0.5">
                      {p.sizes?.filter((s: any) => s.stock > 0).map((s: any) => (
                        <span key={s.label} className="text-2xs bg-cream-100 text-stone-400 px-1.5 py-0.5 rounded">{s.label}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge px-2 py-0.5 rounded-full text-xs', p.isActive ? 'bg-sage-50 text-sage' : 'bg-blush-50 text-blush')}>
                      {p.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(p)} title="Edit" className="btn-ghost p-1.5 rounded-lg text-stone-400 hover:text-bark"><Pencil size={14} /></button>
                      <button onClick={() => handleDuplicate(p)} title="Duplicate" className="btn-ghost p-1.5 rounded-lg text-stone-400 hover:text-sage"><Copy size={14} /></button>
                      <button onClick={() => openReviewModal(p)} title="Manage Reviews" className="btn-ghost p-1.5 rounded-lg text-stone-400 hover:text-sand"><MessageSquare size={14} /></button>
                      <button onClick={() => handleDelete(p._id)} title="Deactivate" className="btn-ghost p-1.5 rounded-lg text-stone-400 hover:text-blush"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Product Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bark/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-8">
            <h2 className="font-display text-2xl text-bark mb-6">
              {editing ? 'Edit Product' : form.title?.startsWith('Copy of') ? 'Duplicate Product' : 'New Product'}
            </h2>

            <div className="space-y-5">
              {/* Title + Description */}
              <div><label className="label">Title</label><input value={form.title} onChange={e => setForm((f: any) => ({...f,title:e.target.value}))} className="input" /></div>
              <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm((f: any) => ({...f,description:e.target.value}))} className="input resize-none" rows={3} /></div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Price (₹)</label><input type="number" value={form.price} onChange={e => setForm((f: any) => ({...f,price:e.target.value}))} className="input" /></div>
                <div><label className="label">Sale Price (₹)</label><input type="number" value={form.discountedPrice} onChange={e => setForm((f: any) => ({...f,discountedPrice:e.target.value}))} className="input" placeholder="Optional" /></div>
              </div>

              {/* Category + Material */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select value={form.category} onChange={e => setForm((f: any) => ({...f,category:e.target.value}))} className="input">
                    {['Women','Men','Unisex','Kids','Accessories'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="label">Material</label><input value={form.material} onChange={e => setForm((f: any) => ({...f,material:e.target.value}))} className="input" placeholder="100% Cotton…" /></div>
              </div>

              {/* Care Instructions */}
              <div><label className="label">Care Instructions</label><input value={form.careInstructions || ''} onChange={e => setForm((f: any) => ({...f,careInstructions:e.target.value}))} className="input" placeholder="Machine wash cold, gentle cycle…" /></div>

              {/* ── Product Spec Attributes ── */}
              <div>
                <p className="label mb-3 text-stone-500 uppercase tracking-wider text-xs">Product Specifications</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Neck Type</label><input value={form.neckType || ''} onChange={e => setForm((f: any) => ({...f,neckType:e.target.value}))} className="input" placeholder="Round Neck, V-Neck, Collar…" /></div>
                  <div><label className="label">Fit Type</label><input value={form.fitType || ''} onChange={e => setForm((f: any) => ({...f,fitType:e.target.value}))} className="input" placeholder="Regular Fit, Slim Fit, Oversized…" /></div>
                  <div><label className="label">Pattern</label><input value={form.pattern || ''} onChange={e => setForm((f: any) => ({...f,pattern:e.target.value}))} className="input" placeholder="Solid, Printed, Striped, Floral…" /></div>
                  <div><label className="label">Sleeve Type</label><input value={form.sleeveType || ''} onChange={e => setForm((f: any) => ({...f,sleeveType:e.target.value}))} className="input" placeholder="Half Sleeve, Full Sleeve, Sleeveless…" /></div>
                  <div><label className="label">Country of Origin</label><input value={form.countryOfOrigin || 'India'} onChange={e => setForm((f: any) => ({...f,countryOfOrigin:e.target.value}))} className="input" placeholder="India" /></div>
                </div>

                {/* Colors */}
                <div className="mt-4">
                  <label className="label">Colors</label>
                  {/* Existing colors */}
                  {form.colors?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {form.colors.map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 bg-cream-50 border border-cream-200 rounded-xl px-3 py-1.5">
                          <span className="w-4 h-4 rounded-full border border-white shadow-sm flex-shrink-0" style={{ backgroundColor: c.hex }} />
                          <span className="text-sm text-bark">{c.name}</span>
                          <button type="button" onClick={() => removeColor(i)} className="text-stone-300 hover:text-blush ml-1 text-xs leading-none">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Add new color */}
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={e => setNewColorHex(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-cream-300 cursor-pointer p-0.5 flex-shrink-0"
                      title="Pick color"
                    />
                    <input
                      value={newColorName}
                      onChange={e => setNewColorName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor() } }}
                      className="input flex-1"
                      placeholder="Color name, e.g. Sage Green"
                    />
                    <button
                      type="button"
                      onClick={addColor}
                      className="btn-primary px-4 py-2 text-sm flex-shrink-0"
                    >Add</button>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                {[['isFeatured','Featured'],['isTrending','Trending'],['isActive','Active (visible)']].map(([k,l]) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[k]} onChange={e => setForm((f: any) => ({...f,[k]:e.target.checked}))} className="rounded" />
                    <span className="text-sm text-bark">{l}</span>
                  </label>
                ))}
              </div>

              {/* ── Available Sizes ── */}
              <div>
                <label className="label">Available Sizes & Stock</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-3">
                  {ALL_SIZES.map(label => {
                    const active = form.sizes?.find((s: any) => s.label === label)
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleSize(label)}
                        className={clsx(
                          'py-2 rounded-xl text-xs font-medium border transition-all',
                          active ? 'bg-bark text-cream border-bark' : 'border-cream-300 text-stone-400 hover:border-bark hover:text-bark'
                        )}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
                {form.sizes?.length > 0 && (
                  <div className="space-y-2">
                    {ALL_SIZES.filter(l => form.sizes.find((s: any) => s.label === l)).map((label: string) => {
                      const s = form.sizes.find((s: any) => s.label === label)
                      return (
                        <div key={label} className="flex items-center gap-3 bg-cream-50 rounded-xl px-4 py-2.5">
                          <span className="text-sm font-medium text-bark w-12">{label}</span>
                          <label className="text-xs text-stone-400 flex-shrink-0">Stock:</label>
                          <input
                            type="number"
                            min={0}
                            value={s?.stock ?? 0}
                            onChange={e => updateStock(label, Number(e.target.value))}
                            className="input py-1 text-sm w-24"
                          />
                          <button type="button" onClick={() => toggleSize(label)} className="ml-auto text-stone-400 hover:text-blush text-xs">Remove</button>
                        </div>
                      )
                    })}
                  </div>
                )}
                {form.sizes?.length === 0 && (
                  <p className="text-xs text-stone-400 italic">No sizes selected — click sizes above to add them</p>
                )}
              </div>

              {/* ── Size Chart ── */}
              <div>
                <label className="label flex items-center gap-1.5"><Ruler size={13}/> Size Chart Image</label>
                {form.sizeChart ? (
                  <div className="relative inline-block">
                    <Image src={form.sizeChart} alt="Size chart" width={240} height={160} className="rounded-2xl object-contain border border-cream-200 bg-cream-50 max-h-40" />
                    <button
                      type="button"
                      onClick={() => setForm((f: any) => ({...f, sizeChart: ''}))}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-blush text-white rounded-full text-xs flex items-center justify-center shadow"
                    >✕</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-cream-300 rounded-2xl py-6 cursor-pointer hover:border-bark transition-colors">
                    <Ruler size={20} className="text-stone-400 mb-2"/>
                    <span className="text-xs text-stone-400">{uploadingChart ? 'Uploading…' : 'Click to upload size chart'}</span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingChart} onChange={handleChartUpload} />
                  </label>
                )}
              </div>

              {/* ── Product Images ── */}
              <div>
                <label className="label">Product Images</label>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="input py-2" disabled={uploading} />
                {uploading && <p className="text-xs text-stone-400 mt-1 animate-pulse">Uploading…</p>}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {form.images?.map((url: string, i: number) => (
                    <div key={i} className="relative w-16 h-20 rounded-xl overflow-hidden bg-cream-200 group">
                      <Image src={url} alt="" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((f: any) => ({...f, images: f.images.filter((_: any, j: number) => j !== i)}))}
                        className="absolute inset-0 bg-bark/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary px-6">{saving ? 'Saving…' : 'Save Product'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reviews Modal ── */}
      {reviewModal && reviewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bark/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl text-bark">Reviews</h2>
                <p className="text-sm text-stone-400 mt-0.5 truncate max-w-xs">{reviewProduct.title}</p>
              </div>
              <button onClick={() => setReviewModal(false)} className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center text-stone-400 hover:bg-cream-200">
                <X size={16} />
              </button>
            </div>

            {/* Add Review Form */}
            <form onSubmit={handleAddReview} className="bg-cream-50 rounded-2xl p-5 mb-6 space-y-4">
              <p className="text-sm font-semibold text-bark">Add Review</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="label">Reviewer Name <span className="text-blush">*</span></label>
                  <input
                    required
                    value={reviewForm.name}
                    onChange={e => setReviewForm(f => ({ ...f, name: e.target.value }))}
                    className="input"
                    placeholder="Priya Sharma"
                  />
                </div>
                <div>
                  <label className="label">Review Date</label>
                  <input
                    type="date"
                    value={reviewForm.date}
                    onChange={e => setReviewForm(f => ({ ...f, date: e.target.value }))}
                    className="input"
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </div>
              </div>

              {/* Star rating */}
              <div>
                <label className="label">Rating <span className="text-blush">*</span></label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                      className="focus:outline-none"
                    >
                      <Star
                        size={28}
                        className={s <= reviewForm.rating ? 'text-sand fill-sand' : 'text-cream-300'}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-stone-400 self-center">{reviewForm.rating}/5</span>
                </div>
              </div>

              <div>
                <label className="label">Comment</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  className="input resize-none"
                  rows={3}
                  placeholder="Great quality, loved the fit…"
                />
              </div>

              {/* Optional image */}
              <div>
                <label className="label">Reviewer Image <span className="text-stone-400 font-normal">(optional)</span></label>
                {reviewForm.image ? (
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-cream-200">
                      <Image src={reviewForm.image} alt="" fill className="object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setReviewForm(f => ({ ...f, image: '' }))}
                      className="text-xs text-stone-400 hover:text-blush"
                    >Remove</button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-cream-300 flex items-center justify-center hover:border-bark transition-colors">
                      <span className="text-xl text-stone-300">+</span>
                    </div>
                    <span className="text-xs text-stone-400">{uploadingReviewImg ? 'Uploading…' : 'Upload photo'}</span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingReviewImg} onChange={handleReviewImageUpload} />
                  </label>
                )}
              </div>

              <button type="submit" disabled={savingReview} className="btn-primary px-6 py-2.5 text-sm">
                {savingReview ? 'Adding…' : 'Add Review'}
              </button>
            </form>

            {/* Existing reviews list */}
            <div>
              <p className="text-sm font-semibold text-bark mb-3">
                Existing Reviews ({reviewList.length})
              </p>
              {reviewLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-cream-100 rounded-xl animate-pulse" />)}
                </div>
              ) : reviewList.length === 0 ? (
                <p className="text-sm text-stone-400 italic py-6 text-center">No reviews yet</p>
              ) : (
                <div className="space-y-3">
                  {reviewList.map((r: any) => (
                    <div key={r._id} className="flex items-start gap-3 bg-cream-50 rounded-2xl p-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-cream-200 flex-shrink-0 flex items-center justify-center text-stone-300 font-medium text-sm">
                        {r.image
                          ? <Image src={r.image} alt="" width={40} height={40} className="object-cover w-full h-full" />
                          : r.name.charAt(0).toUpperCase()
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-bark">{r.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="flex">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} size={11} className={s <= r.rating ? 'text-sand fill-sand' : 'text-cream-300'} />
                                ))}
                              </div>
                              <span className="text-2xs text-stone-400">
                                {new Date(r.reviewDate || r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              {r.isAdminReview && (
                                <span className="text-2xs bg-bark/10 text-bark px-1.5 py-0.5 rounded">admin</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteReview(r._id)}
                            className="p-1.5 rounded-lg text-stone-300 hover:text-blush hover:bg-blush-50 transition-colors flex-shrink-0"
                            title="Delete review"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        {r.comment && <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">{r.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
