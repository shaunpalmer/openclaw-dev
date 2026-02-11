---
name: "ai-agent-skill-collections"
description: "Curated guide to discovering, choosing, and integrating 2,999+ AI agent skills from major awesome-lists"
metadata:
  version: "1.2"
  author: "Claude (GitHub Copilot) for Shaun Palmer / Super Clean Services"
  credit: "VoltAgent/awesome-openclaw-skills, sickn33/antigravity-awesome-skills, ashishpatel26/500-AI-Agents-Projects, skillmatic-ai/awesome-agent-skills, ClawHub.ai"
  date: "2026-02-10"
  updated: "2026-02-11"
---

# Section 26: AI Agent Skill Collections & Curation

## Overview

The explosion of AI agent skills across GitHub (2,999+ verified OpenClaw skills, 715+ Antigravity skills, 500+ project examples, + universal Agent Skills ecosystem) means you never have to write a skill from scratch. This section teaches the Coder agent how to discover, evaluate, and integrate pre-built skills into the Super Clean / Project Studios ecosystem.

**Key Numbers:**
- **2,999** verified OpenClaw skills (from 5,705 total in ClawHub, filtered for quality)
- **715** battle-tested Antigravity skills (Claude Code, Cursor, Copilot)
- **500+** AI agent project use cases (frameworks: CrewAI, AutoGen, Agno, LangGraph)
- **15+** platforms with Agent Skills support (including OpenClaw, Claude Code, Cursor, GitHub Copilot, Gemini CLI, VS Code, OpenAI Codex, Vercel, Supabase, Hugging Face)
- **4 major skill marketplaces** (SkillsMP, Skillstore, SkillsDirectory, skills.sh)
- **Filtered:** Excludes 1,180 spam, 672 crypto, 492 duplicates, 396 malicious, 8 non-English from ClawHub

---

## 1. The Big Three Awesome-Lists

### 1.1 VoltAgent/awesome-openclaw-skills (2,999 Skills)

**URL:** https://github.com/VoltAgent/awesome-openclaw-skills

**What it is:**
Curated collection of 2,999 high-quality OpenClaw skills, filtered from 5,705 total in the ClawHub registry. Organized into 20+ categories.

**Installation:**
```bash
# Method 1: Using clawhub CLI (recommended)
npx clawhub@latest install <skill-slug>

# Method 2: Manual (copy skill to ~/.openclaw/skills/)
git clone https://github.com/openclaw/skills.git ~/.openclaw/skills

# Method 3: Direct GitHub link
# Paste GitHub repo link in OpenClaw UI
```

**Categories Available:**
| Category | Skills | Example |
|----------|--------|---------|
| Coding Agents & IDEs | 133 | coding-agent, claude-team, cursor-agent |
| Web & Frontend | 201 | react-patterns, next-js-expert, tailwind-master |
| DevOps & Cloud | 212 | docker-expert, aws-serverless, terraform-patterns |
| Git & GitHub | 66 | github-pr, auto-pr-merger, git-workflows |
| AI & LLMs | 287 | rag-engineer, prompt-engineer, langgraph |
| Search & Research | 253 | web-search, deepresearch, knowledge-synthesis |
| Data & Analytics | 46 | data-pipeline, sql-expert, pandas-mastery |
| Productivity & Tasks | 134 | task-orchestrator, workflow-automation, project-tracking |
| Communication | 133 | email-automation, slack-bot, discord-integration |
| Security | 62 | security-audit, penetration-testing, vulnerability-scanner |

**Best For:**
- Production-grade OpenClaw environments
- Enterprise automation
- Verified security (checked against VirusTotal)

**Quality Gate:**
Skills are filtered for:
- ✅ Active maintenance (not abandoned)
- ✅ Usage metrics (stars/forks on GitHub)
- ✅ Security audit (VirusTotal partnered)
- ✅ Community adoption (proven in real projects)

---

### 1.2 sickn33/antigravity-awesome-skills (715 Skills)

**URL:** https://github.com/sickn33/antigravity-awesome-skills

**What it is:**
715 universal agentic skills compatible with Claude Code, Gemini CLI, Cursor, Copilot, OpenCode, and AdaL. Released as v5.0.0 with Workflows support.

