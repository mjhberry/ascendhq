import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import StatusPill from '@/components/shared/StatusPill'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile?.org_id) redirect('/onboarding')

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, contacts(name, email, phone), invoice_items(*)')
    .eq('id', id)
    .eq('org_id', profile.org_id)
    .single()

  if (!invoice) notFound()

  const items = invoice.invoice_items ?? []

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2 text-xs" style={{ color: '#8891aa' }}>
        <Link href="/billing" style={{ color: '#1e3a5f' }}>Billing</Link>
        <span>/</span>
        <span>#{invoice.number}</span>
      </div>

      <div className="rounded-xl p-6 bg-white" style={{ border: '1px solid #e8ebf4' }}>
        {/* Invoice header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-2xl font-bold mb-1" style={{ color: '#1a1f2e', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
              #{invoice.number}
            </div>
            <StatusPill status={invoice.status} />
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Total</div>
            <div className="text-3xl font-bold" style={{ color: '#1a1f2e', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
              {formatCurrency(invoice.total)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6 pb-6" style={{ borderBottom: '1px solid #e8ebf4' }}>
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Client</div>
            {invoice.contacts
              ? <div className="text-xs font-semibold" style={{ color: '#1a1f2e' }}>{(invoice.contacts as any).name}</div>
              : <span className="text-xs" style={{ color: '#8891aa' }}>—</span>
            }
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Issued</div>
            <div className="text-xs" style={{ color: '#1a1f2e' }}>{formatDate(invoice.created_at)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Due Date</div>
            <div className="text-xs" style={{ color: invoice.status === 'overdue' ? '#dc2626' : '#1a1f2e' }}>
              {formatDate(invoice.due_at)}
            </div>
          </div>
        </div>

        {/* Line items */}
        <table className="w-full mb-6">
          <thead>
            <tr style={{ borderBottom: '1px solid #e8ebf4' }}>
              {['Description', 'Qty', 'Unit Price', 'Total'].map(h => (
                <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider py-2" style={{ color: '#8891aa' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f2f4f9' }}>
                <td className="py-3 text-xs" style={{ color: '#1a1f2e' }}>{item.description}</td>
                <td className="py-3 text-xs" style={{ color: '#454d66', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{item.quantity}</td>
                <td className="py-3 text-xs" style={{ color: '#454d66', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(item.unit_price)}</td>
                <td className="py-3 text-xs font-semibold" style={{ color: '#1a1f2e', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(item.total)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-xs" style={{ color: '#8891aa' }}>No line items</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-48 space-y-1">
            <div className="flex justify-between text-xs" style={{ color: '#454d66' }}>
              <span>Subtotal</span>
              <span style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: '#454d66' }}>
              <span>Tax</span>
              <span style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(invoice.tax)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1" style={{ borderTop: '1px solid #e8ebf4', color: '#1a1f2e' }}>
              <span>Total</span>
              <span style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid #e8ebf4' }}>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Notes</div>
            <p className="text-xs" style={{ color: '#454d66' }}>{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
