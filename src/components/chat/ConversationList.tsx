'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { formatRelativeTime, truncate } from "@/lib/utils"
import { mockConversations } from "@/mock/conversations"
import { Plus } from "lucide-react"

export function ConversationList({ onNewChat }: { onNewChat?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 flex-shrink-0">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 w-full rounded-lg border border-accent-from/30 bg-accent-from/5 px-3 py-2 text-sm text-accent-from hover:bg-accent-from/10 hover:border-accent-from/50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2">
        {mockConversations.map(conv => {
          const active = pathname === `/chat/${conv.id}`
          return (
            <Link
              key={conv.id}
              href={`/chat/${conv.id}`}
              className={cn(
                "flex flex-col gap-0.5 rounded-lg px-3 py-2.5 transition-colors",
                active
                  ? "bg-bg-subtle border-l-2 border-accent-from"
                  : "hover:bg-bg-subtle border-l-2 border-transparent"
              )}
            >
              <span className="text-xs font-medium text-text-primary truncate">
                {truncate(conv.title, 40)}
              </span>
              <span className="text-[10px] text-text-muted">
                {formatRelativeTime(conv.created_at)}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
