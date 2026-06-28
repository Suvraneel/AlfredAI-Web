'use client'
import { useState, useRef, useCallback } from 'react'
import type { ChatResponse } from '@/types/api'
import { streamChat } from '@/lib/sse'
import { getAtlassianId } from '@/lib/auth'
import { mockConversations, type MockMessage } from '@/mock/conversations'
import { useConversations } from '@/contexts/ConversationContext'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  tool_calls?: ChatResponse['tool_calls_made']
  pending_confirmation?: ChatResponse['pending_confirmation']
  conversation_id: string
}

export function useChat(initialConversationId?: string) {
  const { addConversation } = useConversations()
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (USE_MOCK && initialConversationId) {
      const conv = mockConversations.find(c => c.id === initialConversationId)
      return conv ? conv.messages as ChatMessage[] : []
    }
    return []
  })
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = useCallback(() => {
    setElapsedSeconds(0)
    timerRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      conversation_id: conversationId || '',
    }
    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)
    setStreamingMessage('Alfred is thinking')
    startTimer()

    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 1500))
      const isNew = !conversationId
      const newConvId = conversationId || `conv-mock-${Date.now()}`
      const mockReply: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: `I processed your request: "${content}"\n\nHere's what I found based on your Jira and GitHub data. This is a mock response — connect to the real backend for live data.\n\nRelated: [Jira: PROJ-47] [GitHub: PR#61]`,
        timestamp: new Date().toISOString(),
        tool_calls: [
          { tool_name: 'jira_search_issues', arguments: { query: content }, result: 'Mock results', success: true, duration_ms: 234 },
        ],
        conversation_id: newConvId,
      }
      setConversationId(newConvId)
      setMessages(prev => {
        const updated = [...prev, mockReply]
        if (isNew) {
          addConversation({
            id: newConvId,
            title: content.slice(0, 60),
            created_at: new Date().toISOString(),
            messages: updated as MockMessage[],
          })
        }
        return updated
      })
      setIsStreaming(false)
      setStreamingMessage('')
      stopTimer()
      return
    }

    const atlassianId = getAtlassianId() || ''
    abortRef.current = new AbortController()

    try {
      await streamChat(
        {
          message: content,
          conversation_id: conversationId,
          on_behalf_of_user_id: atlassianId,
          hitl_enabled: true,
        },
        {
          onProgress: (msg) => setStreamingMessage(msg),
          onComplete: (response) => {
            const isNew = !conversationId
            const aiMsg: ChatMessage = {
              id: `msg-${Date.now()}-ai`,
              role: 'assistant',
              content: response.reply,
              timestamp: new Date().toISOString(),
              tool_calls: response.tool_calls_made,
              pending_confirmation: response.pending_confirmation ?? undefined,
              conversation_id: response.conversation_id,
            }
            setConversationId(response.conversation_id)
            setMessages(prev => {
              const updated = [...prev, aiMsg]
              if (isNew) {
                addConversation({
                  id: response.conversation_id,
                  title: content.slice(0, 60),
                  created_at: new Date().toISOString(),
                  messages: updated as MockMessage[],
                })
              }
              return updated
            })
            setIsStreaming(false)
            setStreamingMessage('')
            stopTimer()
          },
          onError: (error) => {
            const errMsg: ChatMessage = {
              id: `msg-${Date.now()}-err`,
              role: 'assistant',
              content: `Error: ${error}`,
              timestamp: new Date().toISOString(),
              conversation_id: conversationId || '',
            }
            setMessages(prev => [...prev, errMsg])
            setIsStreaming(false)
            setStreamingMessage('')
            stopTimer()
          },
        },
        abortRef.current.signal
      )
    } catch {
      setIsStreaming(false)
      setStreamingMessage('')
      stopTimer()
    }
  }, [conversationId, addConversation, startTimer, stopTimer])

  const clearChat = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setConversationId(undefined)
    setIsStreaming(false)
    setStreamingMessage('')
    stopTimer()
  }, [stopTimer])

  return {
    messages,
    conversationId,
    isStreaming,
    streamingMessage,
    elapsedSeconds,
    sendMessage,
    clearChat,
    setMessages,
  }
}
