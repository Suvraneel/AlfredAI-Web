You are building the frontend for **AlfredAI** — a production-grade B2B SaaS web app. This is a real, shippable product, not a demo. Read every section before writing any code. Build incrementally: scaffold the project structure first, then implement screens one by one, starting with auth → onboarding → chat → the rest.

---

## PART 1 — PROJECT SETUP

### Tech Stack (do not deviate)
- **Framework:** Next.js 14 (App Router, TypeScript strict mode)
- **UI components:** shadcn/ui as the component primitive layer
- **Styling:** Tailwind CSS (utility-first; no custom CSS files)
- **Animation:** Framer Motion (no Three.js, no WebGL, no 3D)
- **Forms:** React Hook Form + Zod
- **SSE streaming:** `@microsoft/fetch-event-source` npm package
- **Markdown rendering:** `react-markdown` + `rehype-highlight`
- **Toasts:** `sonner`
- **State:** React Context for auth only; local `useState`/`useReducer` everywhere else
- **Deployment target:** Vercel

### Environment variable
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK=true
```

### Initialize with
```bash
npx create-next-app@latest alfred-ai-web --typescript --tailwind --app --src-dir
cd alfred-ai-web
npx shadcn-ui@latest init
npm install framer-motion react-hook-form zod @hookform/resolvers \
  @microsoft/fetch-event-source react-markdown rehype-highlight sonner \
  lucide-react
```

---

## PART 2 — FILE STRUCTURE

Create this exact structure:

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                ← landing page
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              ← auth guard + AppShell
│   │   ├── chat/page.tsx
│   │   ├── chat/[id]/page.tsx
│   │   ├── onboarding/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── knowledge/page.tsx
│   │   ├── integrations/page.tsx
│   │   ├── agents/page.tsx
│   │   ├── audit/page.tsx
│   │   └── settings/
│   │       ├── team/page.tsx
│   │       ├── connections/page.tsx
│   │       └── profile/page.tsx
│   └── layout.tsx                  ← fonts, providers
├── components/
│   ├── ui/                         ← shadcn primitives only
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── CommandPalette.tsx
│   │   └── TopBar.tsx
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── StreamingMessage.tsx
│   │   ├── ToolCallTrace.tsx
│   │   ├── ConfirmationCard.tsx
│   │   ├── ChatInput.tsx
│   │   └── ConversationList.tsx
│   ├── integrations/
│   │   ├── IntegrationCard.tsx
│   │   ├── ConnectionStatus.tsx
│   │   └── OAuthConnectButton.tsx
│   ├── knowledge/
│   │   └── KnowledgeGraph.tsx
│   ├── dashboard/
│   │   ├── ActivityFeed.tsx
│   │   ├── InsightCard.tsx
│   │   └── QuickActions.tsx
│   ├── audit/
│   │   └── AuditTimeline.tsx
│   └── shared/
│       ├── SourceBadge.tsx
│       ├── IssuePill.tsx
│       ├── StatusDot.tsx
│       └── EmptyState.tsx
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   ├── api.ts                      ← all fetch calls + auto-refresh
│   ├── auth.ts                     ← token storage helpers
│   ├── sse.ts                      ← SSE chat wrapper
│   └── utils.ts
├── hooks/
│   ├── useChat.ts
│   ├── useConnections.ts
│   └── useCommandPalette.ts
├── mock/
│   ├── jira.ts
│   ├── github.ts
│   ├── conversations.ts
│   └── audit.ts
└── types/
    └── api.ts
```

---

## PART 3 — DESIGN SYSTEM

### Color tokens — add to `tailwind.config.ts`

```ts
colors: {
  bg: {
    base:     '#09090B',   // root background
    surface:  '#111113',   // cards, panels
    elevated: '#18181B',   // modals, dropdowns
    subtle:   '#27272A',   // hover, dividers
  },
  text: {
    primary:   '#FAFAFA',
    secondary: '#A1A1AA',
    muted:     '#52525B',
  },
  accent: {
    from: '#6366F1',                  // indigo-500
    to:   '#8B5CF6',                  // violet-500
    glow: 'rgba(99,102,241,0.15)',
  },
  border: {
    DEFAULT: 'rgba(255,255,255,0.06)',
    accent:  'rgba(99,102,241,0.3)',
  },
  success: '#10B981',
  warning: '#F59E0B',
  error:   '#EF4444',
}
```

