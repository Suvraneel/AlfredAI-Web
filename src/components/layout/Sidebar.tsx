'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import {
  MessageSquare, LayoutDashboard, Network, Plug, Bot,
  FileText, Settings, Users, User, LogOut, ChevronRight
} from "lucide-react"
import { useState } from "react"

const navItems = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/knowledge', label: 'Knowledge', icon: Network },
  { href: '/integrations', label: 'Integrations', icon: Plug },
  { href: '/agents', label: 'Agents', icon: Bot },
]

const settingsItems = [
  { href: '/settings/connections', label: 'Connections', icon: Plug },
  { href: '/settings/team', label: 'Team', icon: Users, adminOnly: true },
  { href: '/audit', label: 'Audit Log', icon: FileText },
  { href: '/settings/profile', label: 'Profile', icon: User },
]

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(true)

  const initials = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <aside className={cn(
      "flex flex-col h-full bg-bg-surface border-r border-border transition-all duration-250",
      collapsed ? "w-14" : "w-60"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex items-center h-14 border-b border-border px-4 gap-2.5 flex-shrink-0",
        collapsed && "justify-center px-0"
      )}>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-from to-accent-to text-white text-xs font-bold flex-shrink-0">
          A
        </div>
        {!collapsed && (
          <span className="font-semibold text-text-primary text-sm">AlfredAI</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                active
                  ? "text-text-primary bg-bg-subtle border-l-2 border-accent-from"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-subtle border-l-2 border-transparent",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && label}
            </Link>
          )
        })}

        {/* Settings section */}
        {!collapsed && (
          <div className="pt-4">
            <button
              onClick={() => setSettingsOpen(p => !p)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 w-full text-left text-xs font-medium text-text-muted hover:text-text-secondary transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
              <ChevronRight className={cn("h-3 w-3 ml-auto transition-transform", settingsOpen && "rotate-90")} />
            </button>
            {settingsOpen && (
              <div className="mt-0.5 space-y-0.5">
                {settingsItems.map(({ href, label, icon: Icon, adminOnly }) => {
                  if (adminOnly && user?.role !== 'admin') return null
                  const active = pathname === href
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ml-2 transition-colors",
                        active
                          ? "text-text-primary bg-bg-subtle"
                          : "text-text-secondary hover:text-text-primary hover:bg-bg-subtle"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                      {label}
                      {adminOnly && (
                        <span className="ml-auto text-[10px] px-1 rounded bg-accent-from/10 text-accent-from">Admin</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {collapsed && (
          <div className="pt-4 space-y-0.5">
            {settingsItems.map(({ href, label, icon: Icon, adminOnly }) => {
              if (adminOnly && user?.role !== 'admin') return null
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center justify-center rounded-lg px-2 py-2 transition-colors",
                    active
                      ? "text-text-primary bg-bg-subtle"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-subtle"
                  )}
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* User */}
      <div className={cn("border-t border-border p-3", collapsed && "px-2")}>
        {!collapsed ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-elevated border border-border text-xs font-medium text-text-secondary flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{user?.email}</p>
                <p className="text-[10px] text-text-muted capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-error hover:bg-error/5 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="flex items-center justify-center w-full rounded-lg p-2 text-text-muted hover:text-error hover:bg-error/5 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  )
}
