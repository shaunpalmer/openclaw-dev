---
name: "social-media-login-automation"
description: "Authentication and automation for Facebook, LinkedIn, Instagram, Twitter, TikTok, YouTube"
metadata:
  version: "1.0"
  author: "Claude (GitHub Copilot) for Shaun Palmer / Super Clean Services"
  credit: "OpenClaw agent platform, inspired by oauth2.0 + Playwright browser automation patterns"
  date: "2026-02-10"
---

# Section 25: Social Media Login & Automation

## Overview

Systematic authentication and safe automation for social platforms (Facebook, LinkedIn, Instagram, Twitter, TikTok, YouTube). Required for Scout agent's lead generation and Coder agent's content/account monitoring.

## Platforms Supported

| Platform | Login Type | 2FA? | Rate Limit | Use Case |
|----------|-----------|------|-----------|----------|
| **Facebook** | Email + Password | Yes (optional) | 200/10min | Lead groups, Page posting |
| **LinkedIn** | Email + Password | Yes | 300/hour | Lead search, messaging, recruiter |
| **Instagram** | Username + Password | Yes | 200/hour | DM automation, lead DM, hashtag search |
| **Twitter/X** | Email + Password | Yes | 450/15min | Lead search, DM, trending monitoring |
| **TikTok** | Email/Phone + Password | Yes | 100/hour | Trending research, creator DM |
| **YouTube** | Google Account (OAuth) | Yes | 1000/day | Channel analytics, comment monitoring |

---

## 1. Authentication Methods

### 1.1 OAuth 2.0 (Preferred: Google, Facebook, LinkedIn)

**Advantages:**
- No password needed
- Automatic token refresh
- Built-in 2FA support
- Session isolation

**Flow:**
```
1. Initiate OAuth flow (web browser)
2. User logs in at provider (not agent)
3. Provider redirects with authorization code
4. Exchange code for access token + refresh token
5. Store refresh token securely (encrypted)
6. Use access token for API calls
```

**Shaun's Setup (Google for YouTube):**
```javascript
// ~/.openclaw/config/oauth.json (ENCRYPTED)
{
  "google": {
    "client_id": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    "client_secret": "[ENCRYPTED_SECRET]",
    "redirect_uri": "http://localhost:18789/oauth/callback",
    "scopes": ["https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/spreadsheets"]
  },
  "linkedin": {
    "client_id": "YOUR_LINKEDIN_ID",
    "client_secret": "[ENCRYPTED_SECRET]",
    "scopes": ["r_liteprofile", "r_emailaddress", "w_member_social"]
  }
}
```

### 1.2 Login Form Automation (Playwright/Puppeteer)

**When to use:**
- OAuth2 not available
- Instagram automation
- TikTok automation
- Facebook groups (scraping)

**Setup:**
```bash
npm install playwright
# or
npm install puppeteer
```

**Shaun's Credentials (Encrypted in .openclaw/secrets.json):**
```json
{
  "accounts": {
    "facebook": {
      "email": "[ENCRYPTED]",
      "password": "[ENCRYPTED]",
      "2fa_code_provider": "authenticator_app"  // or "sms" or "backup_codes"
    },
    "linkedin": {
      "email": "[ENCRYPTED]",
      "password": "[ENCRYPTED]",
      "2fa_backup_codes": "[ENCRYPTED_ARRAY]"
    },
    "instagram": {
      "username": "[ENCRYPTED]",
      "password": "[ENCRYPTED]",
      "2fa_phone": "[ENCRYPTED]"
    }
  }
}
```

---

## 2. Login Flow (Step-by-Step)

### 2.1 Facebook Login

