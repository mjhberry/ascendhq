'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Job, Contact } from '@/types'

interface JobFormProps {
  orgId: string
  jobLabel: string
  contacts: Contact[]
  initial?: Partial<Job>
  onClose?: () => void
}

export default function JobForm({ orgId, jobLabel, contacts, initial, onClose }: JobFormProps) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? 'new',
    priority: initial?.priority ?? 'normal',
    contact_id: initial?.contact_id ?? '',
    value: initial?.value ?? 0,
    scheduled_at: initial?.scheduled_at ? initial.scheduled_at.slice(0, 16) : '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function set(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const payload = {
      ...form,
      value: Number(form.value),
      contact_id: form.contact_id || null,
      scheduled_at: form.scheduled_at || null,
    }

    if (initial?.id) {
      const { error } = await supabase.from('jobs').update(payload).eq('id', initial.id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.from('jobs').insert({ ...payload, org_id: orgId })
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
      <div>
        <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>{jobLabel} Title *</label>
        <input value={form.title} onChange={e => set('title', e.target.value)} required
          className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Client</label>
          <select value={form.contact_id} onChange={e => set('contact_id', e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
            <option value="">— No client —</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Value ($)</label>
          <input type="number" min="0" step="0.01" value={form.value} onChange={e => set('value', e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
            {['new', 'scheduled', 'in_progress', 'review', 'complete', 'cancelled'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Priority</label>
          <select value={form.priority} onChange={e => set('priority', e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
            {['low', 'normal', 'high', 'urgent'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Scheduled At</label>
          <input type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Description</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
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
          {loading ? 'Saving…' : initial?.id ? `Update ${jobLabel}` : `Create ${jobLabel}`}
        </button>
      </div>
    </form>
  )
}
