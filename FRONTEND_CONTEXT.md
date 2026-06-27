# AlfredAI — Frontend Build Context

> **This document is self-contained.** It is written for a developer (or AI) who has zero prior knowledge of the project. Read it top-to-bottom before writing any frontend code.

---

## 1. What This Product Is

**AlfredAI** (marketed as "Company Brain") is a **B2B SaaS web application** targeting engineering teams at startups and mid-market companies. It is an AI-powered agent that connects to a company's tools (Jira and GitHub for the MVP) and lets users:

- Ask natural-language questions about their work ("What's blocking PROJ-123?")
- Take actions via AI ("Create a sub-task under PROJ-123, assign it to Alice")
- Get cross-tool context automatically (Jira ticket + linked GitHub PRs + review status in one answer)

The **primary UX is a chat interface**, not a dashboard. The AI handles all tool interactions behind the scenes.

**Business model:** Multi-tenant B2B SaaS. Companies (tenants) sign up, connect their Jira/GitHub, and their team members use the chat.

**Pricing tiers (planned):**
- Starter: $49/mo — 3 users, 1 workspace, 500 AI actions/mo
- Growth: $149/mo — 10 users, unlimited workspaces, 2000 actions/mo
- Enterprise: Custom — unlimited, SSO, custom data retention

---

## 2. Tech Stack — Frontend

**Build with:**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS + shadcn/ui components
- **State:** React Context + `useState`/`useReducer` for local state; no Redux needed
- **Data fetching:** Native `fetch` with custom wrapper (`lib/api.ts`); no React Query for MVP
- **SSE streaming:** `@microsoft/fetch-event-source` (handles POST + auth headers — native `EventSource` does NOT support POST or custom headers)
- **Forms:** React Hook Form + Zod for validation
- **Deployment:** Vercel

**Repo:** Separate from the backend (`AlfredAI-web`).

**Environment variable (the only one you need):**
```
NEXT_PUBLIC_API_URL=http://localhost:8000   # local dev
NEXT_PUBLIC_API_URL=https://api.yourdomain.com  # production
```

---

## 3. Backend Overview

**Base URL:** `http://localhost:8000` (dev), `https://api.yourdomain.com` (prod)
**API prefix:** All endpoints are under `/v1/` except `/health`, `/ready`, `/version`.
**Docs:** Auto-generated Swagger UI available at `{BASE_URL}/docs` — extremely useful during development.

**Auth mechanism:** Bearer JWT in every request header:
```
Authorization: Bearer <access_token>
```

**CORS:** The backend allows `http://localhost:3000` in development. Add the Vercel production domain to `CORS_ORIGINS` in the backend's `.env` before deploying.

**Response header:** Every response includes `X-API-Version` and `X-Request-ID` headers.

---

## 4. Authentication & Authorization Flow

### Token details
- **Access token:** JWT (HS256), expires in **60 minutes**. Payload contains `sub` (user_id), `tenant_id`, `role` (`admin` | `member`), `exp`, `iat`.
- **Refresh token:** Opaque random string, expires in **7 days**. Stored hashed in DB.
- **Storage:** Store `access_token`, `refresh_token`, and `tenant_id` in `localStorage` (or `httpOnly` cookie if you prefer). `tenant_id` must be stored separately — it's needed for the `/auth/login` and `/auth/refresh` calls.

### Important: login requires `tenant_id`
Unlike typical auth flows, the login endpoint requires the user to provide their `tenant_id` **alongside** email and password. This is a bootstrap requirement for PostgreSQL Row-Level Security (RLS). The tenant_id is a UUID. Store it after registration and ask the user to enter it on login, or resolve it by slug first (future enhancement: add a `GET /v1/tenants/by-slug/{slug}` endpoint).

### Auth endpoints

#### Register a new company (tenant)
```
POST /v1/tenants
Content-Type: application/json

{
  "name": "Acme Corp",
  "slug": "acme-corp",          // lowercase, alphanumeric + hyphens, 3-50 chars
  "admin_email": "ceo@acme.com",
  "admin_password": "supersecret123",  // min 12 chars
  "registration_secret": "<REGISTRATION_SECRET from .env>"
}

→ 201 Created
{
  "tenant_id": "uuid",
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```
Note: The `registration_secret` is a backend env var used to gate sign-ups during design-partner phase. For self-serve SaaS, the plan is to remove this gate and add email verification instead (not yet implemented in backend).