```javascript
const browser = await playwright.chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

// Step 1: Navigate to login
await page.goto('https://www.facebook.com/login/', { waitUntil: 'networkidle' });

// Step 2: Enter email
await page.fill('input[name="email"]', facebookEmail);

// Step 3: Enter password
await page.fill('input[name="pass"]', facebookPassword);

// Step 4: Submit
await page.click('button[name="login"]');

// Step 5: Wait for 2FA challenge (if present)
try {
  await page.waitForSelector('[data-testid="email_two_factor_challenge"]', { timeout: 5000 });
  console.log('⚠️ 2FA required: Ask Shaun for code');
  // Agent STOPS and asks for manual 2FA entry
  const code = await askShaun('Enter 2FA code from authenticator:');
  await page.fill('input[autocomplete="one-time-code"]', code);
  await page.click('button[type="submit"]');
} catch (e) {
  console.log('✅ No 2FA challenge (or SMS sent via SMS)');
}

// Step 6: Verify login success
await page.waitForURL('https://www.facebook.com/', { timeout: 10000 });
console.log('✅ Facebook login successful');

// Step 7: Save session (optional)
await context.storageState({ path: '~/.openclaw/.sessions/facebook.json' });
```

### 2.2 LinkedIn Login

```javascript
const page = await context.newPage();
await page.goto('https://www.linkedin.com/login/');

// Fill credentials
await page.fill('#username', linkedinEmail);
await page.fill('#password', linkedinPassword);
await page.click('button[type="submit"]');

// Wait for possible 2FA
try {
  const challenge = await page.waitForSelector('[data-test-id="two-step-verification"]', { timeout: 3000 });
  if (challenge) {
    console.log('⚠️ LinkedIn 2FA required');
    // LinkedIn sends SMS code
    const sms_code = await askShaun('Enter SMS code from LinkedIn:');
    await page.fill('input[data-test-id="pin-digit-0"]', sms_code.split(''));
    await page.click('button[data-test-id="verify-code-button"]');
  }
} catch (e) {}

// Alternative: Verify email-based 2FA
try {
  await page.waitForSelector('[aria-label="Enter the code"]', { timeout: 3000 });
  console.log('⚠️ Email verification required');
  const link = await askShaun('Click the email verification link sent to LinkedIn');
} catch (e) {}

await page.waitForURL('https://www.linkedin.com/feed/', { timeout: 10000 });
console.log('✅ LinkedIn login successful');
```

### 2.3 Instagram Login

```javascript
// Instagram blocks automation tools — use undetected-chromedriver (Python)
// or switch to Instagram Business API

// Fallback: Browser-based with manual supervision
const page = await context.newPage();
await page.goto('https://www.instagram.com/accounts/login/');

await page.fill('input[name="username"]', instagramUsername);
await page.fill('input[name="password"]', instagramPassword);
await page.click('button:has-text("Log in")');

// Instagram checkpoints
try {
  const checkpoint = await page.waitForSelector('[data-testid="challenge"]', { timeout: 5000 });
  console.log('⚠️ Instagram security checkpoint');
  // May require:
  // - Email verification
  // - SMS code
  // - Trusted device confirmation
  const action = await askShaun('Complete Instagram checkpoint (choose method shown on screen)');
} catch (e) {}

// Wait for feed
await page.waitForURL('https://www.instagram.com/', { timeout: 15000 });
console.log('✅ Instagram login successful');
```

---

## 3. Session Management

### 3.1 Session Storage

```javascript
// After successful login, save session
const session = {
  account: "facebook",
  cookies: await context.cookies(),
  localStorage: await page.evaluate(() => JSON.stringify(localStorage)),
  sessionStorage: await page.evaluate(() => JSON.stringify(sessionStorage)),
  timestamp: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
};

// Save encrypted
const encrypted = encrypt(JSON.stringify(session), MASTER_KEY);
fs.writeFileSync('~/.openclaw/.sessions/facebook.json', encrypted);
```

### 3.2 Session Reuse

