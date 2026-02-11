# OpenClaw Plugin Development Notes (Windows + TypeScript)

## Why this doc exists

We hit multiple non-obvious pitfalls while building a local OpenClaw plugin (`channel-manager`). This is a reusable checklist to avoid repeating the same pain for future plugins.

### Current status (working baseline)

* Plugin is installed, discovered, and **loaded**: `Channel Manager | channel-manager | loaded | ~/.openclaw/extensions/channel-manager/index.ts | 0.1.0`
* Gateway is running; **SQLite DB active**; **6 tools registered**
* CLI works (e.g. `npx openclaw channel-manager status` shows channels)
* HTTP API routes are live
* Channel statuses show `unknown` until session-tier sites are connected (manual login + confirm)

---

## Key learnings (the "gotchas")

### 1) OpenClaw discovers plugins by scanning directories

OpenClaw discovery scans these paths (in order):

1. `plugins.load.paths` (custom config extra paths)
2. `<workspace>/.openclaw/extensions/`
3. `<configDir>/extensions/` → `C:\Users\<you>\.openclaw\extensions\`
4. bundled OpenClaw `extensions/`

**Rule:** a plugin must exist as a **directory** inside a scanned path and contain `openclaw.plugin.json` at the root.

---

### 2) Windows junctions/symlinks can be invisible

On Windows, OpenClaw's directory discovery uses `readdirSync({ withFileTypes: true })` and checks `dirent.isDirectory()`.

**Junctions may return `isDirectory() === false`**, so OpenClaw skips the plugin.

✅ Works: real directory copy under `~/.openclaw/extensions/<pluginId>/`
❌ Often fails: junction/symlink into `extensions/`

**Practical fix:** develop in `~/.openclaw/plugins/<pluginId>/` but deploy by **copy/sync** into `~/.openclaw/extensions/<pluginId>/`.

---

### 3) The CLI `plugins install --link <file>` can derive the wrong plugin ID

Linking to `index.ts` (a file) can cause the plugin ID to resolve as **`index`** (filename-derived) instead of your intended folder/plugin ID.

**Rule:** avoid installing by linking a single entry file. Prefer:

* directory-based discovery under `extensions/<pluginId>/`
* manifest-first identification via `openclaw.plugin.json`

---

### 4) Config shape is strict: `plugins.entries` is keyed by plugin ID

OpenClaw expects config:

```json
{
  "plugins": {
    "entries": {
      "channel-manager": {
        "enabled": true,
        "config": {}
      }
    }
  }
}
```

**Rule:** the key in `plugins.entries` must match:

* plugin manifest id
* the directory name under `extensions/`

Mismatch = discovered but not enabled / not persisted.

---

### 5) Local plugins do NOT automatically share OpenClaw's dependencies

We hit `@sinclair/typebox` missing.

**Rule:** treat local plugins as standalone packages:

* install deps inside the plugin directory, or
* bundle to `dist/` (recommended for portability)

---

### 6) PowerShell `Copy-Item -Exclude` is unreliable for recursive excludes

We attempted `Copy-Item -Recurse -Exclude node_modules` but `node_modules` still copied.

✅ Use `robocopy` for deterministic sync.

---

### 7) CLI registration callback signature

Built-in plugins use destructured `({ program })` not bare `(program)`:

```typescript
// ✅ Correct
api.registerCli(({ program }) => {
  const cmd = program.command("my-plugin").description("...");
}, { commands: ["my-plugin"] });

// ❌ Wrong — causes "program.command is not a function"
api.registerCli((program) => {
  const cmd = program.command("my-plugin").description("...");
}, { commands: ["my-plugin"] });
```

### 8) package.json `name` field is used as `idHint`

OpenClaw's `deriveIdHint()` reads `package.json` name to cross-check against the manifest `id`. If they differ, you get a warning:

> plugin id mismatch (manifest uses "X", entry hints "Y")

**Rule:** keep `package.json` name identical to `openclaw.plugin.json` id, or at minimum use `@scope/<id>` format (like built-in plugins use `@openclaw/<id>`).

---

## Recommended plugin layout

```
~/.openclaw/
  plugins/
    channel-manager/              # dev location
      openclaw.plugin.json
      package.json
      tsconfig.json
      sync.ps1
      index.ts
      src/                        # optional subfolder
      dist/                       # compiled output (optional)
      node_modules/
  extensions/
    channel-manager/              # deploy location (must be real dir)
      openclaw.plugin.json
      package.json
      index.ts (or dist/index.js)
      node_modules/               # deps must be here too
