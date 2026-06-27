'use client'
import { useAuth } from "@/contexts/AuthContext"
import { mockConversations } from "@/mock/conversations"
import { mockJiraIssues } from "@/mock/jira"
import { mockAuditLog } from "@/mock/audit"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
    text: 'PROJ-52 is blocked — 14 days with no progress',
    question: "Why is PROJ-52 blocked and how do I unblock it?",
    severity: 'error' as const,
  },
  {
    icon: Clock,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/20',
    text: 'PR #58 has an unreviewed change request for 3 days',
    question: "What's the status of PR #58 and what changes were requested?",
    severity: 'warning' as const,
  },
  {
    icon: CheckCircle2,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/20',
    text: 'Sprint 14 is 78% complete — 2 days remaining',
    question: "What's left in Sprint 14 and what are the risks?",
    severity: 'success' as const,
  },
]

const activityItems = [
  { tool: 'jira', text: 'PROJ-47 moved to In Review by Sarah Chen', time: '2026-06-27T14:28:00Z', issueKey: 'PROJ-47' },
  { tool: 'github', text: 'PR #61 approved by alex-kim', time: '2026-06-27T14:00:00Z', issueKey: null },
  { tool: 'jira', text: 'PROJ-53 assigned to Sarah Chen', time: '2026-06-27T13:45:00Z', issueKey: 'PROJ-53' },
  { tool: 'github', text: 'PR #62 opened by alex-kim', time: '2026-06-27T13:20:00Z', issueKey: null },
  { tool: 'jira', text: 'PROJ-52 blocked by PROJ-31', time: '2026-06-27T13:10:00Z', issueKey: 'PROJ-52' },
  { tool: 'jira', text: 'INFRA-12 updated by Alex Kim', time: '2026-06-27T12:00:00Z', issueKey: 'INFRA-12' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const firstName = user?.email?.split('@')[0]?.split('.')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

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
                {activityItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-bg-subtle transition-colors cursor-pointer"
                    onClick={() => item.issueKey && handleAskAlfred(`Tell me about ${item.issueKey}`)}
                  >
                    <div className={`mt-0.5 h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      item.tool === 'jira' ? 'bg-accent-from/10 text-accent-from' : 'bg-warning/10 text-warning'
                    }`}>
                      {item.tool === 'jira' ? 'J' : 'G'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-primary leading-relaxed">{item.text}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">{formatRelativeTime(item.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
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
                {[
                  { name: 'Jira', status: 'active' as const },
                  { name: 'GitHub', status: 'active' as const },
                  { name: 'Slack', status: 'coming_soon' as const },
                ].map(({ name, status }) => (
                  <div key={name} className="flex items-center gap-2 text-sm">
                    <span className={`h-2 w-2 rounded-full ${
                      status === 'active' ? 'bg-success animate-pulse' : 'bg-text-muted'
                    }`} />
                    <span className="text-text-secondary">{name}</span>
                    <span className="ml-auto text-xs text-text-muted">
                      {status === 'active' ? 'Active' : 'Coming soon'}
                    </span>
                  </div>
                ))}
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
