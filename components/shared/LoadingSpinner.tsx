import { cn } from '@/lib/utils'

export default function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <div className="w-6 h-6 border-2 border-[#e8ebf4] border-t-[#1e3a5f] rounded-full animate-spin" />
    </div>
  )
}
