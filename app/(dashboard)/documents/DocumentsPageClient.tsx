'use client'
import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import DocumentUpload from '@/components/documents/DocumentUpload'
import type { Document } from '@/types'

type DocType = 'contract' | 'permit' | 'photo' | 'proposal' | 'warranty' | 'other'

const TYPE_ICONS: Record<string, string> = {
  contract: '📜',
  permit: '🏛️',
  photo: '📷',
  proposal: '📋',
  warranty: '🛡️',
  other: '📄',
}

const ALL_TYPES: DocType[] = ['contract', 'permit', 'photo', 'proposal', 'warranty', 'other']

interface DocWithRelations extends Document {
  contacts?: { name: string } | null
  jobs?: { title: string } | null
}

interface Props {
  documents: DocWithRelations[]
  orgId: string
  userId: string
}

export default function DocumentsPageClient({ documents: initialDocs, orgId, userId }: Props) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocType | 'all'>('all')
  const [showUpload, setShowUpload] = useState(false)

  const filtered = initialDocs.filter(doc => {
    const matchesSearch = !search ||
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      (doc.contacts as any)?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (doc.jobs as any)?.title?.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || doc.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: '#1a1f2e' }}>Documents</h1>
        <button
          onClick={() => setShowUpload(v => !v)}
          style={{
            fontSize: 12, fontWeight: 600, color: 'white',
            background: '#1e3a5f', border: 'none', borderRadius: 8,
            padding: '7px 14px', cursor: 'pointer',
          }}
        >
          {showUpload ? '✕ Close' : '+ Upload'}
        </button>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="rounded-xl bg-white p-4" style={{ border: '1px solid #e8ebf4' }}>
          <div className="text-sm font-bold mb-4" style={{ color: '#1a1f2e' }}>Upload Document</div>
          <DocumentUpload orgId={orgId} userId={userId} />
        </div>
      )}

      {/* Search + filter */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search documents…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            fontSize: 13,
            border: '1px solid #e8ebf4',
            borderRadius: 8,
            padding: '8px 12px',
            outline: 'none',
            color: '#1a1f2e',
          }}
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as DocType | 'all')}
          style={{
            fontSize: 12,
            border: '1px solid #e8ebf4',
            borderRadius: 8,
            padding: '8px 10px',
            color: '#454d66',
            background: 'white',
          }}
        >
          <option value="all">All types</option>
          {ALL_TYPES.map(t => (
            <option key={t} value={t}>{TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Count */}
      <div className="text-xs" style={{ color: '#8891aa' }}>
        {filtered.length} {filtered.length === 1 ? 'file' : 'files'}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid #e8ebf4' }}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📁</div>
            <div className="text-sm font-semibold mb-1" style={{ color: '#1a1f2e' }}>
              {initialDocs.length === 0 ? 'No documents yet' : 'No results'}
            </div>
            <div className="text-xs" style={{ color: '#8891aa' }}>
              {initialDocs.length === 0
                ? 'Upload documents from any job or client page'
                : 'Try adjusting your search or filter'}
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #e8ebf4' }}>
                {['Name', 'Type', 'Client', 'Job', 'Size', 'Uploaded'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-4 py-3"
                    style={{ color: '#8891aa' }}>{h}</th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, i) => (
                <tr
                  key={doc.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f2f4f9' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8f9fc')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{TYPE_ICONS[doc.type ?? 'other'] ?? '📄'}</span>
                      <span className="text-xs font-semibold" style={{ color: '#1a1f2e' }}>{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] capitalize px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#f2f4f9', color: '#454d66' }}>
                      {doc.type ?? 'other'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#454d66' }}>
                    {(doc.contacts as any)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#454d66' }}>
                    {(doc.jobs as any)?.title ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8891aa', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                    {doc.size_bytes ? `${(doc.size_bytes / 1024).toFixed(0)} KB` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8891aa' }}>
                    {formatDate(doc.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 11, color: '#1e3a5f', border: '1px solid #e8ebf4', borderRadius: 6, padding: '3px 8px', textDecoration: 'none', whiteSpace: 'nowrap' }}
                      >
                        Download
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
