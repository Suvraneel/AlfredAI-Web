'use client'
import { useState } from "react"
import { useConnections } from "@/hooks/useConnections"
import { useAuth } from "@/contexts/AuthContext"
import { StatusDot } from "@/components/shared/StatusDot"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { getConnectionAuthorizeUrl, disconnectTool } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { Lock, RefreshCw, Unplug, Plug } from "lucide-react"
import { toast } from "@/lib/toast"
import { Plug as PlugIcon } from "lucide-react"

const TOOL_META = {
  jira: { name: 'Jira', vendor: 'Atlassian', description: 'Issues, sprints, and backlogs', color: '#6366F1', connectable: true },
  github: { name: 'GitHub', vendor: 'GitHub Inc.', description: 'PRs, commits, and reviews', color: '#F59E0B', connectable: true },
  slack: { name: 'Slack', vendor: 'Salesforce', description: 'Channels, messages, and notifications', color: '#10B981', connectable: false },
  confluence: { name: 'Confluence', vendor: 'Atlassian', description: 'Docs, pages, and knowledge base', color: '#6366F1', connectable: false },
  asana: { name: 'Asana', vendor: 'Asana Inc.', description: 'Tasks, projects, and timelines', color: '#F59E0B', connectable: false },
}

const ALL_TOOLS = Object.keys(TOOL_META) as (keyof typeof TOOL_META)[]

export default function IntegrationsPage() {
  const { connections, isLoading, refetch } = useConnections()
  const { user } = useAuth()
  const [disconnectTarget, setDisconnectTarget] = useState<'jira' | 'github' | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)

  const handleConnect = async (tool: 'jira' | 'github') => {
    setConnecting(tool)
    try {
      const { authorization_url } = await getConnectionAuthorizeUrl(tool)
      window.location.href = authorization_url
    } catch {
      toast.error(`Failed to initiate ${tool} connection`)
      setConnecting(null)
    }
  }

  const handleDisconnect = async () => {
    if (!disconnectTarget) return
    setDisconnecting(true)
    try {
      await disconnectTool(disconnectTarget)
      toast.success(`${disconnectTarget} disconnected`)
      await refetch()
    } catch {
      toast.error(`Failed to disconnect ${disconnectTarget}`)
    } finally {
      setDisconnecting(false)
      setDisconnectTarget(null)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-6 py-4 flex-shrink-0">
        <PlugIcon className="h-4 w-4 text-text-muted" />
        <h1 className="text-sm font-semibold text-text-primary">Integrations</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-text-muted mb-6">Connect your tools to enable AI-powered answers and actions.</p>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALL_TOOLS.map(toolKey => {
                const meta = TOOL_META[toolKey]
                const apiConn = connections.find(c => c.tool === toolKey)
                const conn = apiConn ?? { tool: toolKey, status: meta.connectable ? 'disconnected' : 'coming_soon', connected_at: null, scopes: [], last_verified_at: null }
                const isComingSoon = !meta.connectable
                const isActive = conn.status === 'active'

                return (
                  <div key={toolKey} className={`rounded-xl border bg-bg-surface p-5 flex flex-col gap-4 ${
                    isComingSoon ? 'opacity-60 border-border' : 'border-border hover:border-border-accent transition-colors'
                  }`}>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm"
                          style={{ background: `${meta.color}20`, color: meta.color }}>
                          {meta.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{meta.name}</p>
                          <p className="text-xs text-text-muted">{meta.vendor}</p>
                        </div>
                      </div>
                      {isComingSoon && (
                        <div className="flex items-center gap-1 text-[10px] text-text-muted border border-border rounded px-1.5 py-0.5">
                          <Lock className="h-2.5 w-2.5" />
                          Coming soon
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-text-muted">{meta.description}</p>

                    {!isComingSoon && (
                      <>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <StatusDot status={conn.status} showLabel />
                          </div>
                          {conn.connected_at && (
                            <p className="text-xs text-text-muted">
                              Connected {formatDate(conn.connected_at)}
                            </p>
                          )}
                          {conn.last_verified_at && (
                            <p className="text-xs text-text-muted">
                              Synced {new Date(conn.last_verified_at).toLocaleTimeString()}
                            </p>
                          )}
                          {conn.scopes.length > 0 && (
                            <p className="text-xs text-text-muted">
                              Scopes: {conn.scopes.slice(0, 2).join(', ')}{conn.scopes.length > 2 ? ` +${conn.scopes.length - 2}` : ''}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 mt-auto">
                          {isActive ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-1.5"
                                onClick={() => handleConnect(conn.tool as 'jira' | 'github')}
                                loading={connecting === conn.tool}
                              >
                                <RefreshCw className="h-3 w-3" />
                                Reconnect
                              </Button>
                              {user?.role === 'admin' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 gap-1.5 border-error/30 text-error hover:bg-error/5"
                                  onClick={() => setDisconnectTarget(conn.tool as 'jira' | 'github')}
                                >
                                  <Unplug className="h-3 w-3" />
                                  Disconnect
                                </Button>
                              )}
                            </>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full gap-1.5"
                              onClick={() => handleConnect(conn.tool as 'jira' | 'github')}
                              loading={connecting === conn.tool}
                            >
                              <Plug className="h-3 w-3" />
                              Connect {meta.name}
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Disconnect confirmation dialog */}
      <Dialog open={!!disconnectTarget} onOpenChange={() => setDisconnectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {disconnectTarget}?</DialogTitle>
            <DialogDescription>
              This revokes your token and stops all AI actions for this tool. You can reconnect at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectTarget(null)}>Cancel</Button>
            <Button
              className="bg-error hover:bg-error/90 text-white"
              onClick={handleDisconnect}
              loading={disconnecting}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
