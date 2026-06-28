'use client'
import { useRef, useState, useCallback } from "react"
import { getContext } from "@/lib/api"
import type { CrossToolContext } from "@/types/api"
import { motion, AnimatePresence } from "framer-motion"
import { X, Network, Search, Loader2, GitPullRequest, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Node {
  id: string
  type: 'jira' | 'github' | 'user'
  label: string
  summary?: string
  status?: string
  x: number
  y: number
}

interface Edge {
  source: string
  target: string
  type: 'pr-ref' | 'reviewed' | 'committed'
}

const STATUS_COLORS: Record<string, string> = {
  'In Review': '#F59E0B',
  'Blocked': '#EF4444',
  'In Progress': '#6366F1',
  'Done': '#10B981',
  'To Do': '#52525B',
  'open': '#6366F1',
  'closed': '#10B981',
}

function buildGraphFromContext(ctx: CrossToolContext): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Center: Jira issue
  const issue = ctx.jira_issue
  nodes.push({
    id: issue.key,
    type: 'jira',
    label: issue.key,
    summary: issue.summary,
    status: issue.status,
    x: 400,
    y: 300,
  })

  // PR nodes in a circle around the issue
  ctx.linked_prs.forEach((pr, i) => {
    const angle = (i / Math.max(ctx.linked_prs.length, 1)) * Math.PI * 2
    const r = 200
    const prId = `pr-${pr.number}`
    nodes.push({
      id: prId,
      type: 'github',
      label: `#${pr.number}`,
      summary: pr.title,
      status: pr.state,
      x: 400 + r * Math.cos(angle),
      y: 300 + r * Math.sin(angle),
    })
    edges.push({ source: issue.key, target: prId, type: 'pr-ref' })

    // Reviewer nodes from this PR
    const reviews = ctx.pr_reviews[pr.number] || []
    const uniqueReviewers = [...new Set(reviews.map(r => r.reviewer))]
    uniqueReviewers.forEach((reviewer, j) => {
      const userId = `user-${reviewer}`
      if (!nodes.find(n => n.id === userId)) {
        const reviewerAngle = angle + (j - uniqueReviewers.length / 2) * 0.4
        nodes.push({
          id: userId,
          type: 'user',
          label: reviewer.split('@')[0].slice(0, 8),
          summary: reviewer,
          x: 400 + (r + 110) * Math.cos(reviewerAngle),
          y: 300 + (r + 110) * Math.sin(reviewerAngle),
        })
      }
      edges.push({ source: prId, target: userId, type: 'reviewed' })
    })
  })

  return { nodes, edges }
}

