import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: invitation } = await admin
    .from('invitations')
    .select('id, email, role, expires_at, accepted_at, org_id, organizations(name, industry)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invitation) {
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
  }

  return NextResponse.json({ invitation })
}
