interface IssuePillProps {
  issueKey: string
  summary?: string
  status?: string
}

export function IssuePill({ issueKey, summary, status }: IssuePillProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-bg-elevated border border-border px-2 py-1 text-xs">
      <span className="font-mono text-accent-from">{issueKey}</span>
      {summary && <span className="text-text-muted truncate max-w-[120px]">{summary}</span>}
      {status && <span className="text-text-muted">· {status}</span>}
    </span>
  )
}
