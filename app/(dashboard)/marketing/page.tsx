import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StatusPill from '@/components/shared/StatusPill'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Lead } from '@/types'

const sourceIcon: Record<string, string> = {
  website: '🌐', google: '🔍', referral: '🤝', facebook: '📘', other: '📣',
}

export default async function MarketingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile?.org_id) redirect('/onboarding')

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  const all = (leads as Lead[]) ?? []
  const newLeads = all.filter(l => l.status === 'new').length
  const wonLeads = all.filter(l => l.status === 'won').length
  const wonValue = all.filter(l => l.status === 'won').reduce((s, l) => s + l.value, 0)
  const convRate = all.length > 0 ? Math.round((wonLeads / all.length) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: '#1a1f2e' }}>Marketing & Leads</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'New Leads', value: newLeads, icon: '📣', color: '#7c3aed' },
          { label: 'Total Leads', value: all.length, icon: '👥', color: '#1e3a5f' },
          { label: 'Won', value: wonLeads, icon: '🏆', color: '#16a34a' },
          { label: 'Conv. Rate', value: `${convRate}%`, icon: '📈', color: '#2563eb' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 bg-white" style={{ border: '1px solid #e8ebf4' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8891aa' }}>{s.label}</span>
              <span>{s.icon}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Leads table */}
      <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid #e8ebf4' }}>
        <div className="p-4" style={{ borderBottom: '1px solid #e8ebf4' }}>
          <h2 className="text-sm font-bold" style={{ color: '#1a1f2e' }}>All Leads</h2>
        </div>
        {all.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-3xl mb-2">📣</div>
            <div className="text-sm font-semibold mb-1" style={{ color: '#1a1f2e' }}>No leads yet</div>
            <div className="text-xs" style={{ color: '#8891aa' }}>Leads will appear here from your website, Google, or referrals</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #e8ebf4' }}>
                {['Name', 'Source', 'Service', 'Status', 'Value', 'Date'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#8891aa' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {all.map((lead, i) => (
                <tr key={lead.id} style={{ borderBottom: i < all.length - 1 ? '1px solid #f2f4f9' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8f9fc')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td className="px-4 py-3">
                    <div className="text-xs font-semibold" style={{ color: '#1a1f2e' }}>{lead.name}</div>
                    <div className="text-[10px]" style={{ color: '#8891aa' }}>{lead.email ?? lead.phone ?? ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{sourceIcon[lead.source ?? 'other'] ?? '📣'}</span>
                    <span className="text-[10px] ml-1 capitalize" style={{ color: '#454d66' }}>{lead.source ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#454d66' }}>{lead.service ?? '—'}</td>
                  <td className="px-4 py-3"><StatusPill status={lead.status} /></td>
                  <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                    {lead.value > 0 ? formatCurrency(lead.value) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8891aa' }}>{formatDate(lead.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
