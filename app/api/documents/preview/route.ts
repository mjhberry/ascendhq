import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    return Response.json({ error: 'path is required' }, { status: 400 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Path format is {orgId}/{uuid}-{filename} — verify it belongs to this org
  const pathOrgId = path.split('/')[0]
  if (pathOrgId !== profile.org_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Verify the document record exists in the org
  const { data: doc } = await supabase
    .from('documents')
    .select('id')
    .eq('storage_path', path)
    .eq('org_id', profile.org_id)
    .single()

  if (!doc) {
    return Response.json({ error: 'Document not found' }, { status: 404 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await admin.storage
    .from('documents')
    .createSignedUrl(path, 3600) // 60 minute expiry

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ signedUrl: data.signedUrl })
}
