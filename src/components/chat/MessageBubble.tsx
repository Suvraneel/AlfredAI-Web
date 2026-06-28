'use client'
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/utils"
import type { ChatMessage } from "@/hooks/useChat"
import type { ChatResponse } from "@/types/api"
import { ToolCallTrace } from "./ToolCallTrace"
import { ConfirmationCard } from "./ConfirmationCard"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"

interface MessageBubbleProps {
  message: ChatMessage
  onConfirmApprove?: (response: ChatResponse) => void
  onConfirmCancel?: () => void
}

// Transform [Jira: PROJ-47] and [GitHub: PR#61] → special markdown links
function preprocessBadges(content: string): string {
  return content
    .replace(/\[Jira: ([A-Z]+-\d+)\]/g, '[badge:jira:$1](jira:$1)')
    .replace(/\[GitHub: PR#(\d+)\]/g, '[badge:github:$1](github:pr$1)')
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
                rehypePlugins={[rehypeHighlight]}
                urlTransform={(url) => url}
                components={{
                  code({ children, className, ...props }) {
                    const isInline = !className
                    return isInline ? (
                      <code className="bg-bg-elevated rounded px-1 py-0.5 text-xs font-mono text-accent-from" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className={cn("block bg-bg-elevated rounded-lg p-3 text-xs font-mono overflow-x-auto hljs", className)} {...props}>
                        {children}
                      </code>
                    )
                  },
                  a({ href, children }) {
                    // Source badge: jira:PROJ-47
                    if (href?.startsWith('jira:')) {
                      const key = href.replace('jira:', '')
                      return (
                        <a
                          href={`https://jira.atlassian.com/browse/${key}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-accent-from/10 border border-accent-from/20 px-2 py-0.5 text-xs font-mono text-accent-from hover:bg-accent-from/20 transition-colors no-underline"
                        >
                          Jira: {key}
                        </a>
                      )
                    }
                    // Source badge: github:prNN
                    if (href?.startsWith('github:pr')) {
                      const num = href.replace('github:pr', '')
                      return (
                        <a
                          href={`https://github.com/pulls/${num}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-xs font-mono text-orange-400 hover:bg-orange-500/20 transition-colors no-underline"
                        >
                          GitHub: PR#{num}
                        </a>
                      )
                    }
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
                {preprocessBadges(message.content)}
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
