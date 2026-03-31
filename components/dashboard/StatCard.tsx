import { formatCurrency } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon: string
  isCurrency?: boolean
  trend?: { value: number; label: string }
  color?: string
}

export default function StatCard({ label, value, icon, isCurrency, trend, color = '#1e3a5f' }: StatCardProps) {
  const displayValue = isCurrency && typeof value === 'number'
    ? formatCurrency(value)
    : String(value)

  return (
    <div className="rounded-xl p-5 bg-white" style={{ border: '1px solid #e8ebf4' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8891aa' }}>{label}</div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
          style={{ backgroundColor: '#e4eef9' }}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color, fontFamily: 'var(--font-ibm-plex-mono), monospace' }}>
        {displayValue}
      </div>
      {trend && (
        <div className="text-[11px]" style={{ color: trend.value >= 0 ? '#16a34a' : '#dc2626' }}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </div>
  )
}
