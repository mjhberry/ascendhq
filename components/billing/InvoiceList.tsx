import Link from 'next/link'
import StatusPill from '@/components/shared/StatusPill'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Invoice } from '@/types'

export default function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return <div className="py-12 text-center text-xs" style={{ color: '#8891aa' }}>No invoices yet</div>
  }

  return (
    <table className="w-full">
      <thead>
        <tr style={{ borderBottom: '1px solid #e8ebf4' }}>
          {['Invoice #', 'Client', 'Status', 'Total', 'Due', 'Issued'].map(h => (
            <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#8891aa' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {invoices.map((inv, i) => (
          <tr key={inv.id} style={{ borderBottom: i < invoices.length - 1 ? '1px solid #f2f4f9' : 'none' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8f9fc')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <td className="px-4 py-3">
              <Link href={`/billing/${inv.id}`} className="text-xs font-semibold hover:underline"
                style={{ color: '#1e3a5f', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                #{inv.number}
              </Link>
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: '#454d66' }}>{(inv.contacts as any)?.name ?? '—'}</td>
            <td className="px-4 py-3"><StatusPill status={inv.status} /></td>
            <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#1a1f2e', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
              {formatCurrency(inv.total)}
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: inv.status === 'overdue' ? '#dc2626' : '#8891aa' }}>
              {formatDate(inv.due_at)}
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: '#8891aa' }}>{formatDate(inv.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
