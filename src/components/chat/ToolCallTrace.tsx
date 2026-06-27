'use client'
import { useState } from "react"
import { ChevronRight, CheckCircle2, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ToolCallRecord } from "@/types/api"

interface ToolCallTraceProps {
  toolCalls: ToolCallRecord[]
}

export function ToolCallTrace({ toolCalls }: ToolCallTraceProps) {
  const [open, setOpen] = useState(false)
  if (!toolCalls.length) return null

  const successCount = toolCalls.filter(t => t.success).length
  const failCount = toolCalls.filter(t => !t.success).length

  return (
    <div className="mt-2 rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-text-muted hover:bg-bg-subtle transition-colors bg-bg-surface"
      >
        <ChevronRight className={cn("h-3 w-3 transition-transform flex-shrink-0", open && "rotate-90")} />
        <span>Agent used {toolCalls.length} tool{toolCalls.length !== 1 ? 's' : ''}</span>
        <span className="ml-auto flex items-center gap-2">
          {successCount > 0 && <span className="text-success">{successCount} ✓</span>}
          {failCount > 0 && <span className="text-error">{failCount} ✗</span>}
        </span>
      </button>

      {open && (
        <div className="divide-y divide-border">
          {toolCalls.map((call, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2 bg-bg-base">
              {call.success ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-error mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="font-mono text-xs text-text-primary">{call.tool_name}</span>
                {Object.keys(call.arguments).length > 0 && (
                  <span className="ml-1.5 text-xs text-text-muted">
                    ({Object.entries(call.arguments).map(([k, v]) => `${k}: ${v}`).join(', ')})
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 text-[10px] text-text-muted flex-shrink-0">
                <Clock className="h-2.5 w-2.5" />
                {call.duration_ms}ms
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
