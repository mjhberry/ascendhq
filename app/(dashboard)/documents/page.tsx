import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'

const typeIcon: Record<string, string> = {
  contract: '📜',
  permit: '🏛️',
  photo: '📷',
  proposal: '📋',
  warranty: '🛡️',
  other: '📄',
}

export default async function DocumentsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile?.org_id) redirect('/onboarding')

  const { data: documents } = await supabase
    .from('documents')
    .select('*, contacts(name), jobs(title)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: '#1a1f2e' }}>Documents</h1>
        <span className="text-xs" style={{ color: '#8891aa' }}>{documents?.length ?? 0} files</span>
      </div>

      <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid #e8ebf4' }}>
        {(documents ?? []).length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📁</div>
            <div className="text-sm font-semibold mb-1" style={{ color: '#1a1f2e' }}>No documents yet</div>
            <div className="text-xs" style={{ color: '#8891aa' }}>Documents will appear here once uploaded to jobs or clients</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #e8ebf4' }}>
                {['Name', 'Type', 'Client', 'Job', 'Uploaded'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#8891aa' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(documents ?? []).map((doc, i) => (
                <tr key={doc.id} style={{ borderBottom: i < (documents ?? []).length - 1 ? '1px solid #f2f4f9' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8f9fc')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{typeIcon[doc.type ?? 'other'] ?? '📄'}</span>
                      <span className="text-xs font-semibold" style={{ color: '#1a1f2e' }}>{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] capitalize px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#f2f4f9', color: '#454d66' }}>
                      {doc.type ?? 'other'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#454d66' }}>{(doc.contacts as any)?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#454d66' }}>{(doc.jobs as any)?.title ?? '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8891aa' }}>{formatDate(doc.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
