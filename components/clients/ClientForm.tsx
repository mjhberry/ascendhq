'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Contact } from '@/types'

interface ClientFormProps {
  orgId: string
  clientLabel: string
  initial?: Partial<Contact>
  onClose?: () => void
}

export default function ClientForm({ orgId, clientLabel, initial, onClose }: ClientFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    company: initial?.company ?? '',
    type: initial?.type ?? 'residential',
    status: initial?.status ?? 'active',
    notes: initial?.notes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()

    if (initial?.id) {
      const { error } = await supabase.from('contacts').update(form).eq('id', initial.id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.from('contacts').insert({ ...form, org_id: orgId })
      if (error) { setError(error.message); setLoading(false); return }
    }

    router.refresh()
    onClose?.()
    setLoading(false)
  }

  const inputStyle = { border: '1px solid #e8ebf4', backgroundColor: '#f8f9fc', color: '#1a1f2e' }
  const labelStyle = { color: '#454d66' }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} required
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Company</label>
          <input value={form.company} onChange={e => set('company', e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Phone</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Type</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="lead">Lead</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Notes</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={inputStyle} />
      </div>
      {error && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-1">
        {onClose && (
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: '#f8f9fc', color: '#454d66', border: '1px solid #e8ebf4' }}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: '#1e3a5f' }}>
          {loading ? 'Saving…' : initial?.id ? `Update ${clientLabel}` : `Add ${clientLabel}`}
        </button>
      </div>
    </form>
  )
}
