'use client'
import { useState, useEffect } from 'react'
import type { Document } from '@/types'

type PreviewType = 'image' | 'pdf' | 'word' | 'other'

function getPreviewType(name: string): PreviewType {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'word'
  return 'other'
}

interface Props {
  doc: Document
  onClose: () => void
}

export default function DocumentPreview({ doc, onClose }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fullscreen, setFullscreen] = useState(false)

  const previewType = getPreviewType(doc.name)

  useEffect(() => {
    async function load() {
      if (!doc.storage_path) {
        setSignedUrl(doc.file_url)
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/documents/preview?path=${encodeURIComponent(doc.storage_path)}`)
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Failed to load preview'); setLoading(false); return }
        setSignedUrl(data.signedUrl)
      } catch {
        setError('Network error — please try again')
      }
      setLoading(false)
    }
    load()
  }, [doc.storage_path, doc.file_url])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const modalW = fullscreen ? '95vw' : 760
  const modalH = fullscreen ? '92vh' : 560

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(10, 14, 26, 0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: modalW, maxWidth: '100%',
          height: modalH, maxHeight: '100%',
          backgroundColor: 'white',
          borderRadius: fullscreen ? 12 : 14,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          transition: 'width 0.2s, height 0.2s',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #e8ebf4',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 16 }}>
              {previewType === 'image' ? '📷' : previewType === 'pdf' ? '📄' : previewType === 'word' ? '📝' : '📎'}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1f2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {doc.name}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
            {signedUrl && (
              <a
                href={signedUrl}
                download={doc.name}
                style={{ fontSize: 11, color: '#1e3a5f', border: '1px solid #e8ebf4', borderRadius: 6, padding: '4px 10px', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Download
              </a>
            )}
            <button
              onClick={() => setFullscreen(v => !v)}
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              style={{ fontSize: 14, background: 'none', border: '1px solid #e8ebf4', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#454d66', lineHeight: 1 }}
            >
              {fullscreen ? '⊡' : '⊞'}
            </button>
            <button
              onClick={onClose}
              title="Close"
              style={{ fontSize: 16, background: 'none', border: '1px solid #e8ebf4', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', color: '#454d66', lineHeight: 1.4 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', backgroundColor: '#f2f4f9' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 13, color: '#8891aa' }}>Loading preview…</div>
            </div>
          )}

          {!loading && error && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ fontSize: 32 }}>⚠️</div>
              <div style={{ fontSize: 13, color: '#454d66' }}>{error}</div>
            </div>
          )}

          {!loading && !error && signedUrl && previewType === 'image' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrl}
                alt={doc.name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
              />
            </div>
          )}

          {!loading && !error && signedUrl && previewType === 'pdf' && (
            <embed
              src={signedUrl}
              type="application/pdf"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          )}

          {!loading && !error && (previewType === 'word' || previewType === 'other') && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
              <div style={{ fontSize: 40 }}>{previewType === 'word' ? '📝' : '📎'}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1f2e', textAlign: 'center' }}>
                {previewType === 'word'
                  ? 'Word documents cannot be previewed'
                  : 'This file type cannot be previewed'}
              </div>
              <div style={{ fontSize: 13, color: '#8891aa', textAlign: 'center' }}>
                {previewType === 'word'
                  ? 'Download the file to open it in Microsoft Word or Google Docs.'
                  : 'Download the file to open it locally.'}
              </div>
              {signedUrl && (
                <a
                  href={signedUrl}
                  download={doc.name}
                  style={{ fontSize: 13, fontWeight: 600, color: 'white', background: '#1e3a5f', border: 'none', borderRadius: 8, padding: '9px 20px', textDecoration: 'none' }}
                >
                  Download {doc.name}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
