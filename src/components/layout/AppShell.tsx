'use client'
import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { BottomNav } from "./BottomNav"
import { CommandPalette } from "./CommandPalette"
import { PageTransition } from "./PageTransition"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-full bg-bg-base">
      {/* Sidebar — desktop only */}
      <div className={cn(
        "hidden lg:flex flex-col flex-shrink-0 h-full transition-all duration-250",
        sidebarCollapsed ? "w-14" : "w-60"
      )}>
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      {/* Main content with page transitions */}
      <PageTransition>
        {children}
      </PageTransition>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* Command palette */}
      <CommandPalette />
    </div>
  )
}
