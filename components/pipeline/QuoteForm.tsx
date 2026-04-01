'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { Contact } from '@/types'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
}

interface QuoteFormProps {
  orgId: string
  contacts: Contact[]
  onClose?: () => void
  onSaved?: () => void
}

export default function QuoteForm({ orgId, contacts, onClose, onSaved }: QuoteFormProps) {
  const [title, setTitle] = useState('')
  const [contactId, setContactId] = useState('')
  const [aiDescription, setAiDescription] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', quantity: 1, unit_price: 0 }])
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [taxPct, setTaxPct] = useState(0)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')

  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0)
  const taxAmount = subtotal * (taxPct / 100)
  const total = subtotal + taxAmount

  function addLineItem() {
    setLineItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }])
  }

  function removeLineItem(i: number) {
    setLineItems(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateLineItem(i: number, field: keyof LineItem, value: string | number) {
    setLineItems(prev => prev.map((li, idx) => idx === i ? { ...li, [field]: value } : li))
  }

  async function generateLineItems() {
    if (!aiDescription.trim()) return
    setAiLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pipeline/generate-line-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiDescription }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to generate line items'); return }
      if (data.lineItems?.length) {
        setLineItems(data.lineItems.map((li: LineItem) => ({
          description: li.description,
          quantity: Number(li.quantity) || 1,
          unit_price: Number(li.unit_price) || 0,
        })))
      }
    } catch {
      setError('Failed to generate line items')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSave(status: 'draft' | 'sent') {
    if (!title.trim()) { setError('Title is required'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('quotes').insert({
      org_id: orgId,
      contact_id: contactId || null,
      title,
      description: aiDescription || null,
      status,
      line_items: lineItems,
      subtotal,
      tax: taxAmount,
      total,
      valid_until: validUntil || null,
      notes: notes || null,
    })
    if (err) { setError(err.message); setLoading(false); return }
    onSaved?.()
    onClose?.()
  }

  const inputStyle = { border: '1px solid #e8ebf4', backgroundColor: '#f8f9fc', color: '#1a1f2e' }
  const labelStyle = { color: '#454d66' }

  return (
    <div className="space-y-4">
      {/* Title + Client */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Quote Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. HVAC Full Replacement"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Client</label>
          <select value={contactId} onChange={e => setContactId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
            <option value="">— No client —</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* AI job description */}
      <div>
        <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Job Description</label>
        <div className="flex gap-2">
          <textarea value={aiDescription} onChange={e => setAiDescription(e.target.value)} rows={2}
            placeholder="Describe the job in plain English and click ✨ AI to generate line items…"
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none resize-none" style={inputStyle} />
          <button type="button" onClick={generateLineItems} disabled={aiLoading || !aiDescription.trim()}
            className="px-3 py-2 rounded-lg text-xs font-semibold text-white self-start flex-shrink-0 disabled:opacity-50"
            style={{ backgroundColor: '#7c3aed' }}>
            {aiLoading ? '…' : '✨ AI'}
          </button>
        </div>
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold" style={labelStyle}>Line Items</label>
          <button type="button" onClick={addLineItem} className="text-xs font-semibold" style={{ color: '#1e3a5f' }}>
            + Add Item
          </button>
        </div>
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #e8ebf4' }}>
          <div className="grid px-3 py-2 text-[10px] font-bold uppercase tracking-wider"
            style={{ gridTemplateColumns: '1fr 72px 100px 72px 24px', gap: '8px', backgroundColor: '#f8f9fc', color: '#8891aa', borderBottom: '1px solid #e8ebf4' }}>
            <span>Description</span><span>Qty</span><span>Unit Price</span><span className="text-right">Total</span><span />
          </div>
          {lineItems.map((li, i) => (
            <div key={i} className="grid items-center px-3 py-2"
              style={{ gridTemplateColumns: '1fr 72px 100px 72px 24px', gap: '8px', borderBottom: i < lineItems.length - 1 ? '1px solid #f2f4f9' : 'none' }}>
              <input value={li.description} onChange={e => updateLineItem(i, 'description', e.target.value)}
                placeholder="Service description" className="px-2 py-1.5 rounded text-xs outline-none" style={inputStyle} />
              <input type="number" min="0" step="1" value={li.quantity}
                onChange={e => updateLineItem(i, 'quantity', Number(e.target.value))}
                className="px-2 py-1.5 rounded text-xs outline-none w-full" style={inputStyle} />
              <input type="number" min="0" step="0.01" value={li.unit_price}
                onChange={e => updateLineItem(i, 'unit_price', Number(e.target.value))}
                className="px-2 py-1.5 rounded text-xs outline-none w-full" style={inputStyle} />
              <span className="text-xs font-semibold text-right" style={{ color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                {formatCurrency(li.quantity * li.unit_price)}
              </span>
              <button type="button" onClick={() => removeLineItem(i)}
                className="text-sm font-bold leading-none disabled:invisible"
                style={{ color: '#dc2626' }} disabled={lineItems.length <= 1}>
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notes + Valid until + Tax */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={inputStyle} />
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Valid Until</label>
            <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Tax (%)</label>
            <input type="number" min="0" max="100" step="0.1" value={taxPct}
              onChange={e => setTaxPct(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: '#f8f9fc', border: '1px solid #e8ebf4' }}>
        <div className="flex justify-between text-xs" style={{ color: '#8891aa' }}>
          <span>Subtotal</span>
          <span style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(subtotal)}</span>
        </div>
        {taxPct > 0 && (
          <div className="flex justify-between text-xs" style={{ color: '#8891aa' }}>
            <span>Tax ({taxPct}%)</span>
            <span style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: '1px solid #e8ebf4' }}>
          <span style={{ color: '#1a1f2e' }}>Total</span>
          <span style={{ color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(total)}</span>
        </div>
      </div>

      {error && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        {onClose && (
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: '#f8f9fc', color: '#454d66', border: '1px solid #e8ebf4' }}>
            Cancel
          </button>
        )}
        <button type="button" onClick={() => handleSave('draft')} disabled={loading}
          className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-60"
          style={{ backgroundColor: '#f8f9fc', color: '#1a1f2e', border: '1px solid #e8ebf4' }}>
          Save Draft
        </button>
        <button type="button" onClick={() => handleSave('sent')} disabled={loading}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: '#1e3a5f' }}>
          {loading ? 'Saving…' : 'Send to Client'}
        </button>
      </div>
    </div>
  )
}
