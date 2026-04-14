import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { token, full_name, password } = await req.json()
  if (!token || !full_name || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Use service role to bypass RLS — this route is unauthenticated
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Look up invitation using service role (bypasses RLS)
  const { data: invitation, error: invErr } = await adminSupabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (invErr || !invitation) {
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 })
  }

  // Create auth user
  const { data: authData, error: authErr } = await adminSupabase.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
  })

  if (authErr) {
    if (authErr.message.includes('already been registered')) {
      return NextResponse.json({ error: 'An account with this email already exists. Please sign in instead.' }, { status: 400 })
    }
    return NextResponse.json({ error: authErr.message }, { status: 500 })
  }

  const userId = authData.user!.id

  // Create profile
  const { error: profileErr } = await adminSupabase
    .from('profiles')
    .insert({
      id: userId,
      org_id: invitation.org_id,
      full_name: full_name.trim(),
      email: invitation.email,
      role: invitation.role,
      status: 'active',
      color: '#3b6cb0',
    })

  if (profileErr) {
    // Cleanup: delete the auth user if profile creation failed
    await adminSupabase.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: profileErr.message }, { status: 500 })
  }

  // Mark invitation as accepted
  await adminSupabase
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  return NextResponse.json({ ok: true, email: invitation.email })
}
