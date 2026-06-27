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
import { Settings, RefreshCw, Unplug, Plug, Lock } from "lucide-react"
import { toast } from "sonner"

const TOOL_NAMES = { jira: 'Jira', github: 'GitHub', slack: 'Slack', confluence: 'Confluence', asana: 'Asana' }

export default function ConnectionsSettingsPage() {
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
        <Settings className="h-4 w-4 text-text-muted" />
        <h1 className="text-sm font-semibold text-text-primary">Connections</h1>
        {user?.role !== 'admin' && (
          <span className="ml-2 flex items-center gap-1 text-xs text-text-muted">
            <Lock className="h-3 w-3" /> Admin required to disconnect
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          ) : (
            connections.map(conn => {
              const name = TOOL_NAMES[conn.tool as keyof typeof TOOL_NAMES] || conn.tool
              const isComingSoon = conn.status === 'coming_soon'
              const isActive = conn.status === 'active'

              return (
                <div key={conn.tool} className={`rounded-xl border border-border bg-bg-surface p-5 ${isComingSoon ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-text-primary">{name}</h3>
                        {isComingSoon && (
                          <span className="text-[10px] border border-border rounded px-1.5 text-text-muted">Coming soon</span>
                        )}
                      </div>
                      {conn.connected_at && (
                        <p className="text-xs text-text-muted mt-1">Connected {formatDate(conn.connected_at)}</p>
                      )}
                      {conn.scopes.length > 0 && (
                        <p className="text-xs text-text-muted mt-0.5">
                          Scopes: {conn.scopes.join(', ')}
                        </p>
                      )}
                    </div>
                    <StatusDot status={conn.status} showLabel />
                  </div>

                  {!isComingSoon && (
                    <div className="flex gap-2 mt-4">
                      {isActive ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
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
                              className="gap-1.5 border-error/30 text-error hover:bg-error/5"
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
                          className="gap-1.5"
                          onClick={() => handleConnect(conn.tool as 'jira' | 'github')}
                          loading={connecting === conn.tool}
                        >
                          <Plug className="h-3 w-3" />
                          Connect {name}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

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
            <Button className="bg-error hover:bg-error/90 text-white" onClick={handleDisconnect} loading={disconnecting}>
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
