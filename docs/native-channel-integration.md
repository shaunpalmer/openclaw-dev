# Native Channel Integration — Research Notes

> How to make plugin channels appear alongside WhatsApp/Telegram/Discord in the OpenClaw Control UI.

**Date:** 12 Feb 2026  
**OpenClaw version:** v2026.2.9 (33c75cb)  
**Source files examined:**
- `dist/extensionAPI.js` — plugin API, `registerChannel()` implementation
- `dist/subsystem-DPnkvS73.js` — `CHAT_CHANNEL_ORDER`, `CHAT_CHANNEL_META`, registry
- `dist/plugins-B-QGH1FX.js` — `listChannelPlugins()`, `listPluginChannels()`
- `dist/plugin-auto-enable-DQyu7G4e.js` — `buildChannelUiCatalog()`
- `dist/gateway-cli-DqCmx-9c.js` — `channels.status` RPC handler
- `dist/control-ui/assets/index-BeKTXH1m.js` — UI rendering (`Qp()`, `Yp()`, `ip()`)
- `extensions/discord/index.ts` + `src/channel.ts` — built-in channel example

---

## The Big Finding

**Plugin channels CAN appear natively in the Channels page.**

OpenClaw's plugin API exposes `api.registerChannel()`. Any channel registered through this call flows through the same pipeline as WhatsApp, Telegram, Discord — and the Control UI has a **generic card renderer** (`Yp()`) that handles any channel type not in the hardcoded 8.

This means: no separate UI app, no iframe hacks, no custom console page. The channels just show up.

---

## Full Data Pipeline

### Server Side

```
1. Plugin calls api.registerChannel({ plugin: channelPluginObject })
       ↓
2. extensionAPI.js → registry.channels.push({ pluginId, plugin, dock, source })
       ↓
3. listPluginChannels() → registry.channels.map(entry => entry.plugin)
       ↓
4. listChannelPlugins() → dedupe + sort by meta.order (custom channels get 999)
       ↓
5. buildChannelUiCatalog(plugins) → { order, labels, detailLabels, systemImages, entries }
       ↓
6. channels.status RPC handler assembles payload:
   {
     channelOrder: [ids],
     channelMeta: [{ id, label, detailLabel, systemImage? }],
     channelAccounts: { [id]: [accountSnapshots] },
     channels: { [id]: { configured, running, connected } }
   }
```

### Client Side (Control UI)

```
7. client.request("channels.status") → channelsSnapshot
       ↓
8. ip(snapshot) merges channelOrder + channelMeta + channelAccounts into unified list
       ↓
9. Qp(channelId, props, data) → switch/case per channel:
   - case "whatsapp": → qp() (WhatsApp-specific card)
   - case "telegram": → Wp()
   - case "discord":  → Np()
   - ...
   - default:         → Yp() ← GENERIC CARD RENDERER
```

---

## The Generic Card Renderer (`Yp`)

Any channel not in the hardcoded switch/case gets rendered by `Yp()`. It shows:

- **Card title** — from `channelMeta` label (resolved via `Zp()`)
- **Card subtitle** — "Channel status and configuration."
- **Account count** badge (if >1 account)
- **Status list:**
  - Configured: Yes / No / n/a
  - Running: Yes / No / n/a
  - Connected: Yes / No / n/a
- **Error callout** — if `lastError` is set

This is exactly the same card pattern used by WhatsApp/Telegram but without the channel-specific extras (QR code, bot token fields, etc.).

---

## Channel List Assembly (`ip`)

The `ip()` function builds the final channel list from three sources:

```js
function ip(e) {
  const t = new Set;
  for (const i of e.channelOrder ?? [])    t.add(i);  // from channelOrder
  for (const i of e.channelMeta ?? [])     t.add(i.id); // from channelMeta
  for (const i of Object.keys(e.channelAccounts ?? {})) t.add(i); // from accounts
  // ... dedupes and returns [{id, label, accounts}]
}
```

So even if a channel only appears in `channelAccounts` or only in `channelMeta`, it'll show up.

---

## Built-in Channel Extension Structure

Examined: `extensions/discord/`