### Typography
- **Display:** `Inter` weight 700 for headings
- **UI body:** `Inter` 14px / 1.5 line-height / weight 400–500
- **Mono:** `JetBrains Mono` for issue keys (PROJ-123), UUIDs, code blocks

### Visual rules
- Glass panels: `backdrop-blur-xl bg-white/[0.03]`
- Card outlines: `border border-white/[0.06]` (no thick borders)
- Active glow: `shadow-[0_0_20px_rgba(99,102,241,0.15)]`
- Use glass ONLY for overlapping panels (sidebar, modals) — not decoratively

### Framer Motion rules
- Durations: 150ms micro, 250ms panels, 350ms page
- Easing enter: `[0.16, 1, 0.3, 1]` — easing exit: `[0.4, 0, 1, 1]`
- Never animate `width`/`height` — use `scaleY` + `transformOrigin` or layout animation
- Stagger children: `staggerChildren: 0.04` max
- Status pulses: CSS `animate-pulse` only, not Framer Motion
- Streaming AI text: plain React state updates, no animation on the text chars

---

## PART 4 — BACKEND API

**Base URL:** `NEXT_PUBLIC_API_URL` env var (default `http://localhost:8000`)  
**All endpoints prefixed:** `/v1/` (except `/health`, `/ready`, `/version`)  
**Auth:** `Authorization: Bearer <access_token>` on every protected request  
**Swagger UI:** `{API_URL}/docs` — use it during development

### `lib/auth.ts` — token storage

```ts
const KEYS = {
  accessToken:    'alfred_access_token',
  refreshToken:   'alfred_refresh_token',
  tenantId:       'alfred_tenant_id',
  user:           'alfred_user',
  atlassianId:    'alfred_atlassian_id',  // Atlassian account ID for Jira actions
}

export const getAccessToken  = () => localStorage.getItem(KEYS.accessToken)
export const getRefreshToken = () => localStorage.getItem(KEYS.refreshToken)
export const getTenantId     = () => localStorage.getItem(KEYS.tenantId)
export const getAtlassianId  = () => localStorage.getItem(KEYS.atlassianId)

export const setAuthTokens = (access: string, refresh: string, tenantId: string) => {
  localStorage.setItem(KEYS.accessToken,  access)
  localStorage.setItem(KEYS.refreshToken, refresh)
  localStorage.setItem(KEYS.tenantId,     tenantId)
}

export const clearAuth = () => Object.values(KEYS).forEach(k => localStorage.removeItem(k))
```

### `lib/api.ts` — fetch wrapper with auto-refresh

```ts
const API = process.env.NEXT_PUBLIC_API_URL

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
  localStorage.setItem('alfred_access_token', data.access_token)
  return data.access_token
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  let response = await fetch(`${API}${path}`, { ...options, headers })

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
          response = await fetch(`${API}${path}`, {
            ...options,
            headers: { ...headers, Authorization: `Bearer ${newToken}` },
          })
        } else {
          clearAuth()
          window.location.href = '/login'
        }
      }
    }
  }

  return response
}
```

### `lib/sse.ts` — streaming chat

