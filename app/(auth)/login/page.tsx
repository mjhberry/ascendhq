'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f2f4f9' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ backgroundColor: '#1e3a5f' }}>
            <span className="text-white text-xl font-bold">A</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a1f2e' }}>AscendHQ</h1>
          <p className="text-sm mt-1" style={{ color: '#8891aa' }}>AI-powered business management</p>
        </div>

        <div className="rounded-2xl p-6 bg-white" style={{ border: '1px solid #e8ebf4' }}>
          {sent ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-3">📬</div>
              <div className="text-sm font-semibold mb-1" style={{ color: '#1a1f2e' }}>Check your email</div>
              <div className="text-xs" style={{ color: '#8891aa' }}>We sent a confirmation link to {email}</div>
            </div>
          ) : (
            <>
              <div className="flex rounded-lg p-1 mb-6" style={{ backgroundColor: '#f2f4f9' }}>
                {(['login', 'signup'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-all capitalize"
                    style={mode === m
                      ? { backgroundColor: 'white', color: '#1a1f2e', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                      : { color: '#8891aa' }
                    }>
                    {m === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: '#454d66' }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={{ border: '1px solid #e8ebf4', backgroundColor: '#f8f9fc', color: '#1a1f2e' }}
                    placeholder="you@company.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: '#454d66' }}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                    style={{ border: '1px solid #e8ebf4', backgroundColor: '#f8f9fc', color: '#1a1f2e' }}
                    placeholder="••••••••" />
                </div>
                {error && (
                  <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
                  style={{ backgroundColor: '#1e3a5f' }}>
                  {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
