import { createClient } from '@supabase/supabase-js'
import QuoteAcceptance from './QuoteAcceptance'
import type { Quote } from '@/types'

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: quote } = await admin
    .from('quotes')
    .select('*, organizations(name), contacts(name)')
    .eq('token', token)
    .single()

  if (!quote) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f4f9', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1f2e', marginBottom: 8 }}>Quote not found</h1>
          <p style={{ fontSize: 14, color: '#8891aa' }}>This link may have expired or been revoked.</p>
        </div>
      </div>
    )
  }

  const orgName = (quote.organizations as any)?.name ?? 'Your service provider'

  return (
    <QuoteAcceptance
      quote={quote as Quote}
      orgName={orgName}
      token={token}
    />
  )
}
