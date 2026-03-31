import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getTerms } from '@/lib/terminology'
import StatusPill from '@/components/shared/StatusPill'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*, organizations(*)').eq('id', user.id).single()
  if (!profile?.org_id) redirect('/onboarding')

  const [{ data: job }, { data: documents }] = await Promise.all([
    supabase.from('jobs').select('*, contacts(*), profiles(full_name)').eq('id', id).eq('org_id', profile.org_id).single(),
    supabase.from('documents').select('*').eq('job_id', id).eq('org_id', profile.org_id),
  ])

  if (!job) notFound()

  const terms = getTerms(profile.organizations.industry)

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs" style={{ color: '#8891aa' }}>
        <Link href="/jobs" style={{ color: '#1e3a5f' }}>{terms.jobs}</Link>
        <span>/</span>
        <span>{job.title}</span>
      </div>

      {/* Header */}
      <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e8ebf4' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{terms.jobIcon}</span>
              <h1 className="text-xl font-bold" style={{ color: '#1a1f2e' }}>{job.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={job.status} />
              <StatusPill status={job.priority} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Value</div>
            <div className="text-2xl font-bold" style={{ color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
              {formatCurrency(job.value)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4" style={{ borderTop: '1px solid #e8ebf4' }}>
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Client</div>
            {job.contacts
              ? <Link href={`/clients/${job.contacts.id}`} className="text-xs font-semibold" style={{ color: '#1e3a5f' }}>{job.contacts.name}</Link>
              : <span className="text-xs" style={{ color: '#8891aa' }}>—</span>
            }
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>{terms.assigned}</div>
            <div className="text-xs" style={{ color: '#1a1f2e' }}>{(job.profiles as any)?.full_name ?? '—'}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Scheduled</div>
            <div className="text-xs" style={{ color: '#1a1f2e' }}>{formatDateTime(job.scheduled_at)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Created</div>
            <div className="text-xs" style={{ color: '#1a1f2e' }}>{formatDate(job.created_at)}</div>
          </div>
          {job.completed_at && (
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Completed</div>
              <div className="text-xs" style={{ color: '#1a1f2e' }}>{formatDate(job.completed_at)}</div>
            </div>
          )}
        </div>

        {job.description && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #e8ebf4' }}>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Description</div>
            <p className="text-xs" style={{ color: '#454d66' }}>{job.description}</p>
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="rounded-xl bg-white" style={{ border: '1px solid #e8ebf4' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid #e8ebf4' }}>
          <h2 className="text-sm font-bold" style={{ color: '#1a1f2e' }}>Documents</h2>
          <span className="text-xs" style={{ color: '#8891aa' }}>{documents?.length ?? 0}</span>
        </div>
        {(documents ?? []).length === 0
          ? <div className="py-8 text-center text-xs" style={{ color: '#8891aa' }}>No documents attached</div>
          : (documents ?? []).map(doc => (
            <div key={doc.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #f2f4f9' }}>
              <div className="flex items-center gap-3">
                <span className="text-lg">📄</span>
                <div>
                  <div className="text-xs font-semibold" style={{ color: '#1a1f2e' }}>{doc.name}</div>
                  <div className="text-[10px]" style={{ color: '#8891aa' }}>{doc.type ?? 'other'}</div>
                </div>
              </div>
              <div className="text-xs" style={{ color: '#8891aa' }}>{formatDate(doc.created_at)}</div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
