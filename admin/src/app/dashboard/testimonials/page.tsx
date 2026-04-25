'use client'
// apps/admin/src/app/dashboard/testimonials/page.tsx
import { useEffect, useState } from 'react'
import { testimonialAPI, uploadAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { Plus, Pencil, Trash2, Star, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

const EMPTY = { name: '', description: '', rating: 5, image: '', isActive: true, sortOrder: 0 }

export default function TestimonialsPage() {
  const [items, setItems]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState<any>(null)
  const [form, setForm]         = useState<any>(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = () => {
    setLoading(true)
    testimonialAPI.listAll()
      .then(r => setItems(r.data.testimonials || []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (t: any) => { setEditing(t); setForm({ ...t }); setModal(true) }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { data } = await uploadAPI.presign({ fileName: file.name, fileType: file.type, folder: 'testimonials' })
      await fetch(data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      setForm((f: any) => ({ ...f, image: data.publicUrl }))
      toast.success('Photo uploaded')
    } catch { toast.error('Upload failed') } finally { setUploading(false); e.target.value = '' }
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim()) { toast.error('Name and description are required'); return }
    setSaving(true)
    try {
      if (editing) { await testimonialAPI.update(editing._id, form) }
      else { await testimonialAPI.create(form) }
      toast.success(editing ? 'Testimonial updated' : 'Testimonial added')
      setModal(false); load()
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return
    await testimonialAPI.delete(id); toast.success('Deleted'); load()
  }

  const toggleActive = async (t: any) => {
    await testimonialAPI.update(t._id, { isActive: !t.isActive })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-bark">Testimonials</h1>
          <p className="text-sm text-stone-400 mt-0.5">Customer reviews shown on the home page carousel</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16}/> Add Review</button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 bg-cream-100 rounded-2xl animate-pulse"/>)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <Star size={40} className="mx-auto mb-3 opacity-30"/>
          <p>No testimonials yet. Add your first customer review.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(t => (
            <div key={t._id} className={clsx('card p-5 relative transition-opacity', !t.isActive && 'opacity-50')}>
              <div className="flex items-start gap-3 mb-3">
                {t.image ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-cream-200">
                    <Image src={t.image} alt={t.name} width={48} height={48} className="object-cover w-full h-full"/>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-cream-200 flex items-center justify-center flex-shrink-0 font-display text-bark text-lg">
                    {t.name?.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-bark truncate">{t.name}</p>
                  <div className="flex mt-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= t.rating ? 'text-sand-400 fill-sand-400' : 'text-cream-300'}/>
                    ))}
                  </div>
                </div>
                {!t.isActive && <span className="text-2xs bg-blush-50 text-blush px-2 py-0.5 rounded-full flex-shrink-0">Hidden</span>}
              </div>
              <p className="text-sm text-stone-400 leading-relaxed line-clamp-3">{t.description}</p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-cream-100">
                <button onClick={() => openEdit(t)} className="btn-ghost p-1.5 rounded-lg text-stone-400 hover:text-bark" title="Edit"><Pencil size={14}/></button>
                <button onClick={() => toggleActive(t)} className={clsx('text-xs px-3 py-1 rounded-lg font-medium transition-colors', t.isActive ? 'bg-blush-50 text-blush hover:bg-blush hover:text-white' : 'bg-sage-50 text-sage hover:bg-sage hover:text-white')}>
                  {t.isActive ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => handleDelete(t._id)} className="ml-auto btn-ghost p-1.5 rounded-lg text-stone-400 hover:text-blush" title="Delete"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bark/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl text-bark">{editing ? 'Edit Review' : 'Add Review'}</h2>
              <button onClick={() => setModal(false)} className="btn-ghost p-1.5 rounded-full"><X size={18}/></button>
            </div>

            <div className="space-y-4">
              {/* Photo */}
              <div>
                <label className="label">Customer Photo</label>
                {form.image ? (
                  <div className="flex items-center gap-3">
                    <Image src={form.image} alt="" width={56} height={56} className="w-14 h-14 rounded-full object-cover border border-cream-200"/>
                    <button type="button" onClick={() => setForm((f: any) => ({...f, image: ''}))} className="text-xs text-blush hover:underline">Remove</button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 border-2 border-dashed border-cream-300 rounded-2xl p-4 cursor-pointer hover:border-bark transition-colors">
                    <ImageIcon size={20} className="text-stone-400"/>
                    <span className="text-sm text-stone-400">{uploading ? 'Uploading…' : 'Upload customer photo (optional)'}</span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleImageUpload}/>
                  </label>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="label">Customer Name</label>
                <input value={form.name} onChange={e => setForm((f: any) => ({...f, name: e.target.value}))} className="input" placeholder="Priya Sharma"/>
              </div>

              {/* Rating */}
              <div>
                <label className="label">Rating</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setForm((f: any) => ({...f, rating: s}))}>
                      <Star size={24} className={s <= form.rating ? 'text-sand-400 fill-sand-400' : 'text-cream-300 hover:text-sand-200'}/>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label">Review Text</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm((f: any) => ({...f, description: e.target.value}))}
                  className="input resize-none"
                  rows={4}
                  placeholder="What did they say about FabAroha?"
                />
              </div>

              {/* Sort Order + Active */}
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <label className="label">Display Order</label>
                  <input type="number" min={0} value={form.sortOrder} onChange={e => setForm((f: any) => ({...f, sortOrder: Number(e.target.value)}))} className="input"/>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-5">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm((f: any) => ({...f, isActive: e.target.checked}))} className="rounded"/>
                  <span className="text-sm text-bark">Visible</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary px-6">{saving ? 'Saving…' : 'Save Review'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
