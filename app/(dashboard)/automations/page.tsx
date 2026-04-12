import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AutomationsClient from './AutomationsClient'

export default async function AutomationsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()
  if (!profile?.org_id) redirect('/onboarding')

  const orgId = profile.org_id

  // Ensure automation_settings row exists (create defaults on first visit)
  let { data: settings } = await supabase
    .from('automation_settings')
    .select('*')
    .eq('org_id', orgId)
    .single()

  if (!settings) {
    const { data: inserted } = await supabase
      .from('automation_settings')
      .insert({ org_id: orgId })
      .select('*')
      .single()
    settings = inserted
  }

  if (!settings) {
    // Fallback: use a minimal defaults object so the page still renders
    settings = {
      id: '',
      org_id: orgId,
      quote_followup_enabled: true,
      quote_nudge_enabled: true,
      quote_expiry_enabled: true,
      auto_invoice_on_complete: true,
      invoice_due_reminder_enabled: true,
      invoice_reminder_enabled: true,
      review_request_enabled: true,
      appointment_reminder_enabled: true,
      reactivation_enabled: true,
    } as any
  }

  // Run counts this month per automation type
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: monthlyRuns } = await supabase
    .from('automation_runs')
    .select('automation_type, created_at')
    .eq('org_id', orgId)
    .gte('created_at', monthStart.toISOString())

  // Group by type: count + last run
  const statsMap: Record<string, { count: number; last_run: string | null }> = {}
  for (const row of monthlyRuns ?? []) {
    const t = row.automation_type
    if (!statsMap[t]) statsMap[t] = { count: 0, last_run: null }
    statsMap[t].count++
    if (!statsMap[t].last_run || row.created_at > statsMap[t].last_run!) {
      statsMap[t].last_run = row.created_at
    }
  }
  const runStats = Object.entries(statsMap).map(([type, s]) => ({ type, ...s }))

  // Last 50 runs for activity log
  const { data: recentRuns } = await supabase
    .from('automation_runs')
    .select('id, automation_type, contact_name, message_sent, status, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50)

  console.log('AUTOMATIONS PAGE LOADED', { settings, stats: runStats, logs: recentRuns })

  return (
    <>
    <h1>AUTOMATION ENGINE V2</h1>
    <AutomationsClient
      initialSettings={settings}
      runStats={runStats}
      recentRuns={recentRuns ?? []}
    />
    </>
  )
}
