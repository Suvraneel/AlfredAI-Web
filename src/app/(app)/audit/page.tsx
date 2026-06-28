'use client'
import { useState, useEffect } from "react"
import { getAuditLog } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDateTime } from "@/lib/utils"
import type { AuditLogItem } from "@/types/api"
import { FileText, ChevronLeft, ChevronRight } from "lucide-react"

const ACTION_LABELS: Record<string, string> = {
  'jira.issue.create': 'Created issue',
  'jira.issue.transition': 'Transitioned issue',
  'jira.issue.comment': 'Added comment',
  'jira.issue.assign': 'Assigned issue',
  'jira.issue.update': 'Updated issue',
  'confluence.page.create': 'Created page',
  'confluence.page.update': 'Updated page',
  'confluence.page.comment': 'Added comment',
  'confluence.space.create': 'Created space',
  'confluence.page.link_jira': 'Linked Jira issue',
}

const LIMIT = 50

export default function AuditPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<AuditLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [toolFilter, setToolFilter] = useState<string>('all')

  const fetchAudit = async (newOffset = 0) => {
    setLoading(true)
    try {
      const params: Record<string, string | number | undefined> = {
        limit: LIMIT,
        offset: newOffset,
      }
      if (toolFilter !== 'all') params.tool = toolFilter

      const data = await getAuditLog(params)
      setItems(data.items)
      setTotal(data.total)
      setOffset(newOffset)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAudit(0) }, [toolFilter])

  const totalPages = Math.ceil(total / LIMIT)
  const currentPage = Math.floor(offset / LIMIT) + 1

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-6 py-4 flex-shrink-0">
        <FileText className="h-4 w-4 text-text-muted" />
        <h1 className="text-sm font-semibold text-text-primary">Audit Log</h1>
        <span className="text-xs text-text-muted ml-1">({total} total)</span>

        <div className="ml-auto flex items-center gap-2">
          <Select value={toolFilter} onValueChange={setToolFilter}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="Tool" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tools</SelectItem>
              <SelectItem value="jira">Jira</SelectItem>
              <SelectItem value="github">GitHub</SelectItem>
              <SelectItem value="confluence">Confluence</SelectItem>
            </SelectContent>
          </Select>

        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="space-y-4 max-w-2xl mx-auto">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-3 w-3 rounded-full mt-1 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No actions yet"
            description="Alfred logs every change it makes here."
          />
        ) : (
          <div className="max-w-2xl mx-auto relative">
            {/* Timeline line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />

            <div className="space-y-0">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  {/* Dot */}
                  <div className={`relative z-10 mt-[18px] h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    item.status === 'success'
                      ? 'border-success bg-bg-base'
                      : 'border-error bg-error'
                  }`}>
                    {item.status === 'success' ? (
                      <div className="h-1.5 w-1.5 rounded-full bg-success" />
                    ) : null}
                  </div>

                  {/* Content */}
                  <div className="flex-1 py-3 border-b border-border last:border-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-text-primary">
                            {ACTION_LABELS[item.action_type] || item.action_type}
                          </span>
                          <code className="text-xs font-mono text-accent-from bg-accent-from/10 px-1.5 py-0.5 rounded">
                            {item.target_resource_id}
                          </code>
                          <Badge variant={item.status === 'success' ? 'success' : 'error'} className="text-[10px]">
                            {item.status === 'success' ? '✓' : '✗'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-text-muted capitalize">{item.tool}</span>
                          {user?.role === 'admin' && (
                            <span className="text-xs text-text-muted font-mono">{item.actor_user_id.slice(0, 12)}…</span>
                          )}
                          <span className="text-xs text-text-muted">{formatDateTime(item.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-text-muted">
            Page {currentPage} of {totalPages} · {total} entries
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchAudit(offset - LIMIT)}
              disabled={offset === 0 || loading}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchAudit(offset + LIMIT)}
              disabled={offset + LIMIT >= total || loading}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
