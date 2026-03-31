import { timeAgo } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: string
  description: string
  created_at: string
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

const typeIcon: Record<string, string> = {
  job: '🔧',
  invoice: '💰',
  contact: '👤',
  lead: '📣',
  appointment: '📅',
  default: '📋',
}

export default function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-xs" style={{ color: '#8891aa' }}>
        No recent activity
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div key={item.id} className={`flex items-start gap-3 py-3 ${i < items.length - 1 ? 'border-b' : ''}`}
          style={{ borderColor: '#e8ebf4' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
            style={{ backgroundColor: '#e4eef9' }}>
            {typeIcon[item.type] ?? typeIcon.default}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs" style={{ color: '#1a1f2e' }}>{item.description}</div>
            <div className="text-[10px] mt-0.5" style={{ color: '#8891aa', fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
              {timeAgo(item.created_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