```javascript
// Check if session exists and is still valid
async function restoreSession(platform) {
  const path = `~/.openclaw/.sessions/${platform}.json`;
  if (!fs.existsSync(path)) return null;

  const encrypted = fs.readFileSync(path, 'utf8');
  const session = JSON.parse(decrypt(encrypted, MASTER_KEY));

  if (new Date(session.expiresAt) < new Date()) {
    console.log(`⚠️ Session expired for ${platform}`);
    return null; // Need fresh login
  }

  // Restore session
  const context = await browser.newContext({
    storageState: { cookies: session.cookies }
  });
  
  // Verify still valid
  const page = await context.newPage();
  await page.goto(`https://${platform.domain}/`);
  const logged_in = await page.evaluate(() => !!document.querySelector('[data-testid="account-menu"]'));
  
  if (logged_in) {
    console.log(`✅ Session restored for ${platform}`);
    return context;
  } else {
    console.log(`❌ Session invalid; need re-login`);
    return null;
  }
}
```

---

## 4. 2FA Handling (Critical)

### 4.1 2FA Methods

| Method | Platforms | Provider | Risk |
|--------|-----------|----------|------|
| **Authenticator App** | All | Google Authenticator, Authy, Microsoft Authenticator | ✅ Recommended |
| **SMS Code** | FB, LinkedIn, Instagram | Twilio (intercept not advised) | ⚠️ Moderate |
| **Email Link** | LinkedIn, Twitter | Email provider | ⚠️ Moderate |
| **Backup Codes** | All | Saved in `~/.openclaw/secrets/` (ENCRYPTED) | ✅ Recommended |
| **Hardware Key** | LinkedIn, Google, Twitter | YubiKey, Titan | ✅ Recommended (manual) |

### 4.2 Handling 2FA During Login

**Rule: Never claim to have logged in if 2FA is pending.**

```javascript
async function loginWithFallback(platform, email, password) {
  const [logged_in, requires_2fa] = await attemptLogin(platform, email, password);

  if (logged_in && !requires_2fa) {
    console.log(`✅ [${platform}] Login successful, no 2FA`);
    return true;
  }

  if (requires_2fa) {
    console.log(`⚠️ [${platform}] 2FA required during login`);
    console.log(`    Method: ${detect2FAMethod()}`);
    console.log(`    Action: Agent PAUSES and asks Shaun for code`);

    // INTEGRITY RULE: Do not claim success until 2FA is entered
    const code_provided = await askShaun(`2FA code for ${platform}:`);
    if (!code_provided) {
      console.log(`❌ [${platform}] 2FA not provided; login failed`);
      return false;
    }

    const confirmed = await submit2FA(platform, code_provided);
    if (confirmed) {
      console.log(`✅ [${platform}] 2FA verified, login successful`);
      return true;
    } else {
      console.log(`❌ [${platform}] 2FA code incorrect`);
      return false;
    }
  }

  console.log(`❌ [${platform}] Login failed (check credentials)`);
  return false;
}
```

### 4.3 Backup Codes (Emergency)

Store temporarily in encrypted file for automated login (use sparingly):

```json
// ~/.openclaw/secrets/backup-codes.json (ENCRYPTED)
{
  "facebook": ["12345-ABCDE", "23456-BCDEF", "34567-CDEFG"],
  "linkedin": ["code1", "code2", "code3"],
  "note": "Only use if Authenticator app is lost. Regenerate immediately after use."
}
```

---

## 5. Account Safety & Guardrails

### 5.1 Login Security Checklist

- ✅ **HTTPS only** — all logins over encrypted connection
- ✅ **No credential logging** — never print email/password to console or logs
- ✅ **Timeout on 2FA** — 5 min wait for code, then abort and ask Shaun
- ✅ **Rate limiting** — max 3 login attempts per account per hour
- ✅ **Suspicious activity** — log and pause if account locked/flagged
- ✅ **Session refresh** — refresh auth tokens before expiry (24–48 hrs)
- ✅ **Logout on exit** — always log out before closing browser (avoid session hijacking)
- ✅ **Device fingerprint change** — if accessing from new IP, expect verification

### 5.2 Blocked/Flagged Accounts

If platform blocks login:

```
Signal: Login succeeded, but "suspicious activity" message shown
→ Account temporarily locked by platform
→ Agent: REPORT this immediately to Shaun
→ Shaun: Verify account via email link or support ticket
→ Agent: Wait for Shaun confirmation before retrying
```

### 5.3 Account Lockout Recovery

```javascript
async function recoverFromLockout(platform, email) {
  console.log(`🔒 [${platform}] Account appears locked`);
  
  // 1. Check if email verification is needed
  const verification_link = await askShaun(
    `Check your email for ${platform} verification link. Paste the verification URL here:`
  );

  if (verification_link) {
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();
    await page.goto(verification_link);
    await page.waitForNavigation({ timeout: 10000 });
    console.log(`✅ Email verification complete`);
    await browser.close();
  }

  // 2. Wait 15 minutes before retry
  console.log(`⏳ Waiting 15 minutes before retry...`);
  await sleep(15 * 60 * 1000);

  // 3. Retry login
  return await loginWithFallback(platform, email, password);
}
```

---

## 6. Automation Tasks (After Login)

### 6.1 Facebook Lead Scraping

```javascript
async function scrapeFacebookLeads(searchTerm, groupIds = []) {
  const context = await restoreSession('facebook') || await loginFacebook();
  const page = await context.newPage();

  const leads = [];

  for (const groupId of groupIds) {
    // Chch Community Group, Chch Business Group, etc.
    await page.goto(`https://www.facebook.com/groups/${groupId}/`);

    // Search in group
    await page.fill('[aria-label="Search this group"]', searchTerm);
    await page.press('[aria-label="Search this group"]', 'Enter');

    // Collect posts from last 48 hours
    const posts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[role="article"]')).map(post => {
        const author = post.querySelector('[data-testid="post_header_author"]')?.innerText || 'Unknown';
        const text = post.querySelector('[data-testid="post_message"]')?.innerText || '';
        const timestamp = post.querySelector('a[role="button"][aria-label*="ago"]')?.innerText || '';
        const email = text.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0];
        const phone = text.match(/\+?\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{1,4}\b/)?.[0];

        return { author, text, timestamp, email, phone, url: window.location.href };
      });
    });

    leads.push(...posts);
  }

  return leads;
}
```

### 6.2 LinkedIn Lead Search

```javascript
async function searchLinkedInLeads(keywords, limit = 10) {
  const context = await restoreSession('linkedin') || await loginLinkedIn();
  const page = await context.newPage();

  await page.goto('https://www.linkedin.com/search/results/people/');
  await page.fill('input[placeholder="Search by title, keyword, etc."]', keywords);
  await page.press('input[placeholder="Search by title, keyword, etc."]', 'Enter');

  const leads = [];
  for (let i = 0; i < limit && i < 100; i++) {
    const person = await page.$eval(`li[data-list-index="${i}"] a[href*="/in/"]`, el => ({
      name: el.querySelector('[class*="search-result__title"]')?.innerText,
      title: el.querySelector('[class*="search-result__info"]')?.innerText,
      url: el.getAttribute('href')
    }));
    leads.push(person);

    // Respect rate limiting
    await page.waitForTimeout(1000);
  }

  return leads;
}
```

### 6.3 Instagram DM Automation

```javascript
async function sendInstagramDM(username, recipient, message) {
  const context = await restoreSession('instagram') || await loginInstagram(username);
  const page = await context.newPage();

  await page.goto('https://www.instagram.com/direct/inbox/');
  
  // Click "New Message"
  await page.click('[aria-label="New message"]');

  // Type recipient
  await page.fill('input[placeholder="Search..."]', recipient);
  await page.click(`button:has-text("${recipient}")`);

  // Type message
  await page.fill('textarea[placeholder="Aa"]', message);
  await page.click('button[aria-label="Like"]'); // Send button

  console.log(`✅ DM sent to ${recipient}`);
  
  // Rate limiting: Instagram limits ~40 DMs/hour
  await page.waitForTimeout(90000); // 1.5 min between DMs
}
```

---

## 7. Error Handling & Integrity

### 7.1 Logging All Actions

```javascript
async function logAction(platform, action, result, evidence = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    platform,
    action,         // "login", "post", "DM_send", "lead_scrape"
    result,         // "success" | "failed" | "2fa_pending"
    evidence: {
      screenshot: evidence.screenshot || null,
      message_id: evidence.message_id || null,
      post_url: evidence.post_url || null,
      error_message: evidence.error || null
    }
  };

  fs.appendFileSync('~/.openclaw/logs/socialmedia.log', JSON.stringify(entry) + '\n');
  
  // Also log to heartbeat
  console.log(`[${platform}] ${action} → ${result}`);
}
```

### 7.2 Truthfulness Rules (Critical)

**Golden Rule: Never claim success without proof.**

```javascript
// ❌ WRONG:
console.log("✅ Sent DM to lead");
// (DM may have failed silently)

