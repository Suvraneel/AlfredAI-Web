'use client'
import { useCommandPalette } from "@/hooks/useCommandPalette"
import { Search, Menu } from "lucide-react"

interface TopBarProps {
  onMenuClick?: () => void
  title?: string
}

export function TopBar({ onMenuClick, title }: TopBarProps) {
  const { open } = useCommandPalette()

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-bg-surface px-4 flex-shrink-0">
      {onMenuClick && (
        <button onClick={onMenuClick} className="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-colors">
          <Menu className="h-5 w-5" />
        </button>
      )}
      {title && <h1 className="text-sm font-semibold text-text-primary">{title}</h1>}
      <div className="flex-1" />
      <button
        onClick={open}
        className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary hover:bg-bg-subtle transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-2 border border-border rounded px-1 py-0.5 text-[10px]">
          ⌘K
        </kbd>
      </button>
    </header>
  )
}
