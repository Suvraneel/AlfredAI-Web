import type { AuditLogItem } from '@/types/api'

const now = new Date('2026-06-27T16:00:00Z')
const daysAgo = (d: number, h = 0) => new Date(now.getTime() - d * 86400000 - h * 3600000).toISOString()

export const mockAuditLog: AuditLogItem[] = [
  { id: 'audit-01', actor_user_id: 'mock-user-001', action_type: 'jira.issue.create', tool: 'jira', target_resource_id: 'PROJ-64', target_resource_type: 'issue', status: 'success', created_at: daysAgo(0, 2) },
  { id: 'audit-02', actor_user_id: 'mock-user-001', action_type: 'jira.issue.transition', tool: 'jira', target_resource_id: 'PROJ-47', target_resource_type: 'issue', status: 'success', created_at: daysAgo(0, 2.5) },
  { id: 'audit-03', actor_user_id: 'mock-user-001', action_type: 'jira.issue.comment', tool: 'jira', target_resource_id: 'PROJ-52', target_resource_type: 'issue', status: 'failure', created_at: daysAgo(0, 3) },
  { id: 'audit-04', actor_user_id: 'mock-user-002', action_type: 'jira.issue.assign', tool: 'jira', target_resource_id: 'PROJ-53', target_resource_type: 'issue', status: 'success', created_at: daysAgo(1, 1) },
  { id: 'audit-05', actor_user_id: 'mock-user-001', action_type: 'jira.issue.update', tool: 'jira', target_resource_id: 'PROJ-31', target_resource_type: 'issue', status: 'success', created_at: daysAgo(1, 3) },
  { id: 'audit-06', actor_user_id: 'mock-user-002', action_type: 'jira.issue.create', tool: 'jira', target_resource_id: 'PROJ-63', target_resource_type: 'issue', status: 'success', created_at: daysAgo(2, 0) },
  { id: 'audit-07', actor_user_id: 'mock-user-001', action_type: 'jira.issue.transition', tool: 'jira', target_resource_id: 'PROJ-61', target_resource_type: 'issue', status: 'success', created_at: daysAgo(2, 2) },
  { id: 'audit-08', actor_user_id: 'mock-user-003', action_type: 'jira.issue.comment', tool: 'jira', target_resource_id: 'PROJ-47', target_resource_type: 'issue', status: 'success', created_at: daysAgo(3, 1) },
  { id: 'audit-09', actor_user_id: 'mock-user-001', action_type: 'jira.issue.assign', tool: 'jira', target_resource_id: 'INFRA-12', target_resource_type: 'issue', status: 'success', created_at: daysAgo(3, 4) },
  { id: 'audit-10', actor_user_id: 'mock-user-002', action_type: 'jira.issue.update', tool: 'jira', target_resource_id: 'PROJ-52', target_resource_type: 'issue', status: 'failure', created_at: daysAgo(4, 2) },
  { id: 'audit-11', actor_user_id: 'mock-user-001', action_type: 'jira.issue.create', tool: 'jira', target_resource_id: 'INFRA-15', target_resource_type: 'issue', status: 'success', created_at: daysAgo(4, 5) },
  { id: 'audit-12', actor_user_id: 'mock-user-003', action_type: 'jira.issue.transition', tool: 'jira', target_resource_id: 'PROJ-31', target_resource_type: 'issue', status: 'success', created_at: daysAgo(5, 1) },
  { id: 'audit-13', actor_user_id: 'mock-user-001', action_type: 'jira.issue.comment', tool: 'jira', target_resource_id: 'PROJ-53', target_resource_type: 'issue', status: 'success', created_at: daysAgo(5, 3) },
  { id: 'audit-14', actor_user_id: 'mock-user-002', action_type: 'jira.issue.assign', tool: 'jira', target_resource_id: 'PROJ-47', target_resource_type: 'issue', status: 'success', created_at: daysAgo(6, 0) },
  { id: 'audit-15', actor_user_id: 'mock-user-001', action_type: 'jira.issue.update', tool: 'jira', target_resource_id: 'PROJ-64', target_resource_type: 'issue', status: 'success', created_at: daysAgo(7, 1) },
]