```

---

## "Gold path" process to build a plugin

### Step 0 — Choose plugin ID

Pick a stable ID, e.g. `channel-manager`.

Use it consistently for:

* folder name under `extensions/`
* `openclaw.plugin.json` → `"id"`
* `package.json` → `"name"`
* `openclaw.json` → `plugins.entries.<id>`

---

### Step 1 — Create plugin skeleton

Inside `~/.openclaw/plugins/<pluginId>/`:

* `openclaw.plugin.json` — must contain `"id"` matching folder name
* `package.json` — must contain `"openclaw": { "extensions": ["./index.ts"] }`
* `index.ts` — default export with `{ id, name, description, configSchema, register(api) }`

**Manifest must be at plugin root.**

Minimal `openclaw.plugin.json`:

```json
{
  "id": "channel-manager",
  "name": "Channel Manager",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Minimal `package.json`:

```json
{
  "name": "channel-manager",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "index.ts",
  "openclaw": {
    "extensions": ["./index.ts"]
  }
}
```

---

### Step 2 — Install dependencies locally

If you use libraries (e.g. TypeBox, better-sqlite3), install them inside the plugin folder:

```bash
cd ~/.openclaw/plugins/channel-manager
npm install @sinclair/typebox better-sqlite3
npm install -D @types/better-sqlite3
```

Alternative: bundle everything into `dist/`.

---

### Step 3 — Deploy into extensions as a REAL directory

Because junctions can be skipped on Windows, copy/sync into:

`C:\Users\<you>\.openclaw\extensions\<pluginId>\`

#### Recommended: `robocopy` sync (Windows)

```powershell
$src = "C:\Users\User\.openclaw\plugins\channel-manager"
$dst = "C:\Users\User\.openclaw\extensions\channel-manager"

robocopy $src $dst /MIR /XD node_modules .git dist .cache .turbo /XF sync.ps1 /NFL /NDL /NJH /NJS /NP

# Ensure deps are installed in deploy location
if (-not (Test-Path "$dst\node_modules\better-sqlite3")) {
    Push-Location $dst
    npm install --production 2>&1 | Out-Null
    Pop-Location
    Write-Host "Installed dependencies" -ForegroundColor Yellow
}

Write-Host "Synced -> extensions" -ForegroundColor Green
```

Notes:

* `/MIR` keeps deploy in sync (mirrors deletes too)
* `/XD` actually excludes directories reliably (unlike PowerShell `-Exclude`)
* `/XF` excludes specific files
* Deps installed separately in the deploy location

---

### Step 4 — Enable plugin in config

Edit `C:\Users\User\.openclaw\openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "channel-manager": {
        "enabled": true,
        "config": {
          "dbPath": "~/.openclaw/channel-manager/sessions.db",
          "browserProfile": "openclaw",
          "sessionCheckInterval": "1h"
        }
      }
    }
  }
}
```

---

### Step 5 — Validate discovery

Run:

```powershell
$env:PATH += ";F:\openclaw\npm-global"
npx openclaw plugins list
```

If the plugin does not appear:

* confirm it is a **real directory** under `extensions/` (not junction)
* confirm `openclaw.plugin.json` is present at root
* confirm folder name matches plugin id

---

### Step 6 — Validate runtime load

Start OpenClaw and confirm:

* `[plugins] <name> plugin loaded — tools: ...`
* no `[plugins] plugin CLI register failed` errors
* no `plugin not found` config validation errors

If runtime fails:

* check entrypoint (TS vs JS)
* check module format (CJS vs ESM — match built-in plugins)
* check missing deps (`Cannot find module '...'`)

---

## Dependency + build notes (Windows reality)

### Node native deps (e.g., `better-sqlite3`)

If your plugin uses native Node modules (like `better-sqlite3`), you must ensure the runtime can resolve them at load time.

**What we observed:**

* The plugin loaded cleanly when `node_modules` existed under the deployed `~/.openclaw/extensions/<id>/` directory.
* PowerShell `Copy-Item -Recurse -Exclude` *still copied* `node_modules`, which masked dependency issues.
* A naive `robocopy /XD node_modules` sync would break the plugin unless you install deps in the deployed copy.

**Two sane strategies:**

1. **Install deps in the deployed extensions copy** (simple, reliable)

   * Sync source files (excluding `node_modules`)
   * Then run `npm install --production` in `~/.openclaw/extensions/<id>/`
   * Best when you're iterating quickly and want parity with OpenClaw's discovery location.

2. **Bundle to `dist/` and minimize runtime deps** (best long-term)

   * Compile TS to JS and bundle where possible.
   * Note: native modules like `better-sqlite3` cannot be fully bundled, but you can reduce everything else.
   * Keep `openclaw.plugin.json` pointing at `dist/index.js`.

---

## Plugin SDK API reference (what we used)

Based on built-in plugin source code analysis:

### Tools

```typescript
api.registerTool({
  name: "tool_name",
  label: "Human Label",
  description: "What it does",
  parameters: Type.Object({ /* TypeBox schema */ }),
  async execute(_toolCallId, params) {
    return { content: [{ type: "text", text: "result" }] };
  },
}, { name: "tool_name" });
```

### CLI

```typescript
api.registerCli(({ program }) => {
  const cmd = program.command("my-command").description("...");
  cmd.command("sub").description("...").action(() => { /* ... */ });
}, { commands: ["my-command"] });
```

### HTTP Routes

```typescript
api.registerHttpRoute({
  path: "/__openclaw__/my-plugin/api/endpoint",
  handler: (_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ data: "..." }));
  },
});
```

### Lifecycle Hooks

```typescript
api.on("gateway_start", () => { /* runs on startup */ });
api.on("gateway_stop", () => { /* runs on shutdown */ });
```

### Plugin Config

```typescript
const pluginConfig = api.pluginConfig ?? {};
const dbPath = api.resolvePath(pluginConfig.dbPath || "~/.openclaw/my-plugin/data.db");
```

### Logging

```typescript
api.logger.info("message");
api.logger.warn("message");
api.logger.error("message");
```

---

## Next steps after "plugin loaded"

### A) Connect session-tier channels (manual login + confirm)

Goal: move channels from `unknown` → `connected` so Scout can trust `channel_status` before scraping.

Suggested operator flow (repeat per site):

1. Open a browser session using OpenClaw's profile:
   * `npx openclaw browser open <url> --profile openclaw`
2. Log in manually with the **bot identity** for that channel.
3. Confirm inside Channel Manager:
   * `npx openclaw channel-manager confirm <channel>`
4. Re-check:
   * `npx openclaw channel-manager status`

Practical notes:

* Do one channel end-to-end first (e.g., TradeMe) to validate the loop.
* Expect occasional re-auth and build a "Reconnect" operator habit.

### B) Build the Channel Manager UI (the "9 screens")

This is the big remaining work. Build it as an operator console that sits on top of the plugin's HTTP API.

Minimal UI order (ship value fast):

1. **Dashboard** (connected channels, new leads today, failures)
2. **Channels** (list + Connect/Confirm/Test + status)
3. **Identities** (bot accounts mapped to channels)
4. **Sessions** (last login, expiry hints, reconnect button)
5. **Scheduler** (intervals, pause, backoff)
6. **Leads** (feed + dedupe + notes)
7. **Rollups & Retention** (30-day hot store + cold archive)
8. **Audit Log** (who/what/when)
9. **Settings** (paths, notifier hooks)

### C) Wire Scout to channel_status

Once channels are `connected`, the Scout flow becomes deterministic:

* check `channel_status`
* if connected → run adapter
* if not connected → skip + notify

---

## Debug checklist (fast)

### Plugin not listed

* Is it under `~/.openclaw/extensions/<id>/` as a **real dir** (not junction)?
* Is `openclaw.plugin.json` at root?
* Does folder name match the manifest id?

### Listed but not enabled

* Does `openclaw.json` contain `plugins.entries.<id>.enabled=true`?
* Is `<id>` exactly identical (case + hyphen)?

### Enabled but crashes

* Missing dependency → install locally or bundle
* Wrong entrypoint → point to `dist/index.js` if needed
* ESM/CJS mismatch → align with built-in plugin format
* CLI callback → use `({ program })` not `(program)`

---

## Operational notes

* Prefer **file-based "dev" + copy "deploy"** on Windows.
* Keep a `sync.ps1` in each plugin repo to update `extensions/` quickly.
* Treat third-party plugins as untrusted; inspect before running.
* Gateway restart required after plugin code changes (sync then restart).

---

## Packaging this as a reusable GitHub project

If you want other devs to plug this into their setup, package it like a normal TS library **plus** an OpenClaw extension.

### Goals

* Clone → install → build → copy into `~/.openclaw/extensions/<id>/` → works.
* Minimal "it depends where your node_modules are" surprises.
* Clear versioning and upgrade path.

### Recommended repo structure

```
channel-manager-openclaw/
  README.md
  LICENSE
  openclaw.plugin.json
  package.json
  tsconfig.json
  src/
    index.ts
  dist/
    index.js            # built output (gitignored or committed—your call)
  scripts/
    sync.ps1
    sync.sh
  .github/
    workflows/
      ci.yml
