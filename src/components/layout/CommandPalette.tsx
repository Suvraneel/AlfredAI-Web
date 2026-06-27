'use client'
import { useCommandPalette } from "@/hooks/useCommandPalette"
import { AnimatePresence, motion } from "framer-motion"
import { Search, MessageSquare, FileText, Command } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { CommandItem } from "@/hooks/useCommandPalette"

export function CommandPalette() {
  const { isOpen, close, query, setQuery, items } = useCommandPalette()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSelected(0)
    }
  }, [isOpen])

  useEffect(() => {
    setSelected(0)
  }, [query])

  const handleSelect = (item: CommandItem) => {
    if (item.href) router.push(item.href)
    if (item.action) item.action()
    close()
  }

  const iconMap = {
    command: Command,
    jira: FileText,
    conversation: MessageSquare,
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
          onClick={close}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl bg-bg-elevated border border-border rounded-xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, items.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
              if (e.key === 'Enter' && items[selected]) handleSelect(items[selected])
            }}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-text-muted flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search commands, issues, conversations..."
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
              />
              <kbd className="text-[10px] text-text-muted border border-border rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto py-2">
              {items.length === 0 ? (
                <p className="text-center text-sm text-text-muted py-8">No results</p>
              ) : (
                items.map((item, i) => {
                  const Icon = iconMap[item.type]
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        selected === i ? "bg-bg-subtle" : "hover:bg-bg-subtle"
                      )}
                      onMouseEnter={() => setSelected(i)}
                    >
                      <Icon className="h-4 w-4 text-text-muted flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          "text-sm",
                          item.type === 'jira' ? "font-mono text-accent-from" : "text-text-primary"
                        )}>
                          {item.label}
                        </span>
                        {item.description && (
                          <span className="text-xs text-text-muted ml-2">{item.description}</span>
                        )}
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-surface border border-border text-text-muted">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>

            <div className="border-t border-border px-4 py-2 flex gap-4 text-[10px] text-text-muted">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>esc close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
