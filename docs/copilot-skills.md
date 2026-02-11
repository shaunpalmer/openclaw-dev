# Copilot Skills — AYS Checklist

> **Single source of truth for all agent skills.**
> Consolidated from 29 scattered files. Read top to bottom.

---

## Table of Contents

1. [Core Discipline](#1-core-discipline)
2. [AYS Architecture](#2-ays-architecture)
3. [Drafts & Hydration](#3-drafts--hydration)
4. [Room Composition](#4-room-composition)
5. [Code Quality](#5-code-quality)
6. [Testing](#6-testing)
7. [Bug Scanning](#7-bug-scanning)
8. [Performance](#8-performance)
9. [Documentation](#9-documentation)
10. [Tools & Workflow](#10-tools--workflow)
11. [Code Excellence](#11-code-excellence)
12. [Answer Quality](#12-answer-quality)
13. [Playwright](#13-playwright)
14. [Chrome DevTools](#14-chrome-devtools)
15. [Error Recovery](#15-error-recovery)
16. [Migration & Schema Safety](#16-migration--schema-safety)
17. [Debugging Strategy](#17-debugging-strategy)

---

## 1. Core Discipline

### 1.1 Read the Repo First

**Purpose:** Stop freestyling — read the repo before proposing code.

**Before ANY code change, you MUST:**

1. Locate the relevant source files
2. Read enough context to understand current behaviour
3. Identify the single source of truth for the affected state
4. Confirm existing patterns (naming, structure, style)

**Process:**

```
1. IDENTIFY entry points → where does user interaction start?
2. IDENTIFY state ownership → who owns this data? Where is it stored?
3. FIND the single source of truth → don't create competing sources
4. CONFIRM current behaviour → read code, add logging if needed
5. PATCH minimally → one change at a time, preserve structure
6. RE-CHECK → verify fix doesn't break related code
```

**After reading, before proposing code, state:**

1. Files involved
2. Current behaviour
3. Root cause
4. Proposed fix (minimal patch description)

**Hard Rules:**

| DO | DON'T |
|----|-------|
| Search for existing files before creating | Invent file paths that don't exist |
| Read actual file content before proposing edits | Guess class names, selectors, hooks, or IDs |
| Prefer minimal diffs over sweeping changes | Propose "from scratch" rewrites when a patch works |
| Preserve existing code style and patterns | Assume function signatures without reading them |
| Verify DOM IDs and selectors exist before using them | Refactor unrelated code while fixing a bug |

---

### 1.2 Patch Discipline

**Purpose:** Prevent spaghetti patches — add one small change at a time with proper guards.

**Core Rules (Non-Negotiable):**

1. **NEVER create duplicates** — no V2, New, Copy, Backup suffixes. No "alternative" implementations. Update the canonical file.

2. **SEARCH FIRST, always** — before ANY change, search the codebase for existing patterns. If you're about to create something, ask: "Does this already exist? Where should it live?"

3. **PATCH, don't replace** — extend existing modules, don't create parallel ones.

4. **One change at a time** — make a single logical change, verify before the next.

5. **Add guards, not assumptions:**
   ```javascript
   // ❌ Bad: assumes x exists
   x.doSomething();

   // ✅ Good: guards against undefined
   if (!x) return;
   x.doSomething();
   ```

6. **Add instrumentation first** — before "big" changes, add logging. Verify assumptions with console output. Remove debug logging after fix confirmed.

**Decision Flow:**

```
User request arrives
       │
       ▼
┌─────────────────────────┐
│ SEARCH: Does this exist?│
└───────────┬─────────────┘
     ┌──────┴──────┐
    YES            NO
     │              │
     ▼              ▼
  PATCH         Ask: "Create new?"
  existing      or find nearest file
```

| NEVER DO | DO INSTEAD |
|----------|------------|
| Create `fileV2.js` | Update `file.js` |
| Create `newUtils.js` | Extend existing utils |
| Duplicate a function | Refactor original to be reusable |
| Output full new files | Output diffs/patches |
| Refactor while fixing a bug | Separate concerns |

---

### 1.3 Debug Protocol

**Purpose:** Repeatable debugging recipe.

**Process (follow this order):**

```
1. REPRO STEPS    → Can you reproduce the bug? What exact sequence?
2. EXPECTED vs ACTUAL → What should happen? What does happen?
3. SOURCE OF TRUTH → Where is this data supposed to come from?
4. LOG BOUNDARIES  → Log inputs and outputs at key functions
5. EVENT FLOW     → Are events firing in the right order with the right data?
6. DATA SHAPE     → Is the data structure what you expect?
7. PATCH          → Fix at the source, not the symptom
8. RETEST         → Does the fix work? Did it break anything else?
```

**Logging Template:**

```javascript
console.log('[DEBUG] functionName:', {
  input: inputValue,
  state: currentState,
  timestamp: Date.now()
});
```

**Rules:** Reproduce before fixing. Log at boundaries. Fix at the source. Remove debug logging after fix confirmed. Never guess. Never add multiple fixes at once.

---

### 1.4 UI-State Contracts

**Purpose:** UI reflects state, never defines it.

```
STATE is the source of truth
UI is a REFLECTION of state
UI events TRIGGER state changes
State changes CAUSE UI updates
```

**Flow:**

```
USER ACTION → EVENT → UPDATE STATE → RE-RENDER UI → PERSIST
```

**Hard Rules:**

```javascript
// ✅ State-driven: update state FIRST, then render
this.serviceType = newType;   // State
this.renderServiceTabs();      // UI reflects state
this.saveSnapshot();           // Persist

// ❌ UI-first: reading state FROM the DOM
const activeTab = document.querySelector('.tab.active').dataset.tab;

// ❌ Cosmetic-only: UI changed, state not updated
tab.classList.add('active');
```

**On hydration (loading saved data), ALL of these must happen:**

1. Set internal state (mode, config, form data)
2. Update UI controls (tabs, dropdowns, room list, form fields)
3. Update labels (mode-dependent: "Office" not "Bedroom")
4. Update progress indicators (bars, badges)

Skip any step → UI/state desync.

---

### 1.5 Safe Refactoring

**Purpose:** Extract step-by-step. Preserve behaviour.

**Process:**

```
1. IDENTIFY what to extract
2. WRITE test for current behaviour (if missing)
3. EXTRACT to new function/module
4. VERIFY tests still pass
5. SHOW diff: before → after
6. COMMIT separately from feature work
```

| Safe | Dangerous |
|------|-----------|
| Extract function | Rewrite from scratch |
| Rename variable | Change data structure |
| Move to new file | Merge unrelated code |
| Split large function | Change public API |

**Never:** Refactor + bug fix in same commit. "While I'm here..." → Stop, separate change.

---

## 2. AYS Architecture

### 2.1 Core Principles

1. **Offline-First** — All features MUST work without network.
   ```
   User action → Local state → Local persistence → (Later) Sync
   ```
   Never block user actions waiting for network.

2. **Device-Local Data** — Drafts live on the device, not the server. Sync is eventual, not immediate.

3. **Single Source of Truth** — every piece of data has ONE authoritative source:

   | Data | Source of Truth |
   |------|----------------|
   | Active draft | `DraftManager.activeDraftId` |
   | Quote type | `draft.serviceType` |
   | Form state | `draft.snapshot` |
   | Sync status | `draft.syncStatus` |

4. **State → UI (never reverse)** — UI tabs do not define truth, they reflect truth. Mode changes are events that must be persisted. Hydration must update both internal state AND visible UI controls.

---

### 2.2 Persistence Rules

**Persistence Layers:**

| Layer | Technology | Use For | Survives |
|-------|------------|---------|----------|
| Primary | IndexedDB | Drafts, sync queue | App restart, phone lock |
| Secondary | localStorage | Preferences, flags | App restart |
| Runtime | Memory | Active state | Nothing (volatile) |

**Autosave Triggers:**

| Trigger | Debounce | What Saves |
|---------|----------|------------|
| Checkbox change | 800ms | `payload.progress[itemId]` |
| Field input | 1000ms | Customer/address fields |
| Settings change | Immediate | `propertyConfig` |
| Mode switch | Immediate | `serviceType` |
| `visibilitychange` (hidden) | Immediate | Full state |
| `pagehide` | Immediate | Full state |
| `beforeunload` | Immediate | Full state |

**Lifecycle saves are critical — no debounce:**

```javascript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) saveImmediately();
});
window.addEventListener('pagehide', saveImmediately);
window.addEventListener('beforeunload', saveImmediately);
```

**Retention:** Synced drafts → delete after 14 days. Unsynced stale → delete after 30 days.

---

### 2.3 Mode Switching Contract

**Core Rule:** Mode changes that alter structure require explicit handling.

| From | To | Change Type | Action |
|------|----|-------------|--------|
| Residential | EOT | Cosmetic | Switch OK, add EOT tasks |
| Residential | Commercial | **Structural** | Prompt: New draft |
| Commercial | Residential | **Structural** | Prompt: New draft |
| EOT | Residential | Cosmetic | Switch OK, remove EOT tasks |
| EOT | Commercial | **Structural** | Prompt: New draft |

**Structural change with dirty draft → PROMPT:**

```javascript
this.showModeSwitchPrompt({
  message: `Start a new ${newMode} quote?`,
  options: [
    { label: 'Start New', action: () => this.createNewDraft(newMode) },
    { label: 'Copy Client Details', action: () => this.createNewDraft(newMode, { copyClient: true }) },
    { label: 'Cancel', action: () => {} }
  ]
});
```

**Never:** Silently mutate draft structure. Allow bedrooms in commercial mode. Allow offices in residential mode.

---

## 3. Drafts & Hydration

### 3.1 Draft State Machine

**States:**

```
┌──────────┐
│  draft   │ ← New/editing (not sent)         🟡 Amber
└────┬─────┘
     │ Send/Sync
     ▼
┌──────────┐
│ syncing  │ ← In-flight to server            🔵 Blue
└────┬─────┘
     │ Success / Failure
     ▼
┌──────────┐     ┌──────────┐
│  synced  │     │  error   │                  🟢 Green / 🔴 Red
└──────────┘     └──────────┘
```

**Valid Transitions:**

```javascript
const VALID_TRANSITIONS = {
  'draft':   ['syncing'],
  'syncing': ['synced', 'error'],
  'synced':  ['draft'],   // User edits synced draft
  'error':   ['syncing', 'draft']  // Retry or edit
};
```

---

### 3.2 Draft Database Schema

**Database:** `ays_quotes` → **Object Store:** `drafts`

```javascript
{
  draftId: string,           // UUID, primary key
  createdAt: ISO timestamp,
  updatedAt: ISO timestamp,
  syncStatus: 'draft' | 'syncing' | 'synced' | 'error',
  syncedAt: ISO timestamp | null,

  // Customer
  customerFirstName: string,
  customerLastName: string,
  address: string,
  phone: string,
  email: string,

  // Settings (structural)
  serviceType: 'end-of-tenancy' | 'residential' | 'commercial',
  propertyType: string,
  propertyConfig: object,

  // Form state
  snapshot: {
    progress: {},           // itemId → checked
    variantSelections: {},  // checkboxId → variant
    customItems: [],
    notes: {},
    rooms: []
  }
}
```

**Meta Store:** `{ key: 'activeDraftId', value: UUID }`

**Rules:** Support 50+ drafts. Sort by `updatedAt DESC`. Confirm before deleting unsynced. Track `createdAt` and `updatedAt` separately. Reset status to `draft` when editing synced draft.

---

### 3.3 Hydration Contract (Sacred)

Loading a draft MUST perform ALL steps in order:

```
1. SET MODE        → setJobType(payload.mode)         ← MODE FIRST
2. REBUILD ROOMS   → base_room + addons for that mode
3. APPLY PAYLOAD   → rooms, client, notes, progress, variants
4. RECALC TOTALS   → pricing, hours
5. RENDER          → UI updates LAST
```

**What Must Hydrate:**

| Component | What Updates |
|-----------|-------------|
| Service tabs | Correct tab `.is-active` |
| Property dropdown | Correct option selected |
| Room counters | Numbers match config |
| Room list | Correct rooms generated |
| Room labels | Mode-appropriate names |
| Task checkboxes | Checked state restored |
| Variant dropdowns | Selections restored |
| Customer fields | Name/phone/address filled |
| Progress bars | Reflect actual progress |

**Skip a step → what breaks:**

| Skip | You Get |
|------|---------|
| Step 1 (mode) | Wrong rooms for mode |
| Step 2 (rooms) | 3-item rooms (no base) |
| Step 3 (payload) | Empty form |
| Step 4 (totals) | Wrong prices |
| Step 5 (render) | Stale UI |

**Anti-patterns:** "Patch labels only" (cosmetic fix, state wrong). Update UI without state (desync). Update state without UI (desync). Partial hydration. Never let form win — state wins.

---

### 3.4 Offline-First

**The user can complete an entire quote without network.**

```
Opens app (may be offline) → Creates/loads quote → Completes walkthrough
→ Calculates quote → Shows customer → Saves locally
→ (Later, when online) → Syncs to server
```

**What works offline:** Create, load, edit, check/uncheck, calculate, save, show — everything except sync.

**Sync Queue Pattern:**

```javascript
async function queueForSync(event) {
  await eventQueue.add({
    id: crypto.randomUUID(),
    type: event.type,
    payload: event.payload,
    createdAt: Date.now(),
    status: 'pending'
  });
  if (navigator.onLine) attemptFlush();
}
window.addEventListener('online', attemptFlush);
```

---

## 4. Room Composition

### 4.1 The Rule

**Every room = `base_room` + category addons.** This is composition, not inheritance.

```javascript
// ✅ CORRECT: base + specific
const tasks = [
  ...taskRegistry.base_room,      // 12 items
  ...taskRegistry.bedroom_addons  // 3 items
]; // = 15 items

// ❌ BUG: only room-specific tasks
const tasks = taskRegistry.bedroom_addons; // = 3 items (the "3-item rooms" bug)
```

### 4.2 Task Registry

| Task Set | Contents |
|----------|----------|
| `base_room` | Dust surfaces, vacuum floors, empty bins, clean windows |
| `bedroom_addons` | Change bedding, clean under bed, wardrobe interior |
| `bathroom_addons` | Clean toilet, clean shower/tub, clean mirrors |
| `kitchen_addons` | Clean appliances, degrease surfaces, clean sink |
| `office_addons` | Wipe desks, clean monitors, organize cables |
| `eot_addons` | Deep clean skirting, inside cupboards, wall marks |

### 4.3 Mode → Room Mapping

**Residential/EOT:**

| Room Kind | Labels |
|-----------|--------|
| `bedroom` | Bedroom 1, Bedroom 2... |
| `bathroom` | Bathroom 1... |
| `kitchen` | Kitchen |
| `living` | Living Room |
| `laundry` | Laundry |

**Commercial:**

| Room Kind | Labels |
|-----------|--------|
| `office` | Office 1, Office 2... |
| `bathroom` | Bathroom 1... |
| `kitchen` | Kitchen/Kitchenette |
| `reception` | Reception |
| `boardroom` | Boardroom |
| `warehouse` | Warehouse |

**Critical:** `serviceType` determines room set. Commercial → offices, NOT bedrooms. Always dedupe tasks by ID after composition. Regenerate rooms when `serviceType` changes.

---

## 5. Code Quality

### 5.1 Code Review

**Every change gets a mental review before commit. Check these:**

**Structure:**
- One responsibility per function. No god functions.
- Prefer clarity over clever. No nested ternary hell.
- If over 50 lines → probably split it.
- Copy-pasted block → extract to shared function.

**Naming & Constants:**
- Magic numbers → named constants. Magic strings → constants.
- Names describe what it IS, not what it does temporarily.

```javascript
// ❌ Magic
if (retries > 3) { ... }

// ✅ Named
const MAX_RETRIES = 3;
if (retries > MAX_RETRIES) { ... }
```

**Diff Review (before pushing):**

| Check | What to Look For |
|-------|-----------------|
| Unintended changes | Files you didn't mean to touch |
| Debug leftovers | `console.log`, `debugger`, `TODO` |
| Hardcoded values | URLs, credentials, magic numbers |
| Error handling | Every `async` has `try/catch`, every `querySelector` has null check |
| State consistency | State updated AND UI updated (never one without the other) |
| Cache version | Bumped if any cached asset changed |
| Naming | No dashes, consistent casing within file |

---

### 5.2 Design Patterns

Name the pattern before writing the code. Pick the **simplest pattern that solves the problem** — don't use a Factory when a function will do.

**SOLID (Non-Negotiable):**

| Principle | Rule | Violation Smell |
|-----------|------|----------------|
| **S**ingle Responsibility | One job per class/function | "and" in a function description |
| **O**pen/Closed | Extend, don't modify | `if (type === 'x')` chains growing |
| **L**iskov Substitution | No fake inheritance | Subclass overrides parent method to no-op |
| **I**nterface Segregation | Small, focused interfaces | Class forced to implement unused methods |
| **D**ependency Inversion | High-level owns low-level | Import of concrete class deep inside logic |

**Creational Patterns:**

| Pattern | When to Use | Example in This Codebase |
|---------|-------------|-------------------------|
| **Factory** | Create objects without specifying exact class | `buildChecklistConfigFor(serviceType)` — returns different room sets per type |
| **Singleton** | One instance globally, controlled access | `DraftManager` — one manager owns all draft state |
| **Builder** | Complex object needs step-by-step construction | Quote payload assembly — customer, rooms, items, settings |

**Structural Patterns:**

| Pattern | When to Use | Example |
|---------|-------------|--------|
| **Adapter** | Wrap old interface to fit new one | `getVariantOptions(key)` normalises `floor_variants` → `floor_types` |
| **Facade** | Simplify complex subsystem behind one call | `saveDraft()` hides IndexedDB transaction, validation, autosave debounce |
| **Decorator** | Add behaviour without changing original | Adding EOT tasks on top of base residential tasks |

**Behavioural Patterns:**

| Pattern | When to Use | Example |
|---------|-------------|--------|
| **Observer** | Notify many components when state changes | Event listeners on `serviceType` change → rebuild rooms |
| **Strategy** | Swap algorithm at runtime | Room composition: different item sets for residential vs. commercial |
| **State** | Object behaviour changes with internal state | Draft state machine: `draft` → `syncing` → `synced` / `error` |
| **Command** | Encapsulate action as object (undo, queue) | Sync queue entries — each is a command to replay |

**When NOT to use a pattern:**
- The code is < 30 lines → just write a function
- Only one implementation exists → no interface needed
- You can't name the problem the pattern solves → you're cargo-culting

**Layered Architecture (N-Tier):**

Organise code from database at the bottom to UI at the top. Dependencies point **downward only**.

```
┌─────────────────────────────────────────────────┐
│  PRESENTATION (top)                             │
│  UI components, event handlers, DOM rendering   │
│  checklist-modern.html, AysListItemCheckbox,    │
│  AysDisclosureCard, populateVariantDropdown()   │
├─────────────────────────────────────────────────┤
│  APPLICATION / SERVICE                          │
│  Orchestration, workflows, state coordination   │
│  DraftManager, QuoteManager, service-worker.js  │
├─────────────────────────────────────────────────┤
│  DOMAIN / BUSINESS LOGIC                        │
│  Rules, validation, config, composition         │
│  buildChecklistConfigFor(), ROOM_DEFINITIONS,   │
│  ITEM_DEFINITIONS, getVariantOptions()          │
├─────────────────────────────────────────────────┤
│  DATA ACCESS (bottom)                           │
│  Persistence, queries, storage I/O              │
│  IndexedDB transactions, localStorage,          │
│  saveDraft(), sync queue, PHP endpoints         │
└─────────────────────────────────────────────────┘
```

**Downward flow (user action → storage):**
```
User clicks checkbox
  → Presentation: event handler fires
    → Application: DraftManager.autosave()
      → Domain: validate, build snapshot
        → Data Access: IndexedDB put()
```

**Upward flow (storage → UI rebuild):**
```
IndexedDB read / page load
  → Data Access: getDraft()
    → Domain: buildChecklistConfigFor(serviceType)
      → Application: DraftManager.hydrate()
        → Presentation: render rooms, restore checkboxes
```

**Rules:**
| Rule | Why |
|------|-----|
| UI never calls IndexedDB directly | Skipping layers = spaghetti |
| Data access never touches DOM | Separation of concerns |
| Domain logic has zero DOM imports | Must be testable in isolation |
| Each layer has a clear public interface | Swappable, mockable |
| Cross-layer calls go through the layer above/below | No skipping (UI → Data Access) |

---

### 5.3 Config Management

- One source for all config. No hard-coded values.
- Secrets only via environment variables or vault.
- Validate on load. Fail fast.

```javascript
// ✅ Correct
const apiUrl = config.API_URL;

// ❌ Forbidden
const apiUrl = "https://api.example.com";
```

---

### 5.4 Dependencies

- No importing third-party libs unless listed and justified.
- All deps version-pinned (no `^` or `~`).
- No global requires. No `eval("require")`.

---

### 5.5 Security Audit

**Proactive scanning — run before every push.**

**Auto-scan for these patterns:**

| Pattern | Action |
|---------|--------|
| `password`, `token`, `key`, `secret` (hardcoded) | Flag, move to `.env` |
| `console.log` with sensitive data | Remove before prod |
| `innerHTML` with user input | Replace with `textContent` |
| `eval()` or `Function()` constructor | Remove, find alternative |
| SQL string interpolation | Use parameterised queries |
| Exposed file paths in client code | Redact or remove |
| CORS `*` wildcard | Restrict to known origins |

**Input/Output Rules:**
- Validate all inputs — type, length, range
- Escape all outputs — HTML entities, SQL params
- Secrets go in `.env` — never commit, never log
- CSRF tokens on every form submission (already in auth system)
- Rate limiting on auth endpoints (already implemented)

**On violation:** Stop. Flag the line. Suggest fix. Don't push until resolved.

**PHP-specific (our auth system):**
- Session fixation: `session_regenerate_id(true)` on login ✅
- Password hashing: bcrypt via `password_hash()` ✅
- CSRF: token per session, validated on POST ✅
- Rate limiting: IP-based, 5 failures → 15-min lockout ✅

---

### 5.6 Naming

- Variables/functions: `camelCase` or `snake_case` — either is fine, stay consistent within a file.
- Classes/types: `PascalCase`
- Constants: `SCREAM_CASE`
- **NEVER `kebab-case`** for identifiers — no dashes in variable names, function names, or object keys.
- No `i`, `x`, `foo` — spell it out (except `url`, `id`).
- Rename only what's asked. Log old → new.

---

### 5.7 Commits

```
<type>: <imperative subject under 70 chars, no period>

<body: explain WHY, not what>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

```
✅ fix: stop hydration skipping base_room tasks
✅ feat: add draft list to Manage Quotes tab
❌ update
❌ fixed the thing
❌ changes 2/1/26
```

---

### 5.8 SQL / Query Discipline

- Every SQL string lives in `./queries/<name>.sql` — nothing inline.
- Execute via `QueryRunner.run('name', params)`.
- No string interpolation in SQL — use parameterised queries.

---

## 6. Testing

### 6.1 Rules

- If you touch it — test it.
- Write test BEFORE implementation when possible.
- Unit: 1 file = 1 test file.
- Cover happy path + edge cases + sad path.

| Change Type | Required Tests |
|-------------|---------------|
| New function | Unit test |
| Bug fix | Regression test |
| Refactor | Existing tests pass |
| New feature | Unit + integration |

### 6.2 Edge Cases to Cover

| Category | Test For |
|----------|----------|
| Empty | null, undefined, [], '', 0 |
| Boundaries | min, max, off-by-one |
| Invalid | wrong type, missing field |
| Async | timeout, rejection, race |
| State | dirty, clean, transitioning |

### 6.3 Structure

```javascript
describe('ModuleName', () => {
  describe('functionName', () => {
    it('should do X when Y', () => {
      // Arrange → Act → Assert
    });
  });
});
```

**Before commit:** `npm test` (all green), coverage above 80%.

---

## 7. Bug Scanning

**Purpose:** Proactively find bugs before they ship. Run before every push.

### 7.1 Pre-Push Checklist

```
1. node syntax-check.js        → parser validation
2. node parse-check.js         → structural validation
3. Grep for common bug patterns → see below
4. If all clean → reaper push
```

### 7.2 Bug Patterns to Scan For

| Pattern | Why It's a Bug | Fix |
|---------|---------------|-----|
| `== null` or `== undefined` | Loose equality misses cases | Use `=== null` or `=== undefined` |
| `.length` without null check | TypeError on null/undefined | Guard: `if (!arr \|\| !arr.length)` |
| `addEventListener` without `removeEventListener` | Memory leak on re-render | Store reference, remove on cleanup |
| `setTimeout` / `setInterval` without clear | Orphaned timers | Store ID, clear on teardown |
| `async` function without `try/catch` | Unhandled rejection | Wrap in try/catch or `.catch()` |
| `querySelector` result used without null check | TypeError | Guard: `const el = qs(sel); if (!el) return;` |
| String concatenation in DOM (`+=`) | XSS risk + performance | Use `textContent` or template |
| `for...in` on array | Iterates prototype properties | Use `for...of` or `.forEach()` |
| Floating point comparison (`=== 0.3`) | IEEE 754 imprecision | Use epsilon: `Math.abs(a - b) < 0.001` |
| Event handler in loop without closure | All handlers share last value | Use `let` not `var`, or bind |

### 7.3 PWA-Specific Bugs

| Pattern | Why It's a Bug |
|---------|---------------|
| `fetch()` without offline fallback | Breaks offline-first |
| Cache version not bumped after asset change | Users get stale files |
| `localStorage` for large data (>5MB) | Quota exceeded on mobile |
| No `visibilitychange` save handler | Data lost on phone lock |
| Service worker caching `.php` files | Dynamic pages served stale |

---

## 8. Performance

**Purpose:** This is a PWA running on phones at job sites. Battery, memory, and network matter.

### 8.1 Rendering

| Rule | Why |
|------|-----|
| Batch DOM writes | Avoid layout thrashing |
| Use `documentFragment` for lists | One reflow instead of N |
| Debounce input handlers (800ms+) | Don't fire on every keystroke |
| Use `requestAnimationFrame` for visual updates | Sync with paint cycle |
| Avoid `offsetHeight` / `getBoundingClientRect` in loops | Forces synchronous layout |

### 8.2 Memory

| Rule | Why |
|------|-----|
| Remove event listeners on component teardown | Prevent leaks |
| Nullify large object references when done | Allow GC |
| Don't cache DOM node references across re-renders | Stale references |
| Limit IndexedDB transaction scope | Release locks faster |
| Keep drafts list under 50 without cleanup overhead | UI responsiveness |

### 8.3 Network & Storage

| Rule | Why |
|------|-----|
| Service worker: cache-first for static assets | Instant load offline |
| Autosave debounce: 800-1500ms | Battery + write amplification |
| Sync queue: batch, don't fire per-item | Reduce network calls |
| Compress payloads before sync | Reduce data on mobile |
| Clean up synced drafts after 14 days | Free storage |

### 8.4 Mobile-Specific

| Rule | Why |
|------|-----|
| Touch targets: minimum 44x44px | Fat finger compliance |
| No hover-dependent UI | Touch devices don't hover |
| Handle `visibilitychange` + `pagehide` | Phone lock / app switch |
| Test on slow 3G | Job sites have poor signal |
| Keep JS bundle under 500KB | First paint speed |

---

## 9. Documentation

**Purpose:** Document decisions, not obvious code. Future-you (and future-agents) need context.

### 9.1 When to Document

| Trigger | What to Write | Where |
|---------|---------------|-------|
| Architectural decision | Why we chose X over Y | `docs/` folder |
| Non-obvious bug fix | What broke, root cause, fix | Commit message body |
| New canonical interface | Function signature + usage | JSDoc in the source file |
| Breaking change | What changed, migration path | `docs/` folder |
| Session with major changes | Summary of what was done | Agent memory |

### 9.2 What NOT to Document

- Obvious code (`// increment counter` above `counter++`)
- Temporary debug notes (remove after fix)
- Full file rewrites (the diff IS the documentation)
- Things that change weekly (docs go stale fast)

### 9.3 Code Comments

```javascript
// ✅ Good: explains WHY
// Hard-guard: return null instead of stale config to prevent
// bedrooms leaking into commercial mode (see docs/ui-sync.md)
if (!config) return null;

// ❌ Bad: explains WHAT (obvious from the code)
// Check if config is null and return null
if (!config) return null;
```

### 9.4 JSDoc for Canonical Interfaces

```javascript
/**
 * Get variant options for a dropdown by key.
 * Normalises legacy keys (floor_variants → floor_types).
 * @param {string} key - Variant key from VARIANTS registry
 * @returns {Array<{value: string, label: string}>} Options array
 */
function getVariantOptions(key) { ... }
```

### 9.5 Agent Memory

Update `.agent-memory/memory.md` when:
- Major feature completed
- Architecture changed
- Key decisions made that future sessions need
- Cache version bumped
- New files created or deleted

---

## 10. Tools & Workflow

### 10.1 Git Routine (Reaper)

**When to use:** After completing any logical unit of work — a fix, a feature, cleanup, or config change. Don't let work pile up uncommitted.

**Process:**

```
1. VERIFY    → syntax checks pass, no broken code
2. MESSAGE   → imperative, describes what changed
3. REAPER    → commit + push in one shot
```

**Commands:**

```powershell
# Quick commit (no push)
powershell -File tools/reaper.ps1 -Message "description"

# Commit + push (standard routine)
powershell -File tools/reaper.ps1 -Message "description" -Push
```

**What reaper does:** Stages all changes (`git add -A`), commits with timestamped message, optionally pushes. Auto-sets upstream on first push.

**Message rules:**
- Imperative: "fix", "add", "remove", "consolidate" — not "fixed", "added"
- Describe the change, not the session
- Under 70 chars

**Examples:**

```powershell
# ✅ Good
-Message "fix reaper.ps1 - call git directly"
-Message "consolidate 29 skill files into single copilot-skills.md"
-Message "auth system + variant registry + hard-guard"

# ❌ Bad
-Message "update"
-Message "changes"
-Message "WIP"
```

**When NOT to reaper:**
- Syntax checks fail
- You're mid-change (half the edit done)
- You haven't tested the change

---

### 10.2 GitHub Routine (MCP)

**When to use:** PRs, issues, repo workflows — anything that talks to GitHub.

**Pre-flight:** Always reaper (commit + push) local changes before any GitHub operation. Never create a PR with uncommitted work.

**PR Creation:**

```
1. Reaper push local changes
2. Create PR against main
3. Title prefix: [FE] frontend, [BE] backend, [INFRA] tooling
4. Description: What changed, Why, Testing steps
5. Squash merge preferred
```

**Issue Management:**

- Bug reports → `create_issue` with `bug` + `triage` labels
- Include repro steps and file references
- Search before creating (no duplicates)

**Common Triggers:**

| User Says | Action |
|-----------|--------|
| "Create a PR" | Reaper push, then `create_pull_request` |
| "What are my open issues?" | `list_issues` filtered by assignee |
| "Log this as a bug" | `create_issue` with labels |
| "What PRs are open?" | `list_pull_requests` state=open |
| "Merge that PR" | `merge_pull_request` (squash) |

**Rules:** Push before PR. Label issues. Reference issue numbers in PRs. Don't merge without review. Don't leave PRs open 7+ days.

---

### 10.3 QMD Search

**When to use:** Find architecture decisions, prior session notes, implementation details, or design rationale across 1,000+ markdown files without reading every one.

**Commands:**

```bash
# Search a specific collection (fastest)
qmd search "hydration contract" -c docs -n 10

# Search all collections
qmd search "offline sync rules"

# Narrow results
qmd search "room composition" -c docs -n 5
```

**Collections:**

| Collection | Files | Contains |
|------------|-------|----------|
| `docs` | 78 | Architecture, specs, session notes, implementation plans |
| `ays-premium` | 517 | Premium plugin docs |
| `superclean-plugins` | 404 | Plugin ecosystem docs |
| `leadstream` | 5 | Lead management docs |

**When to search (triggers):**

| Situation | Search For |
|-----------|-----------|
| About to change a system you haven't touched | `qmd search "system name"` — check for prior decisions |
| User asks "why does X work this way?" | `qmd search "X"` — find the original spec |
| Debugging a reoccurring pattern | `qmd search "bug pattern"` — check lessons learned |
| Before creating a new doc | `qmd search "topic"` — ensure it doesn't already exist |
| Need implementation context | `qmd search "feature name" -c docs` — find the spec |

**Rules:**
- Search BEFORE answering questions about architecture or history
- Use `-c docs` for this project's docs (fastest, most relevant)
- Use broad search (no `-c`) when unsure which collection has it
- Results include file path + matched snippets — follow up with `read_file` if needed
- BM25 keyword search works reliably; semantic/vector search may stall on Windows

---

### 10.4 Skill Authoring (meta)

**When to use:** Creating or updating skills in THIS file. One file, no sprawl.

**Rules:**

1. **ALL skills live in `copilot-skills.md`** — never create separate SKILL.md files or skill subfolders.
2. **Add a section, not a file** — new skill = new numbered section in this document.
3. **Update the TOC** — add the new section to the Table of Contents at the top.
4. **Concise is key** — only add context an AI doesn't already have. Challenge each paragraph: "Does this justify its token cost?"
5. **Examples over explanations** — show a code snippet instead of writing three sentences about what to do.
6. **Imperative form** — "Check for...", "Run...", "Validate..." — not "You should check for..."

**Section Template:**

```markdown
## N. Section Name

**Purpose:** One sentence.

### N.1 Sub-topic

| Rule | Why |
|------|-----|
| Do X | Because Y |

### N.2 Another sub-topic

\`\`\`javascript
// Show, don't tell
\`\`\`
```

**Validation before commit:**
- [ ] Added to Table of Contents?
- [ ] Section number is sequential?
- [ ] No duplicate content with existing sections?
- [ ] Under 100 lines for this skill? (split into sub-sections if longer)
- [ ] Examples are concrete, not generic?

---

## 11. Code Excellence

**Purpose:** Not "it works" — it works WELL. Push past the first solution to the right solution.

### 11.1 The Quality Bar

| Level | Description | Accept? |
|-------|-------------|--------|
| Broken | Doesn't run | Never |
| Works | Produces correct output | **Not enough** |
| Works Well | Clean, maintainable, handles edges | Minimum bar |
| Elegant | Simple, obvious, hard to misuse | Target |

Before committing, ask: "Would I be proud to code-review this?" If no — fix it first.

### 11.2 Lazy Patterns to Reject

| Lazy Pattern | Do This Instead |
|---|---|
| Copy-paste with minor tweaks | Extract shared function with parameters |
| Nested ternary | `if/else` or early return |
| Boolean parameter changing behaviour | Two separate functions |
| Catch-all `try/catch` that swallows errors | Specific handling per failure mode |
| Returning mixed types (`string \|\| null \|\| undefined`) | One failure signal, documented |
| "Works on my machine" fix | Reproduce conditions, fix root cause |
| 200-line function | Split at responsibility boundaries |
| `any` type / untyped | Explicit types — use JSDoc if not TS |

### 11.3 The Right Abstraction

Don't reach for a pattern — reach for the **simplest** one that solves the problem:

```
1. Can a plain function do it?           → function
2. Does it need state?                   → object / class
3. Does it need multiple implementations? → strategy / factory
4. Does it need lifecycle management?     → full component
```

Over-engineering is as bad as under-engineering. A 10-line utility doesn't need a class, a factory, and a registry.

### 11.4 Proactive Eye

When reading code to fix X, if you notice Y:

| What You See | Do This |
|---|---|
| Dead code | Flag: "Found unused function at line N" |
| Inconsistent naming | Note it, offer fix in separate commit |
| Missing null guard | Add it if directly related to the fix |
| Performance anti-pattern | Flag with specific fix suggestion |
| Duplicated logic | Note extraction opportunity |

Don't silently walk past problems. Don't "while I'm here" fix them either — **flag them**, let the user decide.

### 11.5 Code Smell Responses

```javascript
// ❌ "It works" level — swallows the problem
try {
  await db.put(draft);
} catch (e) {
  console.log('save failed');
}

// ✅ "Works well" level — handles it properly
try {
  await db.put(draft);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    await cleanupOldDrafts();
    await db.put(draft); // retry once
  } else {
    console.error(`Draft save failed: ${e.name}`, e);
    saveFallbackToLocalStorage(draft);
  }
}
```

---

## 12. Answer Quality

**Purpose:** Beat the LLM default. Be specific, opinionated, and useful — not safe and generic.

### 12.1 Anti-Mediocrity Rules

| Default LLM Tendency | Do This Instead |
|---|---|
| "There are several approaches..." | Pick the best one. Explain why. |
| "You could use X or Y" | "Use X because [reason]. Y doesn't fit here because [reason]." |
| Generic code sample | Code that uses THIS project's patterns, naming, structure |
| Explaining what code does | Explaining WHY the code was written this way |
| Safe non-committal hedge | Commit to an approach. Be wrong sometimes — that's fine. |
| Boilerplate-heavy response | Tight, minimal, zero fluff |
| "Here's a comprehensive solution..." | Here's the MINIMUM change to fix this properly |
| Restating the question back | Just answer it |

### 12.2 Specificity Over Safety

```javascript
// ❌ Generic (any LLM would say this)
// "Consider adding error handling to your async functions"

// ✅ Specific (knows THIS codebase)
// DraftManager.save() needs a try/catch wrapping the
// IndexedDB transaction — if the store is mid-upgrade,
// put() throws InvalidStateError and the draft is
// silently lost. Catch → retry once → fallback to
// localStorage snapshot.
```

Every suggestion must reference a **real file, real function, real line** in this codebase — not a hypothetical.

### 12.3 Opinionated Defaults

When the user doesn't specify preference:

1. Pick the approach that matches existing codebase patterns
2. Pick the simpler option over the "theoretically correct" one
3. Pick the option that's easier to undo if wrong
4. State what you picked and why — user can override

**Never:** "It depends" without then picking one. "Both are valid." "You could go either way."

### 12.4 No Padding

Every sentence earns its place or gets cut:

- No "Great question!" or "That's an interesting point"
- No restating the question back
- No "Let me explain..." — just explain
- No "In conclusion..." — if you're done, stop
- No listing things the user already knows
- No "I'll now use the X tool" — just use it

### 12.5 The "So What" Test

Before including any piece of information, ask: **"So what? Does the user need this to act?"**

```
❌ "JavaScript has both == and === operators for comparison."
   So what? User knows this.

✅ "Line 47: use === instead of == — loose equality lets
   undefined slip through as null here."
   Actionable, specific, references a line.
```

---

## 13. Playwright

**Purpose:** Browser automation and end-to-end testing. Use for testing the PWA in real browser conditions.

### 13.1 When to Use

| Scenario | Tool |
|----------|------|
| Test a full user flow (login → create quote → save) | Playwright test |
| Verify UI renders correctly after code change | Playwright screenshot comparison |
| Test offline behaviour | Playwright with `context.setOffline(true)` |
| Test on mobile viewport | Playwright with device emulation |
| Automate repetitive browser tasks | Playwright script |

### 13.2 Test Structure

```javascript
import { test, expect } from '@playwright/test';

test.describe('Quote Creation', () => {
  test('should save draft on checkbox change', async ({ page }) => {
    await page.goto('/checklist/checklist-modern.html');

    // Arrange: select residential
    await page.selectOption('#service-type', 'residential');

    // Act: check a cleaning item
    await page.click('[data-item-id="dust_surfaces"]');

    // Assert: draft saved in IndexedDB
    const saved = await page.evaluate(async () => {
      const db = await openDB('ays_quotes');
      const drafts = await db.getAll('drafts');
      return drafts.length > 0;
    });
    expect(saved).toBe(true);
  });
});
```

### 13.3 Key Patterns

| Pattern | Code |
|---------|------|
| Wait for network idle | `await page.waitForLoadState('networkidle')` |
| Wait for element | `await page.waitForSelector('.checklist-item')` |
| Test offline | `await context.setOffline(true)` |
| Mobile viewport | `await page.setViewportSize({ width: 375, height: 812 })` |
| Screenshot | `await page.screenshot({ path: 'test.png', fullPage: true })` |
| Intercept requests | `await page.route('**/api/**', route => route.fulfill({ body: '{}' }))` |
| Test service worker | `const sw = await context.serviceWorkers()[0]` |

### 13.4 PWA-Specific Tests to Write

- [ ] Service worker registers and caches shell assets
- [ ] App works offline after first load
- [ ] Draft persists across page reload
- [ ] Mode switch (residential → commercial) rebuilds rooms correctly
- [ ] Floor type dropdown populates with all 9 options
- [ ] Autosave fires on checkbox change
- [ ] Login redirects unauthenticated users

---

## 14. Chrome DevTools

**Purpose:** Live browser inspection via MCP. Debug rendering, performance, and DOM issues without leaving the editor.

### 14.1 Available Tools

| Tool | What It Does | When to Use |
|------|-------------|-------------|
| `evaluate_script` | Run JS in the live page | Read DOM state, test fixes, inspect variables |
| `performance trace` | Record Core Web Vitals | Diagnose slow renders, layout thrashing |
| `performance_analyze_insight` | Drill into specific perf issue | LCP breakdown, document latency |
| `snapshot` | Accessibility tree capture | Check element structure, verify ARIA |
| `screenshot` | Visual capture of page/element | Before/after comparison, bug evidence |
| `click` / `fill` / `select_option` | Interact with page | Reproduce user flows live |
| `navigate` | Go to URL | Switch between pages |
| `console messages` | Read browser console | Catch runtime errors, warnings |

### 14.2 Debugging Workflow

```
1. REPRODUCE   → Navigate to the page, trigger the issue
2. INSPECT     → Snapshot the DOM, check console for errors
3. DIAGNOSE    → evaluate_script to read state / variables
4. TEST FIX    → evaluate_script to try a fix live
5. IMPLEMENT   → Edit the source file with the confirmed fix
6. VERIFY      → Screenshot / snapshot to confirm
```

### 14.3 Common Recipes

**Check if element exists and is visible:**
```javascript
// evaluate_script
() => {
  const el = document.querySelector('#floor-type-select');
  if (!el) return { found: false };
  const rect = el.getBoundingClientRect();
  return {
    found: true,
    visible: rect.width > 0 && rect.height > 0,
    options: el.options ? el.options.length : 0,
    value: el.value
  };
}
```

**Read IndexedDB draft state:**
```javascript
// evaluate_script
async () => {
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open('ays_quotes');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const tx = db.transaction('drafts', 'readonly');
  const store = tx.objectStore('drafts');
  const all = await new Promise(resolve => {
    store.getAll().onsuccess = e => resolve(e.target.result);
  });
  return { count: all.length, ids: all.map(d => d.draftId) };
}
```

**Performance diagnosis:**
```
1. Start performance trace
2. Trigger the slow action (e.g., mode switch)
3. Stop trace
4. Check for: long tasks, layout shifts, excessive reflows
5. Drill into specific insight (LCPBreakdown, DocumentLatency)
```

### 14.4 Rules

- Always snapshot BEFORE making changes — evidence of the original state
- Check console messages after any page interaction — catch silent errors
- Use `evaluate_script` to verify a fix works BEFORE editing source
- Performance traces: keep recording short (< 10s) and focused on one action
- Screenshots: use for user-facing bug reports and before/after proof

---

## 15. Error Recovery

**Purpose:** Don't just catch errors — recover from them. This is a PWA on job sites with dodgy signal. Losing user data is unacceptable.

### 15.1 Fallback Chain

Every critical operation needs a fallback chain — not just a try/catch that logs and moves on.

```
Primary    → IndexedDB put()
  │ fail
  ▼
Retry      → Wait 500ms, try once more
  │ fail
  ▼
Fallback   → localStorage snapshot (smaller, but data survives)
  │ fail
  ▼
Last Resort → Hold in memory + warn user ("Save pending…")
  │ page unload
  ▼
Emergency  → navigator.sendBeacon() with minimal payload
```

### 15.2 Recovery Patterns

| Error | Recovery | Never Do |
|-------|----------|----------|
| `QuotaExceededError` (IndexedDB) | Clean up synced drafts > 14 days, retry | Silently discard the draft |
| Service worker fetch fail | Return cached response, queue for retry | Show blank page |
| IndexedDB upgrade blocked | Prompt user to close other tabs | Force-close or ignore |
| Sync POST fails (network) | Queue in sync list, retry with backoff | Retry in tight loop |
| JSON parse error on draft | Log corrupted data, offer "start fresh" | Delete without trace |
| `visibilitychange` during save | Immediate flush, no debounce | Trust the debounce timer |

### 15.3 Retry Strategy

```javascript
async function withRetry(fn, { maxAttempts = 3, backoff = 500 } = {}) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt === maxAttempts) throw e;
      await new Promise(r => setTimeout(r, backoff * attempt));
    }
  }
}

// Usage
await withRetry(() => db.put(draft), { maxAttempts: 3, backoff: 500 });
```

### 15.4 Degradation Levels

| Level | State | User Experience |
|-------|-------|----------------|
| Full | Online, IndexedDB working | Everything works normally |
| Offline | No network | All features work, sync queued |
| Storage Pressure | Quota near limit | Old synced drafts auto-cleaned, warning shown |
| Storage Failed | Can't write to IndexedDB | localStorage fallback, urgent warning |
| Critical | Both storage mechanisms full | In-memory only, "Do not close app" banner |

**Rule:** Never let the user lose work silently. If recovery fails, TELL THEM.

---

## 16. Migration & Schema Safety

**Purpose:** Safe upgrades when IndexedDB schema, cache versions, or data structures change. Users on old versions must not lose data.

### 16.1 IndexedDB Version Upgrades

```javascript
const request = indexedDB.open('ays_quotes', newVersion);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const oldVersion = event.oldVersion;

  // Step through each version sequentially
  if (oldVersion < 1) {
    db.createObjectStore('drafts', { keyPath: 'draftId' });
  }
  if (oldVersion < 2) {
    // Add index, don't delete store
    const store = event.target.transaction.objectStore('drafts');
    store.createIndex('syncStatus', 'syncStatus');
  }
  if (oldVersion < 3) {
    // New store for settings
    db.createObjectStore('settings', { keyPath: 'key' });
  }
};
```

**Rules:**

| Rule | Why |
|------|-----|
| Step through versions sequentially (if < 1, if < 2…) | User jumping v1 → v3 must hit all migrations |
| Never delete an object store with data | Data loss |
| Add fields as optional with defaults | Old drafts without the field still load |
| Test upgrade path: v1 → latest | Not just vN → vN+1 |
| Handle `onblocked` event | Other tabs have old connection open |

### 16.2 Backward-Compatible Fields

When adding a new field to drafts:

```javascript
// ✅ Safe: default in the reader, not the schema
function getProductionRate(draft) {
  return draft.productionRate ?? 35; // default for old drafts
}

// ❌ Dangerous: migration that modifies every record
// Don't bulk-update 500 drafts on upgrade — slow, error-prone
```

### 16.3 Service Worker Cache Versioning

```
Current: checklist-shell-v10
```

| Rule | Why |
|------|-----|
| Bump version when ANY cached asset changes | Stale files = broken app |
| Old cache deleted in `activate` event | Free storage |
| Never cache `.php`, `auth/`, `config/`, `storage/` | Dynamic content |
| `skipWaiting()` + `clients.claim()` for immediate activation | User gets new version without manual refresh |
| Test: load app → deploy new SW → reload → verify new assets | Catch SW update bugs |

### 16.4 Data Transformation

When a data structure changes:

```javascript
// Version-gate the transformation
function migrateDraft(draft) {
  // v1 → v2: serviceType was called "mode"
  if ('mode' in draft && !('serviceType' in draft)) {
    draft.serviceType = draft.mode;
    delete draft.mode;
  }
  // v2 → v3: rooms was flat array, now keyed by type
  if (Array.isArray(draft.rooms)) {
    draft.rooms = groupBy(draft.rooms, 'roomType');
  }
  return draft;
}
```

**Sequence:** Read old → Transform → Validate → Write new → Verify. Never transform in-place without a backup read.

---

## 17. Debugging Strategy

**Purpose:** Scientific debugging. Prove the root cause before writing a fix. Stop guessing.

### 17.1 The Method

```
1. REPRODUCE    → Can you make it happen consistently?
                   If not: add logging, narrow conditions

2. ISOLATE      → What's the smallest input that triggers it?
                   Remove variables until only the cause remains

3. HYPOTHESIZE  → State your theory: "X happens because Y"
                   Be specific: which function, which line, which value

4. VERIFY       → Prove your hypothesis BEFORE changing code
                   • Add a console.log that confirms the bad state
                   • Use Chrome DevTools evaluate_script
                   • Read the code path step by step

5. FIX          → Minimal patch. One change that addresses root cause.
                   NOT: "I'll refactor this whole section while I'm here"

6. REGRESSION   → Why did this bug exist? Add a guard so it can't recur.
                   • Null check, type check, assertion, or test
```

### 17.2 Common Traps

| Trap | What Happens | Do This Instead |
|------|-------------|----------------|
| Guess-and-patch | Fix works for wrong reason, real bug surfaces later | Verify hypothesis with logging before changing code |
| Shotgun debugging | Change 5 things, one works, no idea which | One change at a time, test after each |
| "Works now" | Coincidental fix — underlying cause still live | Explain WHY your fix works, not just that it does |
| Blame the framework | "Must be a browser bug" | It's almost never the framework. Check your code. |
| Fix the symptom | Suppress error message instead of fixing cause | Ask: "Why does this error happen?" not "How do I hide it?" |
| "Can't reproduce" | Give up | Add logging, try different browsers, check mobile, check offline |

### 17.3 State Your Diagnosis

Before proposing ANY fix, state:

```
ROOT CAUSE: [What is actually wrong]
EVIDENCE:   [How I proved it — log output, code path, test result]
FIX:        [Minimal change to address root cause]
GUARD:      [What prevents this from recurring]
```

Example from this codebase:
```
ROOT CAUSE: buildChecklistConfigFor() falls through to residential
            when serviceType is undefined, returning bedrooms in
            commercial mode.
EVIDENCE:   Added console.log in catch block — serviceType was
            undefined because draft.serviceType wasn't being read.
FIX:        Hard-guard: return null instead of stale config.
GUARD:      Null check at call site prevents silent fallback.
```

### 17.4 PWA-Specific Debugging

| Symptom | Check First |
|---------|------------|
| Stale UI after code change | Cache version bumped? SW activated? |
| Works on desktop, fails on mobile | Touch events, viewport, `visibilitychange` handling |
| Data gone after refresh | Autosave actually fired? Check IndexedDB directly |
| Feature works then stops | SW serving cached old JS. Hard refresh or bump version. |
| Works online, fails offline | `fetch()` without cache fallback? API call without queue? |
| "Save failed" on phone lock | `visibilitychange` handler missing or debounced too long |

---

*Single source of truth. No sprawl. Last updated: 2026-02-09*
