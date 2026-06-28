'use client'
import { useEffect, useState } from "react"
import { Sidebar } from "./Sidebar"
import { BottomNav } from "./BottomNav"
import { CommandPalette } from "./CommandPalette"
import { PageTransition } from "./PageTransition"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  // Icon-only on 768–1023px, full on 1024px+
  useEffect(() => {
    const update = () => setCollapsed(window.innerWidth < 1024)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div className="flex h-full bg-bg-base">
      {/* Sidebar — icon-only on md, full on lg */}
      <div className="hidden md:flex flex-col flex-shrink-0 h-full transition-all duration-250"
           style={{ width: collapsed ? 56 : 240 }}>
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Main content with page transitions */}
      <PageTransition>
        {children}
      </PageTransition>

      {/* Mobile bottom nav (< 768px) */}
      <BottomNav />

      {/* Command palette */}
      <CommandPalette />
    </div>
  )
}
