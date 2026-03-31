import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTerms } from '@/lib/terminology'
import StatusPill from '@/components/shared/StatusPill'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'

export default async function SchedulePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*, organizations(*)').eq('id', user.id).single()
  if (!profile?.org_id) redirect('/onboarding')

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, contacts(name), jobs(title)')
    .eq('org_id', profile.org_id)
    .gte('starts_at', weekStart.toISOString())
    .lte('starts_at', weekEnd.toISOString())
    .order('starts_at')

  const terms = getTerms(profile.organizations.industry)

  // Group by day
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const grouped: Record<string, typeof appointments> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const key = d.toDateString()
    grouped[key] = (appointments ?? []).filter(a => new Date(a.starts_at).toDateString() === key)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1a1f2e' }}>{terms.schedule}</h1>
          <p className="text-xs mt-0.5" style={{ color: '#8891aa' }}>
            Week of {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Object.entries(grouped).map(([dateStr, appts], idx) => {
          const date = new Date(dateStr)
          const isToday = date.toDateString() === now.toDateString()
          return (
            <div key={dateStr} className="rounded-xl p-3"
              style={{
                backgroundColor: isToday ? '#e4eef9' : 'white',
                border: `1px solid ${isToday ? '#c8ddf5' : '#e8ebf4'}`,
                minHeight: 120,
              }}>
              <div className="mb-2">
                <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: isToday ? '#1e3a5f' : '#8891aa' }}>
                  {days[idx].slice(0, 3)}
                </div>
                <div className="text-lg font-bold" style={{ color: isToday ? '#1e3a5f' : '#1a1f2e' }}>
                  {date.getDate()}
                </div>
              </div>
              <div className="space-y-1.5">
                {(appts ?? []).map(a => (
                  <div key={a.id} className="rounded-lg px-2 py-1.5 text-[10px]"
                    style={{ backgroundColor: isToday ? 'white' : '#f8f9fc', border: '1px solid #e8ebf4' }}>
                    <div className="font-semibold truncate" style={{ color: '#1a1f2e' }}>{a.title}</div>
                    {(a.contacts as any)?.name && (
                      <div className="truncate" style={{ color: '#8891aa' }}>{(a.contacts as any).name}</div>
                    )}
                    <div style={{ color: '#8891aa', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                      {new Date(a.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                {(appts ?? []).length === 0 && (
                  <div className="text-[10px] text-center py-2" style={{ color: '#8891aa' }}>—</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Upcoming list */}
      <div className="rounded-xl bg-white" style={{ border: '1px solid #e8ebf4' }}>
        <div className="p-4" style={{ borderBottom: '1px solid #e8ebf4' }}>
          <h2 className="text-sm font-bold" style={{ color: '#1a1f2e' }}>All Upcoming</h2>
        </div>
        {(appointments ?? []).length === 0
          ? <div className="py-8 text-center text-xs" style={{ color: '#8891aa' }}>No appointments this week</div>
          : (appointments ?? []).map(a => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid #f2f4f9' }}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">📅</div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: '#1a1f2e' }}>{a.title}</div>
                  <div className="text-[10px]" style={{ color: '#8891aa' }}>
                    {(a.contacts as any)?.name && `${(a.contacts as any).name} · `}
                    {formatDateTime(a.starts_at)}
                  </div>
                </div>
              </div>
              <StatusPill status={a.status} />
            </div>
          ))
        }
      </div>
    </div>
  )
}