export default function KnowledgePage() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ctx, setCtx] = useState<CrossToolContext | null>(null)
  const [graph, setGraph] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null)
  const [selected, setSelected] = useState<Node | null>(null)
  const [hovered, setHovered] = useState<{ node: Node; x: number; y: number } | null>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const isPanning = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const key = query.trim().toUpperCase()
    if (!key) return
    setLoading(true)
    setError(null)
    setCtx(null)
    setGraph(null)
    setSelected(null)
    setTransform({ x: 0, y: 0, scale: 1 })
    try {
      const result = await getContext(key)
      setCtx(result)
      setGraph(buildGraphFromContext(result))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load context')
    } finally {
      setLoading(false)
    }
  }, [query])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('.node-group')) return
    isPanning.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }))
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.9 : 1.1
    setTransform(t => ({ ...t, scale: Math.min(2, Math.max(0.3, t.scale * factor)) }))
  }

  const nodeColor = (n: Node) => {
    if (n.type === 'github') return '#F59E0B'
    if (n.type === 'user') return '#52525B'
    return STATUS_COLORS[n.status || ''] || '#6366F1'
  }

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-3 flex-shrink-0">
        <Network className="h-4 w-4 text-text-muted" />
        <h1 className="text-sm font-semibold text-text-primary">Knowledge Graph</h1>
        <form onSubmit={handleSearch} className="ml-auto flex items-center gap-2">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Enter Jira key e.g. PROJ-47"
            className="w-56 h-8 text-xs font-mono"
          />
          <Button type="submit" size="sm" disabled={loading || !query.trim()} className="gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            Load
          </Button>
        </form>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-bg-base">
        {!graph && !loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-bg-subtle flex items-center justify-center">
              <Network className="h-8 w-8 text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Enter a Jira issue key to explore relationships</p>
              <p className="text-xs text-text-muted mt-1">Shows the issue, linked PRs, commits, and reviewers from your connected tools</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-accent-from" />
              <p className="text-sm text-text-muted">Fetching cross-tool context…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-sm text-error">{error}</p>
              <p className="text-xs text-text-muted">Make sure Jira and GitHub are connected and the issue key is correct.</p>
              <Button size="sm" variant="outline" onClick={() => { setError(null); setQuery('') }}>Try again</Button>
            </div>
          </div>
        )}

        {graph && (
          <svg
            ref={svgRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => { isPanning.current = false }}
            onMouseLeave={() => { isPanning.current = false }}
            onWheel={handleWheel}
          >
            <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
              {/* Edges */}
              {graph.edges.map((edge, i) => {
                const src = graph.nodes.find(n => n.id === edge.source)
                const tgt = graph.nodes.find(n => n.id === edge.target)
                if (!src || !tgt) return null
                const color = edge.type === 'pr-ref' ? '#6366F1' : edge.type === 'reviewed' ? '#F59E0B' : '#52525B'
                return (
                  <line key={i}
                    x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke={color} strokeWidth={1.5} strokeDasharray={edge.type !== 'pr-ref' ? '4,4' : 'none'} opacity={0.4}
                  />
                )
              })}

              {/* Nodes */}
              {graph.nodes.map(node => {
                const color = nodeColor(node)
                const radius = node.type === 'user' ? 14 : node.type === 'github' ? 16 : 22
                return (
                  <g
                    key={node.id}
                    className="node-group cursor-pointer"
                    transform={`translate(${node.x},${node.y})`}
                    onClick={() => setSelected(selected?.id === node.id ? null : node)}
                    onMouseEnter={e => setHovered({ node, x: e.clientX, y: e.clientY })}
                    onMouseMove={e => setHovered(h => h ? { ...h, x: e.clientX, y: e.clientY } : null)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <circle r={radius + 4} fill={color} opacity={0.12} />
                    <circle r={radius} fill={color} opacity={selected?.id === node.id ? 1 : 0.85}
                      stroke={selected?.id === node.id ? '#fff' : 'transparent'} strokeWidth={2} />
                    <text textAnchor="middle" dominantBaseline="middle" fill="#fff"
                      fontSize={node.type === 'jira' ? 9 : 8} fontWeight="600" fontFamily="monospace">
                      {node.label}
                    </text>
                    {node.type !== 'user' && (
                      <text textAnchor="middle" y={radius + 12} fill="#A1A1AA" fontSize={9} fontFamily="sans-serif">
                        {node.summary ? (node.summary.length > 20 ? node.summary.slice(0, 20) + '…' : node.summary) : ''}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          </svg>
        )}

        {/* Hover tooltip */}
        {hovered && (
          <div
            className="pointer-events-none fixed z-50 rounded-lg border border-border bg-bg-elevated/95 backdrop-blur-md px-3 py-2 shadow-xl text-xs space-y-1 max-w-[200px]"
            style={{ left: hovered.x + 12, top: hovered.y - 8 }}
          >
            <p className="font-mono font-semibold text-text-primary">{hovered.node.label}</p>
            {hovered.node.summary && (
              <p className="text-text-secondary leading-relaxed">{hovered.node.summary.slice(0, 60)}{hovered.node.summary.length > 60 ? '…' : ''}</p>
            )}
            {hovered.node.status && (
              <p className="text-text-muted">Status: <span className="text-text-secondary">{hovered.node.status}</span></p>
            )}
          </div>
        )}

        {/* Legend */}
        {graph && (
          <div className="absolute bottom-4 left-4 rounded-lg border border-border bg-bg-elevated/90 backdrop-blur-sm px-3 py-2 text-xs space-y-1.5">
            <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-accent-from" /><span className="text-text-muted">Jira Issue</span></div>
            <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-warning" /><span className="text-text-muted">GitHub PR</span></div>
            <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-text-muted" /><span className="text-text-muted">Reviewer</span></div>
          </div>
        )}

        {/* Correlation score */}
        {ctx && (
          <div className="absolute top-4 right-4 rounded-lg border border-border bg-bg-elevated/90 backdrop-blur-sm px-3 py-2 text-xs">
            <p className="text-text-muted">Correlation confidence</p>
            <p className="text-text-primary font-semibold">{Math.round(ctx.correlation_confidence * 100)}%</p>
          </div>
        )}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 bottom-0 w-72 bg-bg-surface border-l border-border flex flex-col z-10"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold text-text-primary font-mono">{selected.label}</span>
              <button onClick={() => setSelected(null)} className="text-text-muted hover:text-text-primary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selected.summary && <p className="text-sm text-text-secondary">{selected.summary}</p>}
              {selected.status && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">Status</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: `${STATUS_COLORS[selected.status] || '#6366F1'}20`, color: STATUS_COLORS[selected.status] || '#6366F1' }}>
                    {selected.status}
                  </span>
                </div>
              )}
              {selected.type === 'jira' && ctx && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-medium text-text-muted">Linked PRs</p>
                  {ctx.linked_prs.length === 0 ? (
                    <p className="text-xs text-text-muted">No linked PRs found</p>
                  ) : ctx.linked_prs.map(pr => (
                    <div key={pr.number} className="flex items-center gap-2 text-xs">
                      <GitPullRequest className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                      <span className="text-text-secondary truncate">#{pr.number} {pr.title}</span>
                      {pr.is_merged
                        ? <CheckCircle className="h-3 w-3 text-success flex-shrink-0" />
                        : pr.state === 'closed' ? <XCircle className="h-3 w-3 text-error flex-shrink-0" /> : null}
                    </div>
                  ))}
                </div>
              )}
              {selected.type === 'github' && ctx && (() => {
                const prNum = parseInt(selected.label.replace('#', ''))
                const reviews = ctx.pr_reviews[prNum] || []
                const commits = ctx.pr_commits[prNum] || []
                return (
                  <div className="space-y-3 pt-1">
                    {reviews.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-text-muted">Reviews</p>
                        {reviews.map((r, i) => (
                          <div key={i} className="text-xs flex items-center gap-2">
                            <span className={r.state === 'APPROVED' ? 'text-success' : r.state === 'CHANGES_REQUESTED' ? 'text-error' : 'text-text-muted'}>
                              {r.state === 'APPROVED' ? '✓' : r.state === 'CHANGES_REQUESTED' ? '✗' : '·'}
                            </span>
                            <span className="text-text-secondary">{r.reviewer}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {commits.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-text-muted">Commits ({commits.length})</p>
                        {commits.slice(0, 3).map(c => (
                          <p key={c.sha} className="text-xs text-text-secondary truncate">{c.message}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
