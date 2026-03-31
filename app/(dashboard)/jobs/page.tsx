'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/useOrg'
import JobForm from '@/components/jobs/JobForm'
import KanbanBoard from '@/components/dashboard/KanbanBoard'
import StatusPill from '@/components/shared/StatusPill'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Job, Contact } from '@/types'

type View = 'kanban' | 'list'

export default function JobsPage() {
  const { org, profile, terms } = useOrg()
  const [jobs, setJobs] = useState<Job[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<View>('kanban')

  useEffect(() => {
    if (!profile?.org_id) return
    const supabase = createClient()
    Promise.all([
      supabase.from('jobs').select('*, contacts(name)').eq('org_id', profile.org_id).order('created_at', { ascending: false }),
      supabase.from('contacts').select('*').eq('org_id', profile.org_id).order('name'),
    ]).then(([{ data: j }, { data: c }]) => {
      setJobs((j as Job[]) ?? [])
      setContacts(c ?? [])
      setLoading(false)
    })
  }, [profile?.org_id])

  if (!org || loading) return <LoadingSpinner />

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1a1f2e' }}>{terms.jobs}</h1>
          <p className="text-xs mt-0.5" style={{ color: '#8891aa' }}>{jobs.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg p-0.5" style={{ backgroundColor: '#f2f4f9', border: '1px solid #e8ebf4' }}>
            {(['kanban', 'list'] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all"
                style={view === v ? { backgroundColor: 'white', color: '#1a1f2e', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: '#8891aa' }}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: '#1e3a5f' }}>
            + New {terms.job}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e8ebf4' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#1a1f2e' }}>New {terms.job}</h2>
          <JobForm orgId={profile!.org_id} jobLabel={terms.job} contacts={contacts}
            onClose={() => { setShowForm(false); window.location.reload() }} />
        </div>
      )}

      {jobs.length === 0
        ? <EmptyState icon={terms.jobIcon} title={`No ${terms.jobs.toLowerCase()} yet`}
            description={`Create your first ${terms.job.toLowerCase()} to get started`} />
        : view === 'kanban'
          ? <KanbanBoard jobs={jobs} jobLabel={terms.job} />
          : (
            <div className="rounded-xl bg-white" style={{ border: '1px solid #e8ebf4' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #e8ebf4' }}>
                    {['Title', 'Client', 'Status', 'Priority', 'Value', 'Scheduled', 'Created'].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#8891aa' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j, i) => (
                    <tr key={j.id} style={{ borderBottom: i < jobs.length - 1 ? '1px solid #f2f4f9' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8f9fc')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td className="px-4 py-3">
                        <Link href={`/jobs/${j.id}`} className="text-xs font-semibold hover:underline" style={{ color: '#1e3a5f' }}>{j.title}</Link>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#454d66' }}>{(j.contacts as any)?.name ?? '—'}</td>
                      <td className="px-4 py-3"><StatusPill status={j.status} /></td>
                      <td className="px-4 py-3"><StatusPill status={j.priority} /></td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{formatCurrency(j.value)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#8891aa' }}>{formatDate(j.scheduled_at)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#8891aa' }}>{formatDate(j.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      }
    </div>
  )
}
