/**
 * Channel Manager Plugin for OpenClaw
 *
 * Manages browser-based channel sessions, lead storage, and session health.
 *
 * What it does:
 * - Tracks which channels (TradeMe, Reddit, Seek, etc.) have active browser sessions
 * - Provides tools for Scout to check session health before scraping
 * - Stores leads in SQLite (not CSV) with deduplication and search
 * - Provides a session health service that runs periodically
 * - Exposes CLI commands to connect/disconnect/test channels
 * - Exposes HTTP routes for a future Channel Manager UI
 *
 * Architecture:
 * - Sessions live in the browser profile (cookies, localStorage)
 * - This plugin TRACKS session state, it doesn't OWN credentials
 * - Shaun logs in manually via `openclaw browser open <url> --profile openclaw`
 * - Plugin detects login success and records the session
 * - Scout consumes session status via tools before attempting scrapes
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { Type } from "@sinclair/typebox";
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";

// ============================================================================
// Types
// ============================================================================

type ChannelStatus = "connected" | "expired" | "blocked" | "unknown" | "not-configured";

interface ChannelConfig {
  id: string;
  name: string;
  loginUrl: string;
  /** CSS selector or text that indicates a logged-in state */
  loggedInIndicator: string;
  /** CSS selector or text that indicates a login page */
  loginPageIndicator: string;
  /** Check interval override (ms) */
  checkIntervalMs?: number;
  /** URLs this channel monitors */
  monitorUrls: string[];
  tier: "public" | "session" | "not-ready";
}

interface SessionRecord {
  channelId: string;
  status: ChannelStatus;
  lastCheckedAt: string;
  lastAuthenticatedAt: string | null;
  failureCount: number;
  notes: string;
}

interface LeadRecord {
  id?: number;
  timestamp: string;
  source: string;
  title: string;
  url: string;
  budget: string;
  location: string;
  hotLead: boolean;
  notes: string;
}

// ============================================================================
// Default Channel Definitions
// ============================================================================

