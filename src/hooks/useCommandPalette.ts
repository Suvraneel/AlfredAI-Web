'use client'
import { useState, useEffect, useCallback } from 'react'
import { mockJiraIssues } from '@/mock/jira'
import { mockConversations } from '@/mock/conversations'

export interface CommandItem {
  id: string
  type: 'command' | 'jira' | 'conversation'
  label: string
  description?: string
  href?: string
  action?: () => void
  badge?: string
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => { setIsOpen(false); setQuery('') }, [])
  const toggle = useCallback(() => setIsOpen(p => !p), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggle, close])

  const staticCommands: CommandItem[] = [
    { id: 'new-chat', type: 'command', label: 'New Chat', description: 'Start a new conversation', href: '/chat' },
    { id: 'dashboard', type: 'command', label: 'View Dashboard', href: '/dashboard' },
    { id: 'knowledge', type: 'command', label: 'View Knowledge Graph', href: '/knowledge' },
    { id: 'integrations', type: 'command', label: 'View Integrations', href: '/integrations' },
    { id: 'agents', type: 'command', label: 'View Agents', href: '/agents' },
    { id: 'audit', type: 'command', label: 'View Audit Log', href: '/audit' },
    { id: 'connect-jira', type: 'command', label: 'Connect Jira', href: '/settings/connections' },
    { id: 'profile', type: 'command', label: 'Profile Settings', href: '/settings/profile' },
  ]

  const jiraItems: CommandItem[] = mockJiraIssues.map(issue => ({
    id: `jira-${issue.key}`,
    type: 'jira',
    label: issue.key,
    description: issue.summary,
    badge: issue.status,
    href: `/chat?q=Tell me about ${issue.key}`,
  }))

  const convItems: CommandItem[] = mockConversations.map(c => ({
    id: `conv-${c.id}`,
    type: 'conversation',
    label: c.title,
    description: `${new Date(c.created_at).toLocaleDateString()}`,
    href: `/chat/${c.id}`,
  }))

  const allItems = [...staticCommands, ...jiraItems, ...convItems]
  const filtered = query
    ? allItems.filter(
        item =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase())
      )
    : allItems

  return { isOpen, open, close, toggle, query, setQuery, items: filtered }
}
