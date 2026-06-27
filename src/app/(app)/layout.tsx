'use client'
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { AppShell } from "@/components/layout/AppShell"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-from to-accent-to text-white text-lg font-bold">
            A
          </div>
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-accent-from animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="h-1.5 w-1.5 rounded-full bg-accent-from animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="h-1.5 w-1.5 rounded-full bg-accent-from animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return <AppShell>{children}</AppShell>
}