const DEFAULT_CHANNELS: ChannelConfig[] = [
  {
    id: "reddit",
    name: "Reddit",
    loginUrl: "https://www.reddit.com/login/",
    loggedInIndicator: "user-drawer-button",
    loginPageIndicator: "login-username",
    monitorUrls: [
      "https://www.reddit.com/r/chch/new/",
      "https://www.reddit.com/r/newzealand/new/",
    ],
    tier: "public",
  },
  {
    id: "trademe",
    name: "TradeMe",
    loginUrl: "https://www.trademe.co.nz/a/login",
    loggedInIndicator: "tm-header-authenticated",
    loginPageIndicator: "login_email",
    monitorUrls: [
      "https://www.trademe.co.nz/a/marketplace/services/cleaning/search?region=15",
      "https://www.trademe.co.nz/a/jobs/trades-services/cleaning/search?region=15",
      "https://www.trademe.co.nz/a/jobs/it/web-development/search?region=15",
      "https://www.trademe.co.nz/a/marketplace/computers/services/search?region=15",
    ],
    tier: "session",
  },
  {
    id: "seek",
    name: "Seek NZ",
    loginUrl: "https://www.seek.co.nz/oauth/login/",
    loggedInIndicator: "user-menu",
    loginPageIndicator: "emailAddress",
    monitorUrls: [
      "https://www.seek.co.nz/cleaning-jobs/in-Canterbury?sortmode=ListedDate",
      "https://www.seek.co.nz/web-developer-jobs/in-Canterbury?sortmode=ListedDate",
    ],
    tier: "public",
  },
  {
    id: "indeed",
    name: "Indeed NZ",
    loginUrl: "https://nz.indeed.com/account/login",
    loggedInIndicator: "gnav-header-userinfo",
    loginPageIndicator: "login-email-input",
    monitorUrls: [
      "https://nz.indeed.com/jobs?q=cleaning&l=Christchurch&sort=date",
      "https://nz.indeed.com/jobs?q=web+developer&l=Christchurch&sort=date",
    ],
    tier: "public",
  },
  {
    id: "airtasker",
    name: "Airtasker",
    loginUrl: "https://www.airtasker.com/login/",
    loggedInIndicator: "avatar",
    loginPageIndicator: "login-form",
    monitorUrls: [
      "https://www.airtasker.com/tasks/?location=Christchurch",
    ],
    tier: "session",
  },
  {
    id: "facebook",
    name: "Facebook",
    loginUrl: "https://www.facebook.com/login/",
    loggedInIndicator: "x1iyjqo2",
    loginPageIndicator: "login_form",
    monitorUrls: [],
    tier: "session",
  },
  {
    id: "instagram",
    name: "Instagram",
    loginUrl: "https://www.instagram.com/accounts/login/",
    loggedInIndicator: "coreSpriteDesktopNavProfile",
    loginPageIndicator: "loginForm",
    monitorUrls: [],
    tier: "session",
  },
  {
    id: "youtube",
    name: "YouTube",
    loginUrl: "https://accounts.google.com/ServiceLogin?service=youtube",
    loggedInIndicator: "avatar-btn",
    loginPageIndicator: "identifierId",
    monitorUrls: [],
    tier: "session",
  },
  {
    id: "gmail",
    name: "Gmail",
    loginUrl: "https://accounts.google.com/ServiceLogin?service=mail",
    loggedInIndicator: "gb_71",
    loginPageIndicator: "identifierId",
    monitorUrls: [],
    tier: "session",
  },
  {
    id: "craigslist",
    name: "Craigslist",
    loginUrl: "https://accounts.craigslist.org/login",
    loggedInIndicator: "al",
    loginPageIndicator: "inputEmailHandle",
    monitorUrls: [
      "https://christchurch.craigslist.org/search/jjj?sort=date",
      "https://christchurch.craigslist.org/search/ggg?sort=date",
    ],
    tier: "session",
  },
  {
    id: "fiverr",
    name: "Fiverr",
    loginUrl: "https://www.fiverr.com/login",
    loggedInIndicator: "avatar-decorator",
    loginPageIndicator: "login-container",
    monitorUrls: [
      "https://www.fiverr.com/categories/programming-tech/web-programming",
    ],
    tier: "session",
  },
  {
    id: "gumtree",
    name: "Gumtree",
    loginUrl: "https://www.gumtree.co.nz/login",
    loggedInIndicator: "my-gumtree",
    loginPageIndicator: "login-form",
    monitorUrls: [
      "https://www.gumtree.co.nz/s-jobs/christchurch/v1c9302l3100214p1?sort=date",
      "https://www.gumtree.co.nz/s-services/christchurch/v1c9296l3100214p1?sort=date",
    ],
    tier: "session",
  },
  {
    id: "upwork",
    name: "Upwork",
    loginUrl: "https://www.upwork.com/ab/account-security/login",
    loggedInIndicator: "nav-user",
    loginPageIndicator: "login_username",
    monitorUrls: [
      "https://www.upwork.com/nx/search/jobs/?sort=recency&category2_uid=531770282584862721",
    ],
    tier: "session",
  },
  {
    id: "freelancer",
    name: "Freelancer",
    loginUrl: "https://www.freelancer.com/login",
    loggedInIndicator: "user-avatar",
    loginPageIndicator: "login-email",
    monitorUrls: [
      "https://www.freelancer.com/jobs/website-design/?sort=latest",
      "https://www.freelancer.com/jobs/web-scraping/?sort=latest",
    ],
    tier: "session",
  },
];

// ============================================================================
// Database (SQLite via better-sqlite3)
// ============================================================================