```ts
import { fetchEventSource } from '@microsoft/fetch-event-source'

const API = process.env.NEXT_PUBLIC_API_URL

export interface SSEHandlers {
  onProgress: (message: string) => void
  onComplete: (response: ChatResponse) => void
  onError:    (message: string) => void
}

export async function streamChat(
  body: ChatRequest,
  handlers: SSEHandlers,
  signal?: AbortSignal
) {
  const token = getAccessToken()

  // Try fast path first
  const res = await fetch(`${API}/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  })

  if (res.headers.get('content-type')?.includes('application/json')) {
    const data = await res.json()
    if (!res.ok) { handlers.onError(data.detail ?? 'Unknown error'); return }
    handlers.onComplete(data)
    return
  }

  // SSE path
  await fetchEventSource(`${API}/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
    onmessage(ev) {
      const data = JSON.parse(ev.data)
      if (data.type === 'progress') handlers.onProgress(data.message)
      if (data.type === 'complete') handlers.onComplete(data.response)
      if (data.type === 'error')    handlers.onError(data.message)
    },
    onerror(err) { handlers.onError(String(err)); throw err },
  })
}
```

---

## PART 5 — ALL API ENDPOINTS

### Auth & Tenant

```
POST /v1/tenants
Body: { name: string, slug: string, admin_email: string,
        admin_password: string, registration_secret: string }
Response: { tenant_id: string, access_token: string, token_type: string }
Errors: 409 "Slug already taken" | 409 "Email already registered"

POST /v1/auth/login
Body: { email: string, tenant_id: string, password: string }
Response: { access_token, refresh_token, token_type, expires_in: 3600 }
⚠ tenant_id is REQUIRED — non-standard, see Section 7.3

POST /v1/auth/refresh
Body: { refresh_token: string, tenant_id: string }
Response: { access_token, token_type, expires_in }

POST /v1/auth/logout    [Bearer]
Body: { refresh_token: string }
```

### Users

```
GET  /v1/users/me          [Bearer]  → UserProfile
PATCH /v1/users/me         [Bearer]  Body: { current_password, new_password }
POST /v1/users             [Bearer, admin]  Body: { email, role: "admin"|"member" }
                                    Response: { user_id, email, temporary_password }
GET  /v1/users?limit&offset [Bearer, admin] → { total, items: UserProfile[], next_offset }
```

### Tool Connections

```
GET /v1/connections         [Bearer]  → { connections: ToolConnection[] }
GET /v1/connections/{tool}  [Bearer]  → ToolConnection  (does liveness ping)

GET /v1/connections/jira/authorize?redirect=false  [Bearer]
    → { authorization_url: string }
    ⚠ Always use redirect=false — do NOT call with plain fetch with redirect=true
    Redirect user's window to authorization_url

GET /v1/connections/github/authorize  [Bearer]
    → { authorization_url: string }

DELETE /v1/connections/jira    [Bearer, admin]  → { status: "disconnected" }
DELETE /v1/connections/github  [Bearer, admin]  → { status: "disconnected" }
```

### Chat (core product)

```
POST /v1/chat  [Bearer]
Body: {
  message: string
  conversation_id?: string        // omit for new conversation
  on_behalf_of_user_id: string   // Atlassian account ID — REQUIRED
  hitl_enabled?: boolean          // default false
  source_tools?: string[]         // e.g. ["jira"]
}
Response: JSON ChatResponse  OR  SSE stream (check Content-Type header)
⚠ See lib/sse.ts — handle both paths

POST /v1/chat/confirm/{action_id}  [Bearer]  → ChatResponse
DELETE /v1/chat/confirm/{action_id} [Bearer] → { action_id, message }
```

### Other

```
GET /v1/context/{jira_issue_key}  [Bearer]  → CrossToolContext  (60s Redis cache)
    Returns 424 if Jira or GitHub is not connected

GET /v1/audit  [Bearer]
    Query: actor_user_id?, action_type?, tool?, from_date?, to_date?,
           limit=50 (max 200), offset=0
    Response: { total, items: AuditLogItem[], next_offset }
    ⚠ Non-admin users only see their own entries (enforced server-side)

GET /v1/actions/{action_id}           [Bearer]  → ActionStatus
POST /v1/actions/{action_id}/cancel   [Bearer]  → { message }

GET /health   → { status: "ok" }
GET /ready    → { status: "ready"|"degraded", checks: { database, redis, llm } }
```

---

## PART 6 — TYPESCRIPT TYPES (`types/api.ts`)

```ts
export interface UserProfile {
  user_id:    string
  tenant_id:  string
  email:      string
  role:       'admin' | 'member'
  created_at: string
  is_active:  boolean
}

export interface ToolConnection {
  tool:              'jira' | 'github' | 'slack' | 'confluence' | 'asana'
  status:            'active' | 'disconnected' | 'error' | 'coming_soon'
  connected_at:      string | null
  scopes:            string[]
  last_verified_at:  string | null
}

export interface ChatRequest {
  message:               string
  conversation_id?:      string
  on_behalf_of_user_id:  string
  hitl_enabled?:         boolean
  source_tools?:         string[]
}

export interface ChatResponse {
  conversation_id:       string
  reply:                 string
  tool_calls_made:       ToolCallRecord[]
  pending_confirmation:  ConfirmationRequest | null
  tokens_used:           number
}

export interface ToolCallRecord {
  tool_name:   string
  arguments:   Record<string, unknown>
  result:      string
  success:     boolean
  duration_ms: number
}

export interface ConfirmationRequest {
  action_id:               string
  tool_name:               string
  arguments:               Record<string, unknown>
  human_readable_summary:  string
  expires_at:              string   // ISO — 10-minute TTL
}

export interface JiraIssue {
  key:              string   // "PROJ-123"
  id:               string
  summary:          string
  status:           string
  priority:         string | null
  labels:           string[]
  issue_type:       string
  assignee:         string | null
  reporter:         string | null
  created_at:       string
  updated_at:       string
  due_date:         string | null
  sprint:           string | null
  comments:         JiraComment[]
  linked_issues:    JiraIssueLink[]
  description_text: string | null
}

export interface JiraComment {
  id:         string
  author:     string
  body_text:  string
  created_at: string
  updated_at: string
}

export interface JiraIssueLink {
  link_type:         string
  outward_issue_key: string | null
  inward_issue_key:  string | null
  direction:         'inward' | 'outward'
}

export interface GitHubPR {
  id:           number
  number:       number
  title:        string
  body:         string | null
  state:        'open' | 'closed'
  html_url:     string
  head_branch:  string
  base_branch:  string
  author:       string
  created_at:   string
  updated_at:   string
  merged_at:    string | null
  review_state: string | null
  is_merged:    boolean
}

export interface GitHubCommit {
  sha:          string
  message:      string
  author_name:  string
  committed_at: string
  html_url:     string
}

export interface GitHubReview {
  id:           number
  reviewer:     string
  state:        'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED'
  submitted_at: string
  body:         string | null
}

export interface CrossToolContext {
  jira_issue:           JiraIssue
  linked_prs:           GitHubPR[]
  pr_commits:           Record<number, GitHubCommit[]>
  pr_reviews:           Record<number, GitHubReview[]>
  correlation_confidence: number
}

export interface AuditLogItem {
  id:                  string
  actor_user_id:       string
  action_type:         string   // "jira.issue.create" etc.
  tool:                string
  target_resource_id:  string
  target_resource_type: string
  status:              'success' | 'failure'
  created_at:          string
}

export interface ActionStatus {
  action_id:    string
  status:       'pending' | 'running' | 'complete' | 'failed'
  result:       string | null
  error:        string | null
  started_at:   string
  completed_at: string | null
}
```

---

## PART 7 — MOCK DATA (`NEXT_PUBLIC_USE_MOCK=true`)

When mock mode is on, `lib/api.ts` intercepts all calls and returns mock data.
All mock data must use the exact TypeScript types above.

**`mock/jira.ts`** — 8 issues across 2 projects (PROJ, INFRA):
- `PROJ-47`: "Add OAuth2 login flow" — In Review, assigned to Sarah Chen,
  Sprint 14, linked to PR #61, 2 comments
- `PROJ-52`: "Fix memory leak in worker process" — Blocked, blocked by PROJ-31
- `PROJ-53`: "Update API documentation" — To Do, unassigned
- `PROJ-31`: "Refactor database connection pooling" — In Progress, 5 comments
- `PROJ-61`: "Implement audit log export" — Done, merged
- `INFRA-12`: "Migrate Redis to cluster mode" — In Progress, assigned to Alex K
- `INFRA-15`: "Set up staging environment monitoring" — To Do
- `PROJ-64`: "Fix login timeout on mobile" — In Review, P1 priority

**`mock/github.ts`** — 5 PRs:
- PR #61: "feat: OAuth2 login flow" — open, 2 approvals, linked to PROJ-47
- PR #58: "fix: memory leak in worker" — open, 1 change request, linked to PROJ-52
- PR #55: "feat: audit log API" — merged, linked to PROJ-61
- PR #62: "chore: update dependencies" — open, no reviews
- PR #60: "docs: API documentation update" — draft

**`mock/conversations.ts`** — 3 realistic conversations:
1. "What's the status of the auth refactor?" → AI responds with cross-tool context
   combining PROJ-47 status + PR #61 review status
2. "Create a bug ticket for the login timeout on mobile, P1, assign to Sarah" →
   AI responds with ConfirmationRequest (HITL), then success
3. "Show me everything blocking the current sprint" → AI searches PROJ issues,
   finds PROJ-52 blocked by PROJ-31, responds with summary

**`mock/audit.ts`** — 15 entries over the last 7 days, mix of all action types
and success/failure. Include at least 2 failures with realistic error messages.

---

## PART 8 — SCREENS

### 8.1 Landing Page (`/`)
Public marketing. Dark background. Sections:
1. **Hero** — "Your team's knowledge, unified." + subheadline. CTAs: "Start free
   trial" → /signup, "See how it works" → smooth scroll to demo section.
2. **Animated demo** — CSS-animated mockup of chat interface. Typewriter effect
   showing user typing "What's blocking PROJ-47?" and AI responding. No video.
3. **Integrations strip** — logos: Jira, GitHub, Confluence, Slack, Asana, "and more"
4. **Pricing** — 3 cards: Starter $49/mo (3 users), Growth $149/mo (10 users),
   Enterprise custom
5. **Footer** — minimal

### 8.2 Signup (`/signup`)
Two-column: left = form, right = dark product screenshot or illustration.

Fields:
- Company Name → auto-generates Slug (live, shown below as `alfred.ai/your-slug`)
- Slug (editable) — regex validate: `^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$`
- Email
- Password (min 12 chars, live strength bar)
- Confirm Password
- "Have an invite code?" link → expands to reveal `registration_secret` field

On success: show the `tenant_id` UUID in a highlighted box with copy button +
"⚠ Save this — you need it to log in. It is your Workspace ID." Then redirect
to `/onboarding` after 3 seconds.

### 8.3 Login (`/login`)
Centered card on dark background.

Fields:
- Email
- Password
- Collapsible "Workspace settings" (chevron toggle):
  - "Workspace ID" input — pre-filled from localStorage if available
  - "Remember my workspace" checkbox
- Subtle hint below: "Don't know your Workspace ID? Check your signup confirmation."

### 8.4 Onboarding (`/onboarding`)
3-step wizard with numbered progress indicator at top.

**Step 1 — Welcome**
Product logo, "You're in. Let's set up your workspace." Grid of 4 tool tiles
(Jira, GitHub, Confluence grayed-out, Slack grayed-out). "Next →" button.

**Step 2 — Connect Jira**
- Description: what Jira connection unlocks
- "Connect Jira" button:
  - Calls `GET /v1/connections/jira/authorize?redirect=false` with Bearer token
  - Gets `{ authorization_url }` back
  - Sets `window.location.href = authorization_url`
  - After OAuth returns, backend redirects to your frontend with query params
  - Detect `?connected=jira` in URL → show success state: green checkmark,
    "✓ Jira connected — issues and sprints are syncing"
- "Skip for now" link

**Step 3 — Connect GitHub + Atlassian Account ID**
- Connect GitHub button (same OAuth pattern)
- Separate form field: "Your Atlassian Account ID"
  - Help text: "Found in your Atlassian profile settings. Looks like:
    712020:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  - "How to find it" tooltip: Profile icon → Atlassian Account → Account ID
  - Saved to `localStorage` as `alfred_atlassian_id`
  - ⚠ This is required for all Jira write actions. Without it, AI cannot create
    or update issues on your behalf.
- "Finish setup →" → /chat

### 8.5 Chat (`/chat` and `/chat/[id]`)
Full-height. Left sidebar (240px, collapsible) + main area.

**Left sidebar:**
- "+ New Chat" button at top (accent gradient border)
- Conversation list: each item shows auto-titled (first user message, max 40 chars)
  + relative timestamp. Active item: left indigo border + bg-surface.
- Bottom: user avatar + email + "Settings" link

**Main area — empty state:**
Large centered: Alfred logo + "Ask anything about your Jira or GitHub."
Three suggestion pills below:
- "What's blocking our current sprint?"
- "Show me all open PRs needing review"
- "Summarize what changed in PROJ this week"

**Main area — active conversation:**
- Messages scroll, newest at bottom, auto-scroll on new message
- **User message:** right-aligned, `bg-accent-from/20 border border-accent-from/30`,
  white text, rounded-2xl rounded-tr-sm
- **AI message:** left-aligned, `bg-bg-surface border border-border`, rounded-2xl
  rounded-tl-sm, renders Markdown with syntax-highlighted code blocks
- **Under each AI message:** collapsible "Agent used X tools" section:
  ```
  ▶ Agent used 3 tools   (click to expand)
    ✓ jira_get_issue (PROJ-47) — 234ms
    ✓ github_get_linked_prs (PROJ-47) — 189ms
    ✗ jira_get_issue_comments — 401 scope error
  ```
  Green dot for success, red for failure. Tool name in monospace.
- **Source badges:** inline `[Jira: PROJ-47]` and `[GitHub: PR#61]` pills inside
  AI message text, clickable, open in new tab

**Streaming state:**
While SSE stream is open, show at bottom of message list:
```
Alfred is thinking  •  •  •   (12s)
```
Pulsing dots (CSS animation). Show elapsed seconds.

**HITL Confirmation Card** (rendered as a message-like card after AI response):
```
┌─────────────────────────────────────────────┐
│  ⚡ Waiting for your approval               │
│                                              │
│  {human_readable_summary}                    │
│                                              │
│  Expires in  09:47    ← live countdown      │
│                                              │
│  [✓ Approve and Execute]   [✗ Cancel]      │
└─────────────────────────────────────────────┘
```
Approve → `POST /v1/chat/confirm/{action_id}` → append result as next AI message.
Cancel → `DELETE /v1/chat/confirm/{action_id}` → show "Action cancelled." inline.
After expiry: disable buttons, "This action expired. Send a new message to retry."

**Chat input (bottom, fixed, above safe-area):**
- Auto-resize textarea (Enter = send, Shift+Enter = newline, max 4 rows)
- If `alfred_atlassian_id` is not in localStorage: amber banner above input:
  "⚠ Set your Atlassian Account ID in Profile to enable Jira write actions →"
- Send button: indigo, spinner while in-flight, disabled during streaming
- Keyboard shortcut hint: "⌘K to search • Shift+Enter for new line"

### 8.6 Dashboard (`/dashboard`)
3-column grid (→ 1 column on mobile).

**Left: Activity Feed**
Vertical timeline. Each event:
- Colored tool icon (Jira = indigo, GitHub = orange)
- Text: "PROJ-47 moved to In Review by Sarah Chen"
- Relative time: "2 min ago"
- Click → open chat with that issue pre-loaded

**Center: AI Insights**
Card list, 3-5 items, AI-surfaced from mock data:
- 🔴 "PROJ-52 is blocked — 14 days with no progress"
- ⚠️ "PR #58 has an unreviewed change request for 3 days"
- ✅ "Sprint 14 is 78% complete — 2 days remaining"
Each card: "[Ask Alfred →]" button pre-fills chat with relevant question.

**Right: Quick Actions + Connection Status**
- "New Chat +" button
- Connection pills: `● Jira active` / `● GitHub active` / `○ Slack coming soon`
- "View Audit Log →" link

**Top of page:** "Good morning, [first word of email]." + today's date in muted text.

### 8.7 Knowledge Graph (`/knowledge`)
2D SVG node-link diagram. No external graph library — use SVG/Canvas directly.

Nodes:
- Jira Issues: indigo circles, label = issue key + truncated summary
- GitHub PRs: orange circles, label = "#61 OAuth flow"
- Users: grey avatar circles

Edges:
- Solid line: Jira issue link (blocks/relates)
- Dashed: PR references issue key in branch/title
- Dotted: assigned to user

Interactions:
- Click node → right side panel slides in (Framer Motion) with full issue/PR details
- Hover → tooltip (summary, status, assignee)
- Drag to pan (mouse events on SVG), scroll to zoom (transform scale)
- Search input top-left filters/highlights matching nodes

Use mock data (8 Jira + 5 PR + 3 user nodes). Initial layout: force-directed
approximation (simple repulsion + spring, compute once on mount).

### 8.8 Integrations Hub (`/integrations`)
Card grid (3 columns → 1 on mobile).

**Connected (real API):** Jira, GitHub
```
┌───────────────────────────────────┐
│  [Jira Logo]    Jira              │
│                 Atlassian         │
│                                   │
│  ● Connected                      │
│  acme.atlassian.com               │
│  Synced 2 min ago                 │
│  Scopes: read + write             │
│                                   │
│  [Disconnect ↗]  [Reconnect ↻]   │
└───────────────────────────────────┘
```
Status dot: green animated pulse (active), red static (error), grey (disconnected).

**Coming soon** (grayed, badge "Coming Soon"):
Confluence, Slack, Asana, Notion, Linear — show logos with lock overlay.

Disconnect → confirmation dialog: "This revokes your token and stops all AI actions for this tool. Continue?"

### 8.9 Agents (`/agents`)
Display-only for MVP (automation engine is post-MVP). 3-column card grid.

6 pre-built agent cards:
1. **PR Summarizer** — Trigger: PR merged → Action: Update linked Jira ticket
2. **Sprint Reporter** — Trigger: Weekly cron → Action: Post sprint summary
3. **Blocked Ticket Alert** — Trigger: Daily → Action: Notify assignees of blockers
4. **Onboarding Assistant** — Trigger: Question → Action: Answer from docs
5. **Standup Generator** — Trigger: Morning → Action: Generate standup notes
6. **Code Review Notifier** — Trigger: Review requested → Action: Ping assignee

Each card: icon, name, description, trigger/action line, status toggle (disabled,
saves to localStorage), "Configure" button → slide-over drawer (Framer Motion,
350ms from right) with trigger/action/conditions fields. No backend call.

### 8.10 Audit Log (`/audit`)
Timeline layout, not a plain table.

Each entry:
```
○ Created issue         PROJ-53     Jun 27, 14:32    ✓
  "Fix login timeout"   Bug · P1 · Jira

○ Transitioned issue    PROJ-47     Jun 27, 14:28    ✓
  In Review → Done      Jira

● Added comment         PROJ-52     Jun 27, 13:10    ✗
  401 scope mismatch    Jira
```
Dot: green (success), red (failure).

Action type labels:
- `jira.issue.create` → "Created issue"
- `jira.issue.transition` → "Transitioned issue"
- `jira.issue.comment` → "Added comment"
- `jira.issue.assign` → "Assigned issue"
- `jira.issue.update` → "Updated issue"

Filters (top bar): Date range picker, Tool dropdown (Jira/GitHub), Status (All/Success/Failure).
Pagination: 50/page, prev/next buttons.
Admins see all entries + "User" column. Members see only own entries + no user filter.

### 8.11 Settings — Connections (`/settings/connections`)
Same as Integrations Hub but with admin-only disconnect actions.
Confirmation dialog before disconnect.

### 8.12 Settings — Team (`/settings/team`) — Admin only
Table: Email | Role | Joined | Active status.
"Invite user" button → modal: Email + Role dropdown (member/admin).
`POST /v1/users` → show `temporary_password` once in a copy-enabled modal:
"Share this with the user. It will not be shown again."

Non-admin users: show lock icon + "Admin access required" — do not redirect.

### 8.13 Settings — Profile (`/settings/profile`)
- Email (read-only)
- Role badge (read-only)
- Workspace ID — monospace, copyable UUID
- **Atlassian Account ID** — editable input, persisted to `localStorage`
  on blur/save. Helper: "Required for Jira write actions."
  Format example: `712020:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Change password form: current + new (min 12) + confirm
- `PATCH /v1/users/me` body: `{ current_password, new_password }`

---

## PART 9 — GLOBAL COMMAND PALETTE (Cmd+K)

Open with `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux). Framer Motion overlay with
`backdrop-blur-xl` background. Input auto-focused on open.

