import { createClient } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { token, action } = await request.json()

  if (!token || !['accept', 'decline'].includes(action)) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Confirm the quote exists and is in a respondable state
  const { data: quote, error: fetchErr } = await admin
    .from('quotes')
    .select('id, status')
    .eq('token', token)
    .single()

  if (fetchErr || !quote) {
    return Response.json({ error: 'Quote not found' }, { status: 404 })
  }
  if (quote.status === 'accepted' || quote.status === 'declined') {
    return Response.json({ error: 'Quote has already been responded to' }, { status: 409 })
  }

  const updates =
    action === 'accept'
      ? { status: 'accepted', accepted_at: new Date().toISOString() }
      : { status: 'declined' }

  const { error: updateErr } = await admin
    .from('quotes')
    .update(updates)
    .eq('token', token)

  if (updateErr) {
    return Response.json({ error: updateErr.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