#### Login
```
POST /v1/auth/login
Content-Type: application/json

{
  "email": "user@acme.com",
  "tenant_id": "uuid-of-their-tenant",
  "password": "supersecret123"
}

→ 200 OK
{
  "access_token": "eyJ...",
  "refresh_token": "opaque-random-string",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### Refresh access token
```
POST /v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "opaque-random-string",
  "tenant_id": "uuid-of-their-tenant"
}

→ 200 OK
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 3600
}
```
Call this automatically when any API call returns `401` with `"Token has expired"`.

#### Logout
```
POST /v1/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refresh_token": "opaque-random-string"
}

→ 200 OK
{ "message": "Logged out successfully" }
```

### Auth error responses
| HTTP | `detail` | Frontend action |
|---|---|---|
| `401` `"Invalid email or password"` | Show "Incorrect email or password" | |
| `401` `"Account is disabled"` | Show "Your account has been disabled" | |
| `401` `"Token has expired"` | Auto-refresh the token | |
| `401` `"Invalid authentication token"` | Redirect to login | |
| `403` `"Admin role required"` | Show "You don't have permission" | |

### Role-based UI differences
| Feature | `member` | `admin` |
|---|---|---|
| Chat | ✅ | ✅ |
| View own audit log | ✅ | ✅ |
| View all tenant audit log | ❌ | ✅ |
| Invite users | ❌ | ✅ |
| Disconnect integrations | ❌ | ✅ |
| List all users | ❌ | ✅ |

---

## 5. All API Endpoints

### Tenant Registration
| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/v1/tenants` | None | `{ name, slug, admin_email, admin_password, registration_secret }` | `{ tenant_id, access_token, token_type }` |

### Auth
| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/v1/auth/login` | None | `{ email, tenant_id, password }` | `{ access_token, refresh_token, token_type, expires_in }` |
| `POST` | `/v1/auth/refresh` | None | `{ refresh_token, tenant_id }` | `{ access_token, token_type, expires_in }` |
| `POST` | `/v1/auth/logout` | Bearer | `{ refresh_token }` | `{ message }` |

### Users
| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/v1/users/me` | Bearer | Returns own profile |
| `PATCH` | `/v1/users/me` | Bearer | `{ current_password, new_password }` — password change only |
| `POST` | `/v1/users` | Bearer (admin) | `{ email, role }` — returns `{ user_id, email, temporary_password }` |
| `GET` | `/v1/users?limit=50&offset=0` | Bearer (admin) | Returns `{ total, items, next_offset }` |

User profile shape:
```ts
{
  user_id: string      // UUID
  tenant_id: string    // UUID
  email: string
  role: "admin" | "member"
  created_at: string   // ISO datetime
  is_active: boolean
}
```

### Tool Connections (Jira + GitHub OAuth)
| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/v1/connections` | Bearer | List all connections, no liveness ping |
| `GET` | `/v1/connections/{tool}` | Bearer | Single connection with liveness ping (tool = `jira` or `github`) |
| `GET` | `/v1/connections/jira/authorize?redirect=false` | Bearer | Returns `{ authorization_url }` — redirect user to this URL |
| `GET` | `/v1/connections/jira/callback` | None (OAuth callback) | Handled by backend, redirects after success |
| `DELETE` | `/v1/connections/jira` | Bearer (admin) | Disconnect + revoke |
| `GET` | `/v1/connections/github/authorize` | Bearer | Returns `{ authorization_url }` |
| `GET` | `/v1/connections/github/callback` | None (OAuth callback) | Handled by backend |
| `DELETE` | `/v1/connections/github` | Bearer (admin) | Disconnect + revoke |

Connection status shape:
```ts
{
  tool: "jira" | "github" | "slack" | "confluence"
  status: "active" | "disconnected" | "error"
  connected_at: string | null   // ISO datetime
  scopes: string[]
  last_verified_at: string | null
}
```

**OAuth flow for Jira (important):**
1. Call `GET /v1/connections/jira/authorize?redirect=false` with Bearer token
2. Get back `{ authorization_url: "https://auth.atlassian.com/..." }`
3. Redirect the user's browser to that URL
4. Atlassian redirects back to the backend's `/v1/connections/jira/callback`
5. The backend handles everything, then redirects to your frontend's `/onboarding?step=2&jira=connected` (configure `JIRA_REDIRECT_URI` in backend `.env` to point to your frontend after OAuth completes — **note:** the current backend redirects to itself; you need to add a frontend redirect after the callback succeeds, or configure the backend to redirect to `your-frontend.com/settings/connections?connected=jira`)

**GitHub OAuth flow:** Same pattern. `GET /v1/connections/github/authorize` → redirect user → backend callback handles it.

### Chat (Main Product)
| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/v1/chat` | Bearer | Main chat endpoint — may return JSON or SSE |
| `POST` | `/v1/chat/confirm/{action_id}` | Bearer | Approve a HITL-paused write action |
| `DELETE` | `/v1/chat/confirm/{action_id}` | Bearer | Cancel a HITL-paused write action |

