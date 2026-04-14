import { notFound } from 'next/navigation'
import InviteSignup from './InviteSignup'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/invite/${token}`,
    { cache: 'no-store' }
  )

  if (!res.ok) notFound()

  const { invitation } = await res.json()
  const org = invitation.organizations

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f2f4f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, backgroundColor: '#1e3a5f',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 12,
          }}>
            {org?.name?.slice(0, 1)?.toUpperCase() ?? 'A'}
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1f2e', margin: 0 }}>
            Join {org?.name ?? 'your team'}
          </h1>
          <p style={{ fontSize: 13, color: '#8891aa', marginTop: 6 }}>
            You've been invited as a <strong style={{ color: '#454d66' }}>{invitation.role}</strong>
          </p>
        </div>

        <InviteSignup token={token} email={invitation.email} orgName={org?.name ?? ''} role={invitation.role} />
      </div>
    </div>
  )
}
