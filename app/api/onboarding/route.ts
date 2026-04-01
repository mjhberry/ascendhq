import { createClient } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { slugify } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Missing authorization' }, { status: 401 })
  }
  const token = authHeader.slice(7)

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { user }, error: userError } = await admin.auth.getUser(token)
  if (userError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, industry, category, role, full_name, email } = await request.json()

  const slug = slugify(name) + '-' + Math.random().toString(36).slice(2, 6)
  const { data: org, error: orgErr } = await admin
    .from('organizations')
    .insert({ name, industry, category, slug })
    .select()
    .single()

  if (orgErr || !org) {
    return Response.json({ error: orgErr?.message ?? 'Failed to create organization' }, { status: 500 })
  }

  const { error: profileErr } = await admin.from('profiles').upsert({
    id: user.id,
    org_id: org.id,
    full_name,
    email: email ?? user.email,
    role,
  })

  if (profileErr) {
    return Response.json({ error: profileErr.message }, { status: 500 })
  }

  return Response.json({ org })
}
