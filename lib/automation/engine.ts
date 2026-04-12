import { createClient, SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'

const AI_MODEL = 'claude-sonnet-4-20250514'

export type AutomationType =
  | 'QUOTE_FOLLOWUP'
  | 'QUOTE_NUDGE'
  | 'QUOTE_EXPIRY'
  | 'AUTO_INVOICE'
  | 'INVOICE_DUE_REMINDER'
  | 'INVOICE_OVERDUE_1'
  | 'INVOICE_OVERDUE_2'
  | 'REVIEW_REQUEST'
  | 'APPOINTMENT_REMINDER'
  | 'REACTIVATION'

export interface AutomationRunResult {
  type: AutomationType
  ran: number
  skipped: number
  errors: number
}

function buildEmailHtml(message: string, orgName: string): string {
  const lines = message
    .split('\n')
    .map(l =>
      l.trim()
        ? `<p style="margin:0 0 14px;font-size:15px;color:#454d66;line-height:1.6;">${l}</p>`
        : '<p style="margin:0 0 14px;">&nbsp;</p>'
    )
    .join('')
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f4f9;font-family:'Space Grotesk',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#1e3a5f;padding:20px 32px;border-radius:12px 12px 0 0;">
            <span style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.8);">${orgName}</span>
          </td>
        </tr>
        <tr>
          <td style="background:white;padding:32px;border-radius:0 0 12px 12px;">
            ${lines}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#8891aa;">Sent via <strong style="color:#1e3a5f;">AscendHQ</strong></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function hasRun(
  admin: SupabaseClient,
  orgId: string,
  type: AutomationType,
  entityId: string
): Promise<boolean> {
  const { data } = await admin
    .from('automation_runs')
    .select('id')
    .eq('org_id', orgId)
    .eq('automation_type', type)
    .eq('entity_id', entityId)
    .limit(1)
  return (data?.length ?? 0) > 0
}

async function hasRunRecently(
  admin: SupabaseClient,
  orgId: string,
  type: AutomationType,
  entityId: string,
  withinDays: number
): Promise<boolean> {
  const since = new Date(Date.now() - withinDays * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await admin
    .from('automation_runs')
    .select('id')
    .eq('org_id', orgId)
    .eq('automation_type', type)
    .eq('entity_id', entityId)
    .gte('created_at', since)
    .limit(1)
  return (data?.length ?? 0) > 0
}

async function generateMessage(
  anthropic: Anthropic,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const msg = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })
  const block = msg.content[0]
  return block.type === 'text' ? block.text : ''
}

async function sendAndLog(
  admin: SupabaseClient,
  resend: Resend,
  orgId: string,
  orgName: string,
  params: {
    type: AutomationType
    entityType: string
    entityId: string
    contactName: string
    toEmail: string
    subject: string
    message: string
  }
): Promise<boolean> {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@ascendhq.io',
    to: params.toEmail,
    subject: params.subject,
    html: buildEmailHtml(params.message, orgName),
  })

  await admin.from('automation_runs').insert({
    org_id: orgId,
    automation_type: params.type,
    entity_type: params.entityType,
    entity_id: params.entityId,
    contact_name: params.contactName,
    status: error ? 'error' : 'success',
    message_sent: error ? null : params.message.slice(0, 500),
    error: error ? (error as any).message ?? 'Unknown error' : null,
  })

  return !error
}

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
}

function daysAgo(d: number) {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString()
}

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 60 * 60 * 1000).toISOString()
}

