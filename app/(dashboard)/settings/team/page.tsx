'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/useOrg'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import type { Profile, Invitation, OrgRole } from '@/types'

const ROLES: OrgRole[] = ['owner', 'office', 'sales', 'technician']

const ROLE_COLORS: Record<OrgRole, { bg: string; color: string }> = {
  owner:      { bg: '#fef3c7', color: '#92400e' },
  office:     { bg: '#dbeafe', color: '#1d4ed8' },
  sales:      { bg: '#dcfce7', color: '#16a34a' },
  technician: { bg: '#f3f4f6', color: '#6b7280' },
}

const AVATAR_COLORS = ['#1e3a5f', '#3b6cb0', '#16a34a', '#dc2626', '#7c3aed', '#b45309', '#0891b2', '#c026d3']

function InitialsCircle({ name, color, size = 36 }: { name: string | null; color?: string | null; size?: number }) {
  const bg = color || '#3b6cb0'
  const initials = (name ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

export default function TeamSettingsPage() {
  const { profile, org } = useOrg()
  const [members, setMembers] = useState<Profile[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<OrgRole>('technician')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState({ role: '' as OrgRole, job_title: '', status: 'active', color: '#3b6cb0' })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [deleting, setDeleting] = useState(false)

  const canManage = profile?.role === 'owner' || profile?.role === 'office'

  useEffect(() => {
    if (!profile?.org_id) return
    fetchData()
  }, [profile?.org_id])

  async function fetchData() {
    const [mRes, iRes] = await Promise.all([
      fetch('/api/team/members'),
      canManage ? fetch('/api/team/invitations') : Promise.resolve(null),
    ])
    const mData = await mRes.json()
    setMembers(mData.members ?? [])
    if (iRes) {
      const iData = await iRes.json()
      setInvitations(iData.invitations ?? [])
    }
    setLoading(false)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError('')
    setInviteSuccess('')
    const res = await fetch('/api/team/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    })
    const data = await res.json()
    if (!res.ok) { setInviteError(data.error ?? 'Failed to send invitation'); setInviting(false); return }
    setInviteSuccess(`Invitation sent to ${inviteEmail.trim()}`)
    setInviteEmail('')
    setInvitations(prev => [data.invitation, ...prev])
    setInviting(false)
  }

  async function cancelInvitation(id: string) {
    await fetch(`/api/team/invitations?id=${id}`, { method: 'DELETE' })
    setInvitations(prev => prev.filter(i => i.id !== id))
  }

  function openEdit(member: Profile) {
    setEditTarget(member)
    setEditForm({
      role: member.role,
      job_title: member.job_title ?? '',
      status: member.status ?? 'active',
      color: member.color ?? '#3b6cb0',
    })
  }

  async function saveEdit() {
    if (!editTarget) return
    setSaving(true)
    const res = await fetch('/api/team/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editTarget.id,
        role: editForm.role,
        job_title: editForm.job_title || null,
        status: editForm.status,
        color: editForm.color,
      }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error ?? 'Failed to save'); setSaving(false); return }
    setMembers(prev => prev.map(m => m.id === editTarget.id
      ? { ...m, role: editForm.role, job_title: editForm.job_title || null, status: editForm.status, color: editForm.color }
      : m
    ))
    setEditTarget(null)
    setSaving(false)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/team/members?id=${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      setMembers(prev => prev.filter(m => m.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
    setDeleting(false)
  }

  const inputStyle: React.CSSProperties = {
    border: '1px solid #e8ebf4',
    backgroundColor: '#f8f9fc',
    color: '#1a1f2e',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    outline: 'none',
    width: '100%',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#8891aa',
    display: 'block',
    marginBottom: 5,
  }

  if (!profile || loading) return <LoadingSpinner />

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#1a1f2e' }}>Team</h1>
        <p className="text-xs mt-0.5" style={{ color: '#8891aa' }}>{members.length} member{members.length !== 1 ? 's' : ''} · {org?.name}</p>
      </div>

      {/* Invite form — owners/office only */}
      {canManage && (
        <div className="rounded-xl bg-white p-5" style={{ border: '1px solid #e8ebf4' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: '#1a1f2e' }}>Invite a team member</h2>
          <form onSubmit={handleInvite}>
            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  style={inputStyle}
                  required
                />
              </div>
              <div style={{ width: 160 }}>
                <label style={labelStyle}>Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as OrgRole)} style={inputStyle}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={inviting}
                  style={{
                    padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    backgroundColor: '#1e3a5f', color: 'white', border: 'none',
                    cursor: inviting ? 'not-allowed' : 'pointer', opacity: inviting ? 0.6 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {inviting ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </div>
            {inviteError && (
              <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 12, backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                {inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 12, backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                {inviteSuccess}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Members table */}
      <div className="rounded-xl bg-white" style={{ border: '1px solid #e8ebf4' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #e8ebf4' }}>
          <h2 className="text-sm font-bold" style={{ color: '#1a1f2e' }}>Members</h2>
        </div>
        <div>
          {members.map((m, i) => (
            <div key={m.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 20px',
                borderBottom: i < members.length - 1 ? '1px solid #f2f4f9' : 'none',
              }}
            >
              <InitialsCircle name={m.full_name} color={m.color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1f2e' }}>
                  {m.full_name ?? '—'}
                  {m.id === profile.id && <span style={{ fontSize: 10, color: '#8891aa', marginLeft: 6 }}>(you)</span>}
                </div>
                <div style={{ fontSize: 11, color: '#8891aa', marginTop: 1 }}>
                  {m.email}{m.job_title ? ` · ${m.job_title}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize',
                  ...ROLE_COLORS[m.role],
                }}>
                  {m.role}
                </span>
                {m.status === 'inactive' && (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, backgroundColor: '#f3f4f6', color: '#9ca3af' }}>
                    inactive
                  </span>
                )}
                {canManage && m.id !== profile.id && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => openEdit(m)}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #e8ebf4', background: 'none', cursor: 'pointer', color: '#454d66' }}
                    >
                      Edit
                    </button>
                    {profile.role === 'owner' && (
                      <button
                        onClick={() => setDeleteTarget(m)}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca', background: 'none', cursor: 'pointer', color: '#dc2626' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending invitations */}
      {canManage && invitations.length > 0 && (
        <div className="rounded-xl bg-white" style={{ border: '1px solid #e8ebf4' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #e8ebf4' }}>
            <h2 className="text-sm font-bold" style={{ color: '#1a1f2e' }}>Pending Invitations</h2>
          </div>
          {invitations.map((inv, i) => (
            <div key={inv.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 20px',
                borderBottom: i < invitations.length - 1 ? '1px solid #f2f4f9' : 'none',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', backgroundColor: '#f2f4f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: '#8891aa', flexShrink: 0,
              }}>
                ✉
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1f2e' }}>{inv.email}</div>
                <div style={{ fontSize: 11, color: '#8891aa' }}>
                  Invited as {inv.role} · expires {new Date(inv.expires_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => cancelInvitation(inv.id)}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca', background: 'none', cursor: 'pointer', color: '#dc2626' }}
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Edit member modal */}
      {editTarget && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setEditTarget(null)}
        >
          <div
            style={{ backgroundColor: 'white', borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a1f2e' }}>Edit {editTarget.full_name}</h3>
              <button onClick={() => setEditTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#8891aa' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Role</label>
                <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value as OrgRole }))} style={inputStyle}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Job Title</label>
                <input
                  value={editForm.job_title}
                  onChange={e => setEditForm(f => ({ ...f, job_title: e.target.value }))}
                  placeholder="e.g. Lead Technician"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Avatar Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setEditForm(f => ({ ...f, color: c }))}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', backgroundColor: c,
                        border: editForm.color === c ? '3px solid #1a1f2e' : '2px solid transparent',
                        cursor: 'pointer', padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => setEditTarget(null)} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, backgroundColor: '#f8f9fc', color: '#454d66', border: '1px solid #e8ebf4', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, backgroundColor: '#1e3a5f', color: 'white', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            style={{ backgroundColor: 'white', borderRadius: 16, width: '100%', maxWidth: 380, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#1a1f2e' }}>Remove team member?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#454d66', lineHeight: 1.5 }}>
              <strong>{deleteTarget.full_name}</strong> will lose access to {org?.name}. This cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, backgroundColor: '#f8f9fc', color: '#454d66', border: '1px solid #e8ebf4', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, backgroundColor: '#dc2626', color: 'white', border: 'none', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
