import { toast } from './toast'
import { getAccessToken, getRefreshToken, getTenantId, clearAuth, setAuthTokens } from './auth'
import type { UserProfile, ToolConnection, ChatResponse, AuditLogItem, PaginatedResponse, InviteUserResponse } from '@/types/api'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  const tenantId = getTenantId()
  if (!refresh || !tenantId) return null

  const res = await fetch(`${API}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh, tenant_id: tenantId }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const currentRefresh = getRefreshToken()!
  const currentTenant = getTenantId()!
  setAuthTokens(data.access_token, currentRefresh, currentTenant)
  return data.access_token
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  }

  let response: Response
  try {
    response = await fetch(`${API}${path}`, { ...options, headers })
  } catch {
    toast.error("Can't reach the server. Check your connection.")
    throw new Error('Network error')
  }

  if (response.status === 401) {
    const body = await response.clone().json().catch(() => ({}))
    if (body.detail === 'Token has expired') {
      if (!isRefreshing) {
        isRefreshing = true
        const newToken = await refreshAccessToken()
        isRefreshing = false
        if (newToken) {
          refreshQueue.forEach(cb => cb(newToken))
          refreshQueue = []
          try {
            response = await fetch(`${API}${path}`, {
              ...options,
              headers: { ...headers, Authorization: `Bearer ${newToken}` },
            })
          } catch {
            toast.error("Can't reach the server. Check your connection.")
            throw new Error('Network error')
          }
        } else {
          clearAuth()
          if (typeof window !== 'undefined') window.location.href = '/login'
        }
      } else {
        await new Promise<string>(resolve => refreshQueue.push(resolve))
        const newToken = getAccessToken()!
        try {
          response = await fetch(`${API}${path}`, {
            ...options,
            headers: { ...headers, Authorization: `Bearer ${newToken}` },
          })
        } catch {
          toast.error("Can't reach the server. Check your connection.")
          throw new Error('Network error')
        }
      }
    } else {
      toast.error('Session expired. Redirecting to login…')
      clearAuth()
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
  }

  // Centralized HTTP error toasts
  if (response.status === 403) {
    toast.error("You don't have permission to do that.")
  } else if (response.status === 409) {
    const body = await response.clone().json().catch(() => ({}))
    toast.error(body.detail || 'Conflict error.')
  } else if (response.status === 424) {
    const body = await response.clone().json().catch(() => ({}))
    const tool = body.detail?.match(/(\w+)/)?.[1] || 'the required tool'
    toast.error(`Connect ${tool} first to use this feature.`, {
      action: { label: 'Integrations', onClick: () => { if (typeof window !== 'undefined') window.location.href = '/integrations' } },
    })
  } else if (response.status === 503) {
    toast.error('AlfredAI is temporarily unavailable. Try again shortly.')
  }

  return response
}

// Auth API
export async function loginUser(email: string, tenantId: string, password: string) {
  const res = await fetch(`${API}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, tenant_id: tenantId, password }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Login failed')
  }
  return res.json()
}

export async function registerTenant(data: {
  name: string
  slug: string
  admin_email: string
  admin_password: string
  registration_secret: string
}) {
  const res = await fetch(`${API}/v1/tenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Registration failed')
  }
  return res.json()
}

export async function logoutUser(refreshToken: string) {
  await apiFetch('/v1/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

// Users API
export async function getCurrentUser(): Promise<UserProfile> {
  const res = await apiFetch('/v1/users/me')
  if (!res.ok) throw new Error('Failed to fetch user')
  return res.json()
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  const res = await apiFetch('/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Password update failed')
  }
}

export async function getUsers(limit = 50, offset = 0): Promise<PaginatedResponse<UserProfile>> {
  const res = await apiFetch(`/v1/users?limit=${limit}&offset=${offset}`)
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export async function inviteUser(email: string, role: 'admin' | 'member'): Promise<InviteUserResponse> {
  const res = await apiFetch('/v1/users', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Failed to invite user')
  }
  return res.json()
}

// Connections API
export async function getConnections(): Promise<{ connections: ToolConnection[] }> {
  const res = await apiFetch('/v1/connections')
  if (!res.ok) throw new Error('Failed to fetch connections')
  return res.json()
}

export async function getConnectionAuthorizeUrl(tool: 'jira' | 'github'): Promise<{ authorization_url: string }> {
  const path = tool === 'jira'
    ? '/v1/connections/jira/authorize?redirect=false'
    : '/v1/connections/github/authorize'
  const res = await apiFetch(path)
  if (!res.ok) throw new Error(`Failed to get ${tool} authorization URL`)
  return res.json()
}

export async function disconnectTool(tool: 'jira' | 'github') {
  const res = await apiFetch(`/v1/connections/${tool}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to disconnect ${tool}`)
  return res.json()
}

// Audit API
export async function getAuditLog(params: {
  actor_user_id?: string
  action_type?: string
  tool?: string
  from_date?: string
  to_date?: string
  limit?: number
  offset?: number
} = {}): Promise<PaginatedResponse<AuditLogItem>> {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') searchParams.set(k, String(v))
  })
  const res = await apiFetch(`/v1/audit?${searchParams}`)
  if (!res.ok) throw new Error('Failed to fetch audit log')
  return res.json()
}

// Chat history
export async function getConversationHistory(conversationId: string): Promise<{ conversation_id: string; messages: Array<{ role: 'user' | 'assistant'; content: string }> }> {
  const res = await apiFetch(`/v1/chat/${encodeURIComponent(conversationId)}`)
  if (!res.ok) throw new Error('Failed to fetch conversation history')
  return res.json()
}

// Cross-tool context
export async function getContext(jiraIssueKey: string): Promise<import('@/types/api').CrossToolContext> {
  const res = await apiFetch(`/v1/context/${encodeURIComponent(jiraIssueKey)}`)
  if (!res.ok) throw new Error('Failed to fetch context')
  return res.json()
}

// Chat confirm
export async function confirmAction(actionId: string): Promise<ChatResponse> {
  const res = await apiFetch(`/v1/chat/confirm/${actionId}`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to confirm action')
  return res.json()
}

export async function cancelAction(actionId: string): Promise<{ action_id: string; message: string }> {
  const res = await apiFetch(`/v1/chat/confirm/${actionId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to cancel action')
  return res.json()
}
