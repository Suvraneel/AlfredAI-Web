'use client'
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Bot, GitMerge, BarChart2, AlertTriangle, HelpCircle, ClipboardList, Bell } from "lucide-react"

const AGENTS = [
  {
    id: 'pr-summarizer',
    icon: GitMerge,
    name: 'PR Summarizer',
    description: 'Automatically updates linked Jira tickets when a PR is merged.',
    trigger: 'PR merged',
    action: 'Update linked Jira ticket',
    color: 'text-accent-from',
    bg: 'bg-accent-from/10',
  },
  {
    id: 'sprint-reporter',
    icon: BarChart2,
    name: 'Sprint Reporter',
    description: 'Posts a weekly sprint summary to your team.',
    trigger: 'Weekly cron (Monday 9am)',
    action: 'Post sprint summary',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    id: 'blocked-alert',
    icon: AlertTriangle,
    name: 'Blocked Ticket Alert',
    description: 'Notifies assignees when their tickets have been blocked for 24+ hours.',
    trigger: 'Daily at 10am',
    action: 'Notify assignees of blockers',
    color: 'text-error',
    bg: 'bg-error/10',
  },
  {
    id: 'onboarding-assistant',
    icon: HelpCircle,
    name: 'Onboarding Assistant',
    description: "Answers new team members' questions using your docs and Confluence.",
    trigger: 'Question asked',
    action: 'Answer from docs',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    id: 'standup-generator',
    icon: ClipboardList,
    name: 'Standup Generator',
    description: 'Generates daily standup notes from your recent Jira and GitHub activity.',
    trigger: 'Weekdays at 9am',
    action: 'Generate standup notes',
    color: 'text-accent-to',
    bg: 'bg-accent-to/10',
  },
  {
    id: 'code-review-notifier',
    icon: Bell,
    name: 'Code Review Notifier',
    description: 'Pings the assignee when a code review is requested on their PR.',
    trigger: 'Review requested',
    action: 'Ping assignee',
    color: 'text-success',
    bg: 'bg-success/10',
  },
]

export default function AgentsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      return JSON.parse(localStorage.getItem('agent_enabled') || '{}')
    } catch { return {} }
  })
  const [configuring, setConfiguring] = useState<string | null>(null)

  const toggleAgent = (id: string) => {
    const next = { ...enabled, [id]: !enabled[id] }
    setEnabled(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('agent_enabled', JSON.stringify(next))
    }
  }

  const configuringAgent = AGENTS.find(a => a.id === configuring)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-6 py-4 flex-shrink-0">
        <Bot className="h-4 w-4 text-text-muted" />
        <h1 className="text-sm font-semibold text-text-primary">Agents</h1>
        <Badge className="ml-2 text-[10px] bg-accent-from/10 text-accent-from border-accent-from/20">Preview</Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-text-muted mb-6">
            Pre-built automation agents. Full automation engine coming soon — toggle to preview and configure.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENTS.map(agent => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-bg-surface p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${agent.bg}`}>
                    <agent.icon className={`h-4.5 w-4.5 ${agent.color}`} style={{ height: '18px', width: '18px' }} />
                  </div>
                  <Switch
                    checked={!!enabled[agent.id]}
                    onCheckedChange={() => toggleAgent(agent.id)}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium text-text-primary">{agent.name}</h3>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">{agent.description}</p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <span className="text-text-muted w-12 flex-shrink-0">Trigger</span>
                    <span className="text-text-secondary">{agent.trigger}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-text-muted w-12 flex-shrink-0">Action</span>
                    <span className="text-text-secondary">{agent.action}</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-auto"
                  onClick={() => setConfiguring(agent.id)}
                >
                  Configure
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Config drawer */}
      <AnimatePresence>
        {configuringAgent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setConfiguring(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-bg-elevated border-l border-border shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-text-primary">Configure {configuringAgent.name}</h2>
                <button onClick={() => setConfiguring(null)} className="text-text-muted hover:text-text-primary">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Trigger</label>
                  <div className="rounded-lg border border-border bg-bg-surface px-3 py-2.5 text-sm text-text-secondary">
                    {configuringAgent.trigger}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Action</label>
                  <div className="rounded-lg border border-border bg-bg-surface px-3 py-2.5 text-sm text-text-secondary">
                    {configuringAgent.action}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Conditions</label>
                  <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-text-muted">
                    Condition editor coming soon
                  </div>
                </div>
                <div className="rounded-lg border border-accent-from/20 bg-accent-from/5 p-3 text-xs text-accent-from">
                  Full automation engine is post-MVP. Toggle to preview how this agent would behave.
                </div>
              </div>
              <div className="border-t border-border p-4">
                <Button className="w-full" variant="outline" onClick={() => setConfiguring(null)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
