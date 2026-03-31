'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/useOrg'
import ClientTable from '@/components/clients/ClientTable'
import ClientForm from '@/components/clients/ClientForm'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import type { Contact } from '@/types'

export default function ClientsPage() {
  const { org, profile, terms } = useOrg()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!profile?.org_id) return
    const supabase = createClient()
    supabase.from('contacts').select('*').eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setContacts(data ?? []); setLoading(false) })
  }, [profile?.org_id])

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
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
          style={{ backgroundColor: '#1e3a5f' }}>
          + Add {terms.client}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e8ebf4' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#1a1f2e' }}>New {terms.client}</h2>
          <ClientForm orgId={profile!.org_id} clientLabel={terms.client}
            onClose={() => { setShowForm(false); window.location.reload() }} />
        </div>
      )}

      {/* Search */}
      <div className="rounded-xl bg-white" style={{ border: '1px solid #e8ebf4' }}>
        <div className="p-4" style={{ borderBottom: '1px solid #e8ebf4' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${terms.clients.toLowerCase()}…`}
            className="w-full max-w-xs px-3 py-2 rounded-lg text-xs outline-none"
            style={{ backgroundColor: '#f8f9fc', border: '1px solid #e8ebf4', color: '#1a1f2e' }} />
        </div>
        {filtered.length === 0
          ? <EmptyState icon="👥" title={`No ${terms.clients.toLowerCase()} yet`}
              description={`Add your first ${terms.client.toLowerCase()} to get started`} />
          : <ClientTable contacts={filtered} clientLabel={terms.client} />
        }
      </div>
    </div>
  )
}
