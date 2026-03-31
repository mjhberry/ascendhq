import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile?.org_id) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const { data, error } = await supabase
    .from('invoices')
    .select('*, contacts(name), invoice_items(*)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoices: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile?.org_id) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const body = await req.json()
  const { items, ...invoiceData } = body

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({ ...invoiceData, org_id: profile.org_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items?.length > 0) {
    const lineItems = items.map((item: any) => ({
      ...item,
      invoice_id: invoice.id,
      org_id: profile.org_id,
      total: item.quantity * item.unit_price,
    }))
    await supabase.from('invoice_items').insert(lineItems)
  }

  return NextResponse.json({ invoice }, { status: 201 })
}
