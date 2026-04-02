import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { quoteId, clientName, clientEmail } = await request.json()
  if (!quoteId || !clientEmail) {
    return Response.json({ error: 'quoteId and clientEmail are required' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Verify the token belongs to a real user
  const token = authHeader.slice(7)
  const { data: { user }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: quote, error: quoteErr } = await admin
    .from('quotes')
    .select('*, organizations(name), contacts(name, email)')
    .eq('id', quoteId)
    .single()

  if (quoteErr || !quote) {
    return Response.json({ error: 'Quote not found' }, { status: 404 })
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/q/${quote.token}`
  const orgName = (quote.organizations as any)?.name ?? 'Your service provider'
  const recipientName = clientName || (quote.contacts as any)?.name || 'there'

  const { error: emailErr } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'quotes@ascendhq.io',
    to: clientEmail,
    subject: `Quote from ${orgName}: ${quote.title}`,
    html: buildEmailHTML({ quote, orgName, recipientName, publicUrl }),
  })

  if (emailErr) {
    return Response.json({ error: emailErr.message }, { status: 500 })
  }

  // Save client info and mark as sent
  await admin
    .from('quotes')
    .update({ status: 'sent', client_email: clientEmail, client_name: clientName || null })
    .eq('id', quoteId)

  return Response.json({ success: true })
}

function buildEmailHTML({
  quote,
  orgName,
  recipientName,
  publicUrl,
}: {
  quote: any
  orgName: string
  recipientName: string
  publicUrl: string
}): string {
  const lineItems: any[] = Array.isArray(quote.line_items) ? quote.line_items : []

  const lineItemRows = lineItems
    .map(
      li => `
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#454d66;border-bottom:1px solid #f2f4f9;">${li.description || '—'}</td>
        <td style="padding:10px 16px;font-size:13px;color:#8891aa;text-align:center;border-bottom:1px solid #f2f4f9;">${li.quantity}</td>
        <td style="padding:10px 16px;font-size:13px;color:#8891aa;text-align:right;border-bottom:1px solid #f2f4f9;font-family:monospace;">$${Number(li.unit_price).toFixed(2)}</td>
        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#1a1f2e;text-align:right;border-bottom:1px solid #f2f4f9;font-family:monospace;">$${(li.quantity * li.unit_price).toFixed(2)}</td>
      </tr>`
    )
    .join('')

  const validUntilStr = quote.valid_until
    ? new Date(quote.valid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f4f9;font-family:'Space Grotesk',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1e3a5f;padding:24px 32px;border-radius:12px 12px 0 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:rgba(255,255,255,0.15);border-radius:8px;font-size:16px;font-weight:700;color:white;margin-bottom:8px;">A</div>
                  <div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);">${orgName}</div>
                </td>
                <td align="right">
                  <div style="font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Quote</div>
                  <div style="font-size:22px;font-weight:700;color:#4ade80;font-family:monospace;">$${Number(quote.total).toFixed(2)}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:white;padding:32px;">

            <p style="margin:0 0 24px;font-size:15px;color:#454d66;">Hi ${recipientName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#454d66;">
              ${orgName} has sent you a quote. Please review the details below and use the buttons at the bottom to accept or decline.
            </p>

            <!-- Quote title -->
            <div style="background:#f8f9fc;border:1px solid #e8ebf4;border-radius:10px;padding:20px;margin-bottom:24px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#8891aa;margin-bottom:6px;">Quote</div>
              <div style="font-size:18px;font-weight:700;color:#1a1f2e;margin-bottom:6px;">${quote.title}</div>
              ${quote.description ? `<div style="font-size:13px;color:#8891aa;">${quote.description}</div>` : ''}
              ${validUntilStr ? `<div style="font-size:12px;color:#d97706;margin-top:8px;">⏳ Valid until ${validUntilStr}</div>` : ''}
            </div>

            <!-- Line items -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8ebf4;border-radius:10px;overflow:hidden;margin-bottom:24px;">
              <thead>
                <tr style="background:#f8f9fc;">
                  <th style="padding:10px 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#8891aa;text-align:left;">Description</th>
                  <th style="padding:10px 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#8891aa;text-align:center;">Qty</th>
                  <th style="padding:10px 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#8891aa;text-align:right;">Unit Price</th>
                  <th style="padding:10px 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#8891aa;text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>${lineItemRows}</tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding:10px 16px;font-size:12px;color:#8891aa;text-align:right;">Subtotal</td>
                  <td style="padding:10px 16px;font-size:12px;color:#8891aa;text-align:right;font-family:monospace;">$${Number(quote.subtotal).toFixed(2)}</td>
                </tr>
                ${quote.tax > 0 ? `
                <tr>
                  <td colspan="3" style="padding:4px 16px;font-size:12px;color:#8891aa;text-align:right;">Tax</td>
                  <td style="padding:4px 16px;font-size:12px;color:#8891aa;text-align:right;font-family:monospace;">$${Number(quote.tax).toFixed(2)}</td>
                </tr>` : ''}
                <tr style="background:#f8f9fc;">
                  <td colspan="3" style="padding:12px 16px;font-size:14px;font-weight:700;color:#1a1f2e;text-align:right;">Total</td>
                  <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#16a34a;text-align:right;font-family:monospace;">$${Number(quote.total).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            ${quote.notes ? `
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;margin-bottom:24px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#92400e;margin-bottom:6px;">Notes</div>
              <div style="font-size:13px;color:#78350f;">${quote.notes}</div>
            </div>` : ''}

            <!-- CTA buttons -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:8px;" width="50%">
                  <a href="${publicUrl}?action=decline"
                    style="display:block;text-align:center;padding:14px 20px;background:white;color:#454d66;font-size:14px;font-weight:600;text-decoration:none;border:2px solid #e8ebf4;border-radius:10px;">
                    Decline Quote
                  </a>
                </td>
                <td style="padding-left:8px;" width="50%">
                  <a href="${publicUrl}"
                    style="display:block;text-align:center;padding:14px 20px;background:#1e3a5f;color:white;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;">
                    Review &amp; Accept
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;text-align:center;border-radius:0 0 12px 12px;">
            <p style="margin:0;font-size:11px;color:#8891aa;">
              Sent via <strong style="color:#1e3a5f;">AscendHQ</strong> · This quote was prepared by ${orgName}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
