import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET() {
  const resend = new Resend(process.env.RESEND_API_KEY)

  const result = await resend.emails.send({
    from: 'AscendHQ <onboarding@resend.dev>',
    to: 'matthewhenneberry@yahoo.com',
    subject: 'AscendHQ test email',
    html: '<p>If you received this, Resend is working correctly.</p>',
  })

  return NextResponse.json(result)
}
