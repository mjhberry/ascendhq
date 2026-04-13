import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

  const { data: members, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, phone, job_title, status, color, avatar_url, created_at')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ members })
}

export async function PATCH(req: Request) {
  const supabase = await createServerClient()
  const profile = await getAuthorizedProfile(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'owner' && profile.role !== 'office') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, role, job_title, status, color } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing member id' }, { status: 400 })

  // Prevent demoting the owner if there's only one owner
  if (role && role !== 'owner') {
    const { data: target } = await supabase.from('profiles').select('role').eq('id', id).single()
    if (target?.role === 'owner') {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        .eq('org_id', profile.org_id).eq('role', 'owner')
      if ((count ?? 0) <= 1) {
        return NextResponse.json({ error: 'Cannot demote the only owner' }, { status: 400 })
      }
    }
  }

  const updates: Record<string, unknown> = {}
  if (role !== undefined) updates.role = role
  if (job_title !== undefined) updates.job_title = job_title
  if (status !== undefined) updates.status = status
  if (color !== undefined) updates.color = color

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .eq('org_id', profile.org_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const supabase = await createServerClient()
  const profile = await getAuthorizedProfile(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can remove members' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  if (id === profile.id) return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })

  // Nullify org_id instead of deleting the auth user (preserves auth account)
  const { error } = await supabase
    .from('profiles')
    .update({ org_id: null, status: 'inactive' })
    .eq('id', id)
    .eq('org_id', profile.org_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
