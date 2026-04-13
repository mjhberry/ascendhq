'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface InviteSignupProps {
  token: string
  email: string
  orgName: string
  role: string
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #e8ebf4',
  backgroundColor: '#f8f9fc',
  color: '#1a1f2e',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  color: '#8891aa',
  display: 'block',
  marginBottom: 6,
}

export default function InviteSignup({ token, email, orgName, role }: InviteSignupProps) {
  const [form, setForm] = useState({ full_name: '', password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Full name is required.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, full_name: form.full_name, password: form.password }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to create account.')
      setLoading(false)
      return
    }

    // Auto sign in
    const supabase = createClient()
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: form.password })
    if (signInErr) {
      setError('Account created! Please sign in at /login.')
      setLoading(false)
      return
    }

    setDone(true)
    window.location.href = '/dashboard'
  }

  if (done) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: 16, padding: 32, textAlign: 'center', border: '1px solid #e8ebf4' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1f2e' }}>Welcome to {orgName}!</div>
        <div style={{ fontSize: 13, color: '#8891aa', marginTop: 6 }}>Redirecting you to your dashboard…</div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: 16, padding: 28, border: '1px solid #e8ebf4', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
      <div style={{ marginBottom: 20, padding: '10px 14px', backgroundColor: '#f8f9fc', borderRadius: 8, border: '1px solid #e8ebf4' }}>
        <div style={{ fontSize: 11, color: '#8891aa', marginBottom: 2 }}>Signing up as</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1f2e' }}>{email}</div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input
            value={form.full_name}
            onChange={e => set('full_name', e.target.value)}
            placeholder="Jane Smith"
            style={inputStyle}
            autoFocus
          />
        </div>
        <div>
          <label style={labelStyle}>Password *</label>
          <input
            type="password"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            placeholder="At least 8 characters"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Confirm Password *</label>
          <input
            type="password"
            value={form.confirm_password}
            onChange={e => set('confirm_password', e.target.value)}
            placeholder="Repeat password"
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '11px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
            backgroundColor: '#1e3a5f', color: 'white', border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.65 : 1,
            marginTop: 4,
          }}
        >
          {loading ? 'Creating account…' : `Join ${orgName}`}
        </button>
      </form>
    </div>
  )
}
