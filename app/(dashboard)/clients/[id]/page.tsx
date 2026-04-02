import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getTerms } from '@/lib/terminology'
import StatusPill from '@/components/shared/StatusPill'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import DocumentUpload from '@/components/documents/DocumentUpload'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*, organizations(*)').eq('id', user.id).single()
  if (!profile?.org_id) redirect('/onboarding')

  const [{ data: contact }, { data: jobs }, { data: invoices }] = await Promise.all([
    supabase.from('contacts').select('*').eq('id', id).eq('org_id', profile.org_id).single(),
    supabase.from('jobs').select('*').eq('contact_id', id).eq('org_id', profile.org_id).order('created_at', { ascending: false }),
    supabase.from('invoices').select('*').eq('contact_id', id).eq('org_id', profile.org_id).order('created_at', { ascending: false }),
  ])

  if (!contact) notFound()

  const terms = getTerms(profile.organizations.industry)

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs" style={{ color: '#8891aa' }}>
        <Link href="/clients" style={{ color: '#1e3a5f' }}>{terms.clients}</Link>
        <span>/</span>
        <span>{contact.name}</span>
      </div>

      {/* Header card */}
      <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e8ebf4' }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
              style={{ backgroundColor: '#1e3a5f' }}>
              {contact.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#1a1f2e' }}>{contact.name}</h1>
              {contact.company && <div className="text-xs" style={{ color: '#8891aa' }}>{contact.company}</div>}
              <div className="flex items-center gap-2 mt-1">
                <StatusPill status={contact.status} />
                <span className="text-[10px] capitalize px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#f2f4f9', color: '#454d66' }}>{contact.type}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Lifetime Value</div>
            <div className="text-xl font-bold" style={{ color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
              {formatCurrency(contact.lifetime_value)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5 pt-5" style={{ borderTop: '1px solid #e8ebf4' }}>
          {contact.email && (
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Email</div>
              <a href={`mailto:${contact.email}`} className="text-xs" style={{ color: '#1e3a5f' }}>{contact.email}</a>
            </div>
          )}
          {contact.phone && (
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Phone</div>
              <div className="text-xs" style={{ fontFamily: 'var(--font-ibm-plex-mono), monospace', color: '#1a1f2e' }}>{contact.phone}</div>
            </div>
          )}
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Added</div>
            <div className="text-xs" style={{ color: '#1a1f2e' }}>{formatDate(contact.created_at)}</div>
          </div>
        </div>

        {contact.notes && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #e8ebf4' }}>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8891aa' }}>Notes</div>
            <p className="text-xs" style={{ color: '#454d66' }}>{contact.notes}</p>
          </div>
        )}
      </div>

      {/* Jobs */}
      <div className="rounded-xl bg-white" style={{ border: '1px solid #e8ebf4' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid #e8ebf4' }}>
          <h2 className="text-sm font-bold" style={{ color: '#1a1f2e' }}>{terms.jobs}</h2>
          <span className="text-xs" style={{ color: '#8891aa' }}>{jobs?.length ?? 0}</span>
        </div>
        {(jobs ?? []).length === 0
          ? <div className="py-8 text-center text-xs" style={{ color: '#8891aa' }}>No {terms.jobs.toLowerCase()} yet</div>
          : (jobs ?? []).map(j => (
            <Link key={j.id} href={`/pipeline/${j.id}`}
              className="flex items-center justify-between px-4 py-3 transition-colors"
              style={{ borderBottom: '1px solid #f2f4f9' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8f9fc')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div>
                <div className="text-xs font-semibold" style={{ color: '#1a1f2e' }}>{j.title}</div>
                <div className="text-[10px] mt-0.5" style={{ color: '#8891aa' }}>{formatDate(j.created_at)}</div>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={j.status} />
                <span className="text-xs font-semibold" style={{ color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                  {formatCurrency(j.value)}
                </span>
              </div>
            </Link>
          ))
        }
      </div>

      {/* Documents */}
      <div className="rounded-xl bg-white p-4" style={{ border: '1px solid #e8ebf4' }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: '#1a1f2e' }}>Documents</h2>
        <DocumentUpload
          orgId={profile.org_id}
          userId={user.id}
          contactId={id}
        />
      </div>

      {/* Invoices */}
      <div className="rounded-xl bg-white" style={{ border: '1px solid #e8ebf4' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid #e8ebf4' }}>
          <h2 className="text-sm font-bold" style={{ color: '#1a1f2e' }}>Invoices</h2>
          <span className="text-xs" style={{ color: '#8891aa' }}>{invoices?.length ?? 0}</span>
        </div>
        {(invoices ?? []).length === 0
          ? <div className="py-8 text-center text-xs" style={{ color: '#8891aa' }}>No invoices yet</div>
          : (invoices ?? []).map(inv => (
            <Link key={inv.id} href={`/billing/${inv.id}`}
              className="flex items-center justify-between px-4 py-3 transition-colors"
              style={{ borderBottom: '1px solid #f2f4f9' }}>
              <div>
                <div className="text-xs font-semibold" style={{ color: '#1a1f2e' }}>#{inv.number}</div>
                <div className="text-[10px] mt-0.5" style={{ color: '#8891aa' }}>Due {formatDate(inv.due_at)}</div>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={inv.status} />
                <span className="text-xs font-semibold" style={{ color: '#1a1f2e', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                  {formatCurrency(inv.total)}
                </span>
              </div>
            </Link>
          ))
        }
      </div>
    </div>
  )
}
