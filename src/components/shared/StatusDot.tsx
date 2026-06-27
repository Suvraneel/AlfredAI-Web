import { cn } from "@/lib/utils"

interface StatusDotProps {
  status: 'active' | 'disconnected' | 'error' | 'coming_soon'
  className?: string
  showLabel?: boolean
}

export function StatusDot({ status, className, showLabel }: StatusDotProps) {
  const config = {
    active: { color: 'bg-success', label: 'Active', pulse: true },
    disconnected: { color: 'bg-text-muted', label: 'Disconnected', pulse: false },
    error: { color: 'bg-error', label: 'Error', pulse: false },
    coming_soon: { color: 'bg-text-muted', label: 'Coming Soon', pulse: false },
  }[status]

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.color)} />
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", config.color)} />
      </span>
      {showLabel && <span className="text-xs text-text-secondary">{config.label}</span>}
    </span>
  )
}
