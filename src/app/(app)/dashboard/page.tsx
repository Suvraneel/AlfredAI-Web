'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { getAuditLog, getConnections } from "@/lib/api"
import type { AuditLogItem, ToolConnection } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatRelativeTime, formatDate } from "@/lib/utils"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle, Clock, CheckCircle2, Plus, FileText, Activity,
  Zap, LayoutDashboard
} from "lucide-react"

const insights = [
  {
    icon: AlertCircle,
    color: 'text-error',
    bgColor: 'bg-error/10',
    borderColor: 'border-error/20',
    text: 'Ask Alfred about blocked issues in your current sprint.',
    question: "What's blocking our current sprint?",
    severity: 'error' as const,
  },
  {
    icon: Clock,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/20',
    text: 'Check for open PRs that need review.',
    question: "Show me all open PRs needing review",
    severity: 'warning' as const,
  },
  {
    icon: CheckCircle2,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/20',
    text: 'Summarize recent changes across your tools.',
    question: "Summarize what changed in the last week",
    severity: 'success' as const,
  },
]

const TOOL_LABELS: Record<string, string> = {
  jira: 'Jira',
  github: 'GitHub',
  slack: 'Slack',
  confluence: 'Confluence',
  asana: 'Asana',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [auditItems, setAuditItems] = useState<AuditLogItem[]>([])
  const [connections, setConnections] = useState<ToolConnection[]>([])
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [loadingConnections, setLoadingConnections] = useState(true)

  const firstName = user?.email?.split('@')[0]?.split('.')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    getAuditLog({ limit: 6 })
      .then(r => setAuditItems(r.items))
      .catch(() => {})
      .finally(() => setLoadingActivity(false))
  }, [])

  useEffect(() => {
    getConnections()
      .then(r => setConnections(r.connections))
      .catch(() => {})
      .finally(() => setLoadingConnections(false))
  }, [])

  const handleAskAlfred = (question: string) => {
    router.push(`/chat?q=${encodeURIComponent(question)}`)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-4 flex-shrink-0">
        <LayoutDashboard className="h-4 w-4 text-text-muted" />
        <div>
          <h1 className="text-sm font-semibold text-text-primary">
            {greeting}, {firstName}.
          </h1>
          <p className="text-xs text-text-muted">{formatDate(new Date().toISOString())}</p>
        </div>
        <div className="ml-auto">
          <Link href="/chat">
            <Button size="sm" variant="gradient" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0 }}
            className="lg:col-span-1"
          >
            <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Activity className="h-4 w-4 text-text-muted" />
                <h2 className="text-sm font-medium text-text-primary">Activity</h2>
              </div>
              <div className="divide-y divide-border">
                {loadingActivity ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3">
                      <Skeleton className="h-6 w-6 rounded-md flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-full rounded" />
                        <Skeleton className="h-2.5 w-1/3 rounded" />
                      </div>
                    </div>
                  ))
                ) : auditItems.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-text-muted">
                    No actions yet — Alfred logs every change it makes here.
                  </div>
                ) : (
                  auditItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-bg-subtle transition-colors"
                    >
                      <div className={`mt-0.5 h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        item.tool === 'jira' ? 'bg-accent-from/10 text-accent-from' : 'bg-warning/10 text-warning'
                      }`}>
                        {item.tool === 'jira' ? 'J' : 'G'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-primary leading-relaxed truncate">
                          <span className="capitalize">{item.action_type.replace(/\./g, ' ')}</span>
                          {item.target_resource_id && <span className="text-accent-from"> {item.target_resource_id}</span>}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5">{formatRelativeTime(item.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {auditItems.length > 0 && (
                <div className="border-t border-border px-4 py-2">
                  <Link href="/audit" className="text-xs text-accent-from hover:underline">View full audit log →</Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="lg:col-span-1"
          >
            <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Zap className="h-4 w-4 text-text-muted" />
                <h2 className="text-sm font-medium text-text-primary">AI Insights</h2>
              </div>
              <div className="p-4 space-y-3">
                {insights.map((insight, i) => (
                  <div key={i} className={`rounded-lg border p-3 ${insight.borderColor} ${insight.bgColor}`}>
                    <div className="flex items-start gap-2">
                      <insight.icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${insight.color}`} />
                      <p className="text-xs text-text-primary leading-relaxed flex-1">{insight.text}</p>
                    </div>
                    <button
                      onClick={() => handleAskAlfred(insight.question)}
                      className={`mt-2 text-[10px] font-medium hover:underline ${insight.color}`}
                    >
                      Ask Alfred →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="lg:col-span-1 space-y-4"
          >
            {/* Connection status */}
            <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-sm font-medium text-text-primary">Connections</h2>
              </div>
              <div className="p-4 space-y-2">
                {loadingConnections ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <Skeleton className="h-3 w-24 rounded" />
                      <Skeleton className="h-3 w-16 rounded ml-auto" />
                    </div>
                  ))
                ) : connections.length === 0 ? (
                  <p className="text-xs text-text-muted">No connections yet.</p>
                ) : (
                  connections.map(({ tool, status }) => (
                    <div key={tool} className="flex items-center gap-2 text-sm">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        status === 'active' ? 'bg-success animate-pulse' : 'bg-text-muted'
                      }`} />
                      <span className="text-text-secondary">{TOOL_LABELS[tool] ?? tool}</span>
                      <span className="ml-auto text-xs text-text-muted capitalize">
                        {status === 'active' ? 'Active' : status === 'coming_soon' ? 'Coming soon' : status}
                      </span>
                    </div>
                  ))
                )}
                <Link href="/settings/connections" className="block mt-3 text-xs text-accent-from hover:underline">
                  Manage connections →
                </Link>
              </div>
            </div>

            {/* Quick links */}
            <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-sm font-medium text-text-primary">Quick actions</h2>
              </div>
              <div className="p-4 space-y-2">
                <Link href="/chat" className="flex items-center gap-2 rounded-lg hover:bg-bg-subtle px-2 py-2 transition-colors">
                  <Plus className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">New Chat</span>
                </Link>
                <Link href="/audit" className="flex items-center gap-2 rounded-lg hover:bg-bg-subtle px-2 py-2 transition-colors">
                  <FileText className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">View Audit Log</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
