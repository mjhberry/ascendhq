import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTerms } from '@/lib/terminology'
import StatCard from '@/components/dashboard/StatCard'
import KanbanBoard from '@/components/dashboard/KanbanBoard'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import type { Job } from '@/types'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/onboarding')

  const org = profile.organizations
  const orgId = profile.org_id
  const terms = getTerms(org.industry)

  // Fetch stats in parallel
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: openJobsCount },
    { data: paidInvoices },
    { data: overdueInvoices },
    { count: newLeadsCount },
    { data: jobs },
    { data: recentJobs },
    { data: recentContacts },
  ] = await Promise.all([
    supabase.from('jobs').select('*', { count: 'exact', head: true })
      .eq('org_id', orgId).in('status', ['accepted', 'in_progress']),
    supabase.from('invoices').select('total').eq('org_id', orgId)
      .eq('status', 'paid').gte('paid_at', startOfMonth),
    supabase.from('invoices').select('total').eq('org_id', orgId).eq('status', 'overdue'),
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'new'),
    supabase.from('jobs').select('*, contacts(name)').eq('org_id', orgId)
      .not('status', 'in', '(complete,invoiced,cancelled)').order('created_at', { ascending: false }).limit(20),
    supabase.from('jobs').select('id, title, created_at').eq('org_id', orgId)
      .order('created_at', { ascending: false }).limit(3),
    supabase.from('contacts').select('id, name, created_at').eq('org_id', orgId)
      .order('created_at', { ascending: false }).limit(2),
  ])

  const revenueMTD = (paidInvoices ?? []).reduce((sum, inv) => sum + (inv.total ?? 0), 0)
  const outstanding = (overdueInvoices ?? []).reduce((sum, inv) => sum + (inv.total ?? 0), 0)

  const firstName = profile.full_name?.split(' ')[0] ?? 'there'
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Build activity feed from recent records
  const activityItems = [
    ...(recentJobs ?? []).map(j => ({
      id: j.id,
      type: 'job',
      description: `${terms.job} created: ${j.title}`,
      created_at: j.created_at,
    })),
    ...(recentContacts ?? []).map(c => ({
      id: c.id,
      type: 'contact',
      description: `New ${terms.client.toLowerCase()} added: ${c.name}`,
      created_at: c.created_at,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1a1f2e' }}>
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#8891aa' }}>
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={`Open ${terms.jobs}`}
          value={openJobsCount ?? 0}
          icon={terms.jobIcon}
        />
        <StatCard
          label="Revenue MTD"
          value={revenueMTD}
          icon="💰"
          isCurrency
          color="#16a34a"
        />
        <StatCard
          label="Outstanding"
          value={outstanding}
          icon="⚠️"
          isCurrency
          color="#d97706"
        />
        <StatCard
          label="New Leads"
          value={newLeadsCount ?? 0}
          icon="📣"
          color="#7c3aed"
        />
      </div>

      {/* Kanban preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold" style={{ color: '#1a1f2e' }}>{terms.jobs} Board</h2>
          <a href="/pipeline" className="text-xs font-semibold" style={{ color: '#1e3a5f' }}>View all →</a>
        </div>
        <KanbanBoard jobs={(jobs as Job[]) ?? []} jobLabel={terms.job} />
      </div>

      {/* Activity feed */}
      <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e8ebf4' }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: '#1a1f2e' }}>Recent Activity</h2>
        <ActivityFeed items={activityItems} />
      </div>
    </div>
  )
}
