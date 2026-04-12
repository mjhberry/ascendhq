import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface IncomingContact {
  name?: string
  email?: string
  phone?: string
  company?: string
  type?: string
  notes?: string
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()
  if (!profile?.org_id) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const body = await req.json()
  const contacts: IncomingContact[] = body.contacts
  const batchOffset: number = body.batchOffset ?? 0

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0, errors: [] })
  }

  const orgId = profile.org_id

  // Bulk duplicate check — one query for all emails in this batch
  const emailsToCheck = contacts
    .map(c => c.email?.toLowerCase().trim())
    .filter((e): e is string => Boolean(e))

  const existingEmails = new Set<string>()
  if (emailsToCheck.length > 0) {
    const { data: existing } = await supabase
      .from('contacts')
      .select('email')
      .eq('org_id', orgId)
      .in('email', emailsToCheck)
    existing?.forEach(c => { if (c.email) existingEmails.add(c.email.toLowerCase()) })
  }

  const toInsert: object[] = []
  const skipped: { row: number; name: string; reason: string }[] = []
  const errors: { row: number; name: string; reason: string }[] = []
  // Map insert index back to original batch index for error reporting
  const insertIndexMap: number[] = []

  contacts.forEach((c, i) => {
    const csvRow = batchOffset + i + 2 // +1 for header row, +1 for 1-based display
    const name = c.name?.trim()
    if (!name) {
      errors.push({ row: csvRow, name: '(no name)', reason: 'Name is required' })
      return
    }
    const email = c.email?.toLowerCase().trim() || null
    if (email && existingEmails.has(email)) {
      skipped.push({ row: csvRow, name, reason: 'Duplicate email' })
      return
    }
    insertIndexMap.push(i)
    toInsert.push({
      org_id: orgId,
      name,
      email: email || null,
      phone: c.phone?.trim() || null,
      company: c.company?.trim() || null,
      type: c.type === 'commercial' ? 'commercial' : 'residential',
      notes: c.notes?.trim() || null,
      status: 'active',
    })
  })

  let importedCount = 0

  if (toInsert.length > 0) {
    const { data, error } = await supabase
      .from('contacts')
      .insert(toInsert)
      .select('id')

    if (error) {
      // Bulk insert failed — fall back to row-by-row for granular error reporting
      for (let i = 0; i < toInsert.length; i++) {
        const { error: rowErr } = await supabase.from('contacts').insert(toInsert[i])
        if (rowErr) {
          const origIndex = insertIndexMap[i]
          const csvRow = batchOffset + origIndex + 2
          errors.push({
            row: csvRow,
            name: contacts[origIndex].name?.trim() ?? '(unknown)',
            reason: rowErr.message,
          })
        } else {
          importedCount++
        }
      }
    } else {
      importedCount = data?.length ?? toInsert.length
    }
  }

  return NextResponse.json({
    imported: importedCount,
    skipped: skipped.length,
    errors,
    skipped_details: skipped,
  })
}