class SessionDB {
  private db: any;

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Dynamic import for better-sqlite3
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        login_url TEXT NOT NULL,
        logged_in_indicator TEXT NOT NULL DEFAULT '',
        login_page_indicator TEXT NOT NULL DEFAULT '',
        tier TEXT NOT NULL DEFAULT 'public',
        monitor_urls TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS sessions (
        channel_id TEXT PRIMARY KEY REFERENCES channels(id),
        status TEXT NOT NULL DEFAULT 'unknown',
        last_checked_at TEXT,
        last_authenticated_at TEXT,
        failure_count INTEGER NOT NULL DEFAULT 0,
        notes TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        source TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        budget TEXT NOT NULL DEFAULT '',
        location TEXT NOT NULL DEFAULT '',
        hot_lead INTEGER NOT NULL DEFAULT 0,
        notes TEXT NOT NULL DEFAULT '',
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
      CREATE INDEX IF NOT EXISTS idx_leads_timestamp ON leads(timestamp);
      CREATE INDEX IF NOT EXISTS idx_leads_hot ON leads(hot_lead) WHERE hot_lead = 1;
      CREATE INDEX IF NOT EXISTS idx_leads_url ON leads(url);

      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        channel_id TEXT,
        action TEXT NOT NULL,
        result TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_log(timestamp);
    `);
  }

  // -- Channel operations --

  upsertChannel(channel: ChannelConfig): void {
    this.db.prepare(`
      INSERT INTO channels (id, name, login_url, logged_in_indicator, login_page_indicator, tier, monitor_urls)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        login_url = excluded.login_url,
        logged_in_indicator = excluded.logged_in_indicator,
        login_page_indicator = excluded.login_page_indicator,
        tier = excluded.tier,
        monitor_urls = excluded.monitor_urls
    `).run(
      channel.id, channel.name, channel.loginUrl,
      channel.loggedInIndicator, channel.loginPageIndicator,
      channel.tier, JSON.stringify(channel.monitorUrls),
    );
  }

  getChannels(): Array<ChannelConfig & { status: ChannelStatus; lastCheckedAt: string | null; lastAuthenticatedAt: string | null; failureCount: number }> {
    return this.db.prepare(`
      SELECT c.*, s.status, s.last_checked_at, s.last_authenticated_at, s.failure_count, s.notes as session_notes
      FROM channels c
      LEFT JOIN sessions s ON c.id = s.channel_id
    `).all().map((row: any) => ({
      id: row.id,
      name: row.name,
      loginUrl: row.login_url,
      loggedInIndicator: row.logged_in_indicator,
      loginPageIndicator: row.login_page_indicator,
      tier: row.tier,
      monitorUrls: JSON.parse(row.monitor_urls || "[]"),
      status: row.status || "unknown",
      lastCheckedAt: row.last_checked_at || null,
      lastAuthenticatedAt: row.last_authenticated_at || null,
      failureCount: row.failure_count || 0,
    }));
  }

  // -- Session operations --

  updateSession(channelId: string, status: ChannelStatus, notes = ""): void {
    const now = new Date().toISOString();
    const authAt = status === "connected" ? now : null;

    this.db.prepare(`
      INSERT INTO sessions (channel_id, status, last_checked_at, last_authenticated_at, failure_count, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(channel_id) DO UPDATE SET
        status = excluded.status,
        last_checked_at = excluded.last_checked_at,
        last_authenticated_at = CASE WHEN excluded.status = 'connected' THEN excluded.last_authenticated_at ELSE sessions.last_authenticated_at END,
        failure_count = CASE WHEN excluded.status = 'connected' THEN 0 ELSE sessions.failure_count + 1 END,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `).run(channelId, status, now, authAt, status === "connected" ? 0 : 1, notes, now);
  }

  getSession(channelId: string): SessionRecord | null {
    const row = this.db.prepare(`
      SELECT * FROM sessions WHERE channel_id = ?
    `).get(channelId) as any;
    if (!row) return null;
    return {
      channelId: row.channel_id,
      status: row.status,
      lastCheckedAt: row.last_checked_at,
      lastAuthenticatedAt: row.last_authenticated_at,
      failureCount: row.failure_count,
      notes: row.notes,
    };
  }

  // -- Lead operations --

  insertLead(lead: LeadRecord): { inserted: boolean; id: number | null } {
    try {
      const result = this.db.prepare(`
        INSERT INTO leads (timestamp, source, title, url, budget, location, hot_lead, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        lead.timestamp, lead.source, lead.title, lead.url,
        lead.budget, lead.location, lead.hotLead ? 1 : 0, lead.notes,
      );
      return { inserted: true, id: result.lastInsertRowid as number };
    } catch (err: any) {
      if (err?.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return { inserted: false, id: null };
      }
      throw err;
    }
  }