**Installation:**
```bash
# Recommended: Universal path (~/.agent/skills)
npx antigravity-awesome-skills
# or
git clone https://github.com/sickn33/antigravity-awesome-skills.git ~/.agent/skills

# Claude Code specific
npx antigravity-awesome-skills --claude

# Cursor specific
npx antigravity-awesome-skills --cursor

# Custom directory
npx antigravity-awesome-skills --path /path/to/skills
```

**Key Features:**
- **Universal format:** Works with all major AI coding assistants
- **Bundles:** Pre-curated role-based skill sets (e.g., "Full-Stack Developer", "Security Engineer")
- **Workflows:** Step-by-step playbooks for complex tasks (e.g., "Ship a SaaS MVP", "Security Audit")
- **Catalog:** Full registry in CATALOG.md with descriptions and links

**Popular Bundles:**
1. **Web Wizard** — React, Next.js, API design, frontend testing
2. **Full-Stack Developer** — Backend patterns, databases, DevOps, deployment
3. **Security Engineer** — AppSec, pentesting, vulnerability analysis, compliance
4. **OSS Maintainer** — GitHub workflows, CI/CD, release management, community
5. **Essentials** — General planning, code quality, testing, debugging

**Best For:**
- Multi-tool compatibility (Claude Code + Cursor + Copilot)
- Developers who work across different IDEs
- Quick onboarding via pre-curated bundles
- Workflow automation for complex projects

---

### 1.3 ashishpatel26/500-AI-Agents-Projects (500+ Examples)

**URL:** https://github.com/ashishpatel26/500-AI-Agents-Projects

**What it is:**
500+ real-world AI agent use cases across industries, linked to open-source implementations. Framework-agnostic but includes CrewAI, AutoGen, Agno, and LangGraph examples.

**What you'll find:**
- **Industry use cases:** Healthcare, Finance, Retail, Transportation, Manufacturing, etc.
- **Framework examples:** CrewAI, AutoGen, Agno, LangGraph
- **Project links:** Full source code on GitHub for each example
- **Implementation levels:** Beginner to advanced

**Example Use Cases (Relevant to Super Clean/Project Studios):**
| Category | Use Case | Framework | Link |
|----------|----------|-----------|------|
| **Communication** | Email Auto Responder Flow | CrewAI | GitHub |
| **Productivity** | Meeting Assistant Flow | CrewAI | GitHub |
| **Sales** | Lead Score Flow | CrewAI | GitHub |
| **HR/Service** | Self Evaluation Loop | CrewAI | GitHub |
| **Marketing** | Marketing Strategy Generator | CrewAI | GitHub |
| **Browser Automation** | Browse the Web with Agents | AutoGen | Notebook |

**Best For:**
- Learning by example
- Seeing real-world implementations of skills
- Understanding framework capabilities
- Rapid prototyping (copy-paste starter code)

---

### 1.4 skillmatic-ai/awesome-agent-skills (Universal Agent Skills Resource)

**URL:** https://github.com/skillmatic-ai/awesome-agent-skills

**What it is:**
Comprehensive guide to Agent Skills across the entire ecosystem (Anthropic, OpenAI, Microsoft, etc.). Unlike OpenClaw-specific lists, this covers universal SKILL.md standards used by 15+ platforms.

**Learning Phases:**
- **Phase 1:** Learn Fundamentals (articles, videos, courses on Agent Skills architecture)
- **Phase 2:** Use Existing Skills (supported platforms, skill libraries, marketplaces)
- **Phase 3:** Build & Integrate (how to create, tools, reference implementations)
- **Phase 4:** Benchmarks & Research (evaluation frameworks, advanced engineering, academic papers)

**Platforms with Skills Support:**
- Claude Code (Anthropic)
- OpenAI Codex
- GitHub Copilot
- Cursor
- VS Code
- Gemini CLI
- OpenCode
- Vercel Labs
- Hugging Face
- OpenClaw (officially listed)
- + 8 more (Manus, Amp, Goose, Letta, Roo Code, etc.)

