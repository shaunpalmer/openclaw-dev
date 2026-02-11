# Channel Manager Console UI Specification (v1)

> MATCHING OPENCLAW CONTROL UI LOOK & FEEL

## Solution Setup

*   **Visual system:** colors, spacing, components (so it “looks native”).
*   **IA:** the 9 screens + what each one must do (MVP order).
*   **Critical flows:** connect/confirm/reconnect + Gmail multi-login.
*   **Data contracts:** minimal API + types the UI consumes.
*   **Build plan:** how to ship UI value fast without painting yourself into a corner.

---

## A) Visual System

**Theme:**
*   **Background:** deep navy/blue-black
*   **Surfaces:** slightly lighter panels/cards
*   **Text:** white + cool greys
*   **Accent:** lobster red/orange for primary actions + highlights
*   **Secondary glow:** subtle cyan/purple hover (tiny, not Tron)

**Components (minimal set):**
*   **SidebarNav:** icons + active pill highlight
*   **StatusDot:** (connected/unknown/expired) + tooltip
*   **DataGrid:** dense rows, generous line-height, sticky header
*   **ActionButton:** subtle rounding, no heavy shadows
*   **Drawer (right side):** for “Connect / Confirm / Settings”
*   **Toast:** (success/fail)
*   **Badge:** (channel type: public/auth/session-tier)

**Status Colors:**
*   **Connected:** green dot
*   **Unknown:** amber/grey dot
*   **Expired:** red dot
*   **Blocked:** red + “slash” icon + cooldown timestamp
*   **Rate-limited:** purple dot + retry time

---

## B) Information Architecture (9 Screens)

### 1) Dashboard (ship early)
**Purpose:** “Am I safe to run Scout?”
*   **Cards:**
    *   Connected channels count
    *   Unknown/Expired count
    *   Failures last 24h
*   **Leads today:** (by channel)
*   **“Action Required” list:**
    *   expired sessions
    *   channels needing confirm
    *   blocked/rate-limited

### 2) Channels (Workhorse Screen)
**Grid layout:**
`Channel | Type | Status | Identity | Last Seen | Next Check | Actions`

*   **Actions per row:**
    *   Open Login (launches the `openclaw browser open` command)
    *   Confirm
    *   Test
    *   Pause
*   **Drawer details:**
    *   URL presets (per channel)
    *   Polling interval
    *   Dedupe mode
    *   Notes

### 3) Identities (Multi-login / Bot Accounts)
**Purpose:** “Don’t burn my accounts”
*   **Identity data:**
    *   Display name (e.g., `gmail-bot-01`, `upwork-bot-02`)
    *   Email/username (optional)
    *   Recovery metadata (optional)
    *   Channels assigned
    *   Health (connected/expired count)
*   **Actions:**
    *   Create identity
    *   Assign channel
    *   Rotate / disable identity

### 4) Sessions (The Truth Table)
**Definition:** “Channel + Identity” pairs.
*   **State:** `connected | unknown | expired | blocked`
*   **Metadata:**
    *   Last login timestamp
    *   Last confirmed timestamp
    *   Cookie storage location / vault reference
    *   Expiry hint (if detectable)
*   **Actions:**
    *   Reconnect (opens login)
    *   Invalidate
    *   View events

### 5) Scheduler
*   Per channel frequency
*   Cooldown/backoff settings
*   “Run now”
*   Pause/resume

### 6) Leads
*   Unified feed
*   Filters: channel, keyword match, budget, location, time
*   Dedupe reason + hash
*   “Draft reply” (optional)

### 7) Rollups & Retention
*   **Hot store:** 30 days
*   **Cold store:** Rollups (weekly/monthly)
*   **Actions:**
    *   “Run rollup now”
    *   “Archive month”
    *   “Purge hot store”

### 8) Audit Log
*   Logins opened
*   Confirms
*   Status changes
*   Tool invocations
*   Failures

### 9) Settings
*   DB paths
*   Browser profile name
*   HTTP base URL
*   Notification hooks (email/slack later)

---

## C) Critical Flows

### Flow 1: Connect a session-tier channel (TradeMe / Upwork / Fiverr)
1.  From **Channels** row, click **Open Login**.
2.  UI shows a modal with:
    *   The exact command to run (copy button)
    *   The expected login URL(s)
    *   Which identity to use
3.  After login, click **Confirm**.
4.  Status updates to `connected` + updates `last confirmed` timestamp.

### Flow 2: Gmail (First-class & Multi-login)
*   **In Channels list:** `Gmail (Inbound)` and `Gmail (Outbound)` as distinct logical channels.
*   **In Identities:** Multiple IDs allowed (`gmail-bot-01`, `gmail-bot-02`).
*   **Inbound:**
    *   Watch inbox labels (or search query).
    *   Parse opportunities/replies using incremental sync (last message ID).
*   **Outbound:**
    *   Send drafts only (initially).
    *   Rate-limit per identity.
    *   Rotate identities to distribute risk.

### Flow 3: Identity Rotation & Safety
*   When blocked/expired, UI shows “Reconnect needed”.
*   Scheduler skips work until connected.
*   Scout checks `channel_status` before scraping.

---

## D) Data Contracts (API)

**Endpoints:**
*   `GET /api/channels`
*   `POST /api/channels/:id/confirm`
*   `POST /api/channels/:id/pause`
*   `POST /api/channels/:id/test`
*   `GET /api/identities`
*   `POST /api/identities`
*   `POST /api/identities/:id/assign`
*   `GET /api/sessions` (Channel + Identity rows)

**Core Types:**

```typescript
type Channel = {
  id: "trademe" | "upwork" | "fiverr" | "gmail_in" | "gmail_out" | string;
  label: string;
  type: "public" | "session" | "api";
  status: "connected" | "unknown" | "expired" | "blocked" | "rate_limited";
  identityId?: string;
  lastSeenAt?: string;
  lastConfirmedAt?: string;
  nextRunAt?: string;
};
```

---

## E) Build Plan

1.  **Phase 1 (MVP UI):** Dashboard + Channels + Confirm/Test actions. (Sessions list read-only).
2.  **Phase 2:** Identities CRUD + Assign Identity + Reconnect flows.
3.  **Phase 3:** Leads + Rollups + Scheduler controls.
