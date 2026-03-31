import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; classes: string }> = {
  // Job statuses
  new:         { label: 'New',         classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  scheduled:   { label: 'Scheduled',   classes: 'bg-purple-50 text-purple-700 border-purple-200' },
  in_progress: { label: 'In Progress', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  review:      { label: 'Review',      classes: 'bg-orange-50 text-orange-700 border-orange-200' },
  complete:    { label: 'Complete',    classes: 'bg-green-50 text-green-700 border-green-200' },
  cancelled:   { label: 'Cancelled',   classes: 'bg-gray-100 text-gray-500 border-gray-200' },
  // Invoice statuses
  draft:       { label: 'Draft',       classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  sent:        { label: 'Sent',        classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid:        { label: 'Paid',        classes: 'bg-green-50 text-green-700 border-green-200' },
  overdue:     { label: 'Overdue',     classes: 'bg-red-50 text-red-700 border-red-200' },
  // Lead statuses
  contacted:   { label: 'Contacted',   classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  quoted:      { label: 'Quoted',      classes: 'bg-purple-50 text-purple-700 border-purple-200' },
  won:         { label: 'Won',         classes: 'bg-green-50 text-green-700 border-green-200' },
  lost:        { label: 'Lost',        classes: 'bg-red-50 text-red-700 border-red-200' },
  // Contact statuses
  active:      { label: 'Active',      classes: 'bg-green-50 text-green-700 border-green-200' },
  inactive:    { label: 'Inactive',    classes: 'bg-gray-100 text-gray-500 border-gray-200' },
  lead:        { label: 'Lead',        classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  // Priorities
  low:         { label: 'Low',         classes: 'bg-gray-100 text-gray-500 border-gray-200' },
  normal:      { label: 'Normal',      classes: 'bg-blue-50 text-blue-600 border-blue-200' },
  high:        { label: 'High',        classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  urgent:      { label: 'Urgent',      classes: 'bg-red-50 text-red-700 border-red-200' },
  // Automation statuses
  paused:      { label: 'Paused',      classes: 'bg-gray-100 text-gray-500 border-gray-200' },
}

interface StatusPillProps {
  status: string
  className?: string
}

export default function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status] ?? { label: status, classes: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border',
      config.classes,
      className
    )}>
      {config.label}
    </span>
  )
}
