'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'

type Category = 'home' | 'pro'

const homeIndustries = ['HVAC', 'Plumbing', 'Electrical', 'Roofing', 'Landscaping', 'Cleaning', 'Painting', 'Pest Control', 'Other']
const proIndustries = ['Legal', 'Accounting', 'Consulting', 'Financial', 'Medical', 'Real Estate', 'Insurance', 'Marketing', 'Other']

const categoryCards = [
  {
    value: 'home' as Category,
    icon: '🏠',
    title: 'Home Service',
    desc: 'HVAC, Plumbing, Roofing, Landscaping, Cleaning & more',
  },
  {
    value: 'pro' as Category,
    icon: '💼',
    title: 'Professional Service',
    desc: 'Legal, Accounting, Consulting, Finance, Medical & more',
  },
]

const roles = [
  { value: 'owner',      icon: '👑', title: 'Owner',         desc: 'I run the business' },
  { value: 'office',     icon: '🖥️', title: 'Office Admin',  desc: 'I handle operations & admin' },
  { value: 'technician', icon: '🔧', title: 'Technician',    desc: 'I do the field work' },
  { value: 'sales',      icon: '📣', title: 'Sales',         desc: 'I handle leads & growth' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState<Category | ''>('')
  const [industry, setIndustry] = useState('')
  const [role, setRole] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const industries = category === 'home' ? homeIndustries : proIndustries

  async function handleFinish() {
    if (!businessName.trim() || !fullName.trim()) { setError('Please fill in all fields.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Create org
    const slug = slugify(businessName) + '-' + Math.random().toString(36).slice(2, 6)
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({ name: businessName, industry, category, slug })
      .select().single()

    if (orgErr || !org) { setError(orgErr?.message ?? 'Failed to create organization.'); setLoading(false); return }

    // Create profile
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: user.id,
      org_id: org.id,
      full_name: fullName,
      email: user.email,
      role,
    })

    if (profileErr) { setError(profileErr.message); setLoading(false); return }
    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#f2f4f9' }}>
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3" style={{ backgroundColor: '#1e3a5f' }}>
            <span className="text-white text-lg font-bold">A</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#1a1f2e' }}>Set up AscendHQ</h1>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="rounded-full transition-all"
              style={{
                width: s === step ? 24 : 8,
                height: 8,
                backgroundColor: s <= step ? '#1e3a5f' : '#c8ddf5',
              }} />
          ))}
        </div>

        <div className="rounded-2xl p-6 bg-white" style={{ border: '1px solid #e8ebf4' }}>
          {/* Step 1: Category */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ color: '#1a1f2e' }}>What type of business?</h2>
              <p className="text-xs mb-5" style={{ color: '#8891aa' }}>This helps us tailor AscendHQ to your industry</p>
              <div className="grid grid-cols-2 gap-3">
                {categoryCards.map(card => (
                  <button key={card.value} onClick={() => { setCategory(card.value); setIndustry(''); setStep(2) }}
                    className="p-5 rounded-xl text-left transition-all"
                    style={{ border: `2px solid ${category === card.value ? '#1e3a5f' : '#e8ebf4'}`, backgroundColor: category === card.value ? '#e4eef9' : 'white' }}>
                    <div className="text-3xl mb-2">{card.icon}</div>
                    <div className="text-sm font-bold mb-1" style={{ color: '#1a1f2e' }}>{card.title}</div>
                    <div className="text-[11px]" style={{ color: '#8891aa' }}>{card.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Industry */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ color: '#1a1f2e' }}>Your industry</h2>
              <p className="text-xs mb-5" style={{ color: '#8891aa' }}>Select what best describes your business</p>
              <div className="grid grid-cols-3 gap-2">
                {industries.map(ind => (
                  <button key={ind} onClick={() => { setIndustry(ind); setStep(3) }}
                    className="px-3 py-3 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      border: `2px solid ${industry === ind ? '#1e3a5f' : '#e8ebf4'}`,
                      backgroundColor: industry === ind ? '#e4eef9' : 'white',
                      color: industry === ind ? '#1e3a5f' : '#454d66',
                    }}>
                    {ind}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="mt-4 text-xs" style={{ color: '#8891aa' }}>← Back</button>
            </div>
          )}

          {/* Step 3: Role */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ color: '#1a1f2e' }}>Your role</h2>
              <p className="text-xs mb-5" style={{ color: '#8891aa' }}>How do you fit in the business?</p>
              <div className="grid grid-cols-2 gap-3">
                {roles.map(r => (
                  <button key={r.value} onClick={() => { setRole(r.value); setStep(4) }}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{ border: `2px solid ${role === r.value ? '#1e3a5f' : '#e8ebf4'}`, backgroundColor: role === r.value ? '#e4eef9' : 'white' }}>
                    <div className="text-2xl mb-1">{r.icon}</div>
                    <div className="text-sm font-bold mb-0.5" style={{ color: '#1a1f2e' }}>{r.title}</div>
                    <div className="text-[11px]" style={{ color: '#8891aa' }}>{r.desc}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="mt-4 text-xs" style={{ color: '#8891aa' }}>← Back</button>
            </div>
          )}

          {/* Step 4: Account details */}
          {step === 4 && (
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ color: '#1a1f2e' }}>Almost there!</h2>
              <p className="text-xs mb-5" style={{ color: '#8891aa' }}>Tell us about your business</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: '#454d66' }}>Business Name</label>
                  <input value={businessName} onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex HVAC Services"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #e8ebf4', backgroundColor: '#f8f9fc', color: '#1a1f2e' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: '#454d66' }}>Your Full Name</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Jane Smith"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #e8ebf4', backgroundColor: '#f8f9fc', color: '#1a1f2e' }} />
                </div>
                {error && (
                  <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                    {error}
                  </div>
                )}
                <button onClick={handleFinish} disabled={loading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: '#1e3a5f' }}>
                  {loading ? 'Setting up…' : 'Launch AscendHQ →'}
                </button>
              </div>
              <button onClick={() => setStep(3)} className="mt-4 text-xs" style={{ color: '#8891aa' }}>← Back</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
