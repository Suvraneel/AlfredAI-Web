'use client'
import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { CommandPalette } from "./CommandPalette"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-full bg-bg-base">
      {/* Sidebar */}
      <div className={cn(
        "hidden lg:flex flex-col flex-shrink-0 h-full transition-all duration-250",
        sidebarCollapsed ? "w-14" : "w-60"
      )}>
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {children}
      </div>

      {/* Command palette */}
      <CommandPalette />
    </div>
  )
}