export async function runAutomationsForOrg(orgId: string): Promise<AutomationRunResult[]> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data: org } = await admin
    .from('organizations')
    .select('id, name, industry')
    .eq('id', orgId)
    .single()

  if (!org) return []

  const { data: settings } = await admin
    .from('automation_settings')
    .select('*')
    .eq('org_id', orgId)
    .single()

  if (!settings) return []

  const systemPrompt = `You are writing a business email on behalf of ${org.name}, a ${org.industry} business. Write professional, warm, and personalized emails. Never mention AI. Sign off as the business owner. Keep emails under 150 words.`

  const results: AutomationRunResult[] = []

  // ─── 1. QUOTE_FOLLOWUP ────────────────────────────────────────────────────
  if (settings.quote_followup_enabled) {
    const result: AutomationRunResult = { type: 'QUOTE_FOLLOWUP', ran: 0, skipped: 0, errors: 0 }
    try {
      const windowEnd = hoursAgo(settings.quote_followup_hours)
      const windowStart = hoursAgo(settings.quote_followup_hours + 24)

      const { data: quotes } = await admin
        .from('quotes')
        .select('id, title, total, client_name, client_email, contacts(name, email)')
        .eq('org_id', orgId)
        .eq('status', 'sent')
        .gte('created_at', windowStart)
        .lte('created_at', windowEnd)

      for (const q of quotes ?? []) {
        const email = q.client_email || (q.contacts as any)?.email
        if (!email) { result.skipped++; continue }
        if (await hasRun(admin, orgId, 'QUOTE_FOLLOWUP', q.id)) { result.skipped++; continue }

        const clientName = q.client_name || (q.contacts as any)?.name || 'there'
        const message = await generateMessage(
          anthropic, systemPrompt,
          `Write a follow-up email to ${clientName} about their quote "${q.title}" worth $${q.total}. Check if they have any questions and encourage them to accept. Be warm and helpful.`
        )
        const ok = await sendAndLog(admin, resend, orgId, org.name, {
          type: 'QUOTE_FOLLOWUP', entityType: 'quote', entityId: q.id,
          contactName: clientName, toEmail: email,
          subject: `Following up on your quote from ${org.name}`,
          message,
        })
        ok ? result.ran++ : result.errors++
      }
    } catch (err) {
      result.errors++
    }
    results.push(result)
  }

  // ─── 2. QUOTE_NUDGE ───────────────────────────────────────────────────────
  if (settings.quote_nudge_enabled) {
    const result: AutomationRunResult = { type: 'QUOTE_NUDGE', ran: 0, skipped: 0, errors: 0 }
    try {
      const { data: quotes } = await admin
        .from('quotes')
        .select('id, title, total, client_name, client_email, contacts(name, email)')
        .eq('org_id', orgId)
        .eq('status', 'sent')
        .gte('created_at', hoursAgo(48))
        .lte('created_at', hoursAgo(24))

      for (const q of quotes ?? []) {
        const email = q.client_email || (q.contacts as any)?.email
        if (!email) { result.skipped++; continue }
        if (await hasRun(admin, orgId, 'QUOTE_NUDGE', q.id)) { result.skipped++; continue }

        const clientName = q.client_name || (q.contacts as any)?.name || 'there'
        const message = await generateMessage(
          anthropic, systemPrompt,
          `Write a gentle nudge email to ${clientName} about their quote "${q.title}" for $${q.total}. They received it 24+ hours ago. Remind them it's waiting, offer to answer questions, and make it easy to accept.`
        )
        const ok = await sendAndLog(admin, resend, orgId, org.name, {
          type: 'QUOTE_NUDGE', entityType: 'quote', entityId: q.id,
          contactName: clientName, toEmail: email,
          subject: `Your quote from ${org.name} is waiting`,
          message,
        })
        ok ? result.ran++ : result.errors++
      }
    } catch (err) {
      result.errors++
    }
    results.push(result)
  }

  // ─── 3. QUOTE_EXPIRY ──────────────────────────────────────────────────────
  if (settings.quote_expiry_enabled) {
    const result: AutomationRunResult = { type: 'QUOTE_EXPIRY', ran: 0, skipped: 0, errors: 0 }
    try {
      const { data: quotes } = await admin
        .from('quotes')
        .select('id, title, total, valid_until, client_name, client_email, contacts(name, email)')
        .eq('org_id', orgId)
        .eq('status', 'sent')
        .gte('valid_until', new Date().toISOString())
        .lte('valid_until', hoursFromNow(48))

      for (const q of quotes ?? []) {
        const email = q.client_email || (q.contacts as any)?.email
        if (!email) { result.skipped++; continue }
        if (await hasRun(admin, orgId, 'QUOTE_EXPIRY', q.id)) { result.skipped++; continue }

        const clientName = q.client_name || (q.contacts as any)?.name || 'there'
        const expiryDate = new Date(q.valid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
        const message = await generateMessage(
          anthropic, systemPrompt,
          `Write an urgent but friendly email to ${clientName} letting them know their quote "${q.title}" for $${q.total} expires on ${expiryDate}. Create a sense of urgency without being pushy. Encourage them to accept soon.`
        )
        const ok = await sendAndLog(admin, resend, orgId, org.name, {
          type: 'QUOTE_EXPIRY', entityType: 'quote', entityId: q.id,
          contactName: clientName, toEmail: email,
          subject: `Your quote from ${org.name} expires soon`,
          message,
        })
        ok ? result.ran++ : result.errors++
      }
    } catch (err) {
      result.errors++
    }
    results.push(result)
  }

  // ─── 4. AUTO_INVOICE ──────────────────────────────────────────────────────
  if (settings.auto_invoice_on_complete) {
    const result: AutomationRunResult = { type: 'AUTO_INVOICE', ran: 0, skipped: 0, errors: 0 }
    try {
      const { data: jobs } = await admin
        .from('jobs')
        .select('id, title, value, contact_id, contacts(name, email)')
        .eq('org_id', orgId)
        .eq('status', 'complete')
        .gte('completed_at', hoursAgo(1))

      for (const job of jobs ?? []) {
        const email = (job.contacts as any)?.email
        if (!email) { result.skipped++; continue }
        if (await hasRun(admin, orgId, 'AUTO_INVOICE', job.id)) { result.skipped++; continue }

        // Check no invoice already exists for this job
        const { data: existing } = await admin
          .from('invoices')
          .select('id')
          .eq('org_id', orgId)
          .eq('job_id', job.id)
          .limit(1)
        if (existing?.length) { result.skipped++; continue }

        // Generate invoice number
        const { count } = await admin
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', orgId)
        const invoiceNumber = `INV-${String((count ?? 0) + 1).padStart(4, '0')}`
        const due = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

        const { data: invoice } = await admin
          .from('invoices')
          .insert({
            org_id: orgId,
            contact_id: job.contact_id,
            job_id: job.id,
            number: invoiceNumber,
            status: 'sent',
            subtotal: job.value,
            tax: 0,
            total: job.value,
            due_at: due,
          })
          .select('id')
          .single()

        if (invoice) {
          await admin.from('invoice_items').insert({
            org_id: orgId,
            invoice_id: invoice.id,
            description: job.title,
            quantity: 1,
            unit_price: job.value,
            total: job.value,
          })

          await admin.from('jobs').update({ status: 'invoiced' }).eq('id', job.id)
        }

        const clientName = (job.contacts as any)?.name || 'there'
        const message = await generateMessage(
          anthropic, systemPrompt,
          `Write a short, professional email to ${clientName} letting them know their invoice for "${job.title}" (${invoiceNumber}, $${job.value}) is ready and due in 14 days. Thank them for their business.`
        )

        const ok = await sendAndLog(admin, resend, orgId, org.name, {
          type: 'AUTO_INVOICE', entityType: 'job', entityId: job.id,
          contactName: clientName, toEmail: email,
          subject: `Invoice ${invoiceNumber} from ${org.name}`,
          message,
        })
        ok ? result.ran++ : result.errors++
      }
    } catch (err) {
      result.errors++
    }
    results.push(result)
  }

  // ─── 5. INVOICE_DUE_REMINDER ──────────────────────────────────────────────
  if (settings.invoice_due_reminder_enabled) {
    const result: AutomationRunResult = { type: 'INVOICE_DUE_REMINDER', ran: 0, skipped: 0, errors: 0 }
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const { data: invoices } = await admin
        .from('invoices')
        .select('id, number, total, contacts(name, email)')
        .eq('org_id', orgId)
        .in('status', ['sent', 'overdue'])
        .gte('due_at', todayStart.toISOString())
        .lte('due_at', todayEnd.toISOString())

      for (const inv of invoices ?? []) {
        const email = (inv.contacts as any)?.email
        if (!email) { result.skipped++; continue }
        if (await hasRun(admin, orgId, 'INVOICE_DUE_REMINDER', inv.id)) { result.skipped++; continue }

        const clientName = (inv.contacts as any)?.name || 'there'
        const message = await generateMessage(
          anthropic, systemPrompt,
          `Write a friendly payment reminder to ${clientName}. Invoice ${inv.number} for $${inv.total} is due today. Keep it polite and include a clear call to action to pay.`
        )
        const ok = await sendAndLog(admin, resend, orgId, org.name, {
          type: 'INVOICE_DUE_REMINDER', entityType: 'invoice', entityId: inv.id,
          contactName: clientName, toEmail: email,
          subject: `Payment reminder: Invoice ${inv.number} due today`,
          message,
        })
        ok ? result.ran++ : result.errors++
      }
    } catch (err) {
      result.errors++
    }
    results.push(result)
  }

  // ─── 6. INVOICE_OVERDUE_1 ─────────────────────────────────────────────────
  if (settings.invoice_reminder_enabled) {
    const result: AutomationRunResult = { type: 'INVOICE_OVERDUE_1', ran: 0, skipped: 0, errors: 0 }
    try {
      const days = settings.invoice_overdue_days_1
      const { data: invoices } = await admin
        .from('invoices')
        .select('id, number, total, due_at, contacts(name, email)')
        .eq('org_id', orgId)
        .not('status', 'in', '("paid","cancelled","draft")')
        .lte('due_at', daysAgo(days))
        .gte('due_at', daysAgo(days + 1))

      for (const inv of invoices ?? []) {
        const email = (inv.contacts as any)?.email
        if (!email) { result.skipped++; continue }
        if (await hasRun(admin, orgId, 'INVOICE_OVERDUE_1', inv.id)) { result.skipped++; continue }

        const clientName = (inv.contacts as any)?.name || 'there'
        const message = await generateMessage(
          anthropic, systemPrompt,
          `Write a polite but firm first overdue notice to ${clientName}. Invoice ${inv.number} for $${inv.total} is ${days} day(s) overdue. Request prompt payment and offer to help with any questions.`
        )
        const ok = await sendAndLog(admin, resend, orgId, org.name, {
          type: 'INVOICE_OVERDUE_1', entityType: 'invoice', entityId: inv.id,
          contactName: clientName, toEmail: email,
          subject: `Invoice ${inv.number} is overdue — ${org.name}`,
          message,
        })
        ok ? result.ran++ : result.errors++
      }
    } catch (err) {
      result.errors++
    }
    results.push(result)
  }

  // ─── 7. INVOICE_OVERDUE_2 ─────────────────────────────────────────────────
  if (settings.invoice_reminder_enabled) {
    const result: AutomationRunResult = { type: 'INVOICE_OVERDUE_2', ran: 0, skipped: 0, errors: 0 }
    try {
      const days = settings.invoice_overdue_days_2
      const { data: invoices } = await admin
        .from('invoices')
        .select('id, number, total, due_at, contacts(name, email)')
        .eq('org_id', orgId)
        .not('status', 'in', '("paid","cancelled","draft")')
        .lte('due_at', daysAgo(days))
        .gte('due_at', daysAgo(days + 1))

      for (const inv of invoices ?? []) {
        const email = (inv.contacts as any)?.email
        if (!email) { result.skipped++; continue }
        if (await hasRun(admin, orgId, 'INVOICE_OVERDUE_2', inv.id)) { result.skipped++; continue }

        const clientName = (inv.contacts as any)?.name || 'there'
        const message = await generateMessage(
          anthropic, systemPrompt,
          `Write a firm second overdue notice to ${clientName}. Invoice ${inv.number} for $${inv.total} is now ${days} days overdue. This is a second reminder. Be professional but emphasize urgency and request immediate payment.`
        )
        const ok = await sendAndLog(admin, resend, orgId, org.name, {
          type: 'INVOICE_OVERDUE_2', entityType: 'invoice', entityId: inv.id,
          contactName: clientName, toEmail: email,
          subject: `Second notice: Invoice ${inv.number} overdue — ${org.name}`,
          message,
        })
        ok ? result.ran++ : result.errors++
      }
    } catch (err) {
      result.errors++
    }
    results.push(result)
  }

  // ─── 8. REVIEW_REQUEST ────────────────────────────────────────────────────
  if (settings.review_request_enabled) {
    const result: AutomationRunResult = { type: 'REVIEW_REQUEST', ran: 0, skipped: 0, errors: 0 }
    try {
      const days = settings.review_request_days
      const { data: jobs } = await admin
        .from('jobs')
        .select('id, title, contacts(name, email)')
        .eq('org_id', orgId)
        .in('status', ['complete', 'invoiced'])
        .gte('completed_at', daysAgo(days + 1))
        .lte('completed_at', daysAgo(days))

      for (const job of jobs ?? []) {
        const email = (job.contacts as any)?.email
        if (!email) { result.skipped++; continue }
        if (await hasRun(admin, orgId, 'REVIEW_REQUEST', job.id)) { result.skipped++; continue }

        const clientName = (job.contacts as any)?.name || 'there'
        const message = await generateMessage(
          anthropic, systemPrompt,
          `Write a friendly Google review request to ${clientName} after completing "${job.title}". Keep it under 100 words, be genuine, and make it easy for them to leave a review. Don't include a link — just ask warmly.`
        )
        const ok = await sendAndLog(admin, resend, orgId, org.name, {
          type: 'REVIEW_REQUEST', entityType: 'job', entityId: job.id,
          contactName: clientName, toEmail: email,
          subject: `How did we do? — ${org.name}`,
          message,
        })
        ok ? result.ran++ : result.errors++
      }
    } catch (err) {
      result.errors++
    }
    results.push(result)
  }

  // ─── 9. APPOINTMENT_REMINDER ──────────────────────────────────────────────
  if (settings.appointment_reminder_enabled) {
    const result: AutomationRunResult = { type: 'APPOINTMENT_REMINDER', ran: 0, skipped: 0, errors: 0 }
    try {
      const hours = settings.appointment_reminder_hours
      const { data: appointments } = await admin
        .from('appointments')
        .select('id, title, starts_at, contacts(name, email)')
        .eq('org_id', orgId)
        .eq('status', 'scheduled')
        .gte('starts_at', new Date().toISOString())
        .lte('starts_at', hoursFromNow(hours))

      for (const appt of appointments ?? []) {
        const email = (appt.contacts as any)?.email
        if (!email) { result.skipped++; continue }
        if (await hasRun(admin, orgId, 'APPOINTMENT_REMINDER', appt.id)) { result.skipped++; continue }

        const clientName = (appt.contacts as any)?.name || 'there'
        const apptTime = new Date(appt.starts_at).toLocaleString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
        })
        const message = await generateMessage(
          anthropic, systemPrompt,
          `Write a friendly appointment reminder to ${clientName}. Their appointment "${appt.title}" is scheduled for ${apptTime}. Remind them of the time and ask them to reach out if they need to reschedule.`
        )
        const ok = await sendAndLog(admin, resend, orgId, org.name, {
          type: 'APPOINTMENT_REMINDER', entityType: 'appointment', entityId: appt.id,
          contactName: clientName, toEmail: email,
          subject: `Reminder: Your appointment with ${org.name}`,
          message,
        })
        ok ? result.ran++ : result.errors++
      }
    } catch (err) {
      result.errors++
    }
    results.push(result)
  }

  // ─── 10. REACTIVATION ─────────────────────────────────────────────────────
  if (settings.reactivation_enabled) {
    const result: AutomationRunResult = { type: 'REACTIVATION', ran: 0, skipped: 0, errors: 0 }
    try {
      const days = settings.reactivation_days
      const cutoff = daysAgo(days)

      const { data: contacts } = await admin
        .from('contacts')
        .select('id, name, email')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .not('email', 'is', null)
        .or(`last_contact_at.lte.${cutoff},and(last_contact_at.is.null,created_at.lte.${cutoff})`)
        .limit(20) // Cap per run to avoid flooding

      for (const contact of contacts ?? []) {
        if (!contact.email) { result.skipped++; continue }
        if (await hasRunRecently(admin, orgId, 'REACTIVATION', contact.id, days)) { result.skipped++; continue }

        const message = await generateMessage(
          anthropic, systemPrompt,
          `Write a warm re-engagement email to ${contact.name || 'a valued client'}. It's been a while since we last connected. Reach out to check in, remind them of your services, and invite them to get back in touch. Keep it personal and not salesy.`
        )
        const ok = await sendAndLog(admin, resend, orgId, org.name, {
          type: 'REACTIVATION', entityType: 'contact', entityId: contact.id,
          contactName: contact.name || 'Client', toEmail: contact.email,
          subject: `Checking in — ${org.name}`,
          message,
        })
        ok ? result.ran++ : result.errors++
      }
    } catch (err) {
      result.errors++
    }
    results.push(result)
  }

  return results
}
