'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/useOrg'
import ClientTable from '@/components/clients/ClientTable'
import ClientForm from '@/components/clients/ClientForm'
import CSVImport from '@/components/clients/CSVImport'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import type { Contact } from '@/types'

export default function ClientsPage() {
  const { org, profile, terms } = useOrg()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal state
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Contact | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function fetchContacts() {
    if (!profile?.org_id) return
    const supabase = createClient()
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })
    setContacts(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchContacts()
  }, [profile?.org_id])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    const res = await fetch(`/api/contacts?id=${deleteTarget.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      setDeleteError(data.error ?? 'Failed to delete')
      setDeleting(false)
      return
    }
    setDeleteTarget(null)
    setDeleting(false)
    fetchContacts()
  }

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email?.toLowerCase().includes(search.toLowerCase())) ||
    (c.company?.toLowerCase().includes(search.toLowerCase()))
  )

  if (!org || loading) return <LoadingSpinner />

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1a1f2e' }}>{terms.clients}</h1>
          <p className="text-xs mt-0.5" style={{ color: '#8891aa' }}>{contacts.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: '#f8f9fc', color: '#454d66', border: '1px solid #e8ebf4' }}
          >
            Import CSV
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            + Add {terms.client}
          </button>
        </div>
      </div>

      {/* Search + table */}
      <div className="rounded-xl bg-white" style={{ border: '1px solid #e8ebf4' }}>
        <div className="p-4" style={{ borderBottom: '1px solid #e8ebf4' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${terms.clients.toLowerCase()}…`}
            className="w-full max-w-xs px-3 py-2 rounded-lg text-xs outline-none"
            style={{ backgroundColor: '#f8f9fc', border: '1px solid #e8ebf4', color: '#1a1f2e' }}
          />
        </div>
        {filtered.length === 0
          ? <EmptyState
              icon="👥"
              title={`No ${terms.clients.toLowerCase()} yet`}
              description={`Add your first ${terms.client.toLowerCase()} to get started`}
            />
          : <ClientTable
              contacts={filtered}
              clientLabel={terms.client}
              onEdit={c => setEditTarget(c)}
              onDelete={c => setDeleteTarget(c)}
            />
        }
      </div>

      {/* Create modal */}
      {showCreate && (
        <ClientForm
          orgId={profile!.org_id}
          clientLabel={terms.client}
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); fetchContacts() }}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <ClientForm
          orgId={profile!.org_id}
          clientLabel={terms.client}
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); fetchContacts() }}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            style={{
              backgroundColor: 'white', borderRadius: 14,
              width: '100%', maxWidth: 420,
              padding: 24,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#1a1f2e' }}>
              Delete {deleteTarget.name}?
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#8891aa', lineHeight: 1.5 }}>
              This cannot be undone. All associated data will remain but this contact will be removed.
            </p>
            {deleteError && (
              <p style={{ margin: '0 0 16px', fontSize: 12, color: '#dc2626', padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: 8 }}>
                {deleteError}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  backgroundColor: '#f8f9fc', color: '#454d66', border: '1px solid #e8ebf4',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  backgroundColor: '#dc2626', color: 'white', border: 'none',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import modal */}
      {showImport && (
        <CSVImport
          onClose={() => setShowImport(false)}
          onComplete={() => fetchContacts()}
        />
      )}
    </div>
  )
}
