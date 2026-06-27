'use client'
import { useRef, useState, useEffect, useCallback } from "react"
import { mockJiraIssues } from "@/mock/jira"
import { mockPRs } from "@/mock/github"
import { mockUsers } from "@/mock/conversations"
import { motion, AnimatePresence } from "framer-motion"
import { X, Network, Search } from "lucide-react"
import { truncate } from "@/lib/utils"

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
  type: 'block' | 'relate' | 'pr-ref' | 'assigned'
}

const STATUS_COLORS: Record<string, string> = {
  'In Review': '#F59E0B',
  'Blocked': '#EF4444',
  'In Progress': '#6366F1',
  'Done': '#10B981',
  'To Do': '#52525B',
}

function buildGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Jira nodes in a circle
  mockJiraIssues.forEach((issue, i) => {
    const angle = (i / mockJiraIssues.length) * Math.PI * 2
    const r = 200
    nodes.push({
      id: issue.key,
      type: 'jira',
      label: issue.key,
      summary: issue.summary,
      status: issue.status,
      x: 400 + r * Math.cos(angle),
      y: 350 + r * Math.sin(angle),
    })
    issue.linked_issues.forEach(link => {
      const target = link.outward_issue_key || link.inward_issue_key
      if (target) edges.push({ source: issue.key, target, type: link.link_type.includes('block') ? 'block' : 'relate' })
    })
    if (issue.assignee) {
      edges.push({ source: issue.key, target: `user-${issue.assignee}`, type: 'assigned' })
    }
  })

  // PR nodes
  mockPRs.forEach((pr, i) => {
    const angle = (i / mockPRs.length) * Math.PI * 2
    nodes.push({
      id: `pr-${pr.number}`,
      type: 'github',
      label: `#${pr.number}`,
      summary: pr.title,
      status: pr.state,
      x: 400 + 320 * Math.cos(angle + 0.4),
      y: 350 + 260 * Math.sin(angle + 0.4),
    })
  })

  // User nodes
  const uniqueAssignees = [...new Set(mockJiraIssues.map(i => i.assignee).filter(Boolean))] as string[]
  uniqueAssignees.forEach((name, i) => {
    const angle = (i / uniqueAssignees.length) * Math.PI * 2
    nodes.push({
      id: `user-${name}`,
      type: 'user',
      label: name.split(' ')[0],
      summary: name,
      x: 400 + 100 * Math.cos(angle * 2),
      y: 350 + 100 * Math.sin(angle * 2),
    })
  })

  // PR refs to issues (simple: link PR to issue by index for demo)
  edges.push({ source: 'pr-61', target: 'PROJ-47', type: 'pr-ref' })
  edges.push({ source: 'pr-58', target: 'PROJ-52', type: 'pr-ref' })
  edges.push({ source: 'pr-55', target: 'PROJ-61', type: 'pr-ref' })

  return { nodes, edges }
}

