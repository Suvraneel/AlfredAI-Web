'use client'
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { Suspense } from "react"

function ChatContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q')

  return <ChatWindow initialQuery={q || undefined} />
}

export default function ChatPage() {
  return (
    <div className="flex h-full overflow-hidden">
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-text-muted text-sm">Loading...</div></div>}>
        <ChatContent />
      </Suspense>
    </div>
  )
}
