'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Contact } from '@/types'

interface ClientFormProps {
  orgId: string
  clientLabel: string
  initial?: Partial<Contact>
  onClose: () => void
  onSaved: () => void
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #e8ebf4',
  backgroundColor: '#f8f9fc',
  color: '#1a1f2e',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
  width: '100%',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#8891aa',
  display: 'block',
  marginBottom: 6,
}

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#8891aa',
  gridColumn: '1 / -1',
  paddingTop: 4,
  borderTop: '1px solid #f2f4f9',
  marginTop: 4,
}

const US_STATES = [
  '', 'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC',
]

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function ClientForm({ orgId, clientLabel, initial, onClose, onSaved }: ClientFormProps) {
  const isEdit = Boolean(initial?.id)
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    company: initial?.company ?? '',
    type: initial?.type ?? 'residential',
    status: initial?.status ?? 'active',
    notes: initial?.notes ?? '',
    address_line1: initial?.address_line1 ?? '',
    address_line2: initial?.address_line2 ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? '',
    zip: initial?.zip ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required.'); return }
    if (form.email && !isValidEmail(form.email)) { setError('Please enter a valid email address.'); return }

    setLoading(true)
    setError('')
    const supabase = createClient()

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      company: form.company.trim() || null,
      type: form.type,
      status: form.status,
      notes: form.notes.trim() || null,
      address_line1: form.address_line1.trim() || null,
      address_line2: form.address_line2.trim() || null,
      city: form.city.trim() || null,
      state: form.state || null,
      zip: form.zip.trim() || null,
    }

    if (isEdit) {
      const { error: err } = await supabase
        .from('contacts')
        .update(payload)
        .eq('id', initial!.id!)
        .eq('org_id', orgId)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase
        .from('contacts')
        .insert({ ...payload, org_id: orgId })
      if (err) { setError(err.message); setLoading(false); return }
    }

    setLoading(false)
    onSaved()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 16,
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #f2f4f9',
          flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a1f2e' }}>
            {isEdit ? `Edit ${clientLabel}` : `New ${clientLabel}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#8891aa', lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              {/* Contact info */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Name *</label>
                <input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Full name"
                  style={inputStyle}
                  autoFocus
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="text"
                  inputMode="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="email@example.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="(555) 000-0000"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Company</label>
                <input
                  value={form.company}
                  onChange={e => set('company', e.target.value)}
                  placeholder="Company name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={form.type} onChange={e => set('type', e.target.value)} style={inputStyle}>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...inputStyle, maxWidth: 200 }}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="lead">Lead</option>
                </select>
              </div>

              {/* Address section */}
              <div style={sectionHeadingStyle}>Address</div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Address Line 1</label>
                <input
                  value={form.address_line1}
                  onChange={e => set('address_line1', e.target.value)}
                  placeholder="123 Main St"
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Address Line 2 <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                <input
                  value={form.address_line2}
                  onChange={e => set('address_line2', e.target.value)}
                  placeholder="Suite 100, Apt B…"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  placeholder="Hartford"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>State</label>
                  <select value={form.state} onChange={e => set('state', e.target.value)} style={inputStyle}>
                    {US_STATES.map(s => (
                      <option key={s} value={s}>{s || '—'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>ZIP</label>
                  <input
                    value={form.zip}
                    onChange={e => set('zip', e.target.value)}
                    placeholder="06101"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Notes */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  rows={3}
                  placeholder="Any additional notes…"
                  style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, fontSize: 12,
                backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            padding: '0 20px 20px',
            flexShrink: 0,
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                backgroundColor: '#f8f9fc', color: '#454d66', border: '1px solid #e8ebf4',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                backgroundColor: '#1e3a5f', color: 'white', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : `Add ${clientLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
