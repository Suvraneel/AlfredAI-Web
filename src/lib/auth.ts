const KEYS = {
  accessToken: 'alfred_access_token',
  refreshToken: 'alfred_refresh_token',
  tenantId: 'alfred_tenant_id',
  user: 'alfred_user',
  atlassianId: 'alfred_atlassian_id',
} as const

export const getAccessToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(KEYS.accessToken)
}

export const getRefreshToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(KEYS.refreshToken)
}

export const getTenantId = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(KEYS.tenantId)
}

export const getAtlassianId = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(KEYS.atlassianId)
}

export const setAtlassianId = (id: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.atlassianId, id)
}

export const setAuthTokens = (access: string, refresh: string, tenantId: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEYS.accessToken, access)
  localStorage.setItem(KEYS.refreshToken, refresh)
  localStorage.setItem(KEYS.tenantId, tenantId)
}

export const clearAuth = () => {
  if (typeof window === 'undefined') return
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