**Static commands:**
- New Chat → /chat
- View Dashboard → /dashboard
- View Knowledge Graph → /knowledge
- View Integrations → /integrations
- View Agents → /agents
- View Audit Log → /audit
- Connect Jira → /settings/connections
- Invite Team Member → /settings/team (admin only)
- Profile Settings → /settings/profile

**Dynamic results (from mock data):**
- Recent Jira issues — show key chip + summary + status badge
- Recent conversations — show first message truncated to 50 chars

Select a Jira issue → navigate to `/chat` with message pre-filled:
`"Tell me about {issue_key}"`

Keyboard: ↑↓ to navigate, Enter to select, Escape to close.
Implement in `hooks/useCommandPalette.ts`. Mount global `keydown` listener in
root layout (or use a `useEffect` in the `AppShell`).

---

## PART 10 — NAVIGATION

**Sidebar items:**
```
[AlfredAI Logo + wordmark]
──────────────────────────
💬 Chat              /chat
🏠 Dashboard         /dashboard
🕸  Knowledge        /knowledge
🔌 Integrations      /integrations
🤖 Agents            /agents
──────────────────────────
⚙ Settings
  Connections        /settings/connections
  Team               /settings/team    ← [Admin] badge
  Profile            /settings/profile
──────────────────────────
[User avatar — initials from email]
[email, truncated 24 chars]
[role badge: Admin / Member]
[Sign out]
```

