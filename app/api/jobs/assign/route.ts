import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function PATCH(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('*, organizations(*)').eq('id', user.id).single()
  if (!profile?.org_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { job_id, assigned_to } = await req.json()
  if (!job_id) return NextResponse.json({ error: 'Missing job_id' }, { status: 400 })

  const { data: job, error } = await supabase
    .from('jobs')
    .update({ assigned_to: assigned_to ?? null })
    .eq('id', job_id)
    .eq('org_id', profile.org_id)
    .select('*, contacts(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send notification email to assignee if they have an email
  if (assigned_to) {
    try {
      const { data: assignee } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', assigned_to)
        .single()

      if (assignee?.email) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const org = (profile as any).organizations
        await resend.emails.send({
          from: `${org.name} <onboarding@resend.dev>`,
          to: assignee.email,
          subject: `You've been assigned: ${job.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
              <h2 style="color: #1a1f2e; margin-bottom: 8px;">New Job Assignment</h2>
              <p style="color: #454d66; font-size: 14px; line-height: 1.6;">
                Hi ${assignee.full_name ?? 'there'},<br/><br/>
                You've been assigned to a job at <strong>${org.name}</strong>.
              </p>
              <div style="background: #f8f9fc; border: 1px solid #e8ebf4; border-radius: 10px; padding: 16px; margin: 20px 0;">
                <div style="font-size: 15px; font-weight: 700; color: #1a1f2e;">${job.title}</div>
                ${(job.contacts as any)?.name ? `<div style="font-size: 12px; color: #8891aa; margin-top: 4px;">Client: ${(job.contacts as any).name}</div>` : ''}
              </div>
              <p style="color: #8891aa; font-size: 12px;">Log in to AscendHQ to view the full job details.</p>
            </div>
          `,
        })
      }
    } catch {
      // Don't fail the assignment if email fails
      console.error('Failed to send assignment notification')
    }
  }

  return NextResponse.json({ ok: true, job })
}
