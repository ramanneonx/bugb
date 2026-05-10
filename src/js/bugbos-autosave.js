// bugbOS Auto-Save Module
// Saves a snapshot to localStorage every 10 minutes as a safety net
// ═══════════════════════════════════════════════════════════════

const AUTOSAVE_KEY = 'bb_autosave';
const AUTOSAVE_INTERVAL = 10 * 60 * 1000; // 10 minutes

function autoSave() {
  try {
    const snapshot = {
      version: '3.0',
      timestamp: new Date().toISOString(),
      bugs: JSON.parse(localStorage.getItem('bb_bugs') || '[]'),
      notes: JSON.parse(localStorage.getItem('bb_notes') || '[]'),
      targets: JSON.parse(localStorage.getItem('bb_targets') || '[]'),
      activity: JSON.parse(localStorage.getItem('bb_activity') || '[]'),
      sessions: JSON.parse(localStorage.getItem('bb_sessions') || '[]'),
      customRecon: JSON.parse(localStorage.getItem('bb_custom_recon') || '{}'),
      sessionPlanner: JSON.parse(localStorage.getItem('bb_session_planner') || '{}'),
      userTools: JSON.parse(localStorage.getItem('bb_user_tools') || '[]'),
      userPayloads: JSON.parse(localStorage.getItem('bb_user_payloads') || '[]'),
      settings: JSON.parse(localStorage.getItem('bugbos_settings') || '{}')
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot));
    localStorage.setItem('bb_autosave_time', new Date().toLocaleTimeString());
    updateAutoSaveUI();
  } catch (e) {
    console.warn('AutoSave failed:', e);
  }
}

function updateAutoSaveUI() {
  const el = document.getElementById('autosave-status');
  if (el) {
    const t = localStorage.getItem('bb_autosave_time') || 'Never';
    el.textContent = `⚡ Auto-saved at ${t}`;
    el.style.color = 'var(--acid)';
    setTimeout(() => { if (el) el.style.color = 'var(--text-tertiary)'; }, 3000);
  }
}

function recoverFromAutoSave() {
  const snap = localStorage.getItem(AUTOSAVE_KEY);
  if (!snap) { toast('No auto-save found', 'error'); return; }
  try {
    const data = JSON.parse(snap);
    const ts = new Date(data.timestamp).toLocaleString();
    if (!confirm(`Restore auto-save from ${ts}?\nThis will overwrite current data.`)) return;
    if (data.bugs) { bugs = data.bugs; localStorage.setItem('bb_bugs', JSON.stringify(bugs)); }
    if (data.notes) { notes = data.notes; localStorage.setItem('bb_notes', JSON.stringify(notes)); }
    if (data.targets) { targets = data.targets; localStorage.setItem('bb_targets', JSON.stringify(targets)); }
    if (data.activity) { activity = data.activity; localStorage.setItem('bb_activity', JSON.stringify(activity)); }
    if (data.customRecon) { localStorage.setItem('bb_custom_recon', JSON.stringify(data.customRecon)); }
    if (data.sessionPlanner) { localStorage.setItem('bb_session_planner', JSON.stringify(data.sessionPlanner)); }
    if (data.userTools) { localStorage.setItem('bb_user_tools', JSON.stringify(data.userTools)); }
    if (data.userPayloads) { localStorage.setItem('bb_user_payloads', JSON.stringify(data.userPayloads)); }
    if (data.sessions) { localStorage.setItem('bb_sessions', JSON.stringify(data.sessions)); }
    if (data.settings) { localStorage.setItem('bugbos_settings', JSON.stringify(data.settings)); }

    // Apply settings dynamically (theme presets, modes, customizer configuration)
    if (window.loadSettings) window.loadSettings();

    // Refresh UI Components
    if (window.updateStats) window.updateStats();
    if (window.renderMindset) window.renderMindset();
    if (window.renderRecon) window.renderRecon();
    if (window.renderVulnIndex) window.renderVulnIndex();
    if (window.renderTools) window.renderTools();
    if (window.renderPayloads) window.renderPayloads();
    if (window.renderTargets) window.renderTargets();
    if (window.renderActivity) window.renderActivity();
    if (window.buildAnalytics) window.buildAnalytics();
    if (window.renderKanban) window.renderKanban();

    toast(`Auto-save from ${ts} restored ✅`, 'success');
  } catch (err) {
    console.error(err);
    toast('Auto-save file is corrupted', 'error');
  }
}

function getAutoSaveInfo() {
  const snap = localStorage.getItem(AUTOSAVE_KEY);
  if (!snap) return null;
  try {
    const data = JSON.parse(snap);
    return {
      timestamp: new Date(data.timestamp).toLocaleString(),
      bugCount: (data.bugs || []).length,
      noteCount: (data.notes || []).length,
      targetCount: (data.targets || []).length
    };
  } catch { return null; }
}

function renderAutoSaveInfo() {
  const el = document.getElementById('autosave-info');
  if (!el) return;
  const info = getAutoSaveInfo();
  if (!info) {
    el.innerHTML = '<div class="muted small">No auto-save yet. One will be created in 10 minutes.</div>';
    return;
  }
  el.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px">
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(0,255,159,0.05); border:1px solid var(--acid); border-radius:var(--r-sm)">
        <div>
          <div style="font-weight:700; color:var(--acid)">⚡ Latest Auto-Save</div>
          <div class="muted small">${info.timestamp}</div>
          <div class="muted small">${info.bugCount} bugs · ${info.noteCount} notes · ${info.targetCount} targets</div>
        </div>
        <button class="btn-ghost btn-sm" onclick="recoverFromAutoSave()">↺ Restore</button>
      </div>
      <div class="muted small" style="text-align:center">Auto-saves every 10 minutes while the app is open</div>
    </div>
  `;
}

// Start auto-save timer
setInterval(autoSave, AUTOSAVE_INTERVAL);
// First auto-save after 1 minute
setTimeout(autoSave, 60 * 1000);