// ✅ CORRECT:
const message_id = await sendInstagramDM(recipient, message);
if (message_id) {
  logAction('instagram', 'send_dm', 'success', { message_id });
  console.log(`✅ DM sent (ID: ${message_id})`);
} else {
  logAction('instagram', 'send_dm', 'failed', { error: 'No message ID received' });
  console.log(`❌ DM send failed (no confirmation)`);
}

// If login fails → report it
if (!(await loginWithFallback(...))) {
  logAction('facebook', 'login', 'failed', { error: 'Invalid credentials or account locked' });
  console.log(`❌ Cannot proceed without login`);
  await askShaun('Login failed. Check credentials or account status.');
  return;
}
```

---

## 8. Rate Limiting & Responsible Use

### 8.1 Platform Rate Limits

Respect these limits to avoid blocks (from platform guidelines):

| Platform | Rate Limit | Consequence | Mitigation |
|----------|-----------|-------------|-----------|
| **Facebook Graph API** | 200 req/person/day | Temp block (24h) | Batch requests, wait 24h |
| **LinkedIn API** | 300 req/hour | Endpoint disabled | Random 5–15 sec delays |
| **Instagram** | 200 DMs/day | DM block (24h) | Max 1 DM per 90 sec |
| **Twitter API v2** | 450 requests/15 min | Rate limit error | Use exponential backoff |
| **TikTok** | 100 requests/hour | Ban | Manual actions only |

### 8.2 Retry Logic with Exponential Backoff

```javascript
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 'RATE_LIMIT' && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Rate limited; waiting ${delay}ms before retry...`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
}
```

