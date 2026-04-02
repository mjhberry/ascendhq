'use client'
import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Quote, QuoteLineItem } from '@/types'

interface QuoteAcceptanceProps {
  quote: Quote
  orgName: string
  token: string
}

const navy = '#1e3a5f'
const slate = '#8891aa'
const border = '#e8ebf4'
const bg = '#f2f4f9'

export default function QuoteAcceptance({ quote: initialQuote, orgName, token }: QuoteAcceptanceProps) {
  const [status, setStatus] = useState(initialQuote.status)
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)
  const [error, setError] = useState('')

  const lineItems: QuoteLineItem[] = Array.isArray(initialQuote.line_items) ? initialQuote.line_items : []
  const alreadyResponded = status === 'accepted' || status === 'declined' || status === 'converted'

  async function respond(action: 'accept' | 'decline') {
    setLoading(action)
    setError('')
    try {
      const res = await fetch('/api/quotes/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); setLoading(null); return }
      setStatus(action === 'accept' ? 'accepted' : 'declined')
    } catch {
      setError('Network error — please try again')
    }
    setLoading(null)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg, fontFamily: 'var(--font-space-grotesk), sans-serif', padding: '40px 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, backgroundColor: navy, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16 }}>A</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1f2e' }}>{orgName}</div>
              <div style={{ fontSize: 11, color: slate }}>Sent via AscendHQ</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: slate, marginBottom: 2 }}>Quote Total</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(initialQuote.total)}</div>
          </div>
        </div>

        {/* Already responded banner */}
        {alreadyResponded && (
          <div style={{
            padding: '20px 24px',
            borderRadius: 12,
            marginBottom: 24,
            backgroundColor: status === 'accepted' ? '#dcfce7' : status === 'declined' ? '#fef2f2' : '#f3e8ff',
            border: `1px solid ${status === 'accepted' ? '#bbf7d0' : status === 'declined' ? '#fecaca' : '#e9d5ff'}`,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: status === 'accepted' ? '#15803d' : status === 'declined' ? '#dc2626' : '#7c3aed', marginBottom: 4 }}>
              {status === 'accepted' ? '✅ Quote Accepted' : status === 'declined' ? '❌ Quote Declined' : '✅ Quote Converted'}
            </div>
            <div style={{ fontSize: 13, color: status === 'accepted' ? '#166534' : status === 'declined' ? '#991b1b' : '#6d28d9' }}>
              {status === 'accepted'
                ? 'Thank you! Your acceptance has been recorded. The team will be in touch soon.'
                : status === 'declined'
                ? 'You have declined this quote. If you change your mind, please contact us directly.'
                : 'This quote has been converted to a job.'}
            </div>
          </div>
        )}

        {/* Quote title card */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, padding: '24px 28px', border: `1px solid ${border}`, marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: slate, marginBottom: 8 }}>Quote</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1f2e', margin: '0 0 10px' }}>{initialQuote.title}</h1>
          {initialQuote.description && (
            <p style={{ fontSize: 14, color: '#454d66', margin: '0 0 12px', lineHeight: 1.6 }}>{initialQuote.description}</p>
          )}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, color: slate }}>
              📅 Created {formatDate(initialQuote.created_at)}
            </div>
            {initialQuote.valid_until && (
              <div style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>
                ⏳ Valid until {formatDate(initialQuote.valid_until)}
              </div>
            )}
          </div>
        </div>

        {/* Line items */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, border: `1px solid ${border}`, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${border}` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1f2e' }}>Line Items</span>
          </div>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 90px', gap: 8, padding: '8px 20px', backgroundColor: '#f8f9fc', borderBottom: `1px solid ${border}` }}>
            {['Description', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: slate, textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>

          {lineItems.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: slate }}>No line items</div>
          ) : lineItems.map((li, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 90px', gap: 8, padding: '12px 20px', borderBottom: i < lineItems.length - 1 ? `1px solid #f8f9fc` : 'none' }}>
              <span style={{ fontSize: 13, color: '#454d66' }}>{li.description || '—'}</span>
              <span style={{ fontSize: 13, color: slate, textAlign: 'right' }}>{li.quantity}</span>
              <span style={{ fontSize: 13, color: slate, textAlign: 'right', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(li.unit_price)}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1f2e', textAlign: 'right', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(li.quantity * li.unit_price)}</span>
            </div>
          ))}

          {/* Totals */}
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${border}`, backgroundColor: '#fafbfd' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: slate }}>Subtotal</span>
              <span style={{ fontSize: 12, color: slate, fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(initialQuote.subtotal)}</span>
            </div>
            {initialQuote.tax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: slate }}>Tax</span>
                <span style={{ fontSize: 12, color: slate, fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(initialQuote.tax)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${border}` }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1f2e' }}>Total</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(initialQuote.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {initialQuote.notes && (
          <div style={{ backgroundColor: '#fffbeb', borderRadius: 12, padding: '16px 20px', border: '1px solid #fde68a', marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#92400e', marginBottom: 6 }}>Notes</div>
            <p style={{ fontSize: 13, color: '#78350f', margin: 0, lineHeight: 1.6 }}>{initialQuote.notes}</p>
          </div>
        )}

        {/* Action buttons */}
        {!alreadyResponded && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <button
              onClick={() => respond('decline')}
              disabled={loading !== null}
              style={{ padding: '16px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', border: `2px solid ${border}`, backgroundColor: 'white', color: '#454d66', fontFamily: 'inherit', opacity: loading !== null ? 0.6 : 1, transition: 'all 0.15s' }}>
              {loading === 'decline' ? 'Declining…' : 'Decline Quote'}
            </button>
            <button
              onClick={() => respond('accept')}
              disabled={loading !== null}
              style={{ padding: '16px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', border: 'none', backgroundColor: navy, color: 'white', fontFamily: 'inherit', opacity: loading !== null ? 0.6 : 1, transition: 'all 0.15s' }}>
              {loading === 'accept' ? 'Accepting…' : '✓ Accept Quote'}
            </button>
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 13, border: '1px solid #fecaca', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#c4c9d8' }}>
          Powered by <strong style={{ color: slate }}>AscendHQ</strong>
        </div>

      </div>
    </div>
  )
}
