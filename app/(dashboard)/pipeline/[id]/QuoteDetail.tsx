'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Quote, QuoteLineItem } from '@/types'

type QuoteWithContact = Quote & { contacts: { id: string; name: string; email: string | null } | null }

interface QuoteDetailProps {
  quote: QuoteWithContact
  orgId: string
}

const inputStyle = { border: '1px solid #e8ebf4', backgroundColor: '#f8f9fc', color: '#1a1f2e' }
const labelStyle = { color: '#454d66' }

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  draft:     { bg: '#f2f4f9', color: '#8891aa' },
  sent:      { bg: '#dbeafe', color: '#1d4ed8' },
  accepted:  { bg: '#dcfce7', color: '#16a34a' },
  declined:  { bg: '#fef2f2', color: '#dc2626' },
  converted: { bg: '#f3e8ff', color: '#7c3aed' },
}

function initLineItems(items: QuoteLineItem[]): QuoteLineItem[] {
  return Array.isArray(items) && items.length > 0
    ? items
    : [{ description: '', quantity: 1, unit_price: 0 }]
}

export default function QuoteDetail({ quote: initialQuote, orgId }: QuoteDetailProps) {
  const router = useRouter()
  const [quote, setQuote] = useState<QuoteWithContact>(initialQuote)
  const [editMode, setEditMode] = useState(false)

  // Edit form state
  const [title, setTitle] = useState(quote.title)
  const [description, setDescription] = useState(quote.description ?? '')
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>(() => initLineItems(quote.line_items))
  const [notes, setNotes] = useState(quote.notes ?? '')
  const [validUntil, setValidUntil] = useState(quote.valid_until ? quote.valid_until.slice(0, 10) : '')
  const [taxPct, setTaxPct] = useState(
    quote.subtotal > 0 ? Math.round((quote.tax / quote.subtotal) * 1000) / 10 : 0
  )

  const [saving, setSaving] = useState(false)
  const [actioning, setActioning] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Send-to-client form state
  const [showSendForm, setShowSendForm] = useState(false)
  const [sendClientName, setSendClientName] = useState(quote.client_name ?? quote.contacts?.name ?? '')
  const [sendClientEmail, setSendClientEmail] = useState(quote.client_email ?? quote.contacts?.email ?? '')
  const [sending, setSending] = useState(false)

  // Live totals for edit mode
  const editSubtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0)
  const editTaxAmount = editSubtotal * (taxPct / 100)
  const editTotal = editSubtotal + editTaxAmount

  function openEdit() {
    setTitle(quote.title)
    setDescription(quote.description ?? '')
    setLineItems(initLineItems(quote.line_items))
    setNotes(quote.notes ?? '')
    setValidUntil(quote.valid_until ? quote.valid_until.slice(0, 10) : '')
    setTaxPct(quote.subtotal > 0 ? Math.round((quote.tax / quote.subtotal) * 1000) / 10 : 0)
    setError('')
    setEditMode(true)
  }

  function cancelEdit() {
    setEditMode(false)
    setError('')
  }

  function updateLineItem(i: number, field: keyof QuoteLineItem, value: string | number) {
    setLineItems(prev => prev.map((li, idx) => idx === i ? { ...li, [field]: value } : li))
  }

  async function saveChanges() {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('quotes')
      .update({
        title,
        description: description || null,
        line_items: lineItems,
        subtotal: editSubtotal,
        tax: editTaxAmount,
        total: editTotal,
        valid_until: validUntil || null,
        notes: notes || null,
      })
      .eq('id', quote.id)
      .select('*, contacts(id, name)')
      .single()
    if (err) { setError(err.message); setSaving(false); return }
    setQuote(data as QuoteWithContact)
    setEditMode(false)
    setSaving(false)
  }

  async function handleSendEmail() {
    if (!sendClientEmail.trim()) { setError('Client email is required'); return }
    setSending(true)
    setError('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/quotes/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ quoteId: quote.id, clientName: sendClientName, clientEmail: sendClientEmail }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to send email'); setSending(false); return }
    // Refresh quote state to reflect sent status
    const { data: updated } = await supabase
      .from('quotes').select('*, contacts(id, name, email)').eq('id', quote.id).single()
    if (updated) setQuote(updated as QuoteWithContact)
    setShowSendForm(false)
    setSending(false)
  }

  async function doAction(action: 'accept' | 'decline' | 'delete' | 'convert') {
    setActioning(action)
    setError('')
    const supabase = createClient()

    if (action === 'accept') {
      const { data, error: err } = await supabase
        .from('quotes').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', quote.id)
        .select('*, contacts(id, name)').single()
      if (!err && data) setQuote(data as QuoteWithContact)
      else if (err) setError(err.message)
    }

    if (action === 'decline') {
      const { data, error: err } = await supabase
        .from('quotes').update({ status: 'declined' }).eq('id', quote.id)
        .select('*, contacts(id, name)').single()
      if (!err && data) setQuote(data as QuoteWithContact)
      else if (err) setError(err.message)
    }

    if (action === 'delete') {
      const { error: err } = await supabase.from('quotes').delete().eq('id', quote.id)
      if (!err) router.push('/pipeline')
      else setError(err.message)
    }

    if (action === 'convert') {
      const { data: job, error: jobErr } = await supabase
        .from('jobs')
        .insert({
          org_id: orgId,
          contact_id: quote.contact_id,
          title: quote.title,
          description: quote.description,
          status: 'accepted',
          value: quote.total,
        })
        .select()
        .single()
      if (jobErr) { setError(jobErr.message); setActioning(null); return }
      const { data, error: err } = await supabase
        .from('quotes').update({ job_id: job.id, status: 'converted' }).eq('id', quote.id)
        .select('*, contacts(id, name)').single()
      if (!err && data) setQuote(data as QuoteWithContact)
      else if (err) setError(err.message)
    }

    setActioning(null)
    setConfirmDelete(false)
  }

  const statusStyle = STATUS_STYLES[quote.status] ?? STATUS_STYLES.draft
  const canEdit = quote.status === 'draft' || quote.status === 'sent'

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e8ebf4' }}>
        {editMode ? (
          /* ── Edit mode header ── */
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Quote Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-bold outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={inputStyle} />
            </div>
          </div>
        ) : (
          /* ── View mode header ── */
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-xl font-bold" style={{ color: '#1a1f2e' }}>📋 {quote.title}</h1>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                  style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                  {quote.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: '#8891aa' }}>
                {quote.contacts && (
                  <span>👤 <span style={{ color: '#1e3a5f', fontWeight: 600 }}>{quote.contacts.name}</span></span>
                )}
                <span>Created {formatDate(quote.created_at)}</span>
                {quote.valid_until && <span>⏳ Valid until {formatDate(quote.valid_until)}</span>}
                {quote.accepted_at && <span>✅ Accepted {formatDate(quote.accepted_at)}</span>}
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Total</div>
              <div className="text-2xl font-bold" style={{ color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                {formatCurrency(quote.total)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Line items card */}
      <div className="rounded-xl bg-white" style={{ border: '1px solid #e8ebf4' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #e8ebf4' }}>
          <h2 className="text-sm font-bold" style={{ color: '#1a1f2e' }}>Line Items</h2>
          {editMode && (
            <button type="button" onClick={() => setLineItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }])}
              className="text-xs font-semibold" style={{ color: '#1e3a5f' }}>
              + Add Item
            </button>
          )}
        </div>

        {/* Column headers */}
        <div className="grid px-4 py-2 text-[10px] font-bold uppercase tracking-wider"
          style={{ gridTemplateColumns: '1fr 72px 100px 80px', gap: '8px', backgroundColor: '#f8f9fc', color: '#8891aa', borderBottom: '1px solid #e8ebf4' }}>
          <span>Description</span><span>Qty</span><span>Unit Price</span><span className="text-right">Total</span>
        </div>

        {(editMode ? lineItems : (Array.isArray(quote.line_items) ? quote.line_items : [])).map((li, i) => (
          <div key={i} className="grid items-center px-4 py-2.5"
            style={{ gridTemplateColumns: editMode ? '1fr 72px 100px 80px 24px' : '1fr 72px 100px 80px', gap: '8px', borderBottom: '1px solid #f2f4f9' }}>
            {editMode ? (
              <>
                <input value={li.description} onChange={e => updateLineItem(i, 'description', e.target.value)}
                  className="px-2 py-1.5 rounded text-xs outline-none" style={inputStyle} />
                <input type="number" min="0" step="1" value={li.quantity}
                  onChange={e => updateLineItem(i, 'quantity', Number(e.target.value))}
                  className="px-2 py-1.5 rounded text-xs outline-none w-full" style={inputStyle} />
                <input type="number" min="0" step="0.01" value={li.unit_price}
                  onChange={e => updateLineItem(i, 'unit_price', Number(e.target.value))}
                  className="px-2 py-1.5 rounded text-xs outline-none w-full" style={inputStyle} />
                <span className="text-xs font-semibold text-right" style={{ color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                  {formatCurrency(li.quantity * li.unit_price)}
                </span>
                <button type="button" onClick={() => setLineItems(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-sm font-bold leading-none disabled:invisible"
                  style={{ color: '#dc2626' }} disabled={lineItems.length <= 1}>×</button>
              </>
            ) : (
              <>
                <span className="text-xs" style={{ color: '#454d66' }}>{li.description || '—'}</span>
                <span className="text-xs" style={{ color: '#8891aa' }}>{li.quantity}</span>
                <span className="text-xs" style={{ color: '#8891aa', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(li.unit_price)}</span>
                <span className="text-xs font-semibold text-right" style={{ color: '#1a1f2e', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                  {formatCurrency(li.quantity * li.unit_price)}
                </span>
              </>
            )}
          </div>
        ))}

        {/* Totals footer */}
        <div className="px-4 py-3 space-y-1.5" style={{ borderTop: '1px solid #e8ebf4' }}>
          {editMode ? (
            <>
              <div className="flex justify-between text-xs" style={{ color: '#8891aa' }}>
                <span>Subtotal</span>
                <span style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(editSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs" style={{ color: '#8891aa' }}>
                <div className="flex items-center gap-2">
                  <span>Tax</span>
                  <input type="number" min="0" max="100" step="0.1" value={taxPct}
                    onChange={e => setTaxPct(Number(e.target.value))}
                    className="w-14 px-2 py-1 rounded text-xs outline-none" style={inputStyle} />
                  <span>%</span>
                </div>
                <span style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(editTaxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1" style={{ borderTop: '1px solid #e8ebf4' }}>
                <span style={{ color: '#1a1f2e' }}>Total</span>
                <span style={{ color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(editTotal)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-xs" style={{ color: '#8891aa' }}>
                <span>Subtotal</span>
                <span style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(quote.subtotal)}</span>
              </div>
              {quote.tax > 0 && (
                <div className="flex justify-between text-xs" style={{ color: '#8891aa' }}>
                  <span>Tax</span>
                  <span style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(quote.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1" style={{ borderTop: '1px solid #e8ebf4' }}>
                <span style={{ color: '#1a1f2e' }}>Total</span>
                <span style={{ color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(quote.total)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes + Valid until (edit mode) */}
      {editMode && (
        <div className="rounded-xl p-4 bg-white space-y-4" style={{ border: '1px solid #e8ebf4' }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Valid Until</label>
              <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
          </div>
        </div>
      )}

      {/* Notes (view mode) */}
      {!editMode && quote.notes && (
        <div className="rounded-xl p-4 bg-white" style={{ border: '1px solid #e8ebf4' }}>
          <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: '#8891aa' }}>Notes</div>
          <p className="text-xs" style={{ color: '#454d66' }}>{quote.notes}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {/* Send-to-client form */}
      {showSendForm && (
        <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e8ebf4' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: '#1a1f2e' }}>Send Quote to Client</h3>
            <button onClick={() => { setShowSendForm(false); setError('') }} className="text-xs" style={{ color: '#8891aa' }}>✕</button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Client Name</label>
              <input value={sendClientName} onChange={e => setSendClientName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>Client Email *</label>
              <input type="email" value={sendClientEmail} onChange={e => setSendClientEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowSendForm(false); setError('') }}
              className="px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: '#f8f9fc', color: '#454d66', border: '1px solid #e8ebf4' }}>
              Cancel
            </button>
            <button onClick={handleSendEmail} disabled={sending}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: '#2563eb' }}>
              {sending ? 'Sending…' : '📧 Send Email'}
            </button>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="rounded-xl p-4 bg-white flex items-center justify-between" style={{ border: '1px solid #e8ebf4' }}>
        <a href="/pipeline" className="text-xs font-semibold" style={{ color: '#8891aa' }}>← Back to Pipeline</a>

        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <button onClick={cancelEdit}
                className="px-4 py-2 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: '#f8f9fc', color: '#454d66', border: '1px solid #e8ebf4' }}>
                Cancel
              </button>
              <button onClick={saveChanges} disabled={saving}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: '#1e3a5f' }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              {/* Draft actions */}
              {quote.status === 'draft' && (
                <>
                  {confirmDelete ? (
                    <>
                      <span className="text-xs" style={{ color: '#8891aa' }}>Are you sure?</span>
                      <button onClick={() => setConfirmDelete(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ backgroundColor: '#f8f9fc', color: '#454d66', border: '1px solid #e8ebf4' }}>
                        Cancel
                      </button>
                      <button onClick={() => doAction('delete')} disabled={actioning === 'delete'}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                        style={{ backgroundColor: '#dc2626' }}>
                        {actioning === 'delete' ? '…' : 'Delete'}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setConfirmDelete(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                      Delete
                    </button>
                  )}
                  <button onClick={() => setShowSendForm(true)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: '#2563eb' }}>
                    Send to Client
                  </button>
                  <button onClick={openEdit}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: '#1e3a5f' }}>
                    Edit
                  </button>
                </>
              )}

              {/* Sent actions */}
              {quote.status === 'sent' && (
                <>
                  <button onClick={() => doAction('decline')} disabled={actioning === 'decline'}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
                    style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                    {actioning === 'decline' ? '…' : 'Mark Declined'}
                  </button>
                  <button onClick={() => doAction('accept')} disabled={actioning === 'accept'}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: '#16a34a' }}>
                    {actioning === 'accept' ? '…' : 'Mark Accepted'}
                  </button>
                  <button onClick={openEdit}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: '#1e3a5f' }}>
                    Edit
                  </button>
                </>
              )}

              {/* Accepted actions */}
              {quote.status === 'accepted' && !quote.job_id && (
                <button onClick={() => doAction('convert')} disabled={actioning === 'convert'}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: '#1e3a5f' }}>
                  {actioning === 'convert' ? '…' : 'Convert to Job'}
                </button>
              )}

              {quote.status === 'converted' && (
                <span className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                  Converted to job
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
