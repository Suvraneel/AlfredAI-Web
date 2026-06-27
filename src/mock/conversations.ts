import type { UserProfile, ToolConnection, ChatResponse } from '@/types/api'

export const mockUser: UserProfile = {
  user_id: 'mock-user-001',
  tenant_id: 'mock-tenant-001',
  email: 'alex@acme.com',
  role: 'admin',
  created_at: '2026-06-01T09:00:00Z',
  is_active: true,
}

export const mockUsers: UserProfile[] = [
  mockUser,
  {
    user_id: 'mock-user-002',
    tenant_id: 'mock-tenant-001',
    email: 'sarah.chen@acme.com',
    role: 'member',
    created_at: '2026-06-05T09:00:00Z',
    is_active: true,
  },
  {
    user_id: 'mock-user-003',
    tenant_id: 'mock-tenant-001',
    email: 'marcus.lee@acme.com',
    role: 'member',
    created_at: '2026-06-10T09:00:00Z',
    is_active: true,
  },
]

export const mockConnections: ToolConnection[] = [
  {
    tool: 'jira',
    status: 'active',
    connected_at: '2026-06-01T10:00:00Z',
    scopes: ['read:jira-work', 'write:jira-work', 'read:jira-user'],
    last_verified_at: '2026-06-27T14:00:00Z',
  },
  {
    tool: 'github',
    status: 'active',
    connected_at: '2026-06-01T10:30:00Z',
    scopes: ['repo', 'read:org', 'read:user'],
    last_verified_at: '2026-06-27T14:00:00Z',
  },
  {
    tool: 'slack',
    status: 'coming_soon',
    connected_at: null,
    scopes: [],
    last_verified_at: null,
  },
  {
    tool: 'confluence',
    status: 'coming_soon',
    connected_at: null,
    scopes: [],
    last_verified_at: null,
  },
  {
    tool: 'asana',
    status: 'coming_soon',
    connected_at: null,
    scopes: [],
    last_verified_at: null,
  },
]

export interface MockConversation {
  id: string
  title: string
  created_at: string
  messages: MockMessage[]
}

export interface MockMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  tool_calls?: ChatResponse['tool_calls_made']
  pending_confirmation?: ChatResponse['pending_confirmation']
  conversation_id: string
}

export const mockConversations: MockConversation[] = [
  {
    id: 'conv-001',
    title: "What's the status of the auth refactor?",
    created_at: '2026-06-27T13:00:00Z',
    messages: [
      {
        id: 'msg-001',
        role: 'user',
        content: "What's the status of the auth refactor?",
        timestamp: '2026-06-27T13:00:00Z',
        conversation_id: 'conv-001',
      },
      {
        id: 'msg-002',
        role: 'assistant',
        content: `Here's the current status of the auth refactor:

**PROJ-47 — Add OAuth2 login flow** is currently *In Review* and assigned to **Sarah Chen** (Sprint 14).

The linked PR **#61 "feat: OAuth2 login flow"** has received **2 approvals** (alex-kim and marcus-lee) and is ready to merge.

Key notes:
- OAuth2 callback handler implemented ✓
- Token storage implemented ✓
- 2 commits in the PR

**No blockers.** The implementation looks complete pending final merge approval.`,
        timestamp: '2026-06-27T13:00:05Z',
        tool_calls: [
          { tool_name: 'jira_get_issue', arguments: { issue_key: 'PROJ-47' }, result: 'Issue retrieved', success: true, duration_ms: 234 },
          { tool_name: 'github_get_linked_prs', arguments: { issue_key: 'PROJ-47' }, result: 'PRs retrieved', success: true, duration_ms: 189 },
        ],
        conversation_id: 'conv-001',
      },
    ],
  },
  {
    id: 'conv-002',
    title: 'Create a bug ticket for the login timeout on mobile',
    created_at: '2026-06-27T14:00:00Z',
    messages: [
      {
        id: 'msg-003',
        role: 'user',
        content: 'Create a bug ticket for the login timeout on mobile, P1, assign to Sarah',
        timestamp: '2026-06-27T14:00:00Z',
        conversation_id: 'conv-002',
      },
      {
        id: 'msg-004',
        role: 'assistant',
        content: 'I\'m ready to create a P1 bug ticket for the mobile login timeout issue and assign it to Sarah Chen. Please review the details below before I proceed.',
        timestamp: '2026-06-27T14:00:05Z',
        tool_calls: [
          { tool_name: 'jira_create_issue', arguments: { summary: 'Fix login timeout on mobile', priority: 'P1', assignee: 'Sarah Chen', type: 'Bug' }, result: 'Pending confirmation', success: true, duration_ms: 120 },
        ],
        pending_confirmation: {
          action_id: 'action-001',
          tool_name: 'jira_create_issue',
          arguments: { summary: 'Fix login timeout on mobile', priority: 'P1', assignee: 'Sarah Chen', type: 'Bug' },
          human_readable_summary: 'Create a P1 Bug ticket "Fix login timeout on mobile" in PROJ, assigned to Sarah Chen',
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
        conversation_id: 'conv-002',
      },
    ],
  },
  {
    id: 'conv-003',
    title: "Show me everything blocking the current sprint",
    created_at: '2026-06-27T15:00:00Z',
    messages: [
      {
        id: 'msg-005',
        role: 'user',
        content: 'Show me everything blocking the current sprint',
        timestamp: '2026-06-27T15:00:00Z',
        conversation_id: 'conv-003',
      },
      {
        id: 'msg-006',
        role: 'assistant',
        content: `Here's what's blocking Sprint 14:

**🔴 PROJ-52 — Fix memory leak in worker process** (Blocked)
- Blocked by: **PROJ-31** (Refactor database connection pooling)
- Assignee: Marcus Lee
- PROJ-31 is In Progress — Marcus estimates completion by end of week

**⚠️ PROJ-47 — Add OAuth2 login flow** (In Review)
- PR #61 has 2 approvals but hasn't been merged yet
- Not technically blocked, but needs action from the team

**Summary:** 1 hard blocker (PROJ-52 waiting on PROJ-31), 1 soft blocker (PR needs merge).`,
        timestamp: '2026-06-27T15:00:08Z',
        tool_calls: [
          { tool_name: 'jira_search_issues', arguments: { sprint: 'Sprint 14', status: 'Blocked' }, result: 'Found PROJ-52', success: true, duration_ms: 312 },
          { tool_name: 'jira_get_issue', arguments: { issue_key: 'PROJ-31' }, result: 'Issue retrieved', success: true, duration_ms: 198 },
          { tool_name: 'jira_get_issue', arguments: { issue_key: 'PROJ-52' }, result: 'Issue retrieved', success: true, duration_ms: 156 },
        ],
        conversation_id: 'conv-003',
      },
    ],
  },
]