  getRecentLeads(limit = 20, source?: string): LeadRecord[] {
    let query = "SELECT * FROM leads WHERE archived = 0";
    const params: any[] = [];
    if (source) {
      query += " AND source = ?";
      params.push(source);
    }
    query += " ORDER BY timestamp DESC LIMIT ?";
    params.push(limit);

    return this.db.prepare(query).all(...params).map((row: any) => ({
      id: row.id,
      timestamp: row.timestamp,
      source: row.source,
      title: row.title,
      url: row.url,
      budget: row.budget,
      location: row.location,
      hotLead: row.hot_lead === 1,
      notes: row.notes,
    }));
  }

  getLeadCount(): { total: number; hot: number; today: number } {
    const total = this.db.prepare("SELECT COUNT(*) as c FROM leads WHERE archived = 0").get() as any;
    const hot = this.db.prepare("SELECT COUNT(*) as c FROM leads WHERE hot_lead = 1 AND archived = 0").get() as any;
    const today = this.db.prepare("SELECT COUNT(*) as c FROM leads WHERE date(timestamp) = date('now') AND archived = 0").get() as any;
    return { total: total.c, hot: hot.c, today: today.c };
  }

  archiveOldLeads(olderThanDays = 30): number {
    const result = this.db.prepare(`
      UPDATE leads SET archived = 1
      WHERE archived = 0 AND datetime(timestamp) < datetime('now', '-' || ? || ' days')
    `).run(olderThanDays);
    return result.changes;
  }

  // -- Activity log --

