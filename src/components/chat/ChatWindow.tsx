'use client'
import { useEffect, useRef } from "react"
import { useChat } from "@/hooks/useChat"
import { MessageBubble } from "./MessageBubble"
import { StreamingMessage } from "./StreamingMessage"
import { ChatInput } from "./ChatInput"
import { ConversationList } from "./ConversationList"
import { EmptyState } from "@/components/shared/EmptyState"
import { MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import type { ChatResponse } from "@/types/api"

const SUGGESTIONS = [
  "What's blocking our current sprint?",
  "Show me all open PRs needing review",
  "Summarize what changed in PROJ this week",
]

interface ChatWindowProps {
  conversationId?: string
  initialQuery?: string
}

export function ChatWindow({ conversationId, initialQuery }: ChatWindowProps) {
  const router = useRouter()
  const { messages, isStreaming, streamingMessage, elapsedSeconds, sendMessage, clearChat, setMessages } = useChat(conversationId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const didSendInitial = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  useEffect(() => {
    if (initialQuery && !didSendInitial.current && !conversationId) {
      didSendInitial.current = true
      sendMessage(initialQuery)
    }
  }, [initialQuery, conversationId, sendMessage])

  const handleNewChat = () => {
    clearChat()
    router.push('/chat')
  }

  const handleConfirmApprove = (response: ChatResponse, msgId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) return { ...m, pending_confirmation: undefined }
      return m
    }))
    const aiMsg = {
      id: `msg-${Date.now()}-confirm`,
      role: 'assistant' as const,
      content: response.reply,
      timestamp: new Date().toISOString(),
      tool_calls: response.tool_calls_made,
      pending_confirmation: response.pending_confirmation ?? undefined,
      conversation_id: response.conversation_id,
    }
    setMessages(prev => [...prev, aiMsg])
  }

  const handleConfirmCancel = (msgId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) return { ...m, pending_confirmation: undefined, content: m.content + '\n\n*Action cancelled.*' }
      return m
    }))
  }

  return (
    <div className="flex h-full">
      {/* Left sidebar */}
      <div className="w-60 flex-shrink-0 border-r border-border bg-bg-surface hidden md:flex flex-col">
        <ConversationList onNewChat={handleNewChat} />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-from to-accent-to text-white text-xl font-bold shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                  A
                </div>
                <h2 className="text-lg font-semibold text-text-primary">Ask anything about your Jira or GitHub.</h2>
                <p className="text-sm text-text-muted">Alfred searches your connected tools and gives you answers.</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="rounded-full border border-border bg-bg-elevated px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-accent-from/30 hover:bg-bg-subtle transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onConfirmApprove={msg.pending_confirmation ? (r) => handleConfirmApprove(r, msg.id) : undefined}
                  onConfirmCancel={msg.pending_confirmation ? () => handleConfirmCancel(msg.id) : undefined}
                />
              ))}
              {isStreaming && (
                <StreamingMessage message={streamingMessage} elapsedSeconds={elapsedSeconds} />
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  )
}
