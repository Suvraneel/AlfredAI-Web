export interface Conversation {
  id: string
  title: string
  created_at: string
}

export interface UserProfile {
  user_id: string
  tenant_id: string
  email: string
  role: 'admin' | 'member'
  created_at: string
  is_active: boolean
}

export interface ToolConnection {
  tool: 'jira' | 'github' | 'slack' | 'confluence' | 'asana'
  status: 'active' | 'disconnected' | 'error' | 'coming_soon'
  connected_at: string | null
  scopes: string[]
  last_verified_at: string | null
  atlassian_account_id?: string | null
}

export interface ChatRequest {
  message: string
  conversation_id?: string
  on_behalf_of_user_id: string
  hitl_enabled?: boolean
  source_tools?: string[]
}

export interface ChatResponse {
  conversation_id: string
  reply: string
  tool_calls_made: ToolCallRecord[]
  pending_confirmation: ConfirmationRequest | null
  tokens_used: number
}

export interface ToolCallRecord {
  tool_name: string
  arguments: Record<string, unknown>
  result: string
  success: boolean
  duration_ms: number
}

export interface ConfirmationRequest {
  action_id: string
  tool_name: string
  arguments: Record<string, unknown>
  human_readable_summary: string
  expires_at: string
}

export interface JiraIssue {
  key: string
  id: string
  summary: string
  status: string
  priority: string | null
  labels: string[]
  issue_type: string
  assignee: string | null
  reporter: string | null
  created_at: string
  updated_at: string
  due_date: string | null
  sprint: string | null
  comments: JiraComment[]
  linked_issues: JiraIssueLink[]
  description_text: string | null
}

export interface JiraComment {
  id: string
  author: string
  body_text: string
  created_at: string
  updated_at: string
}

export interface JiraIssueLink {
  link_type: string
  outward_issue_key: string | null
  inward_issue_key: string | null
  direction: 'inward' | 'outward'
}

export interface GitHubPR {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  html_url: string
  head_branch: string
  base_branch: string
  author: string
  created_at: string
  updated_at: string
  merged_at: string | null
  review_state: string | null
  is_merged: boolean
}

export interface GitHubCommit {
  sha: string
  message: string
  author_name: string
  committed_at: string
  html_url: string
}

export interface GitHubReview {
  id: number
  reviewer: string
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED'
  submitted_at: string
  body: string | null
}

export interface CrossToolContext {
  jira_issue: JiraIssue
  linked_prs: GitHubPR[]
  pr_commits: Record<number, GitHubCommit[]>
  pr_reviews: Record<number, GitHubReview[]>
  correlation_confidence: number
}

export interface AuditLogItem {
  id: string
  actor_user_id: string
  action_type: string
  tool: string
  target_resource_id: string
  target_resource_type: string
  status: 'success' | 'failure'
  created_at: string
}

export interface ActionStatus {
  action_id: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  result: string | null
  error: string | null
  started_at: string
  completed_at: string | null
}

export interface PaginatedResponse<T> {
  total: number
  items: T[]
  next_offset: number | null
}

export interface InviteUserResponse {
  user_id: string
  email: string
  temporary_password: string
}
