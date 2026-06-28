'use client'
import { createContext, useCallback, useContext, useState } from 'react'
import { mockConversations, type MockConversation } from '@/mock/conversations'

interface ConversationContextValue {
  conversations: MockConversation[]
  addConversation: (conv: MockConversation) => void
}

const ConversationContext = createContext<ConversationContextValue | null>(null)

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<MockConversation[]>(mockConversations)

  const addConversation = useCallback((conv: MockConversation) => {
    setConversations(prev => {
      if (prev.some(c => c.id === conv.id)) return prev
      return [conv, ...prev]
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