Active state: left 2px indigo border + `bg-bg-subtle`.
Sidebar collapses to icons-only at < 1024px.
Mobile < 768px: bottom navigation bar (Chat, Dashboard, Search, Settings).

**Page transitions:** Framer Motion `AnimatePresence` in route group layout:
`opacity: 0→1` + `y: 8→0`, 150ms ease-out.

---

## PART 11 — ERROR HANDLING

All toasts via `sonner`. Duration: 4s for success, persistent (manual dismiss)
for errors.

| HTTP | Toast |
|---|---|
| `401` expired | (silent — auto-refresh) |
| `401` other | "Session expired. Redirecting to login…" |
| `403` | "You don't have permission to do that." |
| `409` | Show `detail` field verbatim |
| `422` | Show field errors inline in the form |
| `424` | "Connect [tool] first to use this feature." + link to /integrations |
| `503` | "AlfredAI is temporarily unavailable. Try again shortly." |
| Network | "Can't reach the server. Check your connection." |

**Empty states:** Every list/table must have a designed empty state — never blank:
- Chat: "Start a conversation." + 3 suggestion pills
- Audit log: "No actions yet — Alfred logs every change it makes here."
- Team: "Just you. Invite your team to get started."
- Knowledge: "Connect Jira to see your knowledge graph."

