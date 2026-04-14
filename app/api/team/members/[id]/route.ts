import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetId } = await params

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase
    .from('profiles')
    .select('id, org_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!caller?.org_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (caller.role !== 'owner') return NextResponse.json({ error: 'Only owners can remove members' }, { status: 403 })
  if (targetId === caller.id) return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })

  // Fetch target profile (must be in same org)
  const { data: target } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', targetId)
    .eq('org_id', caller.org_id)
    .single()

  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (target.role === 'owner') return NextResponse.json({ error: 'Cannot remove another owner' }, { status: 400 })

  // Find active jobs assigned to this member
  const { data: affectedJobs } = await supabase
    .from('jobs')
    .select('id, title')
    .eq('org_id', caller.org_id)
    .eq('assigned_to', targetId)
    .not('status', 'in', '("complete","invoiced","cancelled")')

  // Unassign jobs and add a note
  const unassignedJobs: { id: string; title: string }[] = []
  if (affectedJobs?.length) {
    const memberName = target.full_name ?? 'Removed member'
    for (const job of affectedJobs) {
      const { data: current } = await supabase
        .from('jobs')
        .select('description')
        .eq('id', job.id)
        .single()

      const existingDesc = current?.description ?? ''
      const note = `Previously assigned to ${memberName} — reassignment needed`
      const newDesc = existingDesc
        ? `${existingDesc}\n\n${note}`
        : note

      await supabase
        .from('jobs')
        .update({ assigned_to: null, description: newDesc })
        .eq('id', job.id)

      unassignedJobs.push({ id: job.id, title: job.title })
    }
  }

  // Use service role to delete auth user (required for admin.deleteUser)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Delete profile first (FK constraint), then auth user
  const { error: profileErr } = await admin
    .from('profiles')
    .delete()
    .eq('id', targetId)
    .eq('org_id', caller.org_id)

  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

  const { error: authErr } = await admin.auth.admin.deleteUser(targetId)
  if (authErr) {
    // Auth user deletion failed but profile is already gone — log and continue
    console.error('Failed to delete auth user:', authErr.message)
  }

  return NextResponse.json({ ok: true, unassignedJobs })
}