**Official Skill Collections (from skillmatic-ai guide):**
| Organization | Repository | Scope |
|--------------|-----------|-------|
| **Anthropic** | anthropics/skills | Claude ecosystem, official |
| **OpenAI** | openai/skills | OpenAI Codex, official |
| **Microsoft** | microsoft/skills | Azure SDKs, AI Foundry |
| **Vercel** | vercel-labs/agent-skills | Web development best practices |
| **Supabase** | supabase/agent-skills | Database/backend operations |
| **Hugging Face** | huggingface/skills | ML/AI community skills |
| **OpenClaw** | clawhub.ai/skills | LocalClaw agents |

**Skill Marketplaces (from skillmatic-ai):**
- SkillsMP — Marketplace for discovering/sharing
- Skillstore — Curated, high-quality skills
- SkillsDirectory — Popular Agent Skills catalog
- skills.sh — Directory + leaderboard

**Best For:**
- Understanding Agent Skills as universal standard
- Cross-platform skill development
- Learning skill architecture and patterns
- Academic understanding (includes research papers)
- Multi-tool teams (Claude Code + Cursor + Copilot)

**Key Resources:**
- **Beginner:** "What are skills" + "Using skills in Claude" guides
- **Development:** "How to Build Skills" section with tutorials
- **Advanced:** Academic papers on skill architecture, prompt injection risks, skill libraries
- **Tools:** SkillCheck (security scanner), OpenSkills (universal loader), LangChain Deep Agents

**Star count:** 143 stars (well-maintained, CC0-1.0 license, updated 2 days ago)

---

## 2. ClawHub: The Official Skill Registry

### 2.1 What is ClawHub?

**URL:** https://clawhub.ai/

ClawHub is the official OpenClaw skill registry. It's a npm-like marketplace for skills with:
- **5,705 total skills** published by developers worldwide
- **Versioning** (rollback-ready, like npm packages)
- **Search with vectors** (semantic search for skills)
- **Signal metrics:** Stars ⭐, Downloads ⤓, Version ⤒
- **Trust signals:** Highlighted (curated) skills, usage stats

