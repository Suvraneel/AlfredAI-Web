'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import type { ChatResponse } from '@/types/api'
import { streamChat } from '@/lib/sse'
import { getAtlassianId } from '@/lib/auth'
import { useConversations } from '@/contexts/ConversationContext'
import { getConversationHistory } from '@/lib/api'

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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isLoadingHistory, setIsLoadingHistory] = useState(!!initialConversationId)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load history from backend when opening an existing conversation
  useEffect(() => {
    if (!initialConversationId) return
    let cancelled = false

    getConversationHistory(initialConversationId)
      .then(data => {
        if (cancelled) return
        const loaded: ChatMessage[] = data.messages.map((m, i) => ({
          id: `history-${i}-${m.role}`,
          role: m.role,
          content: m.content,
          timestamp: new Date().toISOString(),
          conversation_id: initialConversationId,
        }))
        setMessages(loaded)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoadingHistory(false) })

    return () => { cancelled = true }
  }, [initialConversationId])

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
    isLoadingHistory,
    sendMessage,
    clearChat,
    setMessages,
  }
}
