import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DocumentsPageClient from './DocumentsPageClient'

export default async function DocumentsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile?.org_id) redirect('/onboarding')

  const { data: documents } = await supabase
    .from('documents')
    .select('*, contacts(name), jobs(title)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  return (
    <DocumentsPageClient
      documents={documents ?? []}
      orgId={profile.org_id}
      userId={user.id}
    />
  )
}
