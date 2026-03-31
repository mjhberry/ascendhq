'use client'
import Link from 'next/link'
import StatusPill from '@/components/shared/StatusPill'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Contact } from '@/types'

interface ClientTableProps {
  contacts: Contact[]
  clientLabel: string
}

export default function ClientTable({ contacts, clientLabel }: ClientTableProps) {
  if (contacts.length === 0) {
    return (
      <div className="text-center py-12 text-xs" style={{ color: '#8891aa' }}>
        No {clientLabel.toLowerCase()}s yet
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid #e8ebf4' }}>
            {['Name', 'Email', 'Phone', 'Type', 'Status', 'Lifetime Value', 'Added'].map(h => (
              <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-4 py-3"
                style={{ color: '#8891aa' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contacts.map((c, i) => (
            <tr key={c.id}
              className="transition-colors"
              style={{ borderBottom: i < contacts.length - 1 ? '1px solid #f2f4f9' : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8f9fc')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <td className="px-4 py-3">
                <Link href={`/clients/${c.id}`} className="text-xs font-semibold hover:underline"
                  style={{ color: '#1e3a5f' }}>
                  {c.name}
                </Link>
                {c.company && <div className="text-[10px]" style={{ color: '#8891aa' }}>{c.company}</div>}
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: '#454d66' }}>{c.email ?? '—'}</td>
              <td className="px-4 py-3 text-xs" style={{ color: '#454d66', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{c.phone ?? '—'}</td>
              <td className="px-4 py-3">
                <span className="text-[10px] capitalize px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: c.type === 'commercial' ? '#e4eef9' : '#f2f4f9', color: '#454d66' }}>
                  {c.type}
                </span>
              </td>
              <td className="px-4 py-3"><StatusPill status={c.status} /></td>
              <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                {formatCurrency(c.lifetime_value)}
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: '#8891aa' }}>{formatDate(c.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
