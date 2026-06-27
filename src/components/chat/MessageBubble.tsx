'use client'
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/utils"
import type { ChatMessage } from "@/hooks/useChat"
import type { ChatResponse } from "@/types/api"
import { ToolCallTrace } from "./ToolCallTrace"
import { ConfirmationCard } from "./ConfirmationCard"
import ReactMarkdown from "react-markdown"

interface MessageBubbleProps {
  message: ChatMessage
  onConfirmApprove?: (response: ChatResponse) => void
  onConfirmCancel?: () => void
}

export function MessageBubble({ message, onConfirmApprove, onConfirmCancel }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[75%] space-y-2", isUser ? "items-end" : "items-start")}>
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-accent-from/20 border border-accent-from/30 text-text-primary rounded-tr-sm"
            : "bg-bg-surface border border-border text-text-primary rounded-tl-sm"
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown
                components={{
                  code({ children, className, ...props }) {
                    const isInline = !className
                    return isInline ? (
                      <code className="bg-bg-elevated rounded px-1 py-0.5 text-xs font-mono text-accent-from" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className={cn("block bg-bg-elevated rounded-lg p-3 text-xs font-mono overflow-x-auto", className)} {...props}>
                        {children}
                      </code>
                    )
                  },
                  a({ children, href }) {
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent-from hover:underline">
                        {children}
                      </a>
                    )
                  },
                  strong({ children }) {
                    return <strong className="font-semibold text-text-primary">{children}</strong>
                  },
                  ul({ children }) {
                    return <ul className="list-disc list-inside space-y-1 text-text-secondary">{children}</ul>
                  },
                  li({ children }) {
                    return <li className="text-text-secondary">{children}</li>
                  },
                  p({ children }) {
                    return <p className="text-text-primary mb-2 last:mb-0">{children}</p>
                  },
                  h1({ children }) { return <h1 className="text-base font-semibold text-text-primary mb-2">{children}</h1> },
                  h2({ children }) { return <h2 className="text-sm font-semibold text-text-primary mb-1.5">{children}</h2> },
                  h3({ children }) { return <h3 className="text-sm font-medium text-text-primary mb-1">{children}</h3> },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && message.tool_calls && message.tool_calls.length > 0 && (
          <ToolCallTrace toolCalls={message.tool_calls} />
        )}

        {!isUser && message.pending_confirmation && onConfirmApprove && onConfirmCancel && (
          <ConfirmationCard
            confirmation={message.pending_confirmation}
            onApprove={onConfirmApprove}
            onCancel={onConfirmCancel}
          />
        )}

        <p className="text-[10px] text-text-muted px-1">
          {formatRelativeTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}