**Key Sections:**
- [Browse all skills](https://clawhub.ai/skills) — Full searchable registry
- [Highlighted skills](https://clawhub.ai/) — Curated, trusted, high-signal
- [Latest drops](https://clawhub.ai/) — Newly uploaded skills
- [Upload](https://clawhub.ai/upload) — Publish your own skill

---

## 2.2 Skill Discovery Workflow

### Step 1: Define the Need
```
Want: "Extract text and data from PDFs"
→ Keywords: pdf, extraction, document processing
```

### Step 2: Search ClawHub (Primary)

**Search URL:** https://clawhub.ai/skills?q=pdf

**Recommended metrics to check:**
| Signal | Meaning |
|--------|---------|
| ⭐ (Stars) | Community trust (aim for > 10) |
| ⤓ (Downloads) | Active usage (aim for > 100) |
| ⤒ (Version) | Maturity (v2+ = stable) |
| 🟢 (Green highlight) | Verified/curated by ClawHub team |

**Example search results:**
```
pdf-expert
  ⭐ 234 · ⤓ 5,421 · ⤒ 3
  "Extract, convert, and analyze PDFs with OCR support"
  
document-parser  
  ⭐ 89 · ⤓ 1,203 · ⤒ 1
  "Parse DOCX, PDF, XLSX into structured data"
  
ocr-automation
  ⭐ 45 · ⤓ 312 · ⤒ 1
  "Tesseract-based OCR automation"
```

**What to do if skill has low signals:**
- < 10 stars = newer/less trusted (OK for experimentation)
- < 100 downloads = potentially stale (check last update date)
- v1 only = early-stage (may have breaking changes)

### Step 3: Cross-Reference (Secondary Sources)

**VoltAgent list (quality filter):**
```bash
# If on VoltAgent awesome-list → already quality-vetted
# Search: https://github.com/VoltAgent/awesome-openclaw-skills
# grep -r "pdf" README.md
```

**Antigravity list (multi-tool compatibility):**
```bash
# If in Antigravity repo → works with Claude Code + Cursor + Copilot
# Check: https://github.com/sickn33/antigravity-awesome-skills/blob/main/CATALOG.md
```

**500-Projects (real-world examples):**
```bash
# Look for implementation examples
# GitHub: ashishpatel26/500-AI-Agents-Projects
# Search for "PDF", "Document", "Extract"
```

### Step 4: Install from ClawHub

**Method 1: npx clawhub CLI (Recommended - automatic installation)**
```bash
# Install latest version
npx clawhub@latest install pdf-expert

# Install specific version
npx clawhub@latest install pdf-expert@2.1.0

# Verify installation
ls ~/.openclaw/skills/pdf-expert/SKILL.md
```

**Method 2: Manual git clone (for custom paths)**
```bash
# Get skill GitHub URL from ClawHub page
git clone https://github.com/author/pdf-expert.git ~/.openclaw/skills/pdf-expert

# Verify SKILL.md exists
ls ~/.openclaw/skills/pdf-expert/SKILL.md

# Log installation
echo "[$(date)] pdf-expert installed via git" >> ~/.openclaw/logs/skill-installs.log
```

**Method 3: Import via ClawHub UI (copy-paste)**
- On https://clawhub.ai/skills
- Click "Import"
- Paste GitHub URL: `https://github.com/author/pdf-expert`
- ClawHub auto-detects and installs

**Method 4: Update existing skill**
```bash
cd ~/.openclaw/skills/pdf-expert
git pull origin main          # Get latest commits
npx update 2>/dev/null        # Update if using npm
```

---

### 2.3 ClawHub Advanced Usage

**Semantic Search (ClawHub's strength):**
```
Query: "Extract data from documents"
→ Returns: pdf-expert, ocr-automation, document-parser, csv-processor
  (All semantically related, even if keywords don't match exactly)
```

**Filtered Search with Signal Metrics:**
```
https://clawhub.ai/skills
- Filter by category (Data, Automation, DevOps, etc.)
- Sort by: Latest, Most Downloaded, Most Starred
- Pin filters: #productivity, #automation, #pdf
```

**ClawHub Features:**

| Feature | URL | What You'll Find |
|---------|-----|-----------------|
| **Browse All** | https://clawhub.ai/skills | Full searchable registry, 5,705 skills |
| **Highlighted** | https://clawhub.ai/ | Curated, trusted skills (high signal) |
| **Latest** | https://clawhub.ai/ | Newest uploads this week |
| **Upload** | https://clawhub.ai/upload | Share your own skill |
| **Import** | https://clawhub.ai/import | Paste GitHub URL to auto-install |
| **Search** | https://clawhub.ai/skills?q=python | Keyword search |

**Current Highlighted Skills (examples):**
- **Trello:** Manage boards, lists, cards via API (⭐ 21, ⤓ 3,981)
- **Slack:** Workspace integration, message reactions, pinning (⭐ 12, ⤓ 4,508)
- **CalDAV:** Sync iCloud, Google Calendar, other calendar services (⭐ 47, ⤓ 4,955)

**Latest Drops (newest additions):**
- Brave Search Setup
- Podcast production & distribution
- Aliyun OSS file upload
- Task Workflow planning
- Documentation technical writing
- AI Podcast Pipeline
- Windows system integration
- Email Marketing automation
- Galatea Memory management

**Version Management:**
```bash
# Check available versions on ClawHub page
Click: ⤒ Version dropdown
Shows: All published versions with rollback dates

# Example: pdf-expert versions
v3.2.1  (current, 2 days ago)
v3.2.0  (5 days ago)
v3.1.5  (1 week ago)
v3.1.0  (1 month ago)

# Install specific version if current has bugs
npx clawhub@latest install pdf-expert@3.1.5
```

**Bookmark Frequently-Used Skills:**
```
On ClawHub skill page:
- Click ⭐ star icon
- Syncs to your ClawHub profile
- Quick access for next time
```

---

### 2.4 Evaluate Quality (Before Installing)

**On ClawHub page:**

| Criteria | How to Check | What to Look For |
|----------|--------------|-----------------|
| **Maintenance** | "Last updated" date | < 3 months old = active |
| **Usage** | ⤓ Downloads | > 100 = trusted |
| **Trust** | ⭐ Stars | > 10 = community adopted |
| **Maturity** | ⤒ Version | v2+ = stable |
| **Highlight** | 🟢 Green badge | Official verification |
| **Security** | VirusTotal link (if present) | 0 detections |

**On GitHub (linked from ClawHub):**

```bash
# Clone to temp directory
git clone https://github.com/author/pdf-expert /tmp/pdf-expert

# Check code quality
wc -l /tmp/pdf-expert/SKILL.md        # Should be 50+ lines
cat /tmp/pdf-expert/README.md         # Well-documented?

# Check for dangerous patterns (exec, eval, system)
grep -r "eval\|exec\|system" /tmp/pdf-expert/  # Should be empty

# Check dependencies
cat /tmp/pdf-expert/package.json | grep '"dependencies"' -A 10

# Check recency
git log -1 --format="%ai" /tmp/pdf-expert/    # Recent commits?

# Clean up
rm -rf /tmp/pdf-expert
```

---

### 2.5 Skill Categories Relevant to Coder Agent

**For Super Clean Services:**
- 🧹 **Automation:** workflow-automation, task-orchestrator, job-scheduler
- 📧 **Communication:** email-automation, smtp-operations, message-queue
- 💾 **Data:** csv-processor, excel-expert, data-pipeline
- 🗂️ **File Ops:** directory-manager, file-search, batch-rename
- 🌐 **Web Scraping:** web-scraper, html-parser, sitemap-extractor

**For Project Studios (Coding):**
- 🏗️ **Architecture:** system-design, c4-diagramming, architecture-decision-records
- 🐛 **Debugging:** debug-pro, test-runner, error-logging
- ⚙️ **DevOps:** docker-expert, kubernetes, ci-cd-pipelines
- 📚 **Documentation:** doc-coauthoring, readme-generator, api-documenter
- 🔍 **Code Quality:** linter-config, test-driven-development, security-audit

---

## 3. Integrating Skills into the Coder Agent

### 3.1 Skill Loading in Heartbeat

**Current Coder heartbeat tasks:**
```markdown
1. Check Task Queue (~/agents/coder/tasks/)
2. Check Data Directory (F:\openclaw\data\)
3. Code Review Queue
4. Social Media Monitoring
5. Background Maintenance
```

**Enhance with skill loading:**

```markdown
## 6. Load Relevant Skills (New)

### 6.1 Project-Specific Skills
- Read the project's SKILL.md if it exists
- Load Super Clean repo: automation, email, data-processing skills
- Load Project Studios repo: architecture, devops, testing skills

### 6.2 Task-Based Skill Selection
- If task is "refactor PHP code" → load php-patterns, code-quality
- If task is "deploy to AWS" → load aws-serverless, terraform
- If task is "write tests" → load test-driven-development, pytest-mastery

### 6.3 Just-In-Time Skill Installation
- If a task requires "pdf processing" → install pdf-expert
- If task needs "Excel manipulation" → install excel-automation
- Document in activity.log: [SKILL INSTALLED] pdf-expert

```

---

### 3.2 Skill Selection Algorithm

When Coder receives a task, it should:

**Step 1: Parse task type**
```
Task: "Refactor the lead-scraper.py script with tests"
→ Keywords: refactor, Python, testing, scraping
```

**Step 2: Match to skill categories**
```
- File type: .py → python-patterns, code-quality
- Action: refactor → code-refactoring, architecture
- Action: tests → test-driven-development, pytest-mastery
- Domain: scraping → web-scraper, beautifulsoup-expert
```

**Step 3: Check installed skills**
```bash
ls ~/.openclaw/skills/ | grep -E "python|test|refactor|scrape"
```

**Step 4: Install missing skills**
```bash
for skill in python-patterns test-driven-development web-scraper; do
  if ! [ -d ~/.openclaw/skills/$skill ]; then
    npx clawhub@latest install $skill
  fi
done
```

**Step 5: Load skills into context**
```
Read: ~/.openclaw/skills/python-patterns/SKILL.md
Read: ~/.openclaw/skills/test-driven-development/SKILL.md
Read: ~/.openclaw/skills/web-scraper/SKILL.md
→ Inject into prompt before starting task
```

---

## 4. Curating Skills for Super Clean & Project Studios

### 4.1 Essential Skills Repository

Create a custom "Super Clean Starter Pack" by curating from the Big Three:

**File:** `~/.openclaw/skills/CURATED_SKILLS.md`

```json
{
  "super-clean-essential": {
    "category": "Service Automation",
    "description": "Core skills for Super Clean Services operations",
    "skills": [
      "email-automation",        // Lead follow-up, customer comms
      "workflow-automation",     // Scheduling, job coordination
      "csv-processor",           // Lead CSV management
      "calendar-sync",           // Booking calendar integration
      "sms-automation",          // Job notifications
      "payment-processing",      // Invoice, receipt handling
      "customer-database"        // CRM-like operations
    ]
  },
  "project-studios-essential": {
    "category": "Development Automation",
    "description": "Core skills for Project Studios coding",
    "skills": [
      "php-patterns",            // WordPress development
      "test-driven-development", // Quality assurance
      "git-workflows",           // Code review, releases
      "docker-expert",           // Containerization
      "wordpress-plugin-dev",    // WordPress-specific
      "security-audit",          // Code security
      "performance-profiler"     // Speed optimization
    ]
  }
}
```

### 4.2 Periodic Skill Audits

**Monthly: Check for updates**
```bash
# Super Clean skills
cd ~/.openclaw/skills/email-automation && git pull
cd ~/.openclaw/skills/workflow-automation && git pull

# Project Studios skills
cd ~/.openclaw/skills/php-patterns && git pull
cd ~/.openclaw/skills/test-driven-development && git pull
```

**Quarterly: Skill retirement**
- Remove unused skills (free up disk space)
- Keep: High-usage skills (more than 5 tasks/month)
- Remove: Stale skills (last commit > 6 months ago)

---

## 5. Creating Custom Skills vs. Using Pre-Built

### When to Use Pre-Built Skills:
✅ Email automation → Use email-automation
✅ PDF processing → Use pdf-expert
✅ AWS deployment → Use aws-serverless
✅ React patterns → Use react-patterns
✅ Git workflows → Use git-workflows

### When to Create Custom Skills:
❌ Super Clean-specific booking logic
❌ Project Studios custom WordPress module architecture
❌ Proprietary data format handling
❌ Brand-specific code style (use-case too specialized)

**Custom Skill Template:**
```markdown
---
name: "super-clean-lead-processing"
description: "Extract, validate, and log leads for Super Clean Services"
metadata:
  version: "1.0"
  author: "Shaun Palmer"
---

# Super Clean Lead Processing

## Input
CSV file with lead data (name, phone, email, service request)

## Process
1. Validate phone/email format
2. Check against existing leads.csv (duplicates)
3. Categorize service type (cleaning, website, other)
4. Log to F:\openclaw\data\csv\leads.csv with timestamp

## Output
✅ Lead logged | ❌ Duplicate (logged to duplicates.log)
```

---

## 6. Skill Performance & Monitoring

### 6.1 Track Skill Usage

**File:** `~/.openclaw/logs/skill-usage.log`

```
[2026-02-10 09:15:23] [email-automation] Task: send-lead-followup | Result: Success | Duration: 2.3s
[2026-02-10 09:16:45] [csv-processor] Task: deduplicate-leads | Result: Success | Duration: 1.8s
[2026-02-10 09:18:12] [test-driven-development] Task: write-tests | Result: Success | Duration: 145.2s
[2026-02-10 09:22:33] [php-patterns] Task: refactor-plugin | Result: Success | Duration: 312.5s
```

### 6.2 Skill Metrics

| Metric | Calculation | Interpretation |
|--------|-------------|-----------------|
| **Usage frequency** | tasks_using_skill / total_tasks | How often skill is needed |
| **Success rate** | successful_tasks / total_tasks | Skill reliability |
| **Avg duration** | total_duration / task_count | Performance overhead |
| **Last updated** | days_since_git_pull | Maintenance status |

**Decision rule:**
- If success_rate < 80% → investigate, consider alternative skill
- If usage_frequency < 0.5% → candidate for retirement
- If last_updated > 180 days → flag for review

---

## 7. Security & Trust

### 7.1 Pre-Installation Vetting

**Before installing a skill:**

1. **Check VirusTotal scan (for OpenClaw skills)**
   - On ClawHub skill page: "VirusTotal Report" link
   - Acceptable: 0 detections
   - Caution: 1-2 detections (review in detail)
   - Reject: 3+ detections (likely malicious)

2. **Review source code**
   ```bash
   # Clone and inspect
   git clone https://github.com/author/skill.git
   wc -l **/*.{js,py,ts}           # Check code volume
   grep -r "eval\|exec\|system" .  # Dangerous patterns
   ```

3. **Check dependencies**
   ```bash
   # Node.js
   npm audit --production
   
   # Python
   pip-audit (check for known vulns)
   ```

4. **Read documentation**
   - Is there a README?
   - Are security considerations mentioned?
   - Are there usage warnings?

### 7.2 Sandbox Untrusted Skills

```bash
# Install in isolated directory first
mkdir -p /tmp/skill-sandbox/email-automation
git clone <skill-repo> /tmp/skill-sandbox/email-automation

# Test in isolation
cd /tmp/skill-sandbox
bash email-automation/test.sh

# If passes, move to production
mv /tmp/skill-sandbox/email-automation ~/.openclaw/skills/email-automation
```

---

## 8. Integration Rules for Coder Agent

### Rule 1: Always Ask Before Installing
```
Agent: Task requires "analytics-dashboard" skill
→ Log: [UNKNOWN SKILL] analytics-dashboard not found
→ Action: Ask Shaun for approval before installing
→ Wait for confirmation (don't auto-install)
```

### Rule 2: Document Skill Sources
```
Every skill loaded must log:
- Skill name
- Repository (GitHub URL)
- Installation date
- Security review status (APPROVED / PENDING / REJECTED)
```

### Rule 3: Honor Skill Directives
```
If skill's SKILL.md says:
- "Use only in isolated environment" → Don't use in production
- "Requires manual configuration" → Show Shaun the config
- "Dangerous for X use case" → Refuse that use case
```

### Rule 4: Report Skill Conflicts
```
If two skills conflict:
- email-automation uses node-mailer
- smtp-operations also uses node-mailer (different version)
→ Log conflict and ask Shaun which to prioritize
```

---

## 9. Monthly Skill Refresh

**1st of each month: Skill review**

```bash
# Check for new skills in Big Three
cd awesome-openclaw-skills && git pull
cd antigravity-awesome-skills && git pull

# Report new skills added in past month
# (Filter to Super Clean + Project Studios categories only)

# Update installed skills
find ~/.openclaw/skills -name ".git" -type d | \
  while read dir; do
    skill_dir=$(dirname "$dir")
    echo "[UPDATING] $(basename $skill_dir)"
    cd "$skill_dir" && git pull
  done
```

---

## References & Credits

- **VoltAgent/awesome-openclaw-skills:** https://github.com/VoltAgent/awesome-openclaw-skills
  - 2,999 curated skills from ClawHub registry
  - Filtered for security, maintenance, community adoption
  
- **sickn33/antigravity-awesome-skills:** https://github.com/sickn33/antigravity-awesome-skills
  - 715 battle-tested universal skills
  - v5.0.0 includes Workflows and Bundles
  
- **ashishpatel26/500-AI-Agents-Projects:** https://github.com/ashishpatel26/500-AI-Agents-Projects
  - 500+ real-world AI agent use cases
  - Implementations across CrewAI, AutoGen, Agno, LangGraph

- **skillmatic-ai/awesome-agent-skills:** https://github.com/skillmatic-ai/awesome-agent-skills
  - Universal Agent Skills guide (15+ platforms)
  - Learning phases, marketplaces, reference implementations
  - Academic papers, security analysis, benchmarks
  - 143 stars, CC0-1.0 license, actively maintained

- **ClawHub.ai:** https://clawhub.ai/
  - Official OpenClaw skill registry
  - 5,705 total skills with versioning and semantic search

---

## Critical Rules

1. **Verify before installing:** Always check GitHub stars, last commit, and community adoption
2. **No blind trust:** VT-scan and code review mandatory for untrusted sources
3. **Log everything:** Document which skills are used, when, and why
4. **Sandbox first:** Test new skills in isolation before production
5. **Ask Shaun for major installs:** Don't auto-install without confirmation
6. **Maintain transparency:** Report all skill sources and security status