**Skeletons:** Use skeleton screens (not spinners) for all list and table loads.

---

## PART 12 — WHAT NOT TO BUILD (out of scope)

- Password reset / forgot password (backend not built)
- Email verification (backend not built)
- Real Stripe billing (show placeholder pricing card only)
- Real Slack, Confluence, Asana integrations (show as "coming soon")
- Webhook configuration UI
- Workflow automation rule execution (agents page is display-only)
- Native mobile app

---

## PART 13 — CRITICAL IMPLEMENTATION DETAILS

1. **Login requires `tenant_id`** — non-standard. Store it after signup and
   pre-fill in the login form's "Workspace settings" section.

2. **`on_behalf_of_user_id` ≠ AlfredAI user_id** — it is the user's Atlassian
   account ID (format: `712020:uuid`). Read from `localStorage.alfred_atlassian_id`.
   If not set, chat still works for read-only queries; write actions will fail
   with an `authorization_error` from the backend. Show a warning banner in chat.

3. **`POST /v1/chat` returns JSON OR SSE** — check `Content-Type` on the response.
   If `text/event-stream`, parse SSE events. If `application/json`, parse directly.
   Both return the same `ChatResponse` shape. See `lib/sse.ts` implementation above.

4. **`GET /v1/connections/jira/authorize` — always use `?redirect=false`** —
   the default is `?redirect=true` which sends a `307` redirect that `fetch()`
   will follow and break. Get the URL as JSON, then do `window.location.href = url`.
   GitHub's `/authorize` always returns JSON (no redirect parameter needed).

