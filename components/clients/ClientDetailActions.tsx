'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ClientForm from './ClientForm'
import type { Contact } from '@/types'

interface Props {
  contact: Contact
  orgId: string
  clientLabel: string
}

export default function ClientDetailActions({ contact, orgId, clientLabel }: Props) {
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')
    const res = await fetch(`/api/contacts?id=${contact.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      setDeleteError(data.error ?? 'Failed to delete')
      setDeleting(false)
      return
    }
    router.push('/clients')
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setShowEdit(true)}
          style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            backgroundColor: '#f8f9fc', color: '#454d66', border: '1px solid #e8ebf4',
            cursor: 'pointer',
          }}
        >
          Edit
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <ClientForm
          orgId={orgId}
          clientLabel={clientLabel}
          initial={contact}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); router.refresh() }}
        />
      )}

      {/* Delete confirmation */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => !deleting && setShowConfirm(false)}
        >
          <div
            style={{
              backgroundColor: 'white', borderRadius: 14,
              width: '100%', maxWidth: 420,
              padding: 24,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#1a1f2e' }}>
              Delete {contact.name}?
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#8891aa', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: '#1a1f2e' }}>{contact.name}</strong>? This cannot be undone.
            </p>
            {deleteError && (
              <p style={{ margin: '0 0 16px', fontSize: 12, color: '#dc2626', padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: 8 }}>
                {deleteError}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                style={{
                  padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  backgroundColor: '#f8f9fc', color: '#454d66', border: '1px solid #e8ebf4',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  backgroundColor: '#dc2626', color: 'white', border: 'none',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
