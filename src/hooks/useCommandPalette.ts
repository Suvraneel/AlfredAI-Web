'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useConversations } from '@/contexts/ConversationContext'

export interface CommandItem {
  id: string
  type: 'command' | 'conversation'
  label: string
  description?: string
  href?: string
  action?: () => void
  badge?: string
}

export function useCommandPalette() {
  const { user } = useAuth()
  const { conversations } = useConversations()
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
    ...(user?.role === 'admin' ? [
      { id: 'invite-team', type: 'command' as const, label: 'Invite Team Member', description: 'Add a new team member', href: '/settings/team' },
    ] : []),
    { id: 'profile', type: 'command', label: 'Profile Settings', href: '/settings/profile' },
  ]

  const convItems: CommandItem[] = conversations.map(c => ({
    id: `conv-${c.id}`,
    type: 'conversation',
    label: c.title,
    description: new Date(c.created_at).toLocaleDateString(),
    href: `/chat/${c.id}`,
  }))

  const allItems = [...staticCommands, ...convItems]
  const filtered = query
    ? allItems.filter(
        item =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase())
      )
    : allItems

  return { isOpen, open, close, toggle, query, setQuery, items: filtered }
}
