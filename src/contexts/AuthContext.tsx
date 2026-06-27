'use client'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { UserProfile } from '@/types/api'
import { getAccessToken, getRefreshToken, getTenantId, setAuthTokens, clearAuth } from '@/lib/auth'
import { getCurrentUser, loginUser, logoutUser, registerTenant } from '@/lib/api'

interface AuthState {
  user: UserProfile | null
  isLoading: boolean
  tenantId: string | null
}

interface AuthContextValue extends AuthState {
  login: (email: string, tenantId: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: { name: string; slug: string; admin_email: string; admin_password: string; registration_secret: string }) => Promise<{ tenant_id: string }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tenantId, setTenantId] = useState<string | null>(null)

  const refreshUser = useCallback(async () => {
    try {
      const u = await getCurrentUser()
      setUser(u)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    const tid = getTenantId()
    setTenantId(tid)

    if (!token) {
      setIsLoading(false)
      return
    }

    getCurrentUser()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, tid: string, password: string) => {
    const data = await loginUser(email, tid, password)
    setAuthTokens(data.access_token, data.refresh_token, tid)
    setTenantId(tid)
    const u = await getCurrentUser()
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    const refresh = getRefreshToken()
    if (refresh) {
      await logoutUser(refresh).catch(() => {})
    }
    clearAuth()
    setUser(null)
    setTenantId(null)
    window.location.href = '/login'
  }, [])

  const register = useCallback(async (data: { name: string; slug: string; admin_email: string; admin_password: string; registration_secret: string }) => {
    const result = await registerTenant(data)
    setAuthTokens(result.access_token, '', result.tenant_id)
    setTenantId(result.tenant_id)
    const u = await getCurrentUser()
    setUser(u)
    return { tenant_id: result.tenant_id }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, tenantId, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
