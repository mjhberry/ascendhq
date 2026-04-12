'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import StatusPill from '@/components/shared/StatusPill'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Contact } from '@/types'

interface ClientTableProps {
  contacts: Contact[]
  clientLabel: string
  onEdit: (contact: Contact) => void
  onDelete: (contact: Contact) => void
}

export default function ClientTable({ contacts, clientLabel, onEdit, onDelete }: ClientTableProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!openMenu) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openMenu])

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
            {['Name', 'Email', 'Phone', 'Location', 'Type', 'Status', 'Lifetime Value', 'Added', ''].map(h => (
              <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-4 py-3"
                style={{ color: '#8891aa', width: h === '' ? 40 : undefined }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contacts.map((c, i) => (
            <tr key={c.id}
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
              <td className="px-4 py-3 text-xs" style={{ color: '#454d66' }}>
                {[c.city, c.state].filter(Boolean).join(', ') || '—'}
              </td>
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

              {/* Three-dot menu */}
              <td className="px-2 py-3" style={{ position: 'relative', textAlign: 'right' }}>
                <button
                  onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === c.id ? null : c.id) }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 16, color: '#8891aa', padding: '2px 6px', borderRadius: 6,
                    lineHeight: 1,
                  }}
                  title="Actions"
                >
                  ⋮
                </button>

                {openMenu === c.id && (
                  <div
                    ref={menuRef}
                    style={{
                      position: 'absolute', right: 8, top: '100%', zIndex: 20,
                      backgroundColor: 'white',
                      border: '1px solid #e8ebf4',
                      borderRadius: 10,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                      minWidth: 140,
                      overflow: 'hidden',
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <Link
                      href={`/clients/${c.id}`}
                      style={{ display: 'block', padding: '9px 14px', fontSize: 12, color: '#1a1f2e', textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8f9fc')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      onClick={() => setOpenMenu(null)}
                    >
                      View
                    </Link>
                    <button
                      onClick={() => { onEdit(c); setOpenMenu(null) }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '9px 14px', fontSize: 12, color: '#1a1f2e',
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8f9fc')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      Edit
                    </button>
                    <div style={{ height: 1, backgroundColor: '#f2f4f9' }} />
                    <button
                      onClick={() => { onDelete(c); setOpenMenu(null) }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '9px 14px', fontSize: 12, color: '#dc2626',
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
