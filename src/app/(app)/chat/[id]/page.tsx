'use client'
import { use } from "react"
import { ChatWindow } from "@/components/chat/ChatWindow"

export default function ChatConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <div className="flex h-full overflow-hidden">
      <ChatWindow conversationId={id} />
    </div>
  )
}