```
extensions/discord/
  index.ts               → plugin entry point
  openclaw.plugin.json   → { "id": "discord", ... }
  package.json           → { "name": "discord", ... }
  src/
    channel.ts           → exports discordPlugin: ChannelPlugin<ResolvedAccount>
    runtime.ts           → runtime bindings
```

### Entry point pattern (`index.ts`)

```ts
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { discordPlugin } from "./src/channel.js";

const plugin = {
  id: "discord",
  name: "Discord",
  description: "Discord channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    api.registerChannel({ plugin: discordPlugin });
  },
};

export default plugin;
```

### ChannelPlugin object shape (full, from Discord)

The `ChannelPlugin` type is extensive. Discord's implementation includes:

- `id` — channel identifier
- `meta` — label, detailLabel, blurb, systemImage, order
- `onboarding` — setup wizard adapter
- `pairing` — user pairing/approval
- `capabilities` — chatTypes, polls, reactions, threads, media
- `streaming` — coalesce settings
- `reload` — config prefix triggers
- `configSchema` — JSON schema for channel config section
- `config` — account resolution functions:
  - `listAccountIds(cfg)` → string[]
  - `resolveAccount(cfg, accountId)` → resolved account object
  - `defaultAccountId(cfg)` → string
  - `isConfigured(account)` → boolean
  - `isEnabled(account, cfg)` → boolean
  - `describeAccount(account)` → summary
  - `setAccountEnabled(...)` → config mutation
  - `deleteAccount(...)` → config cleanup
- `security` — DM policy, warnings
- `groups` — mention requirements, tool policy
- `messaging` — target normalization, resolver
- `directory` — peer/group listing
- `status` — probeAccount, auditAccount, buildChannelSummary

**Most of these are optional.** The minimal required shape is much smaller.

---

## Minimal ChannelPlugin Shape (for Channel Manager)

For our channels (reddit, trademe, seek, etc.) which are scraper/session-tier channels — not real-time chat channels — we need a much simpler object:

```ts
const channelPlugin = {
  id: "reddit",
  meta: {
    id: "reddit",
    label: "Reddit",
    detailLabel: "Reddit Scraper",
    blurb: "Lead scouting on Reddit.",
    order: 100,  // after built-in channels (0-7)
  },
  config: {
    listAccountIds: (cfg: any) => ["default"],
    resolveAccount: (cfg: any, accountId: string) => ({
      accountId,
      enabled: true,
    }),
    defaultAccountId: (cfg: any) => "default",
    isConfigured: (account: any) => true,
  },
  status: {
    buildChannelSummary: async ({ account }: any) => ({
      configured: true,
      running: false,
      connected: false,  // updated from our DB
    }),
  },
};
```

### What shows up in the UI with this:

A native card in the Channels page:

```
┌─────────────────────────────────┐
│ Reddit                          │
│ Channel status and configuration│
│                                 │
│ Configured    Yes               │
│ Running       No                │
│ Connected     No                │
│                                 │
└─────────────────────────────────┘
```

### Wiring status from our SQLite DB

The `buildChannelSummary` function is called when the UI requests `channels.status`. We can read our session DB to return real status:

```ts
buildChannelSummary: async ({ account }) => {
  const session = db.getSession(channelId);
  return {
    configured: true,
    running: false,
    connected: session?.status === 'connected',
    lastError: session?.status === 'expired' ? 'Session expired' : undefined,
  };
},
```

---

## Server-Side: `channels.status` RPC Handler

The handler in `gateway-cli-DqCmx-9c.js`:

1. Calls `listChannelPlugins()` to get all registered channel plugins
2. Calls `buildChannelUiCatalog(plugins)` to build UI metadata
3. For each plugin, calls `buildChannelAccounts(plugin.id)` which:
   - Gets account IDs via `plugin.config.listAccountIds(cfg)`
   - Resolves each account via `plugin.config.resolveAccount(cfg, accountId)`
   - Optionally probes via `plugin.status.probeAccount()`
   - Builds account snapshots
4. Calls `plugin.status.buildChannelSummary()` for the channel-level summary
5. Assembles the payload with `channelOrder`, `channelMeta`, `channels`, `channelAccounts`
6. Responds via WebSocket RPC

