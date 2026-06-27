'use client'
import { useRef, useState, useEffect } from "react"
import { Send, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAtlassianId } from "@/lib/auth"
import Link from "next/link"

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [hasAtlassianId, setHasAtlassianId] = useState(true)

  useEffect(() => {
    setHasAtlassianId(!!getAtlassianId())
  }, [])

  const adjustHeight = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  const handleSend = () => {
    const msg = value.trim()
    if (!msg || disabled) return
    onSend(msg)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border bg-bg-base px-4 py-3 flex-shrink-0">
      {!hasAtlassianId && (
        <div className="flex items-center gap-2 mb-2 rounded-lg bg-warning/10 border border-warning/20 px-3 py-2 text-xs text-warning">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Set your Atlassian Account ID in </span>
          <Link href="/settings/profile" className="underline hover:text-warning/80">Profile</Link>
          <span> to enable Jira write actions.</span>
        </div>
      )}

      <div className="flex items-end gap-2 rounded-xl border border-border bg-bg-elevated p-2 focus-within:border-accent-from/50 focus-within:ring-2 focus-within:ring-accent-from/10 transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { setValue(e.target.value); adjustHeight() }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Ask anything about your Jira or GitHub..."}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted resize-none outline-none py-1.5 px-2 disabled:opacity-50"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-all flex-shrink-0",
            value.trim() && !disabled
              ? "bg-accent-from hover:bg-accent-from/90 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
              : "bg-bg-subtle text-text-muted cursor-not-allowed"
          )}
        >
          {disabled ? (
            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <p className="mt-1.5 text-center text-[10px] text-text-muted">
        ⌘K to search &nbsp;·&nbsp; Shift+Enter for new line
      </p>
    </div>
  )
}