**Chat request:**
```ts
{
  message: string                  // user's natural language message
  conversation_id?: string         // null for new conversation, UUID for existing
  on_behalf_of_user_id: string     // Atlassian account ID of the user — REQUIRED
  hitl_enabled?: boolean           // default false — if true, write actions pause for confirmation
  source_tools?: string[]          // optional: filter RAG to specific tools, e.g. ["jira"]
}
```

**Chat response (fast path — JSON, < 3 seconds):**
```ts
{
  conversation_id: string
  reply: string                    // the AI's natural language response
  tool_calls_made: ToolCallRecord[]
  pending_confirmation: ConfirmationRequest | null
  tokens_used: number
}
```

**Chat response (slow path — SSE stream, > 3 seconds):**
The endpoint returns `Content-Type: text/event-stream`. Each `data:` line is a JSON object:
```ts
// Progress events (while agent is thinking)
{ type: "progress", message: "Agent is working... (2s)" }

// Final event
{ type: "complete", response: ChatResponse }  // ChatResponse = same shape as fast path

// Error event
{ type: "error", message: string }
```

**CRITICAL: The same `POST /v1/chat` endpoint returns either JSON or SSE depending on how long the agent takes.** Your frontend must handle both. Check `Content-Type` header:
- `application/json` → parse as JSON directly
- `text/event-stream` → parse as SSE stream

