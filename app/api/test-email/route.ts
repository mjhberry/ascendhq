import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET() {
  const resend = new Resend(process.env.RESEND_API_KEY)

  const intendedTo: string = 'matthewhenneberry@yahoo.com'
  // TODO: Remove temp email override after domain verification
  const to = intendedTo === 'solutions@cmcomps.com' ? intendedTo : 'solutions@cmcomps.com'

  const result = await resend.emails.send({
    from: 'AscendHQ <onboarding@resend.dev>',
    to,
    subject: 'AscendHQ test email',
    html: '<p>If you received this, Resend is working correctly.</p>',
  })

  return NextResponse.json(result)
}