---

## 9. Troubleshooting

### 9.1 Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Your account has been blocked" | Too many login attempts or suspicious activity | Wait 24h; verify via email; ask Shaun to change password |
| "2FA code incorrect" | Expired code (30 sec window) or wrong device | Regenerate in Authenticator app, try again |
| "Session expired" | Cookies/tokens no longer valid | Delete session file, login fresh |
| "Cloudflare/bot check" | Platform detected automation | Switch to undetected-chromedriver (Python) or manual login |
| "Email not recognized" | Account deactivated or deleted | Ask Shaun to check account status |

### 9.2 Debugging Commands

```bash
# Check session validity
cat ~/.openclaw/.sessions/facebook.json | jq '.expiresAt'

# Review social media logs
tail -50 ~/.openclaw/logs/socialmedia.log | grep facebook

# Test login (dry run)
node ~/.openclaw/skills/socialmedia/test-login.js --platform=facebook --dry-run

# Clear all sessions (fresh login required)
rm ~/.openclaw/.sessions/*.json
```

---

## 10. Integration with Scout & Coder Agents

### 10.1 Scout Agent: Lead Generation via Social Media

**Heartbeat Task (every 60 sec):**

```markdown
1. **Check Facebook Lead Groups** (Chch Community, Chch Business)
   - Search: "cleaning", "WordPress", "web design"
   - Log leads → `~/leads.csv`
   - Action: Send hot leads to Shaun via Telegram

2. **Check LinkedIn People Search**
   - Search: "Christchurch + cleaning OR property management"
   - Extract: Name, Title, Company, LinkedIn URL
   - Log → `~/prospects.csv`

3. **Monitor Instagram Hashtags**
   - Track: #ChristchurchCleaning, #ChCHWebDesign, #NZProperty
   - Collect DM requests
   - Action: Reply with inquiry link

4. **Email Check** (SuperClean inbox)
   - Scan for keywords: "clean", "help", "price", "WordPress"
   - Log → `~/email-leads.csv`

5. **Escalate Hot Leads**
   - Any lead with: phone + intent + contact info
   - Send to Shaun immediately (Telegram/email)
```

