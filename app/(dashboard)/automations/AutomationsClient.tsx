'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils'

type AutomationSettings = {
  id: string
  org_id: string
  quote_followup_enabled: boolean
  quote_nudge_enabled: boolean
  quote_expiry_enabled: boolean
  auto_invoice_on_complete: boolean
  invoice_due_reminder_enabled: boolean
  invoice_reminder_enabled: boolean
  review_request_enabled: boolean
  appointment_reminder_enabled: boolean
  reactivation_enabled: boolean
}

type RunStat = { type: string; count: number; last_run: string | null }
type RunLog = {
  id: string
  automation_type: string
  contact_name: string | null
  message_sent: string | null
  status: string
  created_at: string
}

type SettingKey = keyof Omit<AutomationSettings, 'id' | 'org_id'>

const AUTOMATION_CARDS: {
  type: string
  name: string
  description: string
  icon: string
  settingKey: SettingKey
}[] = [
  {
    type: 'QUOTE_FOLLOWUP',
    name: 'Quote Follow-up',
    description: 'Send a follow-up email to clients with unseen quotes after 48 hours',
    icon: '📄',
    settingKey: 'quote_followup_enabled',
  },
  {
    type: 'QUOTE_NUDGE',
    name: 'Quote Nudge',
    description: 'Nudge clients who received a quote 24 hours ago but haven\'t accepted',
    icon: '👀',
    settingKey: 'quote_nudge_enabled',
  },
  {
    type: 'QUOTE_EXPIRY',
    name: 'Quote Expiry Warning',
    description: 'Alert clients 48 hours before their quote expires',
    icon: '⏰',
    settingKey: 'quote_expiry_enabled',
  },
  {
    type: 'AUTO_INVOICE',
    name: 'Auto Invoice',
    description: 'Automatically create and send an invoice when a job is marked complete',
    icon: '🧾',
    settingKey: 'auto_invoice_on_complete',
  },
  {
    type: 'INVOICE_DUE_REMINDER',
    name: 'Invoice Due Reminder',
    description: 'Send a payment reminder when a client\'s invoice is due today',
    icon: '📅',
    settingKey: 'invoice_due_reminder_enabled',
  },
  {
    type: 'INVOICE_OVERDUE_1',
    name: 'Invoice Overdue (1st Notice)',
    description: 'First overdue notice sent a few days after the invoice due date',
    icon: '⚠️',
    settingKey: 'invoice_reminder_enabled',
  },
  {
    type: 'INVOICE_OVERDUE_2',
    name: 'Invoice Overdue (2nd Notice)',
    description: 'Second, firmer overdue notice for invoices still unpaid after a week',
    icon: '🚨',
    settingKey: 'invoice_reminder_enabled',
  },
  {
    type: 'REVIEW_REQUEST',
    name: 'Review Request',
    description: 'Ask clients for a Google review a few days after job completion',
    icon: '⭐',
    settingKey: 'review_request_enabled',
  },
  {
    type: 'APPOINTMENT_REMINDER',
    name: 'Appointment Reminder',
    description: 'Send appointment reminders 24 hours before scheduled appointments',
    icon: '🔔',
    settingKey: 'appointment_reminder_enabled',
  },
  {
    type: 'REACTIVATION',
    name: 'Client Reactivation',
    description: 'Re-engage clients who haven\'t been contacted in 180 days',
    icon: '💌',
    settingKey: 'reactivation_enabled',
  },
]

const TYPE_LABELS: Record<string, string> = {
  QUOTE_FOLLOWUP: 'Quote Follow-up',
  QUOTE_NUDGE: 'Quote Nudge',
  QUOTE_EXPIRY: 'Quote Expiry',
  AUTO_INVOICE: 'Auto Invoice',
  INVOICE_DUE_REMINDER: 'Invoice Due',
  INVOICE_OVERDUE_1: 'Overdue 1st',
  INVOICE_OVERDUE_2: 'Overdue 2nd',
  REVIEW_REQUEST: 'Review Request',
  APPOINTMENT_REMINDER: 'Appt Reminder',
  REACTIVATION: 'Reactivation',
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        display: 'inline-flex',
        width: 40,
        height: 22,
        borderRadius: 11,
        padding: 2,
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.2s',
        backgroundColor: on ? '#1e3a5f' : '#d1d5db',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: 'block',
          width: 18,
          height: 18,
          borderRadius: '50%',
          backgroundColor: 'white',
          transition: 'transform 0.2s',
          transform: on ? 'translateX(18px)' : 'translateX(0)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  )
}