```ts
// Recommended pattern using @microsoft/fetch-event-source
import { fetchEventSource } from '@microsoft/fetch-event-source';

async function sendMessage(message: string, conversationId?: string) {
  let finalResponse: ChatResponse | null = null;

  // First try fast path (plain fetch)
  const res = await fetch(`${API_URL}/v1/chat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_id: conversationId, on_behalf_of_user_id: atlassianUserId })
  });

  if (res.headers.get('content-type')?.includes('application/json')) {
    return await res.json() as ChatResponse;
  }

  // SSE path — parse the stream
  return new Promise((resolve, reject) => {
    fetchEventSource(`${API_URL}/v1/chat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversation_id: conversationId, on_behalf_of_user_id: atlassianUserId }),
      onmessage(ev) {
        const data = JSON.parse(ev.data);
        if (data.type === 'progress') { /* update loading UI */ }
        if (data.type === 'complete') resolve(data.response);
        if (data.type === 'error') reject(new Error(data.message));
      }
    });
  });
}
```

**ToolCallRecord shape:**
```ts
{
  tool_name: string     // e.g. "jira_get_issue", "jira_create_issue"
  arguments: object
  result: string        // JSON string or plain text
  success: boolean
  duration_ms: number
}
```

**ConfirmationRequest shape (HITL):**
```ts
{
  action_id: string
  tool_name: string
  arguments: object
  human_readable_summary: string   // e.g. "Create issue 'Fix login bug' in PROJECT as Bug"
  expires_at: string               // ISO datetime — 10 minutes from creation
}
```
When `pending_confirmation` is non-null, show a confirmation card in the chat UI. User clicks Approve → `POST /v1/chat/confirm/{action_id}`. User clicks Cancel → `DELETE /v1/chat/confirm/{action_id}`.

### Cross-Tool Context
| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/v1/context/{jira_issue_key}` | Bearer | Full Jira+GitHub context for one issue key — cached 60s |

Returns `CrossToolContext`:
```ts
{
  jira_issue: JiraIssue
  linked_prs: GitHubPR[]
  pr_commits: { [prNumber: number]: GitHubCommit[] }
  pr_reviews: { [prNumber: number]: GitHubReview[] }
  correlation_confidence: number   // 0.0 to 1.0
}
```
Returns `424 Failed Dependency` if Jira or GitHub is not connected.

### Audit Log
| Method | Path | Auth | Query params |
|---|---|---|---|
| `GET` | `/v1/audit` | Bearer | `actor_user_id`, `action_type`, `tool`, `target_resource_id`, `from_date`, `to_date`, `limit` (max 200, default 50), `offset` |

Non-admin users only see their own entries (enforced server-side). Returns:
```ts
{
  total: number
  items: AuditLogItem[]
  next_offset: number | null
}
```

AuditLogItem shape:
```ts
{
  id: string           // UUID
  actor_user_id: string
  action_type: string  // e.g. "jira.issue.create", "jira.issue.transition"
  tool: string         // "jira" | "github"
  target_resource_id: string  // e.g. "PROJ-123"
  target_resource_type: string
  status: "success" | "failure"
  created_at: string   // ISO datetime
}
```

### Actions (Long-Running)
| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/v1/actions/{action_id}` | Bearer | Poll status |
| `POST` | `/v1/actions/{action_id}/cancel` | Bearer | Cancel if pending/running |

ActionStatus shape:
```ts
{
  action_id: string
  status: "pending" | "running" | "complete" | "failed"
  result: string | null
  error: string | null
  started_at: string
  completed_at: string | null
}
```

### Health (no auth required)
| Method | Path | Response |
|---|---|---|
| `GET` | `/health` | `{ status: "ok" }` |
| `GET` | `/ready` | `{ status: "ready" | "degraded", checks: { database, redis, llm } }` |
| `GET` | `/version` | `{ version, git_sha, environment }` |

---

## 6. Database Entities (for UI understanding)

### Tenant
One per company. Has `id` (UUID), `name`, `slug`, `created_at`, `is_active`.

### User
Belongs to one Tenant. Has `user_id`, `tenant_id`, `email`, `role` (`admin` | `member`), `created_at`, `is_active`. Passwords hashed with bcrypt. No display name field (MVP — just email).

### ToolConnection
One per (tenant, tool type). `tool_type` is `jira` | `github` | `slack` | `confluence`. `status` is `active` | `disconnected` | `error`. `config` JSONB stores non-sensitive metadata like `base_url`, `scopes`, `connected_at`.

### AuditLog
Append-only. Records every write action the AI took. Fields: `action_type` (e.g. `jira.issue.create`), `tool`, `target_resource_id`, `status`, `created_at`. Immutable — no update/delete allowed at DB level.

---

## 7. Pages & Navigation

### Route Structure (Next.js App Router)

```
/                           → Marketing landing page (public)
/login                      → Login form (public)
/signup                     → Company registration (public) — gated by registration_secret
/onboarding                 → 3-step wizard (protected, shown once after signup)
  /onboarding/connect-jira
  /onboarding/connect-github
/chat                       → Main chat interface (protected)
/chat/[conversationId]      → Specific conversation (protected)
/settings                   → Settings shell (protected)
/settings/connections       → Tool connections management
/settings/team              → User list + invite (admin only)
/settings/audit             → Audit log viewer
/settings/profile           → Change password
/settings/billing           → Billing (future Stripe embed)
```

### Navigation Structure (sidebar in app)
```
[ AlfredAI Logo ]
─────────────────
💬 Chat              → /chat
─────────────────
⚙ Settings
  🔗 Connections     → /settings/connections
  👥 Team            → /settings/team  (admin only)
  📋 Audit Log       → /settings/audit
  👤 Profile         → /settings/profile
─────────────────
[User email + role]
[Logout button]
```

---

## 8. Screens — Detailed Requirements

### 8.1 Landing Page (`/`)
- Marketing page only. Hero headline, value prop, "Start free trial" CTA → `/signup`.
- Can be fully static (no API calls).

### 8.2 Signup (`/signup`)
Fields: Company Name, Slug (auto-generated from name, editable), Email, Password, Confirm Password, Registration Secret (hidden field or admin-entered).

Validation:
- Slug: lowercase, alphanumeric + hyphens only, 3-50 chars (show live preview: `yourdomain.com/acme-corp`)
- Password: min 12 characters
- Confirm Password: must match

On submit: `POST /v1/tenants` → on success, store `access_token` + `tenant_id` + redirect to `/onboarding`.

Errors: `409 "Slug already taken"`, `409 "Email already registered"`.

### 8.3 Login (`/login`)
Fields: Email, Tenant ID (UUID — user must know this), Password.

Note: The tenant_id field is a UX problem (users don't know their UUID). Short-term workaround: also show `tenant_id` on the signup success screen and tell users to save it. Long-term: add a "find tenant by email domain" endpoint.

On submit: `POST /v1/auth/login` → store `access_token`, `refresh_token`, `tenant_id` → redirect to `/chat`.

### 8.4 Onboarding Wizard (`/onboarding`)
3 steps, shown once after signup. Progress indicator at top.

**Step 1: Welcome + Overview** — static, just "Here's what AlfredAI can do" with a "Next" button.

**Step 2: Connect Jira**
- Button: "Connect Jira"
- On click: call `GET /v1/connections/jira/authorize?redirect=false` with Bearer token → get `authorization_url` → `window.location.href = authorization_url`
- After OAuth redirect back: show "Jira connected ✓" (detect via query param `?jira=connected`)
- Show "Skip for now" option

**Step 3: Connect GitHub**
- Same pattern: `GET /v1/connections/github/authorize` → redirect
- After return: "GitHub connected ✓"
- "Finish setup" button → redirect to `/chat`

**Note on OAuth redirects:** The backend currently redirects to itself after OAuth. You need to configure backend env vars `JIRA_REDIRECT_URI` and `GITHUB_REDIRECT_URI` to point to `https://your-frontend.com/settings/connections?connected=jira` (or onboarding step). The backend `/v1/connections/jira/callback` endpoint returns `{"status": "connected", "jira_cloud_id": "..."}` as JSON — you'll need to add a frontend redirect after this, or configure the OAuth app's redirect URI to go directly to your frontend's callback handler which then calls the backend.

### 8.5 Chat Interface (`/chat`)
The core product screen. Layout: optional left sidebar (conversation history), main chat area.

**Chat area:**
- Message list (scrollable, newest at bottom)
- User messages: right-aligned, solid background
- AI messages: left-aligned, lighter background, supports Markdown rendering (use `react-markdown`)
- Tool calls: show a collapsible "Agent used tools" section below each AI message listing `tool_name` + success/failure
- Loading state: typing indicator (animated dots) while waiting for response

**Input area (bottom):**
- Textarea (auto-resize, Enter to send, Shift+Enter for newline)
- `on_behalf_of_user_id` field: this is the user's **Atlassian account ID** — critical, required for all Jira operations. Show a small info tooltip. First-time users won't know this value — consider a settings field where users paste their Atlassian account ID.
- Send button (disabled while loading)

**HITL Confirmation Card:**
When a chat response includes `pending_confirmation != null`, render a card in the chat:
```
┌─────────────────────────────────────────────┐
│  ⚠️  Action requires your approval          │
│                                              │
│  {human_readable_summary}                    │
│  Expires in: 9:47                            │
│                                              │
│  [✓ Approve]           [✗ Cancel]           │
└─────────────────────────────────────────────┘
```
- Approve → `POST /v1/chat/confirm/{action_id}` → append result to chat
- Cancel → `DELETE /v1/chat/confirm/{action_id}` → show "Action cancelled" message
- Show countdown timer to expiry (10 minutes from `expires_at`)

**Conversation persistence:** `conversation_id` is returned in the first response. Store it and pass it in subsequent messages for context continuity (24-hour TTL in Redis backend).

**New conversation:** Button "+ New chat" → clear state, omit `conversation_id` on next send.

### 8.6 Settings: Connections (`/settings/connections`)
Show Jira and GitHub as cards:
```
┌─────────────────────┐  ┌─────────────────────┐
│  Jira               │  │  GitHub              │
│  ● Connected        │  │  ○ Not connected      │
│  acme.atlassian.com │  │                      │
│  Connected: Jun 27  │  │  [Connect GitHub]    │
│  [Disconnect] (admin)│  │                      │
└─────────────────────┘  └─────────────────────┘
```
- Status badge: green dot "Connected" | grey dot "Not connected" | red dot "Error — reconnect"
- Connect button → trigger OAuth flow (same as onboarding)
- Disconnect button (admin only) → `DELETE /v1/connections/{tool}` → confirm dialog first

### 8.7 Settings: Team (`/settings/team`) — Admin Only
Table of users: Email | Role | Joined | Status.

**Invite user:**
- Form: Email, Role (dropdown: member / admin)
- `POST /v1/users` → backend returns `{ temporary_password }` — show it once in a modal ("Share this password with the user: xxxxxx") with copy button. It won't be shown again.
- Note: No email sending in MVP — admin shares credentials out-of-band.

### 8.8 Settings: Audit Log (`/settings/audit`)
Table with columns: Time | Action | Tool | Resource | User (admin only) | Status.

Filters: date range picker, action type dropdown, tool dropdown.

Pagination: 50 per page with next/prev buttons using `offset`.

Admin sees all entries; member sees only their own (enforced server-side, but hide User column and user filter from members in UI too).

### 8.9 Settings: Profile (`/settings/profile`)
- Display: email (read-only), role (read-only), `user_id` (show as copyable — needed as `on_behalf_of_user_id` for some workflows)
- Change password form: Current password, New password (min 12 chars), Confirm new password
- `PATCH /v1/users/me`

---

## 9. Key Components

```
components/
├── ui/                        ← shadcn/ui primitives (Button, Input, Badge, Dialog, etc.)
├── auth/
│   ├── LoginForm.tsx
│   └── SignupForm.tsx
├── chat/
│   ├── ChatWindow.tsx         ← main chat container, manages messages state
│   ├── MessageBubble.tsx      ← renders one message (user or AI), with markdown
│   ├── ToolCallsAccordion.tsx ← collapsible list of tool calls made
│   ├── ConfirmationCard.tsx   ← HITL approve/cancel UI with countdown timer
│   ├── ChatInput.tsx          ← textarea + send button
│   └── StreamingIndicator.tsx ← animated dots while SSE in progress
├── connections/
│   ├── ConnectionCard.tsx     ← Jira/GitHub card with status + connect/disconnect
│   └── OAuthButton.tsx        ← triggers authorize URL + redirect
├── settings/
│   ├── TeamTable.tsx
│   ├── InviteUserModal.tsx
│   └── AuditLogTable.tsx
├── layout/
│   ├── AppShell.tsx           ← authenticated layout: sidebar + main content
│   ├── Sidebar.tsx
│   └── TopBar.tsx
└── onboarding/
    └── OnboardingWizard.tsx
```

---

## 10. State Management

Use React Context for global auth state only. Everything else is local component state.

**AuthContext:**
```ts
interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  tenantId: string | null
  user: UserProfile | null    // from GET /v1/users/me
  isLoading: boolean
}
```

Store `accessToken`, `refreshToken`, `tenantId` in `localStorage`. On app load, check for stored token → validate by calling `GET /v1/users/me` → if 401 with "Token has expired", auto-refresh → if refresh fails, redirect to login.

**Token refresh logic:**
```ts
// lib/api.ts — wrap every authenticated fetch here
async function apiFetch(path, options) {
  let response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${getAccessToken()}` }
  });

  if (response.status === 401) {
    const body = await response.clone().json();
    if (body.detail === "Token has expired") {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Retry with new token
        response = await fetch(`${API_URL}${path}`, {
          ...options,
          headers: { ...options.headers, Authorization: `Bearer ${newToken}` }
        });
      } else {
        logout(); // refresh failed, redirect to login
      }
    }
  }
  return response;
}
```

---

## 11. Design System

No official design system exists yet. Use shadcn/ui defaults with these customizations:

**Colors (suggested):**
- Primary: Indigo (`#4F46E5`) — for buttons, active states, links
- Background: `#F9FAFB` (light grey page), `#FFFFFF` (cards/panels)
- Text primary: `#111827`
- Text secondary: `#6B7280`
- Success: `#10B981` (connection active, tool success)
- Error: `#EF4444` (connection error, tool failure)
- Warning: `#F59E0B` (HITL confirmation)
- Border: `#E5E7EB`

