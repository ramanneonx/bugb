# BUGB BY TECHIVIBE — MASTER PRODUCT SPECIFICATION PROMPT
> Give this entire file to any AI agent to build or extend the Bugb platform.

---

## 🎯 PRODUCT VISION (Read This First)

**Bugb by techivibe** is a complete desktop application built with Electron.js that transforms a real bug bounty hunter's personal notes and journey into the world's most beginner-friendly yet advanced bug bounty learning and working platform.

**The goal:** Someone with zero knowledge (even a 10th grade student) should be able to open Bugb, follow the content, and within months become a real bug bounty hunter capable of earning 6-figure monthly bounties. At the same time, advanced hunters use it daily as their full operational command center.

**It is NOT:** A generic SaaS dashboard, a simple note app, a tutorial website.

**It IS:** A living, breathing cyber-intelligence workstation + knowledge academy + personal hunting OS — all in one Electron desktop app.

---

## 🏗️ TECHNICAL STACK (DO NOT CHANGE)

- **Runtime:** Electron.js (desktop app, at `e:\bugbounty\`)
- **Frontend:** Pure HTML + Vanilla CSS + Vanilla JavaScript (NO React, NO Vue, NO Tailwind)
- **Database:** SQLite via `better-sqlite3` (set up in `database.js`)
- **IPC Bridge:** `preload.js` exposes `window.api` to renderer
- **Main process:** `main.js`
- **Renderer entry:** `src/index.html`
- **Fonts:** Space Grotesk + JetBrains Mono (Google Fonts)
- **Markdown:** `marked.js` (in node_modules)

---

## 🎨 DESIGN SYSTEM (STRICT)

### Color Palette
```
--bg:      #0a0a0a   App background
--bg2:     #111111   Topbar/elevated
--bg3:     #171717   Cards/panels
--accent:  #d4ff3f   Acid Yellow (PRIMARY)
--purple:  #7c3aed   Cyber Purple
--red:     #ef4444   Alert Red
--green:   #22c55e   Success
--amber:   #f59e0b   Warning
--text:    #f5f5f5   Primary text
--text2:   #888888   Muted text
--text3:   #444444   Disabled
--border:  #2a2a2a   All borders
```

### Unbreakable Rules
1. NO rounded corners — `border-radius: 0` everywhere
2. 2px solid borders on all interactive elements
3. Hard offset shadows only: `box-shadow: 3px 3px 0px #000`
4. Hover = physical press: `transform: translate(2px,2px)` + reduce shadow
5. Active nav = black text on acid yellow
6. NO gradients on large surfaces
7. NO glassmorphism (no backdrop-filter blur on main panels)
8. Buttons: Acid yellow + black border + black text + hard shadow
9. Headings: Space Grotesk 700-800, UPPERCASE, tight tracking
10. Code/terminal: JetBrains Mono always

---

## 📐 APPLICATION LAYOUT

```
TOPBAR (72px fixed, #111111, 2px border bottom)
  [B] BUGB by techivibe | [breadcrumb] | [● LIVE] [$earned]

SIDEBAR (240px) | MAIN CONTENT AREA (scrollable)

SIDEBAR NAV ITEMS:
  MAIN:    Targets | Attack Surface | Timeline
  LEARN:   Academy | Knowledge Base | Study Hub
  BUILD:   Payloads | Vuln Chains | Templates
  TOOLS:   Search | Smart Import | Settings
```

---

## 📚 FEATURE 1: ACADEMY

Transform owner's notes into structured lessons. 8 modules:

- **Module 0:** What Is Bug Bounty (zero knowledge)
- **Module 1:** Mindset & Strategy
- **Module 2:** Recon Mastery (subfinder, amass, nmap, JS analysis, dorking)
- **Module 3:** Web Vulnerabilities (XSS, SQLi, IDOR, SSRF, CSRF, JWT, OAuth, Business Logic, RCE, Subdomain Takeover, GraphQL, XXE, HTTP Smuggling)
- **Module 4:** Tool Arsenal (Burp Suite, ffuf, nuclei, httpx, sqlmap, custom scripts)
- **Module 5:** Payload & Bypass Library
- **Module 6:** Report Writing (structure, CVSS, PoC, templates per vuln)
- **Module 7:** Real Case Studies (owner's actual findings with payouts)
- **Module 8:** 6-Figure Roadmap (30/90/365 day plans)

**Each lesson has:**
- Markdown content (real working code, not pseudocode)
- Written at 10th-grade reading level with technical accuracy
- "Key Takeaway" section
- "Try It Yourself" lab prompt
- Video embed (YouTube iframe)
- "Mark Complete" button (saves to SQLite)
- Difficulty badge: BEGINNER(green) / INTERMEDIATE(amber) / ADVANCED(purple) / ELITE(red)

**Academy UI:**
- Module grid with icon, title, lesson count, difficulty
- Progress bar per module
- "Continue Learning" button on dashboard

---

## 📝 FEATURE 2: RICH TEXT KNOWLEDGE BASE

Full-featured note editor:

**Toolbar:** Bold, Italic, Underline, Strikethrough, Code inline, Code block, H1/H2/H3, Lists, Blockquote, Link, Table, Divider

**File Upload (drag-drop or click):**
- Images (PNG/JPG/GIF/WebP) → rendered inline in note, resizable
- HTML files → preview + import content
- PDF → download link
- Any file → stored in SQLite BLOB (attachments table)

**Code blocks:** Syntax highlighted, copy button, language selector

**Views:** Split-pane (editor left, live preview right)

**Tags:** Multi-tag with color (#XSS=red, #recon=cyan, #bypass=yellow)

**Export:** .md, .html, PDF (Electron print API)

**Import:** .md, .txt, .html files

**Font picker:** JetBrains Mono / Fira Code / Cascadia Code / Space Grotesk (saved in settings)

---

## 💣 FEATURE 3: PAYLOAD LIBRARY

Searchable, categorized payload database.

**Categories:** XSS, SQLi, SSRF, Auth Bypass, File Upload, IDOR, CSRF, XXE, RCE, Header Injection, Open Redirect, Path Traversal, WAF Bypass, Encoding, Custom

**Each payload entry:**
- Title + description
- The payload (monospace + one-click copy)
- Context (HTML attr / JS / URL param / Header / JSON body)
- Bypass type (WAF / encoding / length limit)
- Example vulnerable code
- Works against (Apache, Nginx, Cloudflare, Akamai badges)
- Success rate (Low/Medium/High)
- User notes

**UI:** Dense terminal-style table, filters, add custom payloads, export as JSON

---

## ⛓️ FEATURE 4: VULNERABILITY CHAIN BOARD

Kanban + relationship graph for chaining weak bugs into critical impacts.

**Columns:** Recon Finding → Low Severity → Chained Attack → Critical Impact → Reported

**Cards:** vuln type, target, severity, related findings, estimated payout

**Chain arrows:** Visual lines between connected cards showing escalation

---

## 🕐 FEATURE 5: OPERATIONS TIMELINE

Terminal-style activity feed per target:
```
[13:42:01] > subfinder -d target.com          (command — green)
[13:42:45] FOUND 247 subdomains               (success — acid yellow)
[13:43:10] TESTING admin.target.com           (testing — white)
[13:44:00] ⚠ Potential IDOR at /api/v2/user  (finding — amber)
[13:45:30] ✗ WAF blocked payload             (blocked — red)
[13:46:00] ✓ BYPASSED — confirmed working    (win — green)
```

Filter by type, search, export as report.

---

## ⚙️ FEATURE 6: SETTINGS & THEME ENGINE

**7 Built-in Themes:**
1. TACTICAL NOIR (default) — #0a0a0a, acid yellow
2. MIDNIGHT PURPLE — #0d0815, #9b59b6
3. GHOST WHITE — #f8f8f8, #000 (light mode)
4. BLOOD RED — #0a0000, #ef4444
5. OCEAN DEEP — #020d1a, #00e5ff
6. MATRIX GREEN — #000, #00ff41
7. CUSTOM — full color pickers

Theme = change CSS variables in `:root` dynamically. Saved in localStorage. Live preview (no reload).

**Other settings:**
- Editor font picker (4 monospace options)
- UI font picker (Space Grotesk, Inter, Outfit, Plus Jakarta Sans)
- Font size slider (12-18px)
- Sidebar auto-collapse toggle
- Background animation on/off + intensity slider
- Accent color picker
- Compact mode (30% less padding)
- XP system on/off

---

## 🎮 FEATURE 7: XP GAMIFICATION SYSTEM

**XP Actions:**
- Complete lesson: +50 XP
- Log tool: +10 XP
- Add note: +15 XP
- Submit finding: +100 XP
- Win bounty: +500 XP × severity multiplier
- 7-day streak: +200 XP bonus

**Levels:**
Rookie → Scout(500) → Tracker(1500) → Infiltrator(3000) → Phantom(6000) → Elite Hunter(10000) → Legend(20000)

**UI:** XP bar in sidebar footer with level name. Level-up = full-screen acid yellow flash 500ms.

---

## 📥 FEATURE 8: FILE IMPORT

Supports: .md, .txt, .html, .json (templates), URL fetch, OneNote HTML export, bulk folder scan

---

## 🗄️ DATABASE TABLES TO ADD

```sql
CREATE TABLE IF NOT EXISTS academy_lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id TEXT, module_name TEXT,
  lesson_title TEXT, difficulty TEXT,
  estimated_minutes INTEGER, content TEXT,
  video_url TEXT, order_index INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER, completed INTEGER DEFAULT 0,
  completed_at DATETIME, UNIQUE(lesson_id)
);

CREATE TABLE IF NOT EXISTS payloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT, category TEXT, payload TEXT,
  context TEXT, bypass_type TEXT,
  targets TEXT, success_rate TEXT, notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_id INTEGER, event_type TEXT,
  message TEXT, details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY, value TEXT
);

CREATE TABLE IF NOT EXISTS xp_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT, xp_gained INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER, filename TEXT,
  filetype TEXT, filedata BLOB,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 NEW IPC METHODS (add to preload.js + main.js)

```javascript
// Academy
window.api.getLessons(moduleId?)
window.api.addLesson(data)
window.api.updateLesson(id, data)
window.api.deleteLesson(id)
window.api.getLessonProgress()
window.api.markLessonComplete(lessonId)

// Payloads
window.api.getPayloads(category?)
window.api.addPayload(data)
window.api.updatePayload(id, data)
window.api.deletePayload(id)

// Timeline
window.api.getTimeline(targetId?)
window.api.addTimelineEvent(data)

// Settings
window.api.getSetting(key)
window.api.setSetting(key, value)
window.api.getAllSettings()

// XP
window.api.getXP()
window.api.addXP(action, amount)

// Files
window.api.saveAttachment(noteId, filename, filetype, buffer)
window.api.getAttachments(noteId)
window.api.deleteAttachment(id)
window.api.openFileDialog(filters)
window.api.showSaveDialog(filename)
window.api.importFile(filepath)
window.api.exportNote(noteId, format)
```

---

## 📋 AGENT TASK ORDER (implement in this sequence)

**Phase 1 — Foundation**
1. Add all new SQLite tables to database.js
2. Add all new IPC methods to preload.js + main.js
3. Build Settings view with live theme engine (7 presets)
4. Build font/size/animation customization

**Phase 2 — Academy**
5. Build Academy module grid + lesson detail view
6. Seed all 8 modules with real lesson content
7. Add lesson progress tracking + "Continue Learning" widget

**Phase 3 — KB Enhancement**
8. Add rich toolbar to Knowledge Base editor
9. Add file/image upload with inline rendering
10. Add export (.md, .html) + tag colors + font picker

**Phase 4 — New Views**
11. Build Payload Library view + seed with real payloads
12. Build Vulnerability Chain Board (Kanban)
13. Build Operations Timeline
14. Add XP system (log on all key actions)

**Phase 5 — Polish**
15. All 7 theme presets working
16. Background animation intensity control
17. Compact mode toggle
18. End-to-end bug testing

---

## 🚫 ABSOLUTE RULES FOR AGENTS

1. NEVER use React, Vue, Angular, or any JS framework
2. NEVER use Tailwind — only the CSS variable system
3. NEVER add rounded corners (border-radius: 0 always)
4. NEVER use soft blur shadows — only hard offset
5. NEVER change Electron main process structure (only add handlers)
6. NEVER delete existing features — only extend
7. ALWAYS use var(--accent) for primary interactive elements
8. ALWAYS write lesson content in simple English (10th grade level)
9. ALWAYS include real, working code examples (no pseudocode)
10. ALWAYS save important data to SQLite (only theme/settings to localStorage)

---

## 🔑 NORTH STAR PRINCIPLE

Every decision must answer YES to:
**"Would a 10th-grade student understand this instantly AND would a pro hunter find this useful daily?"**

If complex → add tooltip or expandable "What is this?"
If basic → add "Advanced" toggle for deeper options

Benchmark: a 16-year-old opens the app → excited, not confused.
A pro hunter opens it → feels like their most powerful tool.

---

*Bugb by techivibe v1.0 Master Specification | techivibe 2026*
