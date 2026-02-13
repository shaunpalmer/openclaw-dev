# Channel Manager for OpenClaw

> Multi‑channel session orchestration, identity control, and operator-grade tooling for OpenClaw.

Channel Manager is a production-ready OpenClaw extension that provides structured control over session-tier platforms (TradeMe, Upwork, Fiverr, Airtasker, Gmail, etc.), identity separation, and deterministic channel status tracking for autonomous agents.

This project was built from real-world implementation experience on Windows with TypeScript and OpenClaw v2026.2.x. The documentation below includes both a public README section and deep technical build notes for developers.

---

## 🚀 What This Plugin Does

Channel Manager introduces a missing infrastructure layer for OpenClaw:

* 🔐 Channel session tracking (connected / unknown / expired)
* 👤 Multi-identity account mapping (bot accounts per channel)
* 🗂 SQLite-backed persistence
* 🧰 CLI tools for operators
* 🌐 HTTP API routes for UI integration
* 🧠 Agent tools that expose `channel_status` to Scout

Instead of blind scraping, agents can:

1. Check `channel_status`
2. Skip disconnected platforms
3. Operate only on verified session channels

This removes guesswork and makes automation deterministic.

---

## 📦 Features

* OpenClaw plugin discovery compatible
* Windows-safe deployment model (no junction pitfalls)
* SQLite session database
* CLI commands:

  * `npx openclaw channel-manager status`
  * `npx openclaw channel-manager confirm <channel>`
* HTTP routes for future UI console
* Structured plugin config via `plugins.entries`

---

## 🛠 Installation (Windows)

1. Clone the repository
2. Install dependencies

   ```bash
   npm install
   ```
3. Build (if using dist-first strategy)

   ```bash
   npm run build
   ```
4. Sync into OpenClaw extensions directory

   ```powershell
   scripts/sync.ps1
   ```
5. Enable in `~/.openclaw/openclaw.json`

   ```json
   {
     "plugins": {
       "entries": {
         "channel-manager": { "enabled": true, "config": {} }
       }
     }
   }
   ```
6. Verify:

   ```bash
   npx openclaw plugins list
   ```

You should see:

```
Channel Manager | channel-manager | loaded
```

---

## 🔄 Connecting Channels

For each platform (e.g., TradeMe, Upwork, Gmail):

```bash
npx openclaw browser open <url> --profile openclaw
```

Log in manually using the bot identity.

Then confirm:

```bash
npx openclaw channel-manager confirm <channel>
```

Check status:

```bash
npx openclaw channel-manager status
```

Channels move from `unknown` → `connected`.

---

## 🧱 Architecture Overview

Channel Manager provides three core layers:

### 1. Identity Layer

Bot accounts per channel.
Supports future multi-login per platform.

### 2. Session Layer

Tracks:

* last login
* channel status
* expiry hints

### 3. Agent Interface Layer

Exposes tools so Scout checks `channel_status` before scraping.

This prevents automation from running against expired sessions.

---

## 📁 Recommended Repo Structure

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
    index.js
  scripts/
    sync.ps1
    sync.sh
```

---

## ⚙️ Build Strategy

### Option A — Dist-first (recommended for distribution)

* Compile to `dist/`
* Point `openclaw.plugin.json` to `dist/index.js`
* Predictable runtime behavior

### Option B — TypeScript entry (local dev)

* Manifest points to `index.ts`
* Faster iteration
* Slightly less portable

---

## 🔐 Security Notes

OpenClaw plugins execute arbitrary code.

Best practices:

* Keep dependencies minimal
* Avoid runtime code downloads
* Document all filesystem paths used
* Store session DB locally

---

# ---

# Developer Notes (Deep Technical Documentation)

The following section documents real build learnings and Windows-specific pitfalls encountered during development.

---

# OpenClaw plugin development notes (Windows + TypeScript)

## Why this doc exists

We hit multiple non-obvious pitfalls while building a local OpenClaw plugin (`channel-manager`). This is a reusable checklist to avoid repeating the same pain for future plugins.

### Current status (working baseline)

* Plugin is installed, discovered, and **loaded**: `Channel Manager | channel-manager | loaded | ~/.openclaw/extensions/channel-manager/index.ts | 0.1.0`
* Gateway is running; **SQLite DB active**; **6 tools registered**
* CLI works (e.g. `npx openclaw channel-manager status` shows channels)
* HTTP API routes are live
* Channel statuses show `unknown` until session-tier sites are connected (manual login + confirm)

---

## Key learnings (the “gotchas”)

### 1) OpenClaw discovers plugins by scanning directories

OpenClaw discovery scans:

1. `plugins.load.paths`
2. `<workspace>/.openclaw/extensions/`
3. `<configDir>/extensions/`
4. bundled `extensions/`

Rule: plugin must exist as a **real directory** and contain `openclaw.plugin.json`.

---

### 2) Windows junctions may be skipped

`dirent.isDirectory()` may return false for junctions.

Use real directories under `extensions/`.

---

### 3) Avoid linking single entry files

`plugins install --link index.ts` can mis-derive plugin ID.

Prefer directory-based discovery.

---

### 4) Config shape must match plugin ID

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

---

### 5) Dependencies are isolated

Local plugins do not inherit OpenClaw deps.
Install or bundle explicitly.

---

### 6) Use robocopy instead of Copy-Item -Exclude

PowerShell recursive exclude is unreliable.
