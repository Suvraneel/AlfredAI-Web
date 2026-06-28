'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, LayoutDashboard, Settings, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCommandPalette } from '@/hooks/useCommandPalette'

const NAV_ITEMS = [
  { href: '/chat', icon: MessageSquare, label: 'Chat' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/settings/profile', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  const pathname = usePathname()
  const { open } = useCommandPalette()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-bg-surface/90 backdrop-blur-xl pb-safe">
      <div className="flex items-center justify-around h-14 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs transition-colors",
                active ? "text-accent-from" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          )
        })}
        <button
          onClick={open}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          <Search className="h-5 w-5" />
          <span>Search</span>
        </button>
      </div>
    </nav>
  )
}
