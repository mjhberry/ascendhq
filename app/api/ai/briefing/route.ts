import { NextRequest, NextResponse } from 'next/server'
import { anthropic, AI_MODEL } from '@/lib/ai/client'
import { createServerClient } from '@/lib/supabase/server'
import { automationPrompts } from '@/lib/ai/prompts'

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.organizations) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const org = profile.organizations
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  const [
    { count: openJobs },
    { count: overdueInvoices },
    { count: newLeads },
    { count: todayAppointments },
  ] = await Promise.all([
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('org_id', profile.org_id).in('status', ['new', 'in_progress', 'review']),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('org_id', profile.org_id).eq('status', 'overdue'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('org_id', profile.org_id).eq('status', 'new'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('org_id', profile.org_id).gte('starts_at', startOfDay).lte('starts_at', endOfDay),
  ])

  const prompt = automationPrompts.morningBriefing({
    orgName: org.name,
    openJobs: openJobs ?? 0,
    overdueInvoices: overdueInvoices ?? 0,
    newLeads: newLeads ?? 0,
    todayAppointments: todayAppointments ?? 0,
  })

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('')

  await supabase.from('ai_logs').insert({
    org_id: profile.org_id,
    user_id: user.id,
    module: 'briefing',
    prompt,
    response: text,
    tokens_used: response.usage.input_tokens + response.usage.output_tokens,
  })

  return NextResponse.json({ briefing: text })
}