5. **OAuth callback redirect** — after the user completes Atlassian/GitHub OAuth,
   the backend's callback returns JSON (`{ status: "connected" }`). You need to
   configure the backend env vars `JIRA_REDIRECT_URI` / `GITHUB_REDIRECT_URI` to
   point to your frontend URL with a `?connected=jira` query param so you know
   the OAuth completed successfully. Coordinate with the backend to add this.

6. **Conversation history** — the backend stores conversations in Redis for 24h
   keyed by `conversation_id`. The frontend does NOT have a "fetch past messages"
   endpoint. On page refresh, the AI still has context (it's in Redis) but the
   rendered message list is gone. For MVP: don't persist rendered messages across
   refreshes. Just reuse the `conversation_id` from the URL to resume the AI context.

7. **Audit log is append-only** — never show edit or delete controls.

8. **Admin-only routes** — check `role === 'admin'` from AuthContext. Show
   "Access restricted" state instead of the component — don't redirect to 403.
   The backend enforces it too (returns 403), but handle it gracefully in UI.

9. **CORS** — backend allows `http://localhost:3000` in dev. For Vercel preview
   deployments, you'll need to update `CORS_ORIGINS` in the backend `.env`.

10. **Invite flow has no email** — `POST /v1/users` returns `temporary_password`
    once in the API response. Show it in a modal with a copy button. There is no
    "resend invite" and no automated email delivery in the MVP.

---

Now build this application. Start with:
1. `tailwind.config.ts` color tokens
2. `types/api.ts`
3. `lib/auth.ts`, `lib/api.ts`, `lib/sse.ts`
4. `mock/` data files
5. `contexts/AuthContext.tsx`
6. Auth screens: `/login`, `/signup`
7. Onboarding: `/onboarding`
8. AppShell + Sidebar + CommandPalette
9. Chat: `/chat` and `/chat/[id]`
10. Remaining screens in order: dashboard → integrations → audit → knowledge → agents → settings