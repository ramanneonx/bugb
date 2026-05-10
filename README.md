<div align="center">

# ⚡ bugbOS
### Elite Bug Bounty Operating System

[![Version](https://img.shields.io/badge/version-1.0.0-00ff9f?style=for-the-badge&logo=electron&logoColor=black)](https://github.com/ramanneonx/bugb/releases)
[![Platform](https://img.shields.io/badge/platform-Windows-0078d4?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/ramanneonx/bugb/releases)
[![License](https://img.shields.io/badge/license-MIT-purple?style=for-the-badge)](LICENSE)

**A tactical cyber-intelligence workspace for elite bug bounty hunters.**  
Track targets, manage bugs, stay focused — all in one offline-first desktop app.

</div>

---

## 🖥️ For Friends — Just Run the .exe (Easiest Way)

> **No Node.js. No coding. Just double-click and go.**

### Step 1 — Download the installer

👉 Go to **[Releases](https://github.com/ramanneonx/bugb/releases)** and download:
- **`bugbOS Setup 1.0.0.exe`** ← Recommended (installs properly, creates Start Menu shortcut)
- **`bugbOS 1.0.0.exe`** ← Portable (no install, just run from anywhere)

### Step 2 — Run it

- Double-click `bugbOS Setup 1.0.0.exe`
- Click **"Next"**, choose install location (or leave default), click **"Install"**
- Done! bugbOS opens automatically ✅

> ⚠️ **Windows SmartScreen warning?**  
> This is normal for unsigned apps. Click **"More info"** → **"Run anyway"**. The app is safe — source code is fully public here.

---

## 🛠️ For Developers — Run from Source

### Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18 or higher | [nodejs.org](https://nodejs.org/) |
| Git | Any | [git-scm.com](https://git-scm.com/) |

### Step 1 — Clone the repo

```bash
git clone https://github.com/ramanneonx/bugb.git
cd bugb
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Start the app

```bash
npm start
```

Or just double-click `run.bat` on Windows.

---

## ☁️ Optional — Enable Google Drive Sync

bugbOS can automatically backup all your data to your personal Google Drive.  
**This is completely optional** — the app works 100% offline without it.

### Step 1 — Get your Google OAuth credentials (free)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a **New Project** (e.g. `bugbOS-Sync`)
3. Go to **APIs & Services → OAuth consent screen** → Choose **External** → Fill in your email → Save
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
5. Application type: **Web Application**
6. Authorized redirect URIs: add `http://localhost`
7. Click **Create** — copy your **Client ID** and **Client Secret**

### Step 2 — Create `gdrive-config.json`

In the bugbOS folder (same folder as `main.js`), create a file called **`gdrive-config.json`**:

```json
{
  "CLIENT_ID": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
  "CLIENT_SECRET": "YOUR_CLIENT_SECRET_HERE"
}
```

> 🔒 This file is **gitignored** — it never gets pushed to GitHub. It's yours only.

### Step 3 — Authenticate

Open bugbOS → Go to **Export/Settings** tab → Click **"Continue with Google"** → Approve in browser → Done!

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **Target Intelligence** | Per-target research dashboard with tabbed notes, tool logs, subdomain tracking, and checklists |
| 📡 **Bug Tracker** | Full bug management with priority, status, bounty tracking |
| 🗂️ **Kanban Board** | Visual drag-and-drop pipeline: Recon → Testing → Reported → Accepted → Paid |
| 🤖 **AI Investigator** | AI-assisted analysis for your targets |
| 🔍 **Recon Mastery** | Methodology guides and recon notes |
| ⚡ **Vulnerability Atlas** | Personal knowledge base for vulnerability types |
| 📝 **Research Docs** | Rich text documents per target — bold, lists, code, images |
| 📊 **Analytics** | Charts for severity, bug types, win-rate, earnings |
| ⏱️ **Focus Timer** | Pomodoro timer with animated robot mascot on completion + custom sounds |
| 🗂️ **Sidebar Customization** | Pin, hide, and reorder any sidebar tab to your preference |
| ☁️ **GDrive Sync** | One-click Google Drive backup — syncs all data across devices |
| 🎨 **10+ Themes** | Premium Minimalist, Acid Hacker, Cobalt, Neo-Brutalist, Hand-Drawn, Glassmorphism, and more |

---

## 🔒 Your Data is Safe

- **All data stored locally** in browser `localStorage` — no external servers
- **Auto-save** every 10 minutes
- **Export anytime**: CSV, Markdown, or full JSON backup
- **Upgrade safely**: Export backup → `git pull` → Import backup if needed
- **GDrive sync** goes directly to *your* Google Drive — bugbOS never sees your files

---

## 🏗️ Build exe yourself

```bash
npm install
npm run build
```

Output in `dist/`:
- `bugbOS Setup 1.0.0.exe` — NSIS installer
- `bugbOS 1.0.0.exe` — Portable exe

---

## 🛠️ Built With

- **Electron** — Desktop shell
- **Vanilla JS + CSS** — Zero framework bloat, maximum performance
- **Neo-Brutalist Design System** — Custom-built multi-theme engine

---

## 📜 License

MIT — fork it, mod it, ship it. 

---

<div align="center">
  <sub>Built with ⚡ by ramanneonx</sub>
</div>