**Typography:**
- Font: Inter (Google Fonts or system-ui fallback)
- Body: 14px / 1.5 line-height
- Heading: 20px bold (page titles), 16px semibold (section headers)
- Mono: `font-mono` for issue keys (PROJ-123), code blocks in AI responses, UUIDs

**Spacing:** 4px base unit (Tailwind default — use `p-4` = 16px, `p-2` = 8px).

**Border radius:** `rounded-lg` (8px) for cards, `rounded-md` (6px) for buttons and inputs.

**Shadows:** `shadow-sm` for cards, no shadow for inputs.

---

## 12. Mobile Responsiveness

**Target:** Web app, not mobile app. Responsive design required but optimized for desktop (engineers use it on laptops/monitors).

**Breakpoints (Tailwind):**
- `sm` (640px+): minimal changes
- `md` (768px+): show sidebar
- `lg` (1024px+): full layout

**Mobile behavior (< 768px):**
- Sidebar collapses to hamburger menu
- Chat takes full width
- Settings pages stack vertically
- The HITL confirmation card must be fully readable on mobile

**Chat input on mobile:** textarea fixed to bottom of screen, content scrolls above it.

---

## 13. Important Business Logic & Validation Rules

### `on_behalf_of_user_id`
- **Required on every chat message.** This is the user's **Atlassian account ID** (UUID format like `712020:xxxxxx-xxxx-...`).
- It is NOT the same as the AlfredAI user_id.
- Users find their Atlassian account ID in their Atlassian profile settings.
- Store it per-user in the frontend (profile settings page) after they paste it in once.
- If missing or empty, the backend will return an `authorization_error` from the MCP layer.

