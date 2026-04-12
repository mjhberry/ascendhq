import { createClient } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { runAutomationsForOrg } from '@/lib/automation/engine'

export const maxDuration = 300 // 5 minutes — Vercel Pro max for cron

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Get all orgs that have automation settings configured
  const { data: orgs, error } = await admin
    .from('organizations')
    .select('id, name')
    .order('created_at', { ascending: true })

  if (error || !orgs?.length) {
    return Response.json({ ran: 0, message: 'No orgs found' })
  }

  const summary: {
    org_id: string
    org_name: string
    results: { type: string; ran: number; skipped: number; errors: number }[]
    error?: string
  }[] = []

  for (const org of orgs) {
    try {
      const results = await runAutomationsForOrg(org.id)
      summary.push({ org_id: org.id, org_name: org.name, results })
    } catch (err) {
      summary.push({
        org_id: org.id,
        org_name: org.name,
        results: [],
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  const totalRan = summary.reduce(
    (acc, s) => acc + s.results.reduce((a, r) => a + r.ran, 0),
    0
  )

  return Response.json({
    success: true,
    orgs_processed: orgs.length,
    total_messages_sent: totalRan,
    summary,
    ran_at: new Date().toISOString(),
  })
}
