import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

async function getAuthorizedProfile(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('*, organizations(*)').eq('id', user.id).single()
  if (!profile?.org_id) return null
  return profile
}

export async function GET() {
  const supabase = await createServerClient()
  const profile = await getAuthorizedProfile(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'owner' && profile.role !== 'office') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: invitations, error } = await supabase
    .from('invitations')
    .select('*, profiles!invited_by(full_name)')
    .eq('org_id', profile.org_id)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invitations })
}

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const profile = await getAuthorizedProfile(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'owner' && profile.role !== 'office') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  console.log('1. Auth passed', { userId: profile.id, orgId: profile.org_id })

  const { email, role } = await req.json()
  if (!email || !role) return NextResponse.json({ error: 'Missing email or role' }, { status: 400 })
  console.log('2. Validation passed', { email, role })

  // Check if user is already a member
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('org_id', profile.org_id)
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()
  if (existing) return NextResponse.json({ error: 'This person is already a team member' }, { status: 400 })

  // Cancel any existing pending invitations for this email
  await supabase
    .from('invitations')
    .delete()
    .eq('org_id', profile.org_id)
    .eq('email', email.toLowerCase().trim())
    .is('accepted_at', null)

  const { data: invitation, error: invErr } = await supabase
    .from('invitations')
    .insert({
      org_id: profile.org_id,
      email: email.toLowerCase().trim(),
      role,
      invited_by: profile.id,
    })
    .select()
    .single()

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })
  console.log('3. Invitation created', { invitationId: invitation.id, token: invitation.token })

  const org = (profile as any).organizations
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`

  const resend = new Resend(process.env.RESEND_API_KEY)
  console.log('4. About to send email', { to: email, from: 'noreply@cmcomps.com' })
  const { data: emailData, error: emailError } = await resend.emails.send({
    from: 'AscendHQ <noreply@cmcomps.com>',
    to: email,
    subject: `You've been invited to join ${org.name} on AscendHQ`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #1a1f2e; margin-bottom: 8px;">You're invited!</h2>
        <p style="color: #454d66; font-size: 14px; line-height: 1.6;">
          ${profile.full_name ?? 'Your team'} has invited you to join <strong>${org.name}</strong> on AscendHQ as a <strong>${role}</strong>.
        </p>
        <div style="margin: 28px 0;">
          <a href="${inviteUrl}" style="background: #1e3a5f; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #8891aa; font-size: 12px;">This invitation expires in 7 days. If you weren't expecting this, you can safely ignore it.</p>
      </div>
    `,
  })

  console.log('5. Resend response', { data: emailData, error: emailError })

  if (emailError) {
    console.error('Resend error sending invitation email:', emailError)
    return NextResponse.json({ error: 'Invitation created but email failed to send', emailError }, { status: 500 })
  }

  return NextResponse.json({ invitation })
}

export async function DELETE(req: Request) {
  const supabase = await createServerClient()
  const profile = await getAuthorizedProfile(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'owner' && profile.role !== 'office') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', id)
    .eq('org_id', profile.org_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