export default function AutomationsClient({
  initialSettings,
  runStats,
  recentRuns,
}: {
  initialSettings: AutomationSettings
  runStats: RunStat[]
  recentRuns: RunLog[]
}) {
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState<string | null>(null)

  async function toggleSetting(key: SettingKey, value: boolean) {
    setSaving(key)
    setSettings(prev => ({ ...prev, [key]: value }))

    const supabase = createClient()
    const { error } = await supabase
      .from('automation_settings')
      .update({ [key]: value })
      .eq('id', settings.id)

    if (error) {
      // Revert on failure
      setSettings(prev => ({ ...prev, [key]: !value }))
    }
    setSaving(null)
  }

  const activeCount = AUTOMATION_CARDS.filter(c => settings[c.settingKey]).length
  const totalRuns = runStats.reduce((acc, s) => acc + s.count, 0)

  function getStats(type: string) {
    return runStats.find(s => s.type === type) ?? { count: 0, last_run: null }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1a1f2e' }}>Automations</h1>
          <p className="text-xs mt-0.5" style={{ color: '#8891aa' }}>
            AI-powered workflows running in the background for your business
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium"
          style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }} />
          {activeCount} active
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Automations', value: activeCount, color: '#16a34a' },
          { label: 'Total Runs (All Time)', value: totalRuns, color: '#1e3a5f' },
          { label: 'Inactive', value: 10 - activeCount, color: '#d97706' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 bg-white" style={{ border: '1px solid #e8ebf4' }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#8891aa' }}>
              {s.label}
            </div>
            <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Automation Cards */}
      <div>
        <h2 className="text-sm font-bold mb-3" style={{ color: '#1a1f2e' }}>Automation Settings</h2>
        <div className="grid grid-cols-2 gap-3">
          {AUTOMATION_CARDS.map(card => {
            const enabled = settings[card.settingKey]
            const stats = getStats(card.type)
            const isSaving = saving === card.settingKey
            return (
              <div
                key={card.type}
                className="rounded-xl p-4 bg-white"
                style={{ border: `1px solid ${enabled ? '#e8ebf4' : '#f2f4f9'}` }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5" style={{ opacity: enabled ? 1 : 0.4 }}>
                    {card.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className="text-xs font-semibold truncate"
                        style={{ color: enabled ? '#1a1f2e' : '#8891aa' }}
                      >
                        {card.name}
                      </span>
                      <div style={{ opacity: isSaving ? 0.5 : 1 }}>
                        <Toggle
                          on={enabled}
                          onChange={v => toggleSetting(card.settingKey, v)}
                        />
                      </div>
                    </div>
                    <p className="text-[11px] mb-2" style={{ color: '#8891aa', lineHeight: 1.5 }}>
                      {card.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px]" style={{ color: '#8891aa', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                        {stats.count} runs
                      </span>
                      {stats.last_run && (
                        <span className="text-[10px]" style={{ color: '#8891aa' }}>
                          Last: {formatDateTime(stats.last_run)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Activity Log */}
      <div>
        <h2 className="text-sm font-bold mb-3" style={{ color: '#1a1f2e' }}>Activity Log</h2>
        <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid #e8ebf4' }}>
          {recentRuns.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-xs font-semibold mb-1" style={{ color: '#1a1f2e' }}>No activity yet</div>
              <div className="text-[11px]" style={{ color: '#8891aa' }}>
                Automations run every 15 minutes. Enable some above to get started.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e8ebf4', backgroundColor: '#f8f9fc' }}>
                    {['Time', 'Type', 'Client', 'Message Preview', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '10px 16px',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#8891aa',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map((run, i) => (
                    <tr
                      key={run.id}
                      style={{ borderBottom: i < recentRuns.length - 1 ? '1px solid #f2f4f9' : 'none' }}
                    >
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#8891aa', whiteSpace: 'nowrap', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                        {formatDateTime(run.created_at)}
                      </td>
                      <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 6,
                          backgroundColor: '#f0f4ff',
                          color: '#1e3a5f',
                        }}>
                          {TYPE_LABELS[run.automation_type] ?? run.automation_type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#1a1f2e', fontWeight: 500 }}>
                        {run.contact_name ?? '—'}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#8891aa', maxWidth: 280 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {run.message_sent
                            ? run.message_sent.slice(0, 80) + (run.message_sent.length > 80 ? '…' : '')
                            : run.status === 'error' ? '(error — no message sent)' : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 6,
                          backgroundColor: run.status === 'success' ? '#dcfce7' : '#fee2e2',
                          color: run.status === 'success' ? '#16a34a' : '#dc2626',
                        }}>
                          {run.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
