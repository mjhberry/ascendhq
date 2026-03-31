import Link from 'next/link'
import StatusPill from '@/components/shared/StatusPill'
import { formatCurrency } from '@/lib/utils'
import type { Job } from '@/types'

const columns = [
  { status: 'new',         label: 'New',         color: '#2563eb' },
  { status: 'in_progress', label: 'In Progress',  color: '#d97706' },
  { status: 'review',      label: 'Review',       color: '#7c3aed' },
  { status: 'complete',    label: 'Done',         color: '#16a34a' },
]

interface KanbanBoardProps {
  jobs: Job[]
  jobLabel: string
}

export default function KanbanBoard({ jobs, jobLabel }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {columns.map(col => {
        const colJobs = jobs.filter(j => j.status === col.status).slice(0, 3)
        return (
          <div key={col.status} className="rounded-xl p-3" style={{ backgroundColor: '#f8f9fc', border: '1px solid #e8ebf4' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#8891aa' }}>{col.label}</span>
              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: '#e8ebf4', color: '#454d66' }}>
                {jobs.filter(j => j.status === col.status).length}
              </span>
            </div>
            <div className="space-y-2">
              {colJobs.map(job => (
                <Link key={job.id} href={`/jobs/${job.id}`}
                  className="block rounded-lg p-3 bg-white transition-all hover:shadow-sm"
                  style={{ border: '1px solid #e8ebf4' }}>
                  <div className="text-xs font-semibold mb-1 truncate" style={{ color: '#1a1f2e' }}>{job.title}</div>
                  {job.contacts && (
                    <div className="text-[10px] mb-2 truncate" style={{ color: '#8891aa' }}>{job.contacts.name}</div>
                  )}
                  <div className="flex items-center justify-between">
                    <StatusPill status={job.priority} />
                    {job.value > 0 && (
                      <span className="text-[10px] font-semibold" style={{ color: '#16a34a', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
                        {formatCurrency(job.value)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {colJobs.length === 0 && (
                <div className="text-center py-4 text-[11px]" style={{ color: '#8891aa' }}>
                  No {jobLabel.toLowerCase()}s
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