export default function KnowledgePage() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [{ nodes, edges }] = useState(buildGraph)
  const [selected, setSelected] = useState<Node | null>(null)
  const [search, setSearch] = useState('')
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const isPanning = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const filteredIds = search
    ? new Set(nodes.filter(n =>
        n.label.toLowerCase().includes(search.toLowerCase()) ||
        n.summary?.toLowerCase().includes(search.toLowerCase())
      ).map(n => n.id))
    : null

  const nodeColor = (n: Node) => {
    if (n.type === 'github') return '#F59E0B'
    if (n.type === 'user') return '#52525B'
    return STATUS_COLORS[n.status || ''] || '#6366F1'
  }

  const edgeStyle = (e: Edge) => {
    if (e.type === 'block') return { stroke: '#EF4444', strokeDasharray: 'none', opacity: 0.6 }
    if (e.type === 'pr-ref') return { stroke: '#F59E0B', strokeDasharray: '4,4', opacity: 0.5 }
    if (e.type === 'assigned') return { stroke: '#52525B', strokeDasharray: '2,4', opacity: 0.4 }
    return { stroke: '#6366F1', strokeDasharray: 'none', opacity: 0.3 }
  }

  const getNode = (id: string) => nodes.find(n => n.id === id)

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

  return (
    <div className="flex h-full relative overflow-hidden">
      {/* Search */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-lg border border-border bg-bg-elevated/80 backdrop-blur-md px-3 py-2 w-56">
        <Search className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search nodes..."
          className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none"
        />
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-border bg-bg-elevated/80 backdrop-blur-md p-3 space-y-1.5">
        {[
          { color: '#6366F1', label: 'Jira issue' },
          { color: '#F59E0B', label: 'GitHub PR' },
          { color: '#52525B', label: 'User' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-text-muted">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* SVG */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => { isPanning.current = false }}
        onMouseLeave={() => { isPanning.current = false }}
        onWheel={handleWheel}
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {/* Edges */}
          {edges.map((edge, i) => {
            const src = getNode(edge.source)
            const tgt = getNode(edge.target)
            if (!src || !tgt) return null
            const style = edgeStyle(edge)
            return (
              <line
                key={i}
                x1={src.x} y1={src.y}
                x2={tgt.x} y2={tgt.y}
                stroke={style.stroke}
                strokeDasharray={style.strokeDasharray}
                strokeOpacity={style.opacity}
                strokeWidth={1}
              />
            )
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const color = nodeColor(node)
            const radius = node.type === 'user' ? 14 : node.type === 'github' ? 16 : 18
            const dimmed = filteredIds && !filteredIds.has(node.id)
            return (
              <g
                key={node.id}
                className="node-group cursor-pointer"
                transform={`translate(${node.x},${node.y})`}
                onClick={() => setSelected(selected?.id === node.id ? null : node)}
                style={{ opacity: dimmed ? 0.2 : 1 }}
              >
                <circle
                  r={radius}
                  fill={`${color}20`}
                  stroke={selected?.id === node.id ? color : `${color}60`}
                  strokeWidth={selected?.id === node.id ? 2 : 1}
                />
                <text
                  textAnchor="middle"
                  dy="0.35em"
                  fontSize={node.type === 'jira' ? 8 : 9}
                  fill={color}
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="600"
                >
                  {node.label}
                </text>
                <text
                  textAnchor="middle"
                  dy={radius + 12}
                  fontSize={8}
                  fill="#52525B"
                  fontFamily="Inter, sans-serif"
                >
                  {truncate(node.summary || '', 20)}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-0 bottom-0 w-72 border-l border-border bg-bg-elevated/95 backdrop-blur-xl shadow-2xl flex flex-col z-20"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <span className={`text-xs font-medium uppercase tracking-wide ${
                  selected.type === 'jira' ? 'text-accent-from' : selected.type === 'github' ? 'text-warning' : 'text-text-muted'
                }`}>{selected.type}</span>
                <h3 className="font-mono text-sm font-semibold text-text-primary mt-0.5">{selected.label}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-text-muted hover:text-text-primary">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selected.summary && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Summary</p>
                  <p className="text-sm text-text-primary leading-relaxed">{selected.summary}</p>
                </div>
              )}
              {selected.status && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Status</p>
                  <span className="text-xs px-2 py-1 rounded-md" style={{
                    background: `${STATUS_COLORS[selected.status] || '#6366F1'}20`,
                    color: STATUS_COLORS[selected.status] || '#6366F1',
                  }}>
                    {selected.status}
                  </span>
                </div>
              )}
              {/* Related edges */}
              <div>
                <p className="text-xs text-text-muted mb-2">Connections</p>
                <div className="space-y-1">
                  {edges.filter(e => e.source === selected.id || e.target === selected.id).map((e, i) => {
                    const other = getNode(e.source === selected.id ? e.target : e.source)
                    if (!other) return null
                    return (
                      <button
                        key={i}
                        className="flex items-center gap-2 w-full text-left hover:bg-bg-subtle rounded-md px-2 py-1.5 transition-colors"
                        onClick={() => setSelected(other)}
                      >
                        <span className="text-xs text-text-muted capitalize">{e.type}</span>
                        <span className="font-mono text-xs text-accent-from">{other.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
