'use client'

interface StreamingMessageProps {
  message?: string
  elapsedSeconds: number
}

export function StreamingMessage({ message, elapsedSeconds }: StreamingMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%]">
        <div className="rounded-2xl rounded-tl-sm bg-bg-surface border border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">
              {message || "Alfred is thinking"}
            </span>
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-from animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-accent-from animate-pulse" style={{ animationDelay: '200ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-accent-from animate-pulse" style={{ animationDelay: '400ms' }} />
            </span>
            {elapsedSeconds > 2 && (
              <span className="text-xs text-text-muted ml-1">({elapsedSeconds}s)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