### Slug validation
- Format: `^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$` — must start and end with alphanumeric, hyphens in middle only, 3-50 chars total.
- Show live error feedback as user types.

### Password rules
- Minimum 12 characters (enforced by backend). Show character count.

### Conversation TTL
- Conversations expire after 24 hours of inactivity. If a user sends a message with a stale `conversation_id`, the backend starts a fresh conversation (no error thrown — returns a new `conversation_id`).

### HITL expiry
- Confirmation requests expire after 10 minutes. Show a live countdown. After expiry, disable the Approve/Cancel buttons and show "This action has expired. Start a new request."

### Audit log immutability
- Audit log is append-only (enforced at DB level). Never show edit/delete controls.

### Admin-only routes
- Client-side: hide admin UI from members (don't render the components)
- Server-side: the backend enforces with 403 — handle gracefully

---

## 14. Error Handling & Loading States

### API error shape
All errors from the backend follow FastAPI's default:
```ts
{ "detail": "Human readable error message" }
// or for structured errors:
{ "detail": { "errors": [{ "tool": "jira", "error": "jira_not_connected", "message": "..." }] } }
```

### Standard HTTP codes to handle
| Code | Meaning | UI action |
|---|---|---|
| `400` | Bad request / validation | Show `detail` message near the form field |
| `401` | Unauthorized | If "Token has expired" → auto-refresh; otherwise → redirect to login |
| `403` | Forbidden | Show "You don't have permission to do this" |
| `404` | Not found | Show "Not found" state |
| `409` | Conflict | Show "Already exists" near the relevant field |
| `422` | Validation error | Show field-level errors (FastAPI returns `detail: [{ loc, msg, type }]`) |
| `424` | Failed dependency | Jira or GitHub not connected — show "Connect [tool] first" with a link |
| `503` | Service unavailable | Show "AlfredAI is temporarily unavailable" banner |

### Loading states
- **Chat sending:** Show streaming indicator (dots animation) immediately on send. Do NOT disable the input — let users queue a follow-up thought.
- **Tool connections:** Skeleton card while loading; spinner on the connect button while OAuth is initiated.
- **Page loads:** Skeleton screens (not spinners) for tables and lists.

### Toast notifications
Use shadcn/ui `toast` or `sonner` library. Show toasts for:
- ✅ "Jira connected successfully"
- ✅ "User invited — share their temporary password"
- ✅ "Action approved and executed"
- ✅ "Password updated"
- ❌ "Failed to connect Jira — try again"
- ❌ "Action cancelled"
- ⚠️ "Jira connection error — please reconnect"

Toasts should auto-dismiss after 4 seconds. Error toasts stay until dismissed.

---

## 15. Project Conventions & Coding Standards

### File structure
```
AlfredAI-web/
├── app/
│   ├── (auth)/              ← route group: login, signup (no app shell)
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/               ← route group: protected, uses AppShell layout
│   │   ├── layout.tsx       ← AppShell wrapper + auth guard
│   │   ├── chat/
│   │   │   └── page.tsx
│   │   ├── onboarding/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── connections/page.tsx
│   │       ├── team/page.tsx
│   │       ├── audit/page.tsx
│   │       └── profile/page.tsx
│   ├── layout.tsx           ← root layout (fonts, providers)
│   └── page.tsx             ← landing page (public)
├── components/              ← see Section 9
├── lib/
│   ├── api.ts               ← all fetch calls, auto-refresh logic
│   ├── auth.ts              ← token storage helpers
│   └── utils.ts             ← cn(), formatDate(), etc.
├── contexts/
│   └── AuthContext.tsx
├── types/
│   └── api.ts               ← TypeScript types matching backend Pydantic models
└── .env.local
```

### TypeScript
- Strict mode (`"strict": true` in tsconfig)
- All API response shapes typed in `types/api.ts` — no `any`
- Use `unknown` for SSE event data and cast after runtime check

### Naming
- Components: PascalCase (`ChatWindow.tsx`)
- Functions/variables: camelCase
- CSS classes: Tailwind utility classes only — no custom CSS files
- API types: match backend field names exactly (snake_case), e.g. `conversation_id`, `actor_user_id`

### Auth guard
Every page in `(app)/` must check auth. Do it in the route group's `layout.tsx`:
```ts
// app/(app)/layout.tsx
export default function AppLayout({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (!user) redirect('/login');
  return <AppShell>{children}</AppShell>;
}
```

---

## 16. Implementation Details the Frontend Developer Must Know

1. **Login requires `tenant_id`.** This is unusual. Store it after signup and surface it in the login flow. Consider a "Remember my organization" checkbox that persists `tenant_id` in `localStorage`.

2. **`on_behalf_of_user_id` is an Atlassian account ID**, not the AlfredAI user UUID. Add a one-time setup screen in onboarding where users paste their Atlassian account ID. Store it in `localStorage` keyed by AlfredAI `user_id`. Example Atlassian account ID format: `712020:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.

3. **SSE vs JSON from the same endpoint.** `POST /v1/chat` returns either `Content-Type: application/json` (< 3s) or `Content-Type: text/event-stream` (> 3s). Check the header and handle both paths.

4. **OAuth redirect chain.** For Jira OAuth, the current backend callback at `/v1/connections/jira/callback` returns JSON (`{"status": "connected"}`). You must configure the backend env vars `JIRA_REDIRECT_URI` and `GITHUB_REDIRECT_URI` to send the user back to your frontend after OAuth completes. E.g., `JIRA_REDIRECT_URI=http://localhost:8000/v1/connections/jira/callback` works for the token exchange, but after that the backend returns JSON not a redirect — coordinate with the backend developer to add a frontend redirect URL parameter.

5. **No email sending in MVP.** When an admin invites a user (`POST /v1/users`), the API returns a `temporary_password` once. Display it in a modal and tell the admin to share it manually. There is no "resend invite" or "forgot password" flow yet.

6. **No password reset flow exists yet.** If a user forgets their password, an admin must create a new account or the team must manually reset it at the DB level. This is a known gap to implement post-MVP.

7. **Conversation history is in Redis, not the frontend.** The backend stores conversation history keyed by `conversation_id` for 24 hours. The frontend only needs to maintain the `conversation_id` string and the rendered message list for the current session. On page refresh, use the `conversation_id` from the URL to re-render past messages — but the backend doesn't have a "get conversation history" endpoint yet (another known gap). For MVP: don't persist rendered messages across page refresh; treat each page load as a fresh chat (but reuse `conversation_id` so the AI retains context).

8. **CORS origins.** The backend's `CORS_ORIGINS` is set to `["http://localhost:3000", "http://localhost:8000"]`. Add your Vercel production domain before deploying. Ask the backend developer to update the `.env` file.

9. **Jira `authorize` endpoint behavior.** `GET /v1/connections/jira/authorize` with `redirect=true` (default) does a `307 redirect` directly to Atlassian — don't call this with `fetch()` as the browser will follow the redirect and you'll lose auth headers. Always use `redirect=false` to get the URL first, then do `window.location.href = url`.

10. **GitHub authorize returns JSON, Jira authorize returns redirect.** Minor inconsistency: GitHub's `/authorize` always returns JSON `{ authorization_url }`. Jira's `/authorize` returns a `307` redirect by default (use `?redirect=false` to get JSON instead). Always use `?redirect=false` for Jira to be consistent.

11. **Audit log `action_type` values** follow `{tool}.{resource}.{verb}` format. Common values: `jira.issue.create`, `jira.issue.update`, `jira.issue.comment`, `jira.issue.assign`, `jira.issue.transition`. Show human-readable labels in the UI: `jira.issue.create` → "Created Jira issue".

12. **The Swagger UI at `{API_URL}/docs` is your best friend** during development. All request/response schemas are documented there automatically from the Pydantic models.