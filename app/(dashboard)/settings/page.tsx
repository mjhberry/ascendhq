'use client'
import { useState } from 'react'

const inputStyle = { border: '1px solid #e8ebf4', backgroundColor: '#f8f9fc', color: '#1a1f2e' }
const labelStyle = { color: '#454d66' }
const cardStyle = { border: '1px solid #e8ebf4' }

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-5" style={cardStyle}>
      <div className="mb-4">
        <h2 className="text-sm font-bold" style={{ color: '#1a1f2e' }}>{title}</h2>
        {description && <p className="text-xs mt-0.5" style={{ color: '#8891aa' }}>{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1.5" style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #f2f4f9' }}>
      <span className="text-sm font-medium" style={{ color: '#1a1f2e' }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none"
        style={{ backgroundColor: enabled ? '#1e3a5f' : '#e8ebf4' }}
      >
        <span
          className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
          style={{ transform: enabled ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [business, setBusiness] = useState({ name: '', industry: '', phone: '', address: '' })
  const [notifications, setNotifications] = useState({ emailJobUpdates: true, emailInvoices: true, smsReminders: false, smsMarketing: false })
  const [account, setAccount] = useState({ name: '', email: '' })
  const [saved, setSaved] = useState<string | null>(null)

  function setB(key: string, value: string) { setBusiness(f => ({ ...f, [key]: value })) }
  function setA(key: string, value: string) { setAccount(f => ({ ...f, [key]: value })) }
  function setN(key: string, value: boolean) { setNotifications(f => ({ ...f, [key]: value })) }

  function handleSave(section: string) {
    setSaved(section)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#1a1f2e' }}>Settings</h1>
        <p className="text-xs mt-0.5" style={{ color: '#8891aa' }}>Manage your account and business preferences</p>
      </div>

      {/* Business Profile */}
      <SectionCard title="Business Profile" description="Your business information displayed to clients">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Business Name">
              <input
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
                value={business.name}
                onChange={e => setB('name', e.target.value)}
                placeholder="Acme Landscaping Co."
              />
            </Field>
            <Field label="Industry">
              <select
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
                value={business.industry}
                onChange={e => setB('industry', e.target.value)}
              >
                <option value="">Select industry</option>
                <option value="landscaping">Landscaping</option>
                <option value="cleaning">Cleaning</option>
                <option value="hvac">HVAC</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="painting">Painting</option>
                <option value="roofing">Roofing</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>
          <Field label="Phone">
            <input
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
              value={business.phone}
              onChange={e => setB('phone', e.target.value)}
              placeholder="(555) 000-0000"
              type="tel"
            />
          </Field>
          <Field label="Address">
            <input
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
              value={business.address}
              onChange={e => setB('address', e.target.value)}
              placeholder="123 Main St, City, State 00000"
            />
          </Field>
          <div className="flex justify-end pt-1">
            <button
              onClick={() => handleSave('business')}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              {saved === 'business' ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notifications" description="Choose how and when you receive updates">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8891aa' }}>Email</p>
          <Toggle enabled={notifications.emailJobUpdates} onChange={v => setN('emailJobUpdates', v)} label="Job status updates" />
          <Toggle enabled={notifications.emailInvoices} onChange={v => setN('emailInvoices', v)} label="Invoice activity" />
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8891aa' }}>SMS</p>
          <Toggle enabled={notifications.smsReminders} onChange={v => setN('smsReminders', v)} label="Appointment reminders" />
          <div style={{ borderBottom: 'none' }}>
            <Toggle enabled={notifications.smsMarketing} onChange={v => setN('smsMarketing', v)} label="Promotions &amp; updates" />
          </div>
        </div>
        <div className="flex justify-end pt-3">
          <button
            onClick={() => handleSave('notifications')}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            {saved === 'notifications' ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </SectionCard>

      {/* Account */}
      <SectionCard title="Account" description="Your personal login details">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name">
              <input
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
                value={account.name}
                onChange={e => setA('name', e.target.value)}
                placeholder="Jane Smith"
              />
            </Field>
            <Field label="Email">
              <input
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={inputStyle}
                value={account.email}
                onChange={e => setA('email', e.target.value)}
                placeholder="jane@example.com"
                type="email"
              />
            </Field>
          </div>
          <div className="flex items-center justify-between pt-1">
            <button
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{ border: '1px solid #e8ebf4', backgroundColor: '#f8f9fc', color: '#454d66' }}
            >
              Change Password
            </button>
            <button
              onClick={() => handleSave('account')}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              {saved === 'account' ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
