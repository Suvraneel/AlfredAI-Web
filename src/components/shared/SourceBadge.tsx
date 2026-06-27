interface SourceBadgeProps {
  source: 'jira' | 'github'
  id: string
  url?: string
}

export function SourceBadge({ source, id, url }: SourceBadgeProps) {
  const colors = {
    jira: 'bg-accent-from/10 text-accent-from border-accent-from/20',
    github: 'bg-warning/10 text-warning border-warning/20',
  }

  const content = (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-mono border ${colors[source]}`}>
      {source === 'jira' ? 'Jira' : 'GitHub'}: {id}
    </span>
  )

  if (url) {
    return <a href={url} target="_blank" rel="noopener noreferrer">{content}</a>
  }
  return content
}
