import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InvoiceList from '@/components/billing/InvoiceList'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import type { Invoice } from '@/types'

export default async function BillingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*, organizations(*)').eq('id', user.id).single()
  if (!profile?.org_id) redirect('/onboarding')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, contacts(name)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  const all = (invoices as Invoice[]) ?? []
  const paid = all.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  const outstanding = all.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + i.total, 0)
  const overdue = all.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: '#1a1f2e' }}>Billing</h1>
        <Link href="/billing/new"
          className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
          style={{ backgroundColor: '#1e3a5f' }}>
          + New Invoice
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Collected', value: paid, color: '#16a34a', icon: '✅' },
          { label: 'Outstanding', value: outstanding, color: '#d97706', icon: '⏳' },
          { label: 'Overdue', value: overdue, color: '#dc2626', icon: '⚠️' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 bg-white" style={{ border: '1px solid #e8ebf4' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8891aa' }}>{s.label}</span>
              <span>{s.icon}</span>
            </div>
            <div className="text-xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
              {formatCurrency(s.value)}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid #e8ebf4' }}>
        <InvoiceList invoices={all} />
      </div>
    </div>
  )
}