### 10.2 Coder Agent: Content & Account Monitoring

**Heartbeat Task:**

```markdown
1. **Monitor YouTube Channel Analytics**
   - Views, subscribers, engagement (daily)
   - Flag if significant drop (> 10%)

2. **Monitor Twitter/X Feed**
   - Retweet relevant industry posts
   - Engage with local Christchurch accounts

3. **Check Facebook Page Comments**
   - Reply to inquiries within 2 hours
   - Log response time → `~/response-times.csv`

4. **Archive Instagram Content**
   - Download photos/videos for portfolio
   - Store in `~/Projects/Portfolio/Instagram/`
```

---

## 11. Credential Storage & Encryption

### 11.1 Secrets File Structure

```json
// ~/.openclaw/secrets.json (ENCRYPTED with MASTER_KEY)
{
  "master_key": "[ENCRYPTED_USING_WINDOWS_DPAPI]",
  "accounts": {
    "facebook": {
      "email": "[AES_256_ENCRYPTED]",
      "password": "[AES_256_ENCRYPTED]",
      "backup_codes": "[AES_256_ENCRYPTED_ARRAY]",
      "2fa_seed": "JBSWY3DP" // Authenticator app seed
    },
    "linkedin": {
      "email": "[AES_256_ENCRYPTED]",
      "password": "[AES_256_ENCRYPTED]"
    },
    "instagram": {
      "username": "[AES_256_ENCRYPTED]",
      "password": "[AES_256_ENCRYPTED]"
    }
  }
}
```

### 11.2 Encryption Setup (Node.js)

```javascript
const crypto = require('crypto');

function encrypt(text, masterKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(masterKey), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(encrypted, masterKey) {
  const [iv, ciphertext] = encrypted.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(masterKey), Buffer.from(iv, 'hex'));
  return decipher.update(Buffer.from(ciphertext, 'hex')) + decipher.final('utf8');
}

// Load master key from Windows Credential Manager
const masterKey = require('keytar').getPassword('openclaw', 'master_key');
```

---

## 12. References & Credits

- **Playwright Documentation**: https://playwright.dev/docs/auth (Session management)
- **OAuth 2.0 Authorization Code Flow**: https://tools.ietf.org/html/rfc6749 (Standards)
- **OWASP Authentication Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **Puppeteer Docs**: https://pptr.dev/ (Browser automation alternative)
- **Linux Academy Login Security**: https://docs.microsoft.com/en-us/windows/security/identity-protection/credential-guard/credential-guard-manage (Windows DPAPI)

---

## Critical Rules (Non-Negotiable)

1. **Login Truthfulness**: Never claim login succeeded unless browser confirms it (check for account menu/feed)
2. **2FA Honesty**: If 2FA required, PAUSE and ask Shaun. Do not guess codes.
3. **No Silent Failures**: If DM doesn't send, report it. If rate limit hit, explain and stop.
4. **Credential Safety**: Never log credentials. Never send to Telegram/email unencrypted.
5. **Rate Limit Respect**: Slow down proactively (1 DM/90 sec) rather than wait for platform block.
6. **Session Expiry Check**: Restore session; if expired, ask for fresh login rather than claiming old session works.
7. **Evidence Required**: Screenshot/message ID for critical actions (DM send, post creation, lead capture).

