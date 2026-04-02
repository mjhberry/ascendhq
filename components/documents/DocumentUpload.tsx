'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import DocumentPreview from './DocumentPreview'
import type { Document } from '@/types'

type DocType = 'contract' | 'permit' | 'photo' | 'proposal' | 'warranty' | 'other'

const TYPE_ICONS: Record<DocType, string> = {
  contract: '📜',
  permit: '🏛️',
  photo: '📷',
  proposal: '📋',
  warranty: '🛡️',
  other: '📄',
}

const DOC_TYPES: DocType[] = ['contract', 'permit', 'photo', 'proposal', 'warranty', 'other']

function detectType(file: File): DocType {
  if (file.type.startsWith('image/')) return 'photo'
  if (file.name.toLowerCase().includes('permit')) return 'permit'
  if (file.name.toLowerCase().includes('warranty')) return 'warranty'
  if (file.name.toLowerCase().includes('proposal') || file.name.toLowerCase().includes('quote')) return 'proposal'
  if (file.name.toLowerCase().includes('contract') || file.name.toLowerCase().includes('agreement')) return 'contract'
  return 'other'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  orgId: string
  userId: string
  jobId?: string
  contactId?: string
}

export default function DocumentUpload({ orgId, userId, jobId, contactId }: Props) {
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingType, setPendingType] = useState<DocType>('other')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const fetchDocs = useCallback(async () => {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (jobId) query = query.eq('job_id', jobId)
    else if (contactId) query = query.eq('contact_id', contactId)

    const { data } = await query
    setDocs(data ?? [])
    setLoading(false)
  }, [orgId, jobId, contactId])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    setPendingFile(file)
    setPendingType(detectType(file))
    setError('')
  }

  async function confirmUpload() {
    if (!pendingFile) return
    setUploading(true)
    setProgress(15)
    setError('')

    const safeName = pendingFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${orgId}/${crypto.randomUUID()}-${safeName}`

    setProgress(35)

    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(path, pendingFile, { upsert: false })

    if (uploadErr) {
      setError(uploadErr.message)
      setUploading(false)
      setProgress(0)
      return
    }

    setProgress(70)

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)

    const { error: insertErr } = await supabase.from('documents').insert({
      org_id: orgId,
      job_id: jobId ?? null,
      contact_id: contactId ?? null,
      name: pendingFile.name,
      type: pendingType,
      storage_path: path,
      file_url: publicUrl,
      size_bytes: pendingFile.size,
      uploaded_by: userId,
    })

    if (insertErr) {
      setError(insertErr.message)
      await supabase.storage.from('documents').remove([path])
      setUploading(false)
      setProgress(0)
      return
    }

    setProgress(100)
    setPendingFile(null)
    await fetchDocs()
    setUploading(false)
    setProgress(0)
  }

  async function handleDelete(doc: Document) {
    if (!confirm(`Delete "${doc.name}"? This cannot be undone.`)) return
    setDeleting(doc.id)
    if (doc.storage_path) {
      await supabase.storage.from('documents').remove([doc.storage_path])
    }
    await supabase.from('documents').delete().eq('id', doc.id)
    await fetchDocs()
    setDeleting(null)
  }

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const onDragLeave = () => setDragOver(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div>
      {/* Drop zone */}
      {!pendingFile && !uploading && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#1e3a5f' : '#c4c9d8'}`,
            borderRadius: 10,
            padding: '20px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: dragOver ? '#f0f4fa' : '#fafbfd',
            transition: 'all 0.15s',
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#454d66', marginBottom: 2 }}>
            Drop a file here or click to browse
          </div>
          <div style={{ fontSize: 11, color: '#8891aa' }}>PDF, images, docs up to 20 MB</div>

          {/* Camera button — visible on touch devices */}
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
              style={{ fontSize: 11, color: '#1e3a5f', background: 'none', border: '1px solid #c4c9d8', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
            >
              Browse files
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); cameraRef.current?.click() }}
              style={{ fontSize: 11, color: '#1e3a5f', background: 'none', border: '1px solid #c4c9d8', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
            >
              📷 Camera
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="*/*"
            style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)}
          />
          {/* Camera capture input — opens device camera on mobile */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Pending file confirmation */}
      {pendingFile && !uploading && (
        <div style={{ border: '1px solid #e8ebf4', borderRadius: 10, padding: '14px 16px', marginBottom: 12, backgroundColor: '#f8f9fc' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1f2e', marginBottom: 10 }}>
            {TYPE_ICONS[pendingType]} {pendingFile.name}
            <span style={{ fontWeight: 400, color: '#8891aa', marginLeft: 6 }}>
              ({formatBytes(pendingFile.size)})
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#8891aa' }}>Type:</span>
            <select
              value={pendingType}
              onChange={e => setPendingType(e.target.value as DocType)}
              style={{ fontSize: 11, border: '1px solid #e8ebf4', borderRadius: 6, padding: '3px 6px', color: '#454d66', background: 'white' }}
            >
              {DOC_TYPES.map(t => (
                <option key={t} value={t}>{TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setPendingFile(null)}
              style={{ fontSize: 11, color: '#8891aa', background: 'none', border: '1px solid #e8ebf4', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={confirmUpload}
              style={{ fontSize: 11, color: 'white', background: '#1e3a5f', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}
            >
              Upload
            </button>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div style={{ border: '1px solid #e8ebf4', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#454d66', marginBottom: 8 }}>Uploading…</div>
          <div style={{ height: 6, backgroundColor: '#e8ebf4', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{ height: '100%', backgroundColor: '#1e3a5f', borderRadius: 3, width: `${progress}%`, transition: 'width 0.3s' }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ fontSize: 12, color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Documents list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: '#8891aa' }}>Loading…</div>
      ) : docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: '#8891aa' }}>No documents attached</div>
      ) : (
        <div style={{ border: '1px solid #e8ebf4', borderRadius: 10, overflow: 'hidden' }}>
          {docs.map((doc, i) => (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: i < docs.length - 1 ? '1px solid #f2f4f9' : 'none',
                backgroundColor: 'white',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{TYPE_ICONS[doc.type as DocType] ?? '📄'}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1f2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#8891aa' }}>
                    {doc.type ?? 'other'}{doc.size_bytes ? ` · ${formatBytes(doc.size_bytes)}` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                <button
                  onClick={() => setPreviewDoc(doc)}
                  title="Preview"
                  style={{ fontSize: 13, background: 'none', border: '1px solid #e8ebf4', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: '#454d66', lineHeight: 1 }}
                >
                  👁
                </button>
                {doc.file_url && (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: '#1e3a5f', border: '1px solid #e8ebf4', borderRadius: 6, padding: '3px 8px', textDecoration: 'none', whiteSpace: 'nowrap' }}
                  >
                    Download
                  </a>
                )}
                <button
                  onClick={() => handleDelete(doc)}
                  disabled={deleting === doc.id}
                  style={{ fontSize: 11, color: '#dc2626', background: 'none', border: '1px solid #fecaca', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', opacity: deleting === doc.id ? 0.5 : 1 }}
                >
                  {deleting === doc.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewDoc && (
        <DocumentPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  )
}