---

## Key Constants

### CHAT_CHANNEL_ORDER (built-in, hardcoded)

```ts
const CHAT_CHANNEL_ORDER = [
  "telegram",    // order 0
  "whatsapp",    // order 1
  "discord",     // order 2
  "googlechat",  // order 3
  "slack",       // order 4
  "signal",      // order 5
  "imessage",    // order 6
];
```

Note: `nostr` appears in the UI's `Vp()` default list but not in this server-side constant. It's registered as a separate extension.

### CHAT_CHANNEL_ALIASES

```ts
const CHAT_CHANNEL_ALIASES = {
  imsg: "imessage",
  "google-chat": "googlechat",
  gchat: "googlechat",
};
```

### Sorting

`listChannelPlugins()` sorts by:
1. `meta.order` if set
2. `CHAT_CHANNEL_ORDER.indexOf(id)` if in the hardcoded list
3. `999` for all other channels (plugin channels)
4. Alphabetical by `id` as tiebreaker

So our channels will appear **after** the built-in 7, sorted alphabetically.

---

## Plugin Registry Structure

```ts
const registry = {
  plugins: [],
  tools: [],
  hooks: [],
  typedHooks: [],
  channels: [],      // ← our registerChannel() calls land here
  providers: [],
  gatewayHandlers: {},
  httpHandlers: [],
  httpRoutes: [],
  cliRegistrars: [],
  services: [],
  commands: [],
  diagnostics: [],
};
```

Each `channels[]` entry:
```ts
{
  pluginId: "channel-manager",  // our plugin id
  plugin: channelPluginObject,  // the ChannelPlugin we pass
  dock: undefined,              // optional dock binding
  source: "extensions/channel-manager"
}
```

### normalizeAnyChannelId

This function checks the plugin registry for channel resolution:

```ts
function normalizeAnyChannelId(raw) {
  const key = normalizeChannelKey(raw);
  if (!key) return null;
  return requireActivePluginRegistry().channels.find((entry) => {
    const id = String(entry.plugin.id ?? "").trim().toLowerCase();
    if (id && id === key) return true;
    return (entry.plugin.meta.aliases ?? []).some(
      (alias) => alias.trim().toLowerCase() === key
    );
  })?.plugin.id ?? null;
}
```

This means our channels will be resolvable by ID through the standard channel normalization.

---

## Implementation Plan

### Step 1: Define channel plugin objects

For each of our 8 channels (reddit, trademe, seek, indeed, airtasker, facebook, instagram, youtube), create a minimal `ChannelPlugin` object.

### Step 2: Register in `register(api)`

```ts
register(api) {
  // ... existing tool/CLI/HTTP registrations ...

  for (const channel of DEFAULT_CHANNELS) {
    api.registerChannel({
      plugin: buildChannelPlugin(channel, db),
    });
  }
}
```

### Step 3: Wire `buildChannelSummary` to SQLite

Read session status from our DB to return real connected/configured/running state.

### Step 4: Deploy + restart

Sync to `extensions/channel-manager/`, restart gateway, verify channels appear in Channels page at `http://127.0.0.1:18789`.

---

## Open Questions

1. **Will multiple registerChannel calls from one plugin work?** — The code dedupes by `plugin.id`, not by `pluginId`. So multiple channel registrations from the same extension should work fine.

2. **Can we hook into the card UI beyond the generic renderer?** — Not without modifying the Control UI bundle. The `Yp()` generic card is what we get. For richer UI (confirm buttons, login commands), we still serve our own console page at `/__openclaw__/channel-manager/console`.

3. **probeAccount — should we implement it?** — Optional. If implemented, the UI will show a "last probed" timestamp and call it when the user clicks refresh. Good for session-tier channels where we can check cookie validity.

4. **configSchema — should we define one?** — Yes, eventually. This lets the Config page in the Control UI show editable settings for each channel (URLs, polling intervals, etc.). Not needed for MVP.

---

*Written 12 Feb 2026 — based on source code analysis of OpenClaw v2026.2.9*
