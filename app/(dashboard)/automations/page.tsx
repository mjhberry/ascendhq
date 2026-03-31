import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StatusPill from '@/components/shared/StatusPill'
import { formatDateTime } from '@/lib/utils'
import type { Automation } from '@/types'

const triggerLabel: Record<string, string> = {
  job_complete: 'Job Completed',
  invoice_overdue: 'Invoice Overdue',
  new_lead: 'New Lead',
  appointment_reminder: 'Appointment Reminder',
}

const triggerIcon: Record<string, string> = {
  job_complete: '✅',
  invoice_overdue: '⚠️',
  new_lead: '📣',
  appointment_reminder: '📅',
}

const defaultAutomations = [
  { name: 'New Lead Auto-Reply', trigger: 'new_lead', description: 'Send a personalized AI reply to every new lead within minutes' },
  { name: 'Overdue Invoice Reminder', trigger: 'invoice_overdue', description: 'Automatically send polite payment reminders for overdue invoices' },
  { name: 'Job Complete Review Request', trigger: 'job_complete', description: 'Ask clients for a Google review after every completed job' },
  { name: 'Appointment Reminder', trigger: 'appointment_reminder', description: 'Send reminder emails 24 hours before scheduled appointments' },
]

export default async function AutomationsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile?.org_id) redirect('/onboarding')

  const { data: automations } = await supabase
    .from('automations')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  const active = (automations as Automation[]) ?? []

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1a1f2e' }}>Automations</h1>
          <p className="text-xs mt-0.5" style={{ color: '#8891aa' }}>AI-powered workflows that run automatically</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active', value: active.filter(a => a.status === 'active').length, color: '#16a34a' },
          { label: 'Total Runs', value: active.reduce((s, a) => s + a.run_count, 0), color: '#1e3a5f' },
          { label: 'Paused', value: active.filter(a => a.status === 'paused').length, color: '#d97706' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 bg-white" style={{ border: '1px solid #e8ebf4' }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8891aa' }}>{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Active automations */}
      {active.length > 0 && (
        <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid #e8ebf4' }}>
          <div className="p-4" style={{ borderBottom: '1px solid #e8ebf4' }}>
            <h2 className="text-sm font-bold" style={{ color: '#1a1f2e' }}>Your Automations</h2>
          </div>
          {active.map((auto, i) => (
            <div key={auto.id} className="flex items-center justify-between px-4 py-4"
              style={{ borderBottom: i < active.length - 1 ? '1px solid #f2f4f9' : 'none' }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{triggerIcon[auto.trigger] ?? '⚡'}</span>
                <div>
                  <div className="text-xs font-semibold" style={{ color: '#1a1f2e' }}>{auto.name}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: '#8891aa' }}>
                    Trigger: {triggerLabel[auto.trigger] ?? auto.trigger}
                    {auto.last_run_at && ` · Last run ${formatDateTime(auto.last_run_at)}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: '#8891aa', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                  {auto.run_count} runs
                </span>
                <StatusPill status={auto.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Available automations to add */}
      <div>
        <h2 className="text-sm font-bold mb-3" style={{ color: '#1a1f2e' }}>
          {active.length === 0 ? 'Available Automations' : 'Add More Automations'}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {defaultAutomations.map(auto => {
            const alreadyAdded = active.some(a => a.trigger === auto.trigger)
            return (
              <div key={auto.trigger} className="rounded-xl p-4 bg-white"
                style={{ border: '1px solid #e8ebf4', opacity: alreadyAdded ? 0.5 : 1 }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{triggerIcon[auto.trigger]}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-semibold" style={{ color: '#1a1f2e' }}>{auto.name}</div>
                      {alreadyAdded
                        ? <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>Active</span>
                        : <button className="text-[10px] px-2 py-1 rounded-lg font-semibold text-white" style={{ backgroundColor: '#1e3a5f' }}>
                            Enable
                          </button>
                      }
                    </div>
                    <p className="text-[11px]" style={{ color: '#8891aa' }}>{auto.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
