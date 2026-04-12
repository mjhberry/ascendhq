'use client'

import { useState, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'upload' | 'mapping' | 'importing' | 'results'

type AscendField =
  | 'name' | 'first_name' | 'last_name'
  | 'email' | 'phone' | 'company' | 'type' | 'notes'
  | 'address_line1' | 'address_line2' | 'city' | 'state' | 'zip'
  | 'skip'

interface MappedContact {
  name?: string
  email?: string
  phone?: string
  company?: string
  type?: string
  notes?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  zip?: string
}

interface ImportError { row: number; name: string; reason: string }

interface ImportResult {
  imported: number
  skipped: number
  errors: ImportError[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ASCEND_FIELD_OPTIONS: { value: AscendField; label: string }[] = [
  { value: 'skip',         label: 'Skip this column' },
  { value: 'name',         label: 'Name (Full)' },
  { value: 'first_name',   label: 'First Name' },
  { value: 'last_name',    label: 'Last Name' },
  { value: 'email',        label: 'Email' },
  { value: 'phone',        label: 'Phone' },
  { value: 'company',      label: 'Company' },
  { value: 'type',         label: 'Type (residential / commercial)' },
  { value: 'notes',        label: 'Notes' },
  { value: 'address_line1', label: 'Address Line 1' },
  { value: 'address_line2', label: 'Address Line 2' },
  { value: 'city',         label: 'City' },
  { value: 'state',        label: 'State' },
  { value: 'zip',          label: 'ZIP Code' },
]

const PREVIEW_FIELD_LABELS: Record<string, string> = {
  name: 'Name', email: 'Email', phone: 'Phone',
  company: 'Company', type: 'Type', notes: 'Notes',
  address_line1: 'Address', city: 'City', state: 'State', zip: 'ZIP',
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  // Strip UTF-8 BOM
  const clean = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text
  const lines = clean.split(/\r?\n/)

  function parseLine(line: string): string[] {
    const cells: string[] = []
    let cur = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
        else inQ = !inQ
      } else if (ch === ',' && !inQ) {
        cells.push(cur.trim()); cur = ''
      } else {
        cur += ch
      }
    }
    cells.push(cur.trim())
    return cells
  }

  const nonEmpty = lines.filter(l => l.trim())
  if (nonEmpty.length === 0) return { headers: [], rows: [] }
  return {
    headers: parseLine(nonEmpty[0]),
    rows: nonEmpty.slice(1).map(parseLine),
  }
}

// ─── Auto-mapper ──────────────────────────────────────────────────────────────

function autoMapColumn(header: string): AscendField {
  const h = header.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  if (/^(name|full name|contact name|display name)$/.test(h)) return 'name'
  if (/^(first name|given name|firstname)$/.test(h)) return 'first_name'
  if (/^(last name|family name|surname|lastname)$/.test(h)) return 'last_name'
  if (/^(email|e mail|email address|e mail address|email 1 value)$/.test(h)) return 'email'
  if (/^(phone|phone number|mobile|cell|telephone|phone 1 value|business phone|home phone|mobile phone)$/.test(h)) return 'phone'
  if (/^(company|company name|organization|organisation|business|employer)$/.test(h)) return 'company'
  if (/^(type|contact type|client type)$/.test(h)) return 'type'
  if (/^(notes|note|comments|comment|description|memo)$/.test(h)) return 'notes'
  if (/^(address|address line 1|address1|street|street address)$/.test(h)) return 'address_line1'
  if (/^(address line 2|address2|suite|apt|unit)$/.test(h)) return 'address_line2'
  if (/^(city|town|locality)$/.test(h)) return 'city'
  if (/^(state|province|region|state province)$/.test(h)) return 'state'
  if (/^(zip|zip code|postal code|postcode)$/.test(h)) return 'zip'
  return 'skip'
}

// ─── Row → contact ────────────────────────────────────────────────────────────

function applyMapping(
  row: string[],
  headers: string[],
  mapping: Record<string, AscendField>
): MappedContact {
  const result: MappedContact = {}
  let firstName = ''
  let lastName = ''

  headers.forEach((header, i) => {
    const field = mapping[header]
    const value = (row[i] ?? '').trim()
    if (!field || field === 'skip' || !value) return
    if (field === 'first_name') firstName = value
    else if (field === 'last_name') lastName = value
    else (result as any)[field] = value
  })

  if (firstName || lastName) {
    result.name = [firstName, lastName].filter(Boolean).join(' ')
  }
  return result
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  border: '1px solid #e8ebf4',
  backgroundColor: '#f8f9fc',
  color: '#1a1f2e',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 12,
  outline: 'none',
  width: '100%',
}

const btnPrimary: React.CSSProperties = {
  backgroundColor: '#1e3a5f',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  padding: '8px 18px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  backgroundColor: '#f8f9fc',
  color: '#454d66',
  border: '1px solid #e8ebf4',
  borderRadius: 8,
  padding: '8px 18px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CSVImportProps {
  onClose: () => void
  onComplete: () => void
}

export default function CSVImport({ onClose, onComplete }: CSVImportProps) {
  const [step, setStep] = useState<Step>('upload')
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, AscendField>>({})
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── File ingestion ────────────────────────────────────────────────────────

  function handleFile(file: File | undefined | null) {
    if (!file || !file.name.endsWith('.csv')) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const { headers: h, rows: r } = parseCSV(text)
      setHeaders(h)
      setRows(r)
      const initial: Record<string, AscendField> = {}
      h.forEach(col => { initial[col] = autoMapColumn(col) })
      setMapping(initial)
    }
    reader.readAsText(file, 'UTF-8')
  }

  // ── Import runner ─────────────────────────────────────────────────────────

  async function runImport() {
    setStep('importing')

    const allContacts: MappedContact[] = rows
      .map(row => applyMapping(row, headers, mapping))
      .filter(c => c.name?.trim())

    setProgress({ current: 0, total: allContacts.length })

    const BATCH = 50
    let totalImported = 0
    let totalSkipped = 0
    const allErrors: ImportError[] = []

    for (let offset = 0; offset < allContacts.length; offset += BATCH) {
      const batch = allContacts.slice(offset, offset + BATCH)
      try {
        const res = await fetch('/api/contacts/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contacts: batch, batchOffset: offset }),
        })
        const data = await res.json()
        totalImported += data.imported ?? 0
        totalSkipped += data.skipped ?? 0
        if (Array.isArray(data.errors)) allErrors.push(...data.errors)
      } catch {
        allErrors.push({ row: offset + 2, name: '(batch)', reason: 'Network error' })
      }
      setProgress({ current: Math.min(offset + BATCH, allContacts.length), total: allContacts.length })
    }

    setResult({ imported: totalImported, skipped: totalSkipped, errors: allErrors })
    setStep('results')
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const hasNameMapping = Object.values(mapping).some(
    f => f === 'name' || f === 'first_name' || f === 'last_name'
  )
  const validRowCount = rows.filter(row => {
    const c = applyMapping(row, headers, mapping)
    return c.name?.trim()
  }).length
  const previewRows = rows.slice(0, 3).map(row => applyMapping(row, headers, mapping))
  const previewFields = (
    ['name', 'email', 'phone', 'company', 'address_line1', 'city', 'state', 'zip'] as const
  ).filter(f =>
    Object.values(mapping).some(v =>
      v === f || (f === 'name' && (v === 'first_name' || v === 'last_name'))
    )
  )

  function reset() {
    setStep('upload')
    setFileName('')
    setHeaders([])
    setRows([])
    setMapping({})
    setProgress({ current: 0, total: 0 })
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Steps ─────────────────────────────────────────────────────────────────

  function renderUpload() {
    return (
      <>
        <div style={{ padding: '24px 24px 0' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1f2e', margin: 0 }}>
            Import Contacts from CSV
          </h2>
          <p style={{ fontSize: 12, color: '#8891aa', marginTop: 4 }}>
            Supports Google Contacts, iCloud, Outlook, and generic CSV exports
          </p>
        </div>

        <div style={{ padding: 24, flex: 1 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files?.[0])}
          />
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#1e3a5f' : '#e8ebf4'}`,
              borderRadius: 12,
              padding: '40px 20px',
              cursor: 'pointer',
              textAlign: 'center',
              backgroundColor: dragging ? '#f0f4ff' : '#f8f9fc',
              transition: 'all 0.15s',
            }}
          >
            {fileName ? (
              <>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1f2e' }}>{fileName}</div>
                <div style={{ fontSize: 12, color: '#8891aa', marginTop: 4 }}>
                  {rows.length} row{rows.length !== 1 ? 's' : ''} detected
                  {' · '}
                  {headers.length} column{headers.length !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 11, color: '#1e3a5f', marginTop: 8 }}>
                  Click to choose a different file
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📂</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1f2e' }}>
                  Drag &amp; drop your CSV file here
                </div>
                <div style={{ fontSize: 12, color: '#8891aa', marginTop: 4 }}>
                  or click to browse
                </div>
                <div style={{ fontSize: 11, color: '#8891aa', marginTop: 12 }}>
                  Accepts .csv files only
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button style={btnSecondary} onClick={onClose}>Cancel</button>
          <button
            style={{ ...btnPrimary, opacity: fileName && rows.length > 0 ? 1 : 0.4 }}
            disabled={!fileName || rows.length === 0}
            onClick={() => setStep('mapping')}
          >
            Next: Map Fields →
          </button>
        </div>
      </>
    )
  }

  function renderMapping() {
    return (
      <>
        <div style={{ padding: '24px 24px 0' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1f2e', margin: 0 }}>
            Map CSV Columns
          </h2>
          <p style={{ fontSize: 12, color: '#8891aa', marginTop: 4 }}>
            We've auto-mapped common headers — adjust as needed
          </p>
        </div>

        <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto' }}>
          {/* Mapping table */}
          <div style={{ border: '1px solid #e8ebf4', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              padding: '8px 14px',
              backgroundColor: '#f8f9fc',
              borderBottom: '1px solid #e8ebf4',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8891aa' }}>CSV Column</span>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8891aa' }}>AscendHQ Field</span>
            </div>
            {headers.map((header, i) => (
              <div
                key={header}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  padding: '8px 14px', alignItems: 'center',
                  borderBottom: i < headers.length - 1 ? '1px solid #f2f4f9' : 'none',
                }}
              >
                <div>
                  <span style={{ fontSize: 12, color: '#1a1f2e', fontWeight: 500 }}>{header}</span>
                  <span style={{ fontSize: 11, color: '#8891aa', marginLeft: 6 }}>
                    {rows[0]?.[i] ? `"${rows[0][i]}"` : ''}
                  </span>
                </div>
                <select
                  value={mapping[header] ?? 'skip'}
                  onChange={e => setMapping(m => ({ ...m, [header]: e.target.value as AscendField }))}
                  style={inputStyle}
                >
                  {ASCEND_FIELD_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Preview */}
          {previewRows.length > 0 && previewFields.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8891aa', marginBottom: 8 }}>
                Preview (first {previewRows.length} row{previewRows.length !== 1 ? 's' : ''})
              </div>
              <div style={{ border: '1px solid #e8ebf4', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${previewFields.length}, 1fr)`,
                  padding: '8px 14px',
                  backgroundColor: '#f8f9fc',
                  borderBottom: '1px solid #e8ebf4',
                }}>
                  {previewFields.map(f => (
                    <span key={f} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8891aa' }}>
                      {PREVIEW_FIELD_LABELS[f]}
                    </span>
                  ))}
                </div>
                {previewRows.map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${previewFields.length}, 1fr)`,
                      padding: '8px 14px',
                      borderBottom: i < previewRows.length - 1 ? '1px solid #f2f4f9' : 'none',
                    }}
                  >
                    {previewFields.map(f => (
                      <span key={f} style={{ fontSize: 12, color: '#454d66', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(row as any)[f] || <span style={{ color: '#d1d5db' }}>—</span>}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasNameMapping && (
            <div style={{ marginTop: 12, padding: '10px 14px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: '#92400e' }}>
                ⚠️ Map at least one Name column (Name, First Name, or Last Name) to continue
              </span>
            </div>
          )}
        </div>

        <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <button style={btnSecondary} onClick={() => setStep('upload')}>← Back</button>
          <button
            style={{ ...btnPrimary, opacity: hasNameMapping && validRowCount > 0 ? 1 : 0.4 }}
            disabled={!hasNameMapping || validRowCount === 0}
            onClick={runImport}
          >
            Import {validRowCount} Contact{validRowCount !== 1 ? 's' : ''} →
          </button>
        </div>
      </>
    )
  }

  function renderImporting() {
    const pct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0
    return (
      <div style={{ padding: 32, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ fontSize: 36 }}>⚡</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1f2e', textAlign: 'center', marginBottom: 4 }}>
            Importing contacts...
          </div>
          <div style={{ fontSize: 12, color: '#8891aa', textAlign: 'center' }}>
            {progress.current} of {progress.total}
          </div>
        </div>
        <div style={{ width: '100%', maxWidth: 320 }}>
          <div style={{ width: '100%', height: 8, backgroundColor: '#f2f4f9', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              backgroundColor: '#1e3a5f',
              borderRadius: 4,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ fontSize: 11, color: '#8891aa', textAlign: 'center', marginTop: 6 }}>
            {Math.round(pct)}% complete
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#8891aa' }}>Please don't close this window</div>
      </div>
    )
  }

  function renderResults() {
    if (!result) return null
    const errorCount = result.errors.length
    const showErrors = result.errors.slice(0, 10)
    return (
      <>
        <div style={{ padding: '24px 24px 0' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1f2e', margin: 0 }}>
            Import Complete
          </h2>
        </div>

        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: '14px 16px', borderRadius: 10, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a', fontFamily: 'monospace' }}>{result.imported}</div>
              <div style={{ fontSize: 11, color: '#15803d', marginTop: 2 }}>Imported</div>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: 10, backgroundColor: '#fefce8', border: '1px solid #fde68a', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#d97706', fontFamily: 'monospace' }}>{result.skipped}</div>
              <div style={{ fontSize: 11, color: '#b45309', marginTop: 2 }}>Skipped</div>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: 10, backgroundColor: errorCount > 0 ? '#fef2f2' : '#f8f9fc', border: `1px solid ${errorCount > 0 ? '#fecaca' : '#e8ebf4'}`, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: errorCount > 0 ? '#dc2626' : '#8891aa', fontFamily: 'monospace' }}>{errorCount}</div>
              <div style={{ fontSize: 11, color: errorCount > 0 ? '#b91c1c' : '#8891aa', marginTop: 2 }}>Errors</div>
            </div>
          </div>

          {result.skipped > 0 && (
            <div style={{ padding: '10px 14px', backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, marginBottom: 12, fontSize: 12, color: '#92400e' }}>
              {result.skipped} contact{result.skipped !== 1 ? 's' : ''} skipped — duplicate email already in your contacts
            </div>
          )}

          {errorCount > 0 && (
            <div style={{ border: '1px solid #fecaca', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', backgroundColor: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#dc2626' }}>
                  Errors
                </span>
              </div>
              {showErrors.map((err, i) => (
                <div key={i} style={{ padding: '8px 14px', borderBottom: i < showErrors.length - 1 ? '1px solid #fef2f2' : 'none', display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 11, color: '#8891aa', fontFamily: 'monospace', flexShrink: 0 }}>Row {err.row}</span>
                  <span style={{ fontSize: 12, color: '#1a1f2e', flexShrink: 0 }}>{err.name}</span>
                  <span style={{ fontSize: 12, color: '#dc2626' }}>{err.reason}</span>
                </div>
              ))}
              {errorCount > 10 && (
                <div style={{ padding: '8px 14px', fontSize: 11, color: '#8891aa' }}>
                  ...and {errorCount - 10} more error{errorCount - 10 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <button style={btnSecondary} onClick={reset}>Import Another</button>
          <button style={btnPrimary} onClick={() => { onClose(); onComplete() }}>
            View Contacts
          </button>
        </div>
      </>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={step !== 'importing' ? onClose : undefined}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 16,
          width: '100%',
          maxWidth: step === 'mapping' ? 680 : 520,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid #f2f4f9',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['upload', 'mapping', 'importing', 'results'] as Step[]).map((s, i) => (
              <div key={s} style={{
                width: 6, height: 6, borderRadius: '50%',
                backgroundColor: step === s ? '#1e3a5f' : s === 'results' && step === 'results' ? '#16a34a' : '#e8ebf4',
              }} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#8891aa', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            {step === 'upload' && 'Step 1 — Upload'}
            {step === 'mapping' && 'Step 2 — Map Fields'}
            {step === 'importing' && 'Step 3 — Importing'}
            {step === 'results' && 'Step 4 — Results'}
          </div>
          {step !== 'importing' && (
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#8891aa', lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          )}
        </div>

        {/* Step content */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {step === 'upload' && renderUpload()}
          {step === 'mapping' && renderMapping()}
          {step === 'importing' && renderImporting()}
          {step === 'results' && renderResults()}
        </div>
      </div>
    </div>
  )
}
