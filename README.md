<div align="center">
  <img src="https://img.shields.io/badge/bugbOS-Elite_Command_Center-00ff9f?style=for-the-badge&logo=electron&logoColor=black" alt="bugbOS" />
  <h1>bugbOS</h1>
  <p>A tactical cyber-intelligence Operating System for Elite Bug Bounty Hunters.</p>
</div>

## 🎯 What is bugbOS?
bugbOS is a hyper-fast, standalone Electron-based workspace designed to replace messy notes, scattered tools, and chaotic browser tabs. It acts as your command center for tracking targets, managing bugs, analyzing data, and maintaining focus during bug hunting sessions.

## ✨ Features
*   **Target Intelligence**: Manage targets, track scopes, and monitor recon progress.
*   **Kanban Bug Pipeline**: Drag-and-drop board for your findings (`Recon` → `Testing` → `Reported` → `Triaged` → `Accepted` → `Paid`).
*   **Analytics Dashboard**: Visual charts for severity distribution, bug types, win-rate, and bounty tracking.
*   **Focus Timer**: Built-in Pomodoro-style timer to track your hunting sessions and maintain productivity.
*   **Global Search (`CTRL+K`)**: Instantly search across all your bugs, targets, and notes.
*   **Export & Backup**: Export bugs to CSV, notes to Markdown, or take a full JSON backup of your OS state.
*   **100% Local**: All data is stored locally on your machine via `localStorage`. No cloud, no tracking.

## 🚀 Installation & Usage

It's incredibly simple to run bugbOS on your machine.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16 or higher)
*   Git

### 1. Clone the repository
```bash
git clone https://github.com/ramanneonx/bugb.git
cd bugb
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the OS
```bash
npm start
```
*(Alternatively, you can just run `run.bat` on Windows)*

---

## 🔒 Data Safety & Upgrades
Your data is safe! 
*   **User Data**: Any screenshots or attachments you want to save can be placed in the `userdata/` folder. This folder is ignored by git and is never touched during updates.
*   **Auto-Save**: The app automatically saves a snapshot of your data every 10 minutes.
*   **Upgrading**: Before pulling new updates from GitHub, go to the `Export / Backup` tab in the app and click **Export Full Backup**. After `git pull`, you can always import it back if needed.

## 🛠️ Built With
*   Electron
*   Vanilla JS & CSS (Zero framework bloat)
*   Neo-Brutalist Design System

## 📜 License
MIT License. Feel free to fork, modify, and improve!
