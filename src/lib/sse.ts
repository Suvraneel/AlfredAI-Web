'use client'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { getAccessToken } from './auth'
import type { ChatRequest, ChatResponse } from '@/types/api'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface SSEHandlers {
  onProgress: (message: string) => void
  onComplete: (response: ChatResponse) => void
  onError: (message: string) => void
}

export async function streamChat(
  body: ChatRequest,
  handlers: SSEHandlers,
  signal?: AbortSignal
) {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(`${API}/v1/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })

  if (res.headers.get('content-type')?.includes('application/json')) {
    const data = await res.json()
    if (!res.ok) {
      handlers.onError(data.detail ?? 'Unknown error')
      return
    }
    handlers.onComplete(data)
    return
  }

  await fetchEventSource(`${API}/v1/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
    onmessage(ev) {
      const data = JSON.parse(ev.data)
      if (data.type === 'progress') handlers.onProgress(data.message)
      if (data.type === 'complete') handlers.onComplete(data.response)
      if (data.type === 'error') handlers.onError(data.message)
    },
    onerror(err) {
      handlers.onError(String(err))
      throw err
    },
  })
}
