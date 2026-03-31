interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-sm font-semibold text-[#1a1f2e] mb-1">{title}</h3>
      {description && <p className="text-xs text-[#8891aa] max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  )
}
