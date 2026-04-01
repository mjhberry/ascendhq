'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/useOrg'
import QuoteForm from '@/components/pipeline/QuoteForm'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Job, Quote, Contact, JobStatus } from '@/types'

type TabKey = 'quotes' | 'accepted' | 'in_progress' | 'complete' | 'invoiced'

const TABS: { key: TabKey; label: string; aiPrompt: string }[] = [
  { key: 'quotes',      label: 'Quotes',      aiPrompt: 'Help me write a compelling quote for a potential client. The job involves:' },
  { key: 'accepted',    label: 'Accepted',    aiPrompt: 'I have accepted jobs waiting to be scheduled. Help me plan and prioritize them.' },
  { key: 'in_progress', label: 'In Progress', aiPrompt: 'Help me draft a progress update for jobs currently underway.' },
  { key: 'complete',    label: 'Complete',    aiPrompt: 'Help me write a follow-up message for recently completed jobs to request a review.' },
  { key: 'invoiced',    label: 'Invoiced',    aiPrompt: 'Help me draft a polite payment reminder for outstanding invoices.' },
]

export default function PipelinePage() {
  const { org, profile, terms } = useOrg()
  const [activeTab, setActiveTab] = useState<TabKey>('quotes')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [converting, setConverting] = useState<string | null>(null)
  const [invoicing, setInvoicing] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.org_id) return
    fetchData()
  }, [profile?.org_id])

  async function fetchData() {
    const supabase = createClient()
    const [{ data: q }, { data: j }, { data: c }] = await Promise.all([
      supabase.from('quotes').select('*, contacts(name)').eq('org_id', profile!.org_id).order('created_at', { ascending: false }),
      supabase.from('jobs').select('*, contacts(name), profiles(full_name)').eq('org_id', profile!.org_id)
        .in('status', ['accepted', 'in_progress', 'complete', 'invoiced']).order('created_at', { ascending: false }),
      supabase.from('contacts').select('*').eq('org_id', profile!.org_id).order('name'),
    ])
    setQuotes((q as Quote[]) ?? [])
    setJobs((j as Job[]) ?? [])
    setContacts(c ?? [])
    setLoading(false)
  }

  async function convertToJob(quote: Quote) {
    setConverting(quote.id)
    const supabase = createClient()
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        org_id: profile!.org_id,
        contact_id: quote.contact_id,
        title: quote.title,
        description: quote.description,
        status: 'accepted',
        value: quote.total,
      })
      .select('*, contacts(name), profiles(full_name)')
      .single()

    if (!error && job) {
      await supabase.from('quotes').update({ job_id: job.id, status: 'converted' }).eq('id', quote.id)
      setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: 'converted' as const, job_id: job.id } : q))
      setJobs(prev => [job as Job, ...prev])
      setActiveTab('accepted')
    }
    setConverting(null)
  }

  async function generateInvoice(job: Job) {
    setInvoicing(job.id)
    const supabase = createClient()
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`
    const { error } = await supabase.from('invoices').insert({
      org_id: profile!.org_id,
      contact_id: job.contact_id,
      job_id: job.id,
      number: invoiceNumber,
      status: 'draft',
      subtotal: job.value,
      tax: 0,
      total: job.value,
    })
    if (!error) {
      await supabase.from('jobs').update({ status: 'invoiced' }).eq('id', job.id)
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'invoiced' as JobStatus } : j))
      setActiveTab('invoiced')
    }
    setInvoicing(null)
  }

  function openAI() {
    const tab = TABS.find(t => t.key === activeTab)
    document.dispatchEvent(new CustomEvent('open-ai', { detail: { prompt: tab?.aiPrompt } }))
  }

  if (!org || loading) return <LoadingSpinner />

  const activeQuotes = quotes.filter(q => q.status !== 'converted')
  const tabCounts: Record<TabKey, number> = {
    quotes:      activeQuotes.length,
    accepted:    jobs.filter(j => j.status === 'accepted').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    complete:    jobs.filter(j => j.status === 'complete').length,
    invoiced:    jobs.filter(j => j.status === 'invoiced').length,
  }

  const activeJobs = jobs.filter(j => j.status === activeTab)

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1a1f2e' }}>Pipeline</h1>
          <p className="text-xs mt-0.5" style={{ color: '#8891aa' }}>{terms.job} workflow</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openAI}
            className="px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: '#f2f4f9', color: '#454d66', border: '1px solid #e8ebf4' }}>
            🤖 Ask AI
          </button>
          <button
            onClick={() => { setActiveTab('quotes'); setShowQuoteForm(true) }}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: '#1e3a5f' }}>
            + New Quote
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#f2f4f9', border: '1px solid #e8ebf4' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            style={activeTab === tab.key
              ? { backgroundColor: 'white', color: '#1a1f2e', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
              : { color: '#8891aa' }}>
            {tab.label}
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: activeTab === tab.key ? '#e8ebf4' : 'rgba(0,0,0,0.06)',
                color: activeTab === tab.key ? '#454d66' : '#8891aa',
              }}>
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Quote form */}
      {showQuoteForm && (
        <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e8ebf4' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold" style={{ color: '#1a1f2e' }}>New Quote</h2>
            <button onClick={() => setShowQuoteForm(false)} className="text-xs" style={{ color: '#8891aa' }}>✕ Close</button>
          </div>
          <QuoteForm
            orgId={profile!.org_id}
            contacts={contacts}
            onClose={() => setShowQuoteForm(false)}
            onSaved={() => { setShowQuoteForm(false); setLoading(true); fetchData() }}
          />
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'quotes' ? (
        activeQuotes.length === 0
          ? <EmptyState icon="📋" title="No quotes yet" description="Create your first quote to start the pipeline" />
          : (
            <div className="space-y-3">
              {activeQuotes.map(quote => (
                <div key={quote.id} className="rounded-xl p-4 bg-white flex items-center gap-4"
                  style={{ border: '1px solid #e8ebf4' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold" style={{ color: '#1a1f2e' }}>{quote.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                        style={{
                          backgroundColor: quote.status === 'sent' ? '#dbeafe' : quote.status === 'accepted' ? '#dcfce7' : '#f2f4f9',
                          color: quote.status === 'sent' ? '#1d4ed8' : quote.status === 'accepted' ? '#16a34a' : '#8891aa',
                        }}>
                        {quote.status}
                      </span>
                    </div>
                    {quote.description && (
                      <p className="text-xs truncate mb-1.5" style={{ color: '#8891aa' }}>{quote.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs" style={{ color: '#8891aa' }}>
                      {(quote.contacts as any)?.name && <span>👤 {(quote.contacts as any).name}</span>}
                      <span>📅 {formatDate(quote.created_at)}</span>
                      {quote.valid_until && <span>⏳ Until {formatDate(quote.valid_until)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold" style={{ color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                      {formatCurrency(quote.total)}
                    </span>
                    {!quote.job_id && (
                      <button onClick={() => convertToJob(quote)} disabled={converting === quote.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: '#1e3a5f' }}>
                        {converting === quote.id ? '…' : 'Convert to Job'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
      ) : (
        activeJobs.length === 0
          ? <EmptyState icon="⚡" title={`No ${activeTab.replace('_', ' ')} ${terms.job.toLowerCase()}s`}
              description="Items will appear here as they move through the pipeline" />
          : (
            <div className="space-y-3">
              {activeJobs.map(job => (
                <div key={job.id} className="rounded-xl p-4 bg-white flex items-center gap-4"
                  style={{ border: '1px solid #e8ebf4' }}>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1">
                      <a href={`/pipeline/${job.id}`} className="text-xs font-bold hover:underline" style={{ color: '#1a1f2e' }}>
                        {job.title}
                      </a>
                    </div>
                    {job.description && (
                      <p className="text-xs truncate mb-1.5" style={{ color: '#8891aa' }}>{job.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs" style={{ color: '#8891aa' }}>
                      {(job.contacts as any)?.name && <span>👤 {(job.contacts as any).name}</span>}
                      {(job.profiles as any)?.full_name && <span>🔧 {(job.profiles as any).full_name}</span>}
                      <span>📅 {formatDate(job.scheduled_at ?? job.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold" style={{ color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                      {formatCurrency(job.value)}
                    </span>
                    {activeTab === 'complete' && (
                      <button onClick={() => generateInvoice(job)} disabled={invoicing === job.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: '#16a34a' }}>
                        {invoicing === job.id ? '…' : 'Generate Invoice'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
      )}
    </div>
  )
}
