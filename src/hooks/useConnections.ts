'use client'
import { useState, useEffect } from 'react'
import type { ToolConnection } from '@/types/api'
import { getConnections } from '@/lib/api'

export function useConnections() {
  const [connections, setConnections] = useState<ToolConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConnections = async () => {
    try {
      setIsLoading(true)
      const data = await getConnections()
      setConnections(data.connections)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load connections')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConnections()
  }, [])

  return { connections, isLoading, error, refetch: fetchConnections }
}
