// ============================================================================
// Channel Manager - Core Data Contracts
// ============================================================================

export type ChannelStatus = 
  | "connected" 
  | "unknown" 
  | "expired" 
  | "blocked" 
  | "rate_limited";

export type ChannelType = "public" | "session" | "api" | "not-ready";

export interface Channel {
  id: string; // e.g. "trademe", "upwork", "gmail_in"
  label: string; // Display name
  type: ChannelType;
  status: ChannelStatus;
  
  // Associations
  identityId?: string; // core identity currently assigned
  
  // Timestamps
  lastSeenAt?: string; // ISO string
  lastConfirmedAt?: string; // ISO string (manual confirm)
  nextRunAt?: string; // ISO string (scheduler)
  
  // Config snapshot (optional subset)
  monitorUrls?: string[];
  checkIntervalMs?: number;
}

export interface Identity {
  id: string; // e.g. "gmail-bot-01"
  displayName: string;
  email?: string;
  recoveryEmail?: string;
  
  // Stats
  connectedCount: number;
  expiredCount: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string; // specific session ID if needed, or composite key
  channelId: string;
  identityId: string;
  
  status: ChannelStatus;
  
  lastLoginAt?: string;
  lastConfirmedAt?: string;
  
  // Storage references
  cookieVaultPath?: string;
  browserProfile?: string;
  
  expiryHint?: string; // e.g. "Login redirect detected"
}

export interface Lead {
  id: number;
  hash: string; // for dedupe (url + title hash)
  channelId: string;
  
  timestamp: string;
  sourceUrl: string;
  
  // Extracted data
  title: string;
  budget?: string; // raw string like "$50-$100"
  location?: string;
  descriptionSnippet?: string;
  
  status: "new" | "drafted" | "replied" | "archived";
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ChannelStats {
  connected: number;
  unknown: number;
  expired: number;
  failures24h: number;
  leadsToday: number;
}