```

### Build + runtime strategy (pick one)

**Option A — "Dist-first" (recommended for distribution)**

* Build to `dist/` and point `openclaw.plugin.json` to `dist/index.js`.
* Keep TS source for contributors.
* Pros: predictable runtime.
* Cons: you must publish a build artifact (commit dist, or release artifacts).

**Option B — "TS entry" (fine for local dev, less portable)**

* Keep `openclaw.plugin.json` pointing to `index.ts`.
* Pros: simplest while hacking.
* Cons: relies on OpenClaw's TS runtime assumptions; more brittle across versions.

### Dependency strategy (especially native deps)

If you use native deps (e.g., `better-sqlite3`):

* Don't try to "bundle" native deps.
* Instead ensure `npm ci` runs in the deployed extensions folder.

Recommended approach for users:

* Provide a sync/install script that:
  1. copies the plugin directory into `~/.openclaw/extensions/<id>`
  2. runs `npm ci` (or `npm install`) in that deployed folder

### Installation instructions (Windows)

1. Clone repo
2. `npm install`
3. `npm run build` (if dist-first)
4. Run `scripts/sync.ps1` which:
   * mirrors repo → `C:\Users\<you>\.openclaw\extensions\<id>`
   * runs `npm ci` in the deployed folder
5. Add/verify `plugins.entries.<id>.enabled=true` in `openclaw.json`
6. `npx openclaw plugins list` → confirm `loaded`

### Installation instructions (macOS/Linux)

Same idea, but use `scripts/sync.sh` and deploy to:

* `~/.openclaw/extensions/<id>/`

### Versioning + releases

* Use semver: `0.x` while stabilizing, `1.0` when API/manifest stable.
* Tag releases and attach a zip artifact of the plugin directory (recommended):
  * includes `openclaw.plugin.json`, `package.json`, `dist/`, `scripts/`

### CI (GitHub Actions) checklist

* Node LTS matrix
* `npm ci`
* `npm run build`
* basic smoke test (e.g., import plugin entry)
* optional: lint + typecheck

### Licensing

* Pick a permissive license if you want adoption (MIT/Apache-2.0).

### Security posture (important)

Because OpenClaw plugins can execute code:

* Keep the plugin minimal and auditable.
* Avoid auto-downloading code at runtime.
* Document exactly what the plugin touches (filesystem paths, network domains, DB files).

---

*Written 12 Feb 2026 — based on real build experience with channel-manager plugin on OpenClaw v2026.2.9 (33c75cb), Windows 10, Node.js 22.16.0.*