  logActivity(channelId: string | null, action: string, result: string, notes = ""): void {
    this.db.prepare(`
      INSERT INTO activity_log (timestamp, channel_id, action, result, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(new Date().toISOString(), channelId, action, result, notes);
  }

  pruneActivityLog(olderThanDays = 30): number {
    const result = this.db.prepare(`
      DELETE FROM activity_log
      WHERE datetime(timestamp) < datetime('now', '-' || ? || ' days')
    `).run(olderThanDays);
    return result.changes;
  }

  close(): void {
    this.db.close();
  }
}

// ============================================================================
// Native Channel Registration — ChannelPlugin builder
// ============================================================================

/**
 * Tier-to-type mapping for the native UI.
 * OpenClaw's ChannelPlugin expects the tier description, not our internal tier value.
 */
const TIER_DETAIL_LABEL: Record<string, string> = {
  public: "Public Scraper",
  session: "Session-Based",
  "not-ready": "Not Ready",
};

/**
 * Build a ChannelPlugin-compatible object for one of our channels.
 * This is what api.registerChannel() needs to make the channel
 * appear natively in the Control UI Channels page.
 *
 * The generic card renderer (Yp) will show:
 *   - Card title (from meta.label)
 *   - Configured / Running / Connected status
 *   - Error callout if lastError is set
 */
function buildChannelPlugin(channel: ChannelConfig, db: SessionDB) {
  return {
    id: channel.id,
    meta: {
      id: channel.id,
      label: channel.name,
      detailLabel: `${channel.name} — ${TIER_DETAIL_LABEL[channel.tier] || channel.tier}`,
      blurb: `${channel.name} channel managed by Channel Manager plugin.`,
      // Sort after built-in channels (0–7). Group by tier: session=100, public=110
      order: channel.tier === "session" ? 100 : 110,
    },
    // Required: OpenClaw's dock system reads capabilities off the plugin object.
    // Without this, buildDockFromPlugin() sets capabilities=undefined and
    // dock.capabilities.nativeCommands crashes the heartbeat.
    capabilities: {},
    config: {
      listAccountIds: (_cfg: any) => ["default"],
      resolveAccount: (_cfg: any, accountId: string) => ({
        accountId,
        enabled: true,
      }),
      defaultAccountId: (_cfg: any) => "default",
      isConfigured: (_account: any) => true,
    },
    status: {
      buildChannelSummary: async (_params: any) => {
        const session = db.getSession(channel.id);
        const connected = session?.status === "connected";
        const expired = session?.status === "expired";
        const blocked = session?.status === "blocked";
        return {
          configured: true,
          running: false,
          connected,
          lastError: expired
            ? "Session expired — re-login required"
            : blocked
              ? "Channel blocked"
              : undefined,
        };
      },
    },
  };
}

// ============================================================================
// Plugin Registration
// ============================================================================

const plugin = {
  id: "channel-manager",
  name: "Channel Manager",
  description: "Manages browser-based channel sessions, lead storage, and session health for Scout automation.",
  configSchema: Type.Object({
    dbPath: Type.Optional(Type.String()),
    browserProfile: Type.Optional(Type.String()),
    sessionCheckInterval: Type.Optional(Type.String()),
  }),

  register(api: OpenClawPluginApi) {
    const pluginConfig = (api.pluginConfig ?? {}) as Record<string, unknown>;
    const dbPath = api.resolvePath(
      (pluginConfig.dbPath as string) || "~/.openclaw/channel-manager/sessions.db",
    );
    const browserProfile = (pluginConfig.browserProfile as string) || "openclaw";

    let db: SessionDB;

    try {
      db = new SessionDB(dbPath);
      api.logger.info(`Channel Manager DB: ${dbPath}`);
    } catch (err) {
      api.logger.error(`Failed to open DB at ${dbPath}: ${err}`);
      return;
    }

    // Seed default channels
    for (const ch of DEFAULT_CHANNELS) {
      db.upsertChannel(ch);
    }

    // ========================================================================
    // Register each channel natively with OpenClaw's channel system
    // This makes them appear in the Control UI Channels page alongside
    // WhatsApp, Telegram, Discord, etc.
    // ========================================================================

    for (const ch of DEFAULT_CHANNELS) {
      api.registerChannel({
        plugin: buildChannelPlugin(ch, db),
      });
    }
    api.logger.info(`Channel Manager: registered ${DEFAULT_CHANNELS.length} native channels`);

    // ========================================================================
    // Tool: channel_status — Scout checks this before scraping
    // ========================================================================

    api.registerTool({
      name: "channel_status",
      label: "Channel Status",
      description: "Check the session status of one or all channels. Scout should call this before attempting to scrape a session-required site. Returns status (connected/expired/blocked/unknown), last auth time, and failure count.",
      parameters: Type.Object({
        channelId: Type.Optional(Type.String({ description: "Channel ID (e.g. 'trademe', 'reddit'). Omit for all channels." })),
      }),
      async execute(_toolCallId, params) {
        if (params.channelId) {
          const session = db.getSession(params.channelId);
          if (!session) {
            return {
              content: [{ type: "text", text: `Channel '${params.channelId}' not found or no session recorded. Check channel_list for available channels.` }],
            };
          }
          return {
            content: [{ type: "text", text: JSON.stringify(session, null, 2) }],
          };
        }

        const channels = db.getChannels();
        const summary = channels.map(ch => ({
          id: ch.id,
          name: ch.name,
          tier: ch.tier,
          status: ch.status,
          lastAuth: ch.lastAuthenticatedAt,
          failures: ch.failureCount,
        }));
        return {
          content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
        };
      },
    }, { name: "channel_status" });

    // ========================================================================
    // Tool: channel_report_login — Scout reports login wall encountered
    // ========================================================================

    api.registerTool({
      name: "channel_report_login",
      label: "Report Login Required",
      description: "Report that a channel requires re-login. Call this when you hit a login wall while scraping. This marks the session as expired and logs the event for Shaun to handle.",
      parameters: Type.Object({
        channelId: Type.String({ description: "Channel ID (e.g. 'trademe')" }),
        url: Type.Optional(Type.String({ description: "URL where login was encountered" })),
        notes: Type.Optional(Type.String({ description: "Additional notes about the failure" })),
      }),
      async execute(_toolCallId, params) {
        db.updateSession(params.channelId, "expired", params.notes || `Login required at ${params.url || "unknown URL"}`);
        db.logActivity(params.channelId, "login_required", "expired", params.url || "");
        return {
          content: [{ type: "text", text: `Session for '${params.channelId}' marked as expired. Shaun will re-login manually.` }],
        };
      },
    }, { name: "channel_report_login" });

    // ========================================================================
    // Tool: channel_confirm_login — After Shaun logs in manually
    // ========================================================================

    api.registerTool({
      name: "channel_confirm_login",
      label: "Confirm Login Success",
      description: "Confirm that a channel login was successful (called after manual login or session verification).",
      parameters: Type.Object({
        channelId: Type.String({ description: "Channel ID" }),
      }),
      async execute(_toolCallId, params) {
        db.updateSession(params.channelId, "connected", "Manual login confirmed");
        db.logActivity(params.channelId, "login_confirmed", "connected");
        return {
          content: [{ type: "text", text: `Session for '${params.channelId}' marked as connected.` }],
        };
      },
    }, { name: "channel_confirm_login" });

    // ========================================================================
    // Tool: lead_store — Scout stores leads here instead of CSV
    // ========================================================================

    api.registerTool({
      name: "lead_store",
      label: "Store Lead",
      description: "Store a new lead in the database. Automatically deduplicates by URL. Returns whether the lead was new or already existed.",
      parameters: Type.Object({
        source: Type.String({ description: "Where the lead came from (e.g. 'trademe', 'reddit', 'seek')" }),
        title: Type.String({ description: "Lead title or description" }),
        url: Type.String({ description: "URL of the listing/post" }),
        budget: Type.Optional(Type.String({ description: "Budget or price" })),
        location: Type.Optional(Type.String({ description: "Location" })),
        hotLead: Type.Optional(Type.Boolean({ description: "Is this a hot lead?" })),
        notes: Type.Optional(Type.String({ description: "Additional notes" })),
      }),
      async execute(_toolCallId, params) {
        const lead: LeadRecord = {
          timestamp: new Date().toISOString(),
          source: params.source,
          title: params.title,
          url: params.url,
          budget: params.budget || "",
          location: params.location || "",
          hotLead: params.hotLead || false,
          notes: params.notes || "",
        };
        const result = db.insertLead(lead);
        db.logActivity(params.source, "lead_store", result.inserted ? "new" : "duplicate", params.url);

        if (result.inserted) {
          return {
            content: [{ type: "text", text: `Lead stored (ID: ${result.id})${lead.hotLead ? " — HOT LEAD flagged" : ""}` }],
          };
        }
        return {
          content: [{ type: "text", text: `Lead already exists (duplicate URL: ${params.url})` }],
        };
      },
    }, { name: "lead_store" });

    // ========================================================================
    // Tool: lead_search — Search leads database
    // ========================================================================

    api.registerTool({
      name: "lead_search",
      label: "Search Leads",
      description: "Search recent leads. Returns the most recent leads, optionally filtered by source.",
      parameters: Type.Object({
        source: Type.Optional(Type.String({ description: "Filter by source (e.g. 'trademe')" })),
        limit: Type.Optional(Type.Number({ description: "Number of results (default 20)" })),
      }),
      async execute(_toolCallId, params) {
        const leads = db.getRecentLeads(params.limit || 20, params.source);
        const counts = db.getLeadCount();
        return {
          content: [{
            type: "text",
            text: `Leads: ${counts.total} total, ${counts.hot} hot, ${counts.today} today\n\n${JSON.stringify(leads, null, 2)}`,
          }],
        };
      },
    }, { name: "lead_search" });

    // ========================================================================
    // Tool: lead_stats — Quick stats
    // ========================================================================

    api.registerTool({
      name: "lead_stats",
      label: "Lead Statistics",
      description: "Get a quick summary of lead counts.",
      parameters: Type.Object({}),
      async execute() {
        const counts = db.getLeadCount();
        return {
          content: [{
            type: "text",
            text: `Total leads: ${counts.total}\nHot leads: ${counts.hot}\nToday: ${counts.today}`,
          }],
        };
      },
    }, { name: "lead_stats" });

    // ========================================================================
    // CLI: openclaw channel-manager <subcommand>
    // ========================================================================

    api.registerCli(({ program }) => {
      const cmd = program
        .command("channel-manager")
        .description("Channel session manager");

      cmd
        .command("status")
        .description("Show all channel session statuses")
        .action(() => {
          const channels = db.getChannels();
          console.log("\nChannel Sessions:");
          console.log("─".repeat(80));
          for (const ch of channels) {
            const icon = ch.status === "connected" ? "🟢" :
              ch.status === "expired" ? "🟡" :
              ch.status === "blocked" ? "🔴" : "⚪";
            console.log(`${icon} ${ch.name.padEnd(15)} ${ch.tier.padEnd(10)} ${ch.status.padEnd(12)} auth: ${ch.lastAuthenticatedAt || "never"} failures: ${ch.failureCount}`);
          }
          console.log();
          const counts = db.getLeadCount();
          console.log(`Leads: ${counts.total} total, ${counts.hot} hot, ${counts.today} today`);
        });

      cmd
        .command("connect <channelId>")
        .description("Open channel login page in browser for manual login")
        .action(async (channelId: string) => {
          const channels = db.getChannels();
          const ch = channels.find(c => c.id === channelId);
          if (!ch) {
            console.error(`Unknown channel: ${channelId}. Available: ${channels.map(c => c.id).join(", ")}`);
            process.exit(1);
          }
          console.log(`Opening ${ch.name} login page: ${ch.loginUrl}`);
          console.log(`Browser profile: ${browserProfile}`);
          console.log(`\nAfter logging in, run: openclaw channel-manager confirm ${channelId}`);
          // The actual browser opening is handled by the gateway's browser tool
          // For CLI, we just update state and inform the user
        });

      cmd
        .command("confirm <channelId>")
        .description("Confirm login was successful for a channel")
        .action((channelId: string) => {
          db.updateSession(channelId, "connected", "Manual login confirmed via CLI");
          db.logActivity(channelId, "login_confirmed", "connected", "via CLI");
          console.log(`✓ ${channelId} marked as connected.`);
        });

      cmd
        .command("disconnect <channelId>")
        .description("Mark a channel session as expired")
        .action((channelId: string) => {
          db.updateSession(channelId, "expired", "Manually disconnected via CLI");
          db.logActivity(channelId, "disconnected", "expired", "via CLI");
          console.log(`✓ ${channelId} marked as expired.`);
        });

      cmd
        .command("leads")
        .description("Show recent leads")
        .option("--source <source>", "Filter by source")
        .option("--limit <n>", "Number of results", "20")
        .action((opts: any) => {
          const leads = db.getRecentLeads(parseInt(opts.limit), opts.source);
          const counts = db.getLeadCount();
          console.log(`\nLeads: ${counts.total} total, ${counts.hot} hot, ${counts.today} today\n`);
          for (const lead of leads) {
            const hot = lead.hotLead ? "🔥" : "  ";
            console.log(`${hot} [${lead.source}] ${lead.title}`);
            console.log(`   ${lead.url}`);
            if (lead.budget) console.log(`   Budget: ${lead.budget}`);
            console.log();
          }
        });

      cmd
        .command("prune")
        .description("Archive leads older than 30 days and prune activity log")
        .option("--days <n>", "Archive threshold in days", "30")
        .action((opts: any) => {
          const days = parseInt(opts.days);
          const archived = db.archiveOldLeads(days);
          const pruned = db.pruneActivityLog(days);
          console.log(`Archived ${archived} leads older than ${days} days.`);
          console.log(`Pruned ${pruned} activity log entries older than ${days} days.`);
        });
    }, { commands: ["channel-manager"] });

    // ========================================================================
    // HTTP Route: /channel-manager/api/* (for future UI)
    // ========================================================================

    api.registerHttpRoute({
      path: "/__openclaw__/channel-manager/api/channels",
      handler: (_req, res) => {
        const channels = db.getChannels();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(channels));
      },
    });

    api.registerHttpRoute({
      path: "/__openclaw__/channel-manager/api/leads",
      handler: (_req, res) => {
        const leads = db.getRecentLeads(50);
        const counts = db.getLeadCount();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ counts, leads }));
      },
    });

    // Confirm channel (GET with ?channelId=xxx)
    api.registerHttpRoute({
      path: "/__openclaw__/channel-manager/api/confirm",
      handler: (req, res) => {
        const url = new URL(req.url || "", "http://localhost");
        const channelId = url.searchParams.get("channelId") || "";
        if (!channelId) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "channelId query param required" }));
          return;
        }
        db.updateSession(channelId, "connected", "Confirmed via console UI");
        db.logActivity(channelId, "confirm", "connected", "Confirmed via console UI");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, channelId, status: "connected" }));
      },
    });

    // Launch the OpenClaw browser for a channel login (GET with ?channelId=xxx)
    // Uses the SAME browser profile that Scout uses, so cookies are shared.
    // Human logs in → session persists → Scout rides the cookies.
    api.registerHttpRoute({
      path: "/__openclaw__/channel-manager/api/browser-login",
      handler: (req, res) => {
        const url = new URL(req.url || "", "http://localhost");
        const channelId = url.searchParams.get("channelId") || "";
        const channel = DEFAULT_CHANNELS.find((ch) => ch.id === channelId);
        if (!channel) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `Channel "${channelId}" not found` }));
          return;
        }
        // Spawn openclaw browser open in the background — opens the login page
        // in OpenClaw's own Chrome profile so cookies persist for Scout
        const cmd = `npx openclaw browser open "${channel.loginUrl}" --profile chrome`;
        exec(cmd, { env: { ...process.env, PATH: process.env.PATH + ";F:\\openclaw\\npm-global" } }, (err, _stdout, _stderr) => {
          if (err) {
            api.logger.error(`Failed to launch browser for ${channelId}: ${err.message}`);
          }
        });
        db.logActivity(channelId, "browser_login", "pending", `Launched browser for ${channel.name} login`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, channelId, loginUrl: channel.loginUrl, message: `Opening ${channel.name} login in OpenClaw browser...` }));
      },
    });

    // Serve the console UI
    api.registerHttpRoute({
      path: "/__openclaw__/channel-manager/console",
      handler: (_req, res) => {
        const htmlPath = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "console.html");
        try {
          const html = fs.readFileSync(htmlPath, "utf-8");
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(html);
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Console UI not found: " + htmlPath + " — " + err.message);
        }
      },
    });

    // ========================================================================
    // Lifecycle hooks
    // ========================================================================

    // Auto-prune on gateway start
    api.on("gateway_start", () => {
      const archived = db.archiveOldLeads(30);
      const pruned = db.pruneActivityLog(30);
      if (archived > 0 || pruned > 0) {
        api.logger.info(`Channel Manager: archived ${archived} old leads, pruned ${pruned} log entries`);
      }
    });

    // Clean shutdown
    api.on("gateway_stop", () => {
      db.close();
    });

    api.logger.info("Channel Manager plugin loaded — tools: channel_status, channel_report_login, channel_confirm_login, lead_store, lead_search, lead_stats");
  },
};

export default plugin;
