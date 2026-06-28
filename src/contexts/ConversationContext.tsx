'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Conversation } from '@/types/api'

const STORAGE_KEY = 'alfredai:conversations'

function loadFromStorage(): Conversation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(conversations: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, 100)))
  } catch {}
}

interface ConversationContextValue {
  conversations: Conversation[]
  addConversation: (conv: Conversation) => void
}

const ConversationContext = createContext<ConversationContextValue | null>(null)

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    setConversations(loadFromStorage())
  }, [])

  const addConversation = useCallback((conv: Conversation) => {
    setConversations(prev => {
      if (prev.some(c => c.id === conv.id)) return prev
      const next = [conv, ...prev]
      saveToStorage(next)
      return next
    })
  }, [])

  return (
    <ConversationContext.Provider value={{ conversations, addConversation }}>
      {children}
    </ConversationContext.Provider>
  )
}

export function useConversations() {
  const ctx = useContext(ConversationContext)
  if (!ctx) throw new Error('useConversations must be used within ConversationProvider')
  return ctx
}
