function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ═══════════════════════════════════════════════════
// bugbOS v3.0 — Core Logic (academy.html only)
// ═══════════════════════════════════════════════════

// Guard: only run on the academy page (has #page-title)
// (Removed outer page guard block to expose functions and state globally)

// STATE
var bugs    = JSON.parse(localStorage.getItem('bb_bugs')    || '[]');
var notes   = JSON.parse(localStorage.getItem('bb_notes')   || '[]');
var targets = JSON.parse(localStorage.getItem('bb_targets') || '[]');
var editingNoteId = null;
var currentAnimKey = null;
var animNotes = JSON.parse(localStorage.getItem('bb_anim_notes') || '{}');

// ─── CLOUD SYNC HOOK ────────────────────────────────
function onDataChange() {
  if (window.triggerCloudSync) window.triggerCloudSync();
}

function saveBugs() {
  localStorage.setItem('bb_bugs', JSON.stringify(bugs));
  onDataChange();
}

function saveNotes() {
  localStorage.setItem('bb_notes', JSON.stringify(notes));
  onDataChange();
}



function saveAppData(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
  onDataChange();
}

const SESSION_DEFAULT_CHECKLIST = [
  { text: "Scope Check: Verified in-scope/out-of-scope assets from policy", done: false },
  { text: "Platform Login: Authenticated into HackerOne/Bugcrowd/Private dashboard", done: false },
  { text: "Proxy Connected: Traffic is intercepting properly in Burp/ZAP", done: false },
  { text: "Radar Synced: Passive/active recon lists are loaded into Target Intel", done: false },
  { text: "Documentation Ready: Obsidian/Notes tab open and ready for evidence", done: false },
  { text: "Environment Clean: Browser cache cleared and clean profile active", done: false },
  { text: "Automation Ready: Nuclei/Custom scanners primed for specific target", done: false },
  { text: "Distractions Muted: Notifications off, deep flow-state mode initiated", done: false },
  { text: "Vulnerability Mindset: Ready to hunt specific attack patterns", done: false },
  { text: "Backup Verified: Google Drive sync is connected and functioning", done: false }
];

// ─── NAVIGATION ─────────────────────────────────────
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(el => {
  el.addEventListener('click', () => {
    const v = el.dataset.view;
    if (v) showView(v);
  });
});


document.getElementById('menu-btn').addEventListener('click', () => {
  const sb = document.getElementById('sidebar');
  sb.style.transform = sb.style.transform === 'translateX(-240px)' ? '' : 'translateX(-240px)';
});

// ─── BACKGROUND CANVAS ──────────────────────────────
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
resize(); window.addEventListener('resize', resize);
for (let i = 0; i < 70; i++) {
  particles.push({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    r: Math.random() * 1.2 + 0.3,
    vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
    a: Math.random() * Math.PI * 2,
    color: Math.random() > 0.6 ? '0,255,159' : Math.random() > 0.5 ? '0,229,255' : '155,89,182'
  });
}
function animBg() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.a += 0.008;
    if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
    if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${p.color},${0.15 + 0.1 * Math.sin(p.a)})`; ctx.fill();
  });
  requestAnimationFrame(animBg);
}
animBg();

// ─── STATS ──────────────────────────────────────────
function updateStats() {
  const total  = bugs.reduce((s, b) => s + (parseFloat(b.bounty) || 0), 0);
  const targets = [...new Set(bugs.map(b => b.target).filter(Boolean))].length;
  const notesCount = notes.length;

  animateValue('d-bugs', 0, bugs.length, 500);
  animateValue('d-bounty', 0, total, 800, true);
  animateValue('d-targets', 0, targets, 500);
  animateValue('d-notes', 0, notesCount, 500);
  
  setEl('stat-bugs',  bugs.length);
  setEl('stat-bounty',total.toLocaleString());
  setEl('stat-targets',targets);
  setEl('badge-bugs', bugs.length);

  // XP
  const lvl  = Math.floor(bugs.length / 5) + 1;
  const pct  = ((bugs.length % 5) / 5 * 100);
  setEl('xp-level', 'LVL ' + lvl);
  const xfill = document.getElementById('xp-fill');
  if (xfill) xfill.style.width = pct + '%';

  // Streak
  const streak = Math.min(bugs.length * 2, 30);
  setEl('streak-count', streak);

  renderPipeline();
}

function animateValue(id, start, end, duration, isCurrency = false) {
  const obj = document.getElementById(id);
  if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const val = Math.floor(progress * (end - start) + start);
    obj.textContent = isCurrency ? val.toLocaleString() : val;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}


function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── PIPELINE ───────────────────────────────────────
function renderPipeline() {
  ['found','reported','triaged','bounty'].forEach(s => {
    const el = document.getElementById('pipe-' + s + '-items');
    if (el) el.innerHTML = '';
  });
  bugs.forEach(b => {
    const el = document.createElement('div');
    el.className = 'pipe-card';
    el.innerHTML = `<div class="pipe-card-title"><span class="sev-badge sev-${b.severity}">${b.severity}</span> ${escapeHTML(b.title)}</div><div class="pipe-card-meta">${escapeHTML(b.target || '')}</div>`;
    const col = document.getElementById('pipe-' + b.status + '-items');
    if (col) col.appendChild(el);
  });
}

// ─── BUG CRUD ───────────────────────────────────────
function quickAddBug() {
  const title = document.getElementById('q-title').value.trim();
  if (!title) return toast('Enter a bug title', 'error');
  bugs.push({ id: Date.now(), title, severity: document.getElementById('q-severity').value, target: document.getElementById('q-target').value || 'Unknown', type: 'Other', status: 'found', bounty: 0, notes: '', date: new Date().toLocaleDateString() });
  saveBugs(); document.getElementById('q-title').value = '';
  toast('Bug added! 🎉', 'success');
}

function showAddBugModal() { document.getElementById('modal-bug').classList.remove('hidden'); }

function saveBug() {
  const title = document.getElementById('m-title').value.trim();
  if (!title) return toast('Enter a title', 'error');
  const bug = { id: Date.now(), title, severity: document.getElementById('m-severity').value, target: document.getElementById('m-target').value || 'Unknown', type: document.getElementById('m-type').value, status: document.getElementById('m-status').value, bounty: parseFloat(document.getElementById('m-bounty').value) || 0, notes: document.getElementById('m-notes').value, date: new Date().toLocaleDateString() };
  bugs.push(bug);
  saveBugs(); closeModal('modal-bug'); renderTracker(); toast('Bug saved! 🎉', 'success');
  logActivity(`New bug found: ${bug.title}`, 'success');
}

function saveBugs() { localStorage.setItem('bb_bugs', JSON.stringify(bugs)); updateStats(); }

function deleteBug(id) {
  bugs = bugs.filter(b => b.id !== id);
  saveBugs(); renderTracker(); toast('Bug deleted', 'info');
}

function renderTracker(filter) {
  const active = filter || document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  const list   = active === 'all' ? bugs : bugs.filter(b => b.severity === active);
  const tbody  = document.getElementById('bugs-tbody');
  if (!tbody) return;
  tbody.innerHTML = list.length === 0
    ? `<tr><td colspan="8" style="text-align:center;color:var(--text-tertiary);padding:32px">No bugs yet. Start hunting!</td></tr>`
    : list.map(b => `
    <tr>
      <td><span class="sev-badge sev-${b.severity}">${b.severity}</span></td>
      <td><strong style="font-size:.9rem">${escapeHTML(b.title)}</strong><div style="font-size:.72rem;color:var(--text-tertiary)">${escapeHTML(b.type)}</div></td>
      <td style="color:var(--cyan);font-family:var(--font-mono);font-size:.82rem">${escapeHTML(b.target)}</td>
      <td><span class="tag tag-acid" style="font-size:.65rem">${escapeHTML(b.type)}</span></td>
      <td><span style="color:var(--text-secondary);font-size:.82rem">${b.status}</span></td>
      <td style="color:var(--acid);font-weight:700;font-family:var(--font-mono)">${b.bounty ? '$' + b.bounty : '—'}</td>
      <td style="color:var(--text-tertiary);font-size:.8rem">${b.date}</td>
      <td><button class="btn-danger btn-sm" onclick="deleteBug(${b.id})">Delete</button></td>
    </tr>`).join('');

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === active);
    btn.onclick = () => renderTracker(btn.dataset.filter);
  });
}

// ─── MODALS ──────────────────────────────────────────
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// ─── TOAST ───────────────────────────────────────────
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2800);
}

// ─── NOTES ───────────────────────────────────────────
function addNote() {
  editingNoteId = null;
  ['n-title','n-body'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('n-tag').value = 'General';
  document.getElementById('modal-note').classList.remove('hidden');
  setTimeout(() => document.getElementById('n-title').focus(), 100);
}

function saveNote() {
  const title = document.getElementById('n-title').value.trim();
  if (!title) return toast('Enter a title', 'error');
  const note = { id: editingNoteId || Date.now(), title, body: document.getElementById('n-body').value, tag: document.getElementById('n-tag').value };
  if (editingNoteId) { notes = notes.map(n => n.id === editingNoteId ? note : n); }
  else { notes.push(note); }
  localStorage.setItem('bb_notes', JSON.stringify(notes));
  onDataChange();
  closeModal('modal-note'); renderNotes(); updateStats();
  toast('Note saved! 📝', 'success');
  logActivity(`Note updated: ${note.title}`, 'info');
}

function renderNotes(q) {
  const list = q ? notes.filter(n => (n.title + n.body).toLowerCase().includes(q)) : notes;
  const grid = document.getElementById('notes-grid');
  if (!grid) return;
  if (!list.length) { grid.innerHTML = '<div style="color:var(--text-tertiary);padding:40px;text-align:center">No notes yet. Click + New Note.</div>'; return; }
  grid.innerHTML = list.map(n => `
    <div class="note-card">
      <div class="note-card-title">${escapeHTML(n.title)}</div>
      <div class="note-card-body">${escapeHTML((n.body||'').slice(0,160))}${(n.body||'').length>160?'...':''}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
        <span class="note-card-tag">${escapeHTML(n.tag||'General')}</span>
        <div style="display:flex;gap:6px">
          <button class="btn-acid btn-sm" onclick="editNote(${n.id})">Edit</button>
          <button class="btn-danger btn-sm" onclick="deleteNote(${n.id})">Del</button>
        </div>
      </div>
    </div>`).join('');
}

function editNote(id) {
  const n = notes.find(n => n.id === id); if (!n) return;
  editingNoteId = id;
  document.getElementById('n-title').value = n.title;
  document.getElementById('n-body').value  = n.body || '';
  document.getElementById('n-tag').value   = n.tag  || 'General';
  document.getElementById('modal-note').classList.remove('hidden');
}

function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  localStorage.setItem('bb_notes', JSON.stringify(notes));
  renderNotes(); updateStats(); toast('Note deleted', 'info');
}

function searchNotes(q) { renderNotes(q.toLowerCase()); }
// ─── INITIALIZATION ─────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initCustomization();
  updateStats();
  renderMindset();
  renderRecon();
  renderVulnIndex();
  renderTools();
  renderPayloads();
  renderTargets();
  renderActivity();
  buildAnalytics();
  initTimer();
  renderKanban();

  // Enter key helpers for modal inputs and lists
  const mtName = document.getElementById('mt-name');
  if (mtName) {
    mtName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveTarget();
    });
  }
  const mtScope = document.getElementById('mt-scope');
  if (mtScope) {
    mtScope.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveTarget();
    });
  }
  const tdNewItem = document.getElementById('td-new-item');
  if (tdNewItem) {
    tdNewItem.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addTargetChecklistItem();
    });
  }
});



// ─── RENDERING FUNCTIONS ─────────────────────────────

function renderMindset() {
  // Mindset is now the Pre-Hunting Session Planner!
  const objInput = document.getElementById('sp-objective');
  const targetSel = document.getElementById('sp-target-select');
  const notesArea = document.getElementById('sp-notes');
  const checklistContainer = document.getElementById('session-checklist-items');

  if (!objInput || !targetSel || !notesArea || !checklistContainer) return;

  // Load target options
  targetSel.innerHTML = '<option value="">-- Select Active Target --</option>' + 
    targets.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('');

  // Load saved session planner state
  const state = JSON.parse(localStorage.getItem('bb_session_planner') || '{}');
  
  objInput.value = state.objective || '';
  targetSel.value = state.targetId || '';
  notesArea.value = state.notes || '';

  // Default checklist items if none saved
  const defaultChecklist = [
    { text: "Scope Check: Verified in-scope/out-of-scope assets from policy", done: false },
    { text: "Proxy Connected: Traffic is intercepting properly in Burp/ZAP", done: false },
    { text: "Radar Synced: Passive/active recon lists are loaded into Target Intel", done: false },
    { text: "Distractions Muted: Notifications off, deep flow-state mode initiated", done: false },
    { text: "Vulnerability Mindset: Ready to hunt specific attack patterns", done: false }
  ];

  const checklist = state.checklist || defaultChecklist;

  checklistContainer.innerHTML = checklist.map((item, idx) => `
    <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-glass); padding:8px 12px; border-radius:var(--r-sm); border:1px solid var(--border); gap:10px">
      <label style="display:flex; align-items:center; gap:10px; cursor:pointer; flex:1; margin:0">
        <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleSessionChecklistItem(${idx})" style="width:16px; height:16px; accent-color:var(--acid); cursor:pointer">
        <span style="font-size:0.85rem; color:${item.done ? 'var(--text-tertiary)' : 'var(--text-secondary)'}; text-decoration:${item.done ? 'line-through' : 'none'}">${escapeHTML(item.text)}</span>
      </label>
      <button class="btn-ghost btn-sm" onclick="deleteSessionChecklistItem(${idx})" style="padding:0; min-width:24px; height:24px; color:var(--red); border:none; background:transparent">✕</button>
    </div>
  `).join('');

  // Update stats
  const total = checklist.length;
  const done = checklist.filter(c => c.done).length;
  const statsEl = document.getElementById('sp-checklist-stats');
  const tagEl = document.getElementById('sp-session-ready-tag');

  if (statsEl) statsEl.textContent = `${done}/${total} Checklist Completed`;
  if (tagEl) {
    if (done === total && total > 0) {
      tagEl.style.display = 'inline-block';
      tagEl.classList.add('pulse');
    } else {
      tagEl.style.display = 'none';
    }
  }
}

function saveSessionPlannerData() {
  const objInput = document.getElementById('sp-objective');
  const targetSel = document.getElementById('sp-target-select');
  const notesArea = document.getElementById('sp-notes');

  const oldState = JSON.parse(localStorage.getItem('bb_session_planner') || '{}');
  const state = {
    objective: objInput ? objInput.value : '',
    targetId: targetSel ? targetSel.value : '',
    notes: notesArea ? notesArea.value : '',
    checklist: oldState.checklist || []
  };

  saveAppData('bb_session_planner', state);
}

function toggleSessionChecklistItem(idx) {
  const state = JSON.parse(localStorage.getItem('bb_session_planner') || '{}');
  const checklist = state.checklist && state.checklist.length ? state.checklist : [...SESSION_DEFAULT_CHECKLIST];
  
  checklist[idx].done = !checklist[idx].done;
  state.checklist = checklist;

  saveAppData('bb_session_planner', state);
  renderMindset();

  // Show a glorious toast if complete!
  if (checklist.every(c => c.done)) {
    toast('🚀 RADAR ACTIVE! Flow State Engaged. Let\'s Hack! 💣', 'success');
  }
}

function addSessionChecklistItem() {
  const input = document.getElementById('sp-new-item');
  if (!input || !input.value.trim()) return;
  
  const state = JSON.parse(localStorage.getItem('bb_session_planner') || '{}');
  const checklist = state.checklist && state.checklist.length ? state.checklist : [...SESSION_DEFAULT_CHECKLIST];
  checklist.push({ text: input.value.trim(), done: false });
  state.checklist = checklist;
  saveAppData('bb_session_planner', state);
  input.value = '';
  renderMindset();
  toast('Custom check added!', 'success');
}

function deleteSessionChecklistItem(idx) {
  const state = JSON.parse(localStorage.getItem('bb_session_planner') || '{}');
  const checklist = state.checklist && state.checklist.length ? state.checklist : [...SESSION_DEFAULT_CHECKLIST];
  checklist.splice(idx, 1);
  state.checklist = checklist;
  saveAppData('bb_session_planner', state);
  renderMindset();
  toast('Check deleted', 'info');
}

function resetSessionPlanner() {
  if (!confirm('Are you sure you want to reset your pre-hunting session planner?')) return;
  localStorage.removeItem('bb_session_planner');
  renderMindset();
  toast('Planner reset! 🔄', 'info');
}

// ─── WORKSPACE CUSTOMIZATION ──────────────────────────
// All customization logic is handled by bugbos-settings.js.
// initCustomization is a no-op — loadSettings() already runs on DOMContentLoaded.

function initCustomization() {
  // No-op: bugbos-settings.js handles all theme/layout/tab init.
}

// toggleTabVisibility, applyThemePreset, customThemeColorChanged,
// resetThemeToDefault, applyStructuralMode, applyTypography
// are ALL defined in bugbos-settings.js which loads before this file.
// Do NOT redefine them here — it would shadow the settings module.

function renderTools() {
  const container = document.getElementById('tools-content');
  if (!container) return;

  const customTools = JSON.parse(localStorage.getItem('bb_user_tools') || '[]');
  const allTools = [...toolsData, ...customTools.map(t => ({ ...t, isCustom: true }))];

  container.innerHTML = allTools.map(tool => {
    const cmds = tool.commands || (tool.cmd ? [tool.cmd] : []);
    
    const cmdsHtml = cmds.map(c => {
      const b64 = btoa(unescape(encodeURIComponent(c)));
      const escapedCmd = c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `
        <div style="background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:var(--r-xs); padding:8px; margin-bottom:8px; display:flex; flex-direction:column; gap:6px">
          <div class="tool-cmd" style="margin:0; font-size:0.75rem">${escapedCmd}</div>
          <button class="btn-ghost btn-sm" style="align-self:flex-end; font-size:0.6rem; padding:2px 8px" onclick="copyTextEncoded('${b64}')">📋 Copy</button>
        </div>
      `;
    }).join('');

    if (tool.isCustom) {
      return `
        <div class="tool-card" style="border-color:rgba(0,255,159,0.2)">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px">
            <div class="tool-name" style="color:var(--acid)">${escapeHTML(tool.name)} <span class="tag tag-acid" style="font-size:0.55rem; padding:2px 4px; vertical-align:middle; margin-left:4px">CUSTOM</span></div>
            <div style="display:flex; gap:6px">
              <button class="btn-ghost btn-sm" style="padding:2px 6px; border:none; background:transparent" onclick="editCustomTool(${tool.id})">✏️</button>
              <button class="btn-ghost btn-sm" style="padding:2px 6px; border:none; background:transparent; color:var(--red)" onclick="deleteCustomTool(${tool.id})">🗑</button>
            </div>
          </div>
          <div class="tool-desc" style="margin-bottom:12px">${escapeHTML(tool.desc)}</div>
          <div class="tool-cmds-list">${cmdsHtml}</div>
        </div>
      `;
    } else {
      return `
        <div class="tool-card">
          <div class="tool-name" style="margin-bottom:8px">${escapeHTML(tool.name)}</div>
          <div class="tool-desc" style="margin-bottom:12px">${escapeHTML(tool.desc)}</div>
          <div class="tool-cmds-list">${cmdsHtml}</div>
        </div>
      `;
    }
  }).join('');
}

function addToolCommandInput(value = '') {
  const container = document.getElementById('p-tool-cmds-container');
  if (!container) return;
  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.gap = '8px';
  div.innerHTML = `
    <textarea class="q-input tool-cmd-input" rows="2" style="flex:1" placeholder="Enter command...">${value}</textarea>
    <button class="btn-ghost" onclick="this.parentElement.remove()" style="padding:0 10px; color:var(--red); border-color:var(--red)">✕</button>
  `;
  container.appendChild(div);
}

function showAddToolModal() {
  const m = document.getElementById('modal-tool');
  if (m) m.classList.remove('hidden');
  document.getElementById('tool-modal-title').textContent = 'Add Custom Tool';
  document.getElementById('p-tool-id').value = '';
  document.getElementById('p-tool-name').value = '';
  document.getElementById('p-tool-desc').value = '';
  document.getElementById('p-tool-cmds-container').innerHTML = '';
  addToolCommandInput();
}

function editCustomTool(id) {
  const customTools = JSON.parse(localStorage.getItem('bb_user_tools') || '[]');
  const tool = customTools.find(t => t.id === id);
  if (!tool) return;

  const m = document.getElementById('modal-tool');
  if (m) m.classList.remove('hidden');

  document.getElementById('tool-modal-title').textContent = 'Edit Custom Tool';
  document.getElementById('p-tool-id').value = tool.id;
  document.getElementById('p-tool-name').value = tool.name;
  document.getElementById('p-tool-desc').value = tool.desc;
  
  const container = document.getElementById('p-tool-cmds-container');
  container.innerHTML = '';
  const cmds = tool.commands || (tool.cmd ? [tool.cmd] : []);
  cmds.forEach(c => addToolCommandInput(c));
  if (cmds.length === 0) addToolCommandInput();
}

function saveCustomTool() {
  const idVal = document.getElementById('p-tool-id').value;
  const name = document.getElementById('p-tool-name').value.trim();
  const desc = document.getElementById('p-tool-desc').value.trim();
  
  const cmdInputs = document.querySelectorAll('.tool-cmd-input');
  const commands = Array.from(cmdInputs).map(i => i.value.trim()).filter(Boolean);

  if (!name || commands.length === 0) return toast('Please enter name and at least one command', 'error');

  const customTools = JSON.parse(localStorage.getItem('bb_user_tools') || '[]');

  if (idVal) {
    // Edit mode
    const id = parseFloat(idVal);
    const idx = customTools.findIndex(t => t.id === id);
    if (idx !== -1) {
      customTools[idx] = { id, name, desc, commands, isCustom: true };
      toast('Custom tool updated! 🔧', 'success');
    }
  } else {
    // Add mode
    const newTool = {
      id: Date.now(),
      name,
      desc,
      commands,
      isCustom: true
    };
    customTools.push(newTool);
    toast('Custom tool added! 🔧', 'success');
  }

  saveAppData('bb_user_tools', customTools);
  closeModal('modal-tool');
  renderTools();
}

function deleteCustomTool(id) {
  if (!confirm('Are you sure you want to delete this custom tool?')) return;

  let customTools = JSON.parse(localStorage.getItem('bb_user_tools') || '[]');
  customTools = customTools.filter(t => t.id !== id);
  saveAppData('bb_user_tools', customTools);

  toast('Custom tool deleted', 'info');
  renderTools();
}

function renderCases() {
  const container = document.getElementById('cases-content');
  if (!container) return;
  container.innerHTML = casesData.map(c => `
    <div class="case-card">
      <div class="case-title">${escapeHTML(c.title)}</div>
      <div class="case-target">${escapeHTML(c.target)} | <span style="color:var(--acid)">${c.bounty}</span></div>
      <div class="case-steps" style="white-space:pre-line">${escapeHTML(c.body)}</div>
      ${c.link ? `<a href="${c.link}" target="_blank" class="case-link">Read Full Writeup &rarr;</a>` : ''}
    </div>
  `).join('');
}

function renderRecon() {
  const customRecon = JSON.parse(localStorage.getItem('bb_custom_recon') || '{}');
  const container = document.getElementById('recon-content');
  if (!container) return;
  container.innerHTML = reconData.map((phase, idx) => {
    const customItems = customRecon[idx] || [];
    const allItems = [...phase.items, ...customItems];
    return `
    <div class="phase-block">
      <div class="phase-title" style="display:flex; justify-content:space-between; align-items:center">
        ${phase.phase}
        <button class="btn-ghost btn-sm" onclick="showAddReconItemModal(${idx})" style="font-size:0.75rem; padding:2px 6px">➕ Add Item</button>
      </div>
      <div class="phase-body">
        ${allItems.map((item, itemIdx) => `
          <div class="phase-item">
            <div class="phase-item-title" style="display:flex; justify-content:space-between; align-items:center">
              ${escapeHTML(item.title)}
              ${item.isCustom ? `<button class="btn-ghost btn-sm" onclick="deleteCustomReconItem(${idx}, '${item.id}')" style="color:var(--red); border:none; padding:0 4px">✕</button>` : ''}
            </div>
            <div class="phase-item-body">
              ${escapeHTML(item.body).replace(/\n/g, '<br>')}
              ${item.imagePath ? `<div style="margin-top:10px;"><img src="file://${item.imagePath}" style="max-width:100%; border-radius:var(--r-sm); border:1px solid var(--border)"></div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `}).join('');
}

// === Recon CRUD ===
let currentReconPhaseIdx = null;

function showAddReconItemModal(phaseIdx) {
  currentReconPhaseIdx = phaseIdx;
  document.getElementById('modal-recon').classList.remove('hidden');
  document.getElementById('recon-title').value = '';
  document.getElementById('recon-body').value = '';
  document.getElementById('recon-file').value = '';
  document.getElementById('recon-title').focus();
}

async function saveReconItem() {
  const title = document.getElementById('recon-title').value.trim();
  const body = document.getElementById('recon-body').value.trim();
  const fileInput = document.getElementById('recon-file');
  
  if (!title) return alert('Title is required');
  
  let imagePath = null;
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    // Read file as base64
    const base64Data = await new Promise((resolve) => {
      reader.onload = (e) => resolve(e.target.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    
    if (window.api && window.api.saveFile) {
      imagePath = await window.api.saveFile(file.name, base64Data);
    }
  }
  
  const customRecon = JSON.parse(localStorage.getItem('bb_custom_recon') || '{}');
  if (!customRecon[currentReconPhaseIdx]) customRecon[currentReconPhaseIdx] = [];
  
  customRecon[currentReconPhaseIdx].push({
    id: 'recon_' + Date.now(),
    title,
    body,
    imagePath,
    isCustom: true
  });
  
  saveAppData('bb_custom_recon', customRecon);
  closeModal('modal-recon');
  renderRecon();
  toast('Recon item added! 🔍', 'success');
}

function deleteCustomReconItem(phaseIdx, itemId) {
  if (!confirm('Delete this custom recon item?')) return;
  
  const customRecon = JSON.parse(localStorage.getItem('bb_custom_recon') || '{}');
  if (customRecon[phaseIdx]) {
    customRecon[phaseIdx] = customRecon[phaseIdx].filter(item => item.id !== itemId);
    saveAppData('bb_custom_recon', customRecon);
    renderRecon();
    toast('Item deleted', 'info');
  }
}

function renderVulnIndex() {
  const container = document.getElementById('vuln-index-list');
  if (!container) return;
  container.innerHTML = vulnData.map((vuln, idx) => `
    <div class="vuln-index-item" onclick="selectVuln(${idx})">
      <div style="width:10px; height:10px; border-radius:50%; background:${vuln.color}"></div>
      ${escapeHTML(vuln.name)}
    </div>
  `).join('');
}

function selectVuln(idx) {
  const vuln = vulnData[idx];
  document.querySelectorAll('.vuln-index-item').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
  
  document.getElementById('vuln-empty-state').classList.add('hidden');
  document.getElementById('vuln-detail-content').classList.remove('hidden');
  
  document.getElementById('vd-title').textContent = vuln.name;
  document.getElementById('vd-desc').textContent = vuln.desc;
  document.getElementById('vd-anim').innerHTML = vuln.anim;
  
  const checks = document.getElementById('vd-checks');
  checks.innerHTML = vuln.checks.map(c => `<li>${c}</li>`).join('');
  
  // Load notes
  const noteKey = `vuln_note_${escapeHTML(vuln.name)}`;
  const savedNote = localStorage.getItem(noteKey) || '';
  document.getElementById('vd-notes-display').innerHTML = savedNote || '<p class="muted">No personal notes yet. Click Edit to add your own methodologies and payloads.</p>';
  document.getElementById('vd-editor').innerHTML = savedNote;

  // Render Payloads
  const payloadsContainer = document.getElementById('vd-payloads-container');
  const payloadsList = document.getElementById('vd-payloads');
  
  if (vuln.payloads && vuln.payloads.length > 0) {
    payloadsContainer.classList.remove('hidden');
    payloadsList.innerHTML = vuln.payloads.map(p => `
      <div style="background:var(--bg-elevated); border:1px solid var(--border); padding:10px; border-radius:var(--r-sm); position:relative;">
        <code style="color:var(--text-code); font-family:var(--font-mono); font-size:0.85rem; white-space:pre-wrap; word-break:break-all; display:block; padding-right:40px;">${escapeHTML(p)}</code>
        <button class="btn-ghost btn-sm" onclick="copyTextEncoded('${btoa(unescape(encodeURIComponent(p)))}')" style="position:absolute; top:8px; right:8px; padding:2px 8px; font-size:0.75rem;">Copy</button>
      </div>
    `).join('');
  } else {
    payloadsContainer.classList.add('hidden');
    payloadsList.innerHTML = '';
  }
}

function toggleVulnEditor() {
  const isEditing = !document.getElementById('vd-notes-editor-container').classList.contains('hidden');
  if (isEditing) {
    document.getElementById('vd-notes-editor-container').classList.add('hidden');
    document.getElementById('vd-notes-display').classList.remove('hidden');
    document.getElementById('btn-vuln-save').classList.add('hidden');
    document.getElementById('btn-vuln-edit').textContent = '✏️ Edit Notes';
  } else {
    document.getElementById('vd-notes-editor-container').classList.remove('hidden');
    document.getElementById('vd-notes-display').classList.add('hidden');
    document.getElementById('btn-vuln-save').classList.remove('hidden');
    document.getElementById('btn-vuln-edit').textContent = '✕ Cancel';
    document.getElementById('vd-editor').focus();
  }
}

function saveVulnNotes() {
  const title = document.getElementById('vd-title').textContent;
  const content = document.getElementById('vd-editor').innerHTML;
  saveAppData(`vuln_note_${title}`, content);
  document.getElementById('vd-notes-display').innerHTML = content;
  toggleVulnEditor();
  toast('Methodology saved! 📚', 'success');
}

function getMergedPayloadData() {
  // Deep clone payloadData so we don't mutate the original static data
  const baseData = JSON.parse(JSON.stringify(payloadData));
  const customPayloads = JSON.parse(localStorage.getItem('bb_user_payloads') || '[]');

  customPayloads.forEach(p => {
    let cat = baseData.find(c => c.category.toLowerCase() === p.category.toLowerCase());
    if (!cat) {
      cat = {
        category: p.category,
        color: '#ff2d55', // Unique neon color for custom categories
        payloads: []
      };
      baseData.push(cat);
    }
    cat.payloads.push({ name: p.name, payload: p.payload });
  });

  return baseData;
}

function renderPayloads(filter = 'all', searchQ = '') {
  const filterBar = document.getElementById('payload-filter-bar');
  const grid = document.getElementById('payload-grid');
  if (!filterBar || !grid) return;

  const mergedData = getMergedPayloadData();

  // Filter by category
  let filteredData = filter === 'all' ? mergedData : mergedData.filter(c => c.category.toLowerCase() === filter.toLowerCase());

  // Filter by search query if present
  if (searchQ) {
    const q = searchQ.toLowerCase().trim();
    filteredData = filteredData.map(cat => {
      return {
        ...cat,
        payloads: cat.payloads.filter(p => p.name.toLowerCase().includes(q) || p.payload.toLowerCase().includes(q))
      };
    }).filter(cat => cat.payloads.length > 0);
  }

  // Render filters
  filterBar.innerHTML = `<button class="filter-btn ${filter === 'all' ? 'active' : ''}" onclick="renderPayloads('all')">All</button>` + 
    mergedData.map(cat => `
      <button class="filter-btn ${filter === cat.category ? 'active' : ''}" onclick="renderPayloads('${cat.category}')">${cat.category}</button>
    `).join('');

  if (filteredData.length === 0) {
    grid.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-tertiary)">No payloads found matching "${searchQ}"</div>`;
    return;
  }

  grid.innerHTML = filteredData.map(cat => `
    <div class="panel">
      <div class="panel-header">
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%">
          <div style="display:flex; align-items:center; gap:8px">
            <div class="ph-dot" style="background:${cat.color}"></div>
            <span>${cat.category} Arsenal</span>
          </div>
        </div>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:12px">
        ${cat.payloads.map(p => {
          // Check if it's a custom payload so we can optionally delete it!
          const isCustom = JSON.parse(localStorage.getItem('bb_user_payloads') || '[]').some(x => x.name === p.name);
          
          // Support for an array of payloads per entry
          const payloadList = Array.isArray(p.payload) ? p.payload : [p.payload];

          return `
            <div class="phase-item" style="display:flex; flex-direction:column; justify-content:space-between; border-color:${isCustom ? 'rgba(255,45,85,0.3)' : 'var(--border)'}">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center">
                  <div class="phase-item-title" style="color:${isCustom ? '#ff2d55' : cat.color}">${escapeHTML(p.name)}</div>
                  ${isCustom ? `<button class="btn-ghost btn-sm" style="color:var(--red); padding:2px 6px; border:none; background:transparent" onclick="deleteCustomPayload('${p.name.replace(/'/g, "\\'")}')">🗑</button>` : ''}
                </div>
                ${payloadList.map(pl => {
                  const b64 = btoa(unescape(encodeURIComponent(pl)));
                  const escapedPayload = pl.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                  return `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; border-top:1px dashed var(--border); padding-top:8px">
                      <div class="tool-cmd" style="margin:0; font-size:.7rem; word-break:break-all; flex:1">${escapedPayload}</div>
                      <button class="btn-ghost btn-sm" style="margin-left:8px" onclick="copyTextEncoded('${b64}')">Copy</button>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}

function filterPayloads(q) {
  const activeBtn = document.querySelector('#payload-filter-bar .filter-btn.active');
  const activeFilter = activeBtn ? activeBtn.textContent : 'all';
  renderPayloads(activeFilter === 'All' ? 'all' : activeFilter, q);
}

function showAddPayloadModal() {
  const m = document.getElementById('modal-payload');
  if (m) m.classList.remove('hidden');
  document.getElementById('p-name').value = '';
  document.getElementById('p-contents-container').innerHTML = `
    <div class="payload-input-group" style="display:flex; gap:8px; align-items:flex-start">
      <textarea class="q-input payload-content-input" rows="2" style="flex:1" placeholder="e.g. &lt;script&gt;alert(1)&lt;/script&gt;"></textarea>
      <button class="btn-ghost" onclick="if(document.querySelectorAll('.payload-content-input').length > 1) this.parentElement.remove()" style="color:var(--red); padding:8px">✕</button>
    </div>
  `;
}

function addPayloadInput() {
  const container = document.getElementById('p-contents-container');
  const div = document.createElement('div');
  div.className = 'payload-input-group';
  div.style.cssText = 'display:flex; gap:8px; align-items:flex-start';
  div.innerHTML = `
    <textarea class="q-input payload-content-input" rows="2" style="flex:1" placeholder="e.g. &lt;script&gt;alert(1)&lt;/script&gt;"></textarea>
    <button class="btn-ghost" onclick="if(document.querySelectorAll('.payload-content-input').length > 1) this.parentElement.remove()" style="color:var(--red); padding:8px">✕</button>
  `;
  container.appendChild(div);
}

function saveCustomPayload() {
  const name = document.getElementById('p-name').value.trim();
  const category = document.getElementById('p-category').value;
  
  const contentInputs = document.querySelectorAll('.payload-content-input');
  const payloadList = [];
  contentInputs.forEach(input => {
    if (input.value.trim()) payloadList.push(input.value.trim());
  });

  if (!name || payloadList.length === 0) return toast('Please fill in name and at least one payload', 'error');

  const customPayloads = JSON.parse(localStorage.getItem('bb_user_payloads') || '[]');
  
  if (customPayloads.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    return toast('A payload with this name already exists', 'error');
  }

  customPayloads.push({ name, category, payload: payloadList });
  saveAppData('bb_user_payloads', customPayloads);

  closeModal('modal-payload');
  toast('Custom payload added successfully! 💣', 'success');
  
  // Reload payloads
  renderPayloads();
}

function deleteCustomPayload(name) {
  if (!confirm(`Are you sure you want to delete custom payload "${name}"?`)) return;
  
  let customPayloads = JSON.parse(localStorage.getItem('bb_user_payloads') || '[]');
  customPayloads = customPayloads.filter(p => p.name !== name);
  saveAppData('bb_user_payloads', customPayloads);
  
  toast('Custom payload deleted', 'info');
  renderPayloads();
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard!', 'info'));
}

function copyTextEncoded(b64) {
  try {
    const raw = decodeURIComponent(escape(atob(b64)));
    navigator.clipboard.writeText(raw).then(() => toast('Copied to clipboard!', 'info'));
  } catch (err) {
    toast('Failed to copy text', 'error');
  }
}

function populateReportTargetsDropdown() {
  const sel = document.getElementById('r-import-target');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Select Target --</option>' + 
    targets.map(t => `<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('');
  const container = document.getElementById('r-import-finding-container');
  if (container) container.classList.add('hidden');
}

function onReportImportTargetChange() {
  const targetId = parseFloat(document.getElementById('r-import-target').value);
  const container = document.getElementById('r-import-finding-container');
  const findingSel = document.getElementById('r-import-finding');
  const assetInput = document.getElementById('r-asset');

  if (!targetId) {
    if (container) container.classList.add('hidden');
    return;
  }

  const t = targets.find(x => x.id === targetId);
  if (!t) return;

  // Pre-fill asset URL
  if (assetInput && !assetInput.value) {
    assetInput.value = t.name.startsWith('http') ? t.name : `https://${escapeHTML(t.name)}`;
  }

  const logs = t.logs || [];
  if (logs.length === 0) {
    if (container) container.classList.add('hidden');
    toast('No recon logs/findings found for this target', 'info');
  } else {
    if (container) container.classList.remove('hidden');
    if (findingSel) {
      findingSel.innerHTML = '<option value="">-- Select Finding --</option>' + 
        logs.map((l, idx) => `<option value="${idx}">${escapeHTML(l.tool)}: ${(l.out || '').slice(0, 40)}...</option>`).join('');
    }
  }
}

function onReportImportFindingChange() {
  const targetId = parseFloat(document.getElementById('r-import-target').value);
  const findingSel = document.getElementById('r-import-finding');
  if (!findingSel) return;
  const findingIdx = parseInt(findingSel.value);
  if (!targetId || isNaN(findingIdx)) return;

  const t = targets.find(x => x.id === targetId);
  if (!t) return;

  const log = t.logs[findingIdx];
  if (!log) return;

  // Populate finding info into report fields!
  const titleInput = document.getElementById('r-title');
  const descInput = document.getElementById('r-desc');

  if (titleInput) {
    titleInput.value = `${log.tool} Finding on ${escapeHTML(t.name)}`;
  }
  if (descInput) {
    descInput.value = `Tool: ${log.tool}\nCaptured Findings:\n${log.out}`;
  }
  toast('Finding data imported into builder!', 'success');
}

function importLogFileToReport(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const descInput = document.getElementById('r-desc');
    const titleInput = document.getElementById('r-title');
    if (descInput) {
      descInput.value = `Imported Log File (${file.name}):\n\n${text}`;
    }
    if (titleInput && !titleInput.value) {
      titleInput.value = `Log Report - ${file.name.split('.')[0]}`;
    }
    toast(`Successfully imported ${file.name} ✅`, 'success');
  };
  reader.readAsText(file);
}

function generateReport() {
  const title = document.getElementById('r-title').value || 'Vulnerability Report';
  const severity = document.getElementById('r-severity').value;
  const asset = document.getElementById('r-asset').value || 'https://target.com';
  const param = document.getElementById('r-param').value || 'N/A';
  const desc = document.getElementById('r-desc').value || 'No description provided.';
  const steps = document.getElementById('r-steps').value || 'No steps provided.';
  const impact = document.getElementById('r-impact').value || 'No impact provided.';
  const fix = document.getElementById('r-fix').value || 'No fix provided.';

  const report = `
# BUG REPORT: ${title}

## Summary
- **Severity:** ${severity}
- **Asset:** ${asset}
- **Parameter:** ${param}
- **Date:** ${new Date().toLocaleDateString()}

## Description
${desc}

## Steps to Reproduce
${steps}

## Impact
${impact}

## Recommended Fix
${fix}

---
Report generated via bugbOS v3.0
  `.trim();

  document.getElementById('report-output').textContent = report;
  document.getElementById('btn-export-pdf').style.display = 'inline-block';
  toast('Report generated! 📋', 'success');
}

function copyReport() {
  const report = document.getElementById('report-output').textContent;
  if (report.includes('Fill the form')) return toast('Generate a report first', 'error');
  copyText(report);
}

function formatDoc(cmd, val = null) {
  document.execCommand(cmd, false, val);
}

function insertImage(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = `<img src="${e.target.result}" style="max-width:100%; border-radius:var(--r-sm); margin:10px 0; border:1px solid var(--border)">`;
      document.execCommand('insertHTML', false, img);
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function renderAnimList() {
  const container = document.getElementById('anim-list');
  if (!container) return;
  container.innerHTML = vulnData.map((v, i) => `
    <div class="anim-item" onclick="selectAnim(${i})">${v.name.split(' — ')[0]}</div>
  `).join('');
}

function selectAnim(idx) {
  const vuln = vulnData[idx];
  document.querySelectorAll('.anim-item').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
  document.getElementById('anim-stage').innerHTML = vuln.anim;
  
  const payloadContainer = document.getElementById('anim-payload-content');
  if (payloadContainer) {
    if (vuln.payloads && vuln.payloads.length > 0) {
      payloadContainer.innerHTML = vuln.payloads.map(p => {
        const b64 = btoa(unescape(encodeURIComponent(p)));
        const escaped = p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-glass); padding:8px 12px; margin-bottom:6px; border-radius:var(--r-sm); border-left:2px solid var(--acid)">
            <code style="font-family:var(--font-mono); font-size:.75rem; word-break:break-all; color:var(--text-primary)">${escaped}</code>
            <button class="btn-ghost btn-sm" style="margin-left:10px" onclick="copyTextEncoded('${b64}')">Copy</button>
          </div>
        `;
      }).join('');
    } else {
      payloadContainer.innerHTML = '<div class="muted small">No specific payloads for this attack.</div>';
    }
  }

  const noteKey = `anim_note_${escapeHTML(vuln.name)}`;
  const savedNote = localStorage.getItem(noteKey) || `<p class="muted">Advanced tactical notes for ${escapeHTML(vuln.name)} will appear here. Click Edit to customize.</p>`;
  document.getElementById('anim-note-content').innerHTML = savedNote;
}

function editAnimNote() {
  const activeAnim = document.querySelector('.anim-item.active');
  if (!activeAnim) return toast('Select an animation first', 'error');
  
  const idx = Array.from(activeAnim.parentNode.children).indexOf(activeAnim);
  const vuln = vulnData[idx];
  currentAnimKey = `anim_note_${escapeHTML(vuln.name)}`;
  
  const savedNote = localStorage.getItem(currentAnimKey) || '';
  document.getElementById('anim-note-edit').innerHTML = savedNote;
  document.getElementById('modal-anim-note').classList.remove('hidden');
}

function saveAnimNote() {
  const content = document.getElementById('anim-note-edit').innerHTML;
  localStorage.setItem(currentAnimKey, content);
  document.getElementById('anim-note-content').innerHTML = content;
  closeModal('modal-anim-note');
  toast('Animation notes saved!', 'success');
}



// --- TARGET MANAGEMENT -----------------------------
var targets = JSON.parse(localStorage.getItem('bb_targets') || '[]');
var currentTargetId = null;



function filterTargets(type) {
  document.querySelectorAll('#view-targets .filter-btn').forEach(btn => {
    const btnText = btn.textContent.toLowerCase();
    btn.classList.toggle('active', (type === 'all' && btnText.includes('all')) || (type === 'active' && btnText.includes('active')) || (type === 'completed' && btnText.includes('completed')));
  });
  
  const searchQ = document.getElementById('target-search') ? document.getElementById('target-search').value.toLowerCase().trim() : '';
  renderTargets(type, searchQ);
}

function renderTargets(filter = 'all', search = '') {
  const container = document.getElementById('targets-grid');
  if (!container) return;

  let filtered = targets;
  
  // 1. Filter by status
  if (filter === 'active') {
    filtered = targets.filter(t => (t.checklist || []).some(c => !c.done));
  } else if (filter === 'completed') {
    filtered = targets.filter(t => (t.checklist || []).length > 0 && (t.checklist || []).every(c => c.done));
  }

  // 2. Filter by search query
  if (search) {
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(search) || 
      (t.scope || '').toLowerCase().includes(search) ||
      (t.platform || '').toLowerCase().includes(search)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="panel full-width" style="text-align:center; padding:40px; color:var(--text-tertiary)">No ${filter === 'all' ? '' : filter} targets found.</div>`;
  } else {
    container.innerHTML = filtered.map(t => {
      const totalTasks = (t.checklist || []).length;
      const doneTasks = (t.checklist || []).filter(c => c.done).length;
      const pct = totalTasks > 0 ? Math.floor((doneTasks / totalTasks) * 100) : 0;
      const platformIcons = {
        'HackerOne': '🛡️',
        'Bugcrowd': '🦟',
        'Intigriti': '⚡',
        'Private': '🔒',
        'Other': '🎯'
      };
      const pIcon = platformIcons[t.platform] || '🎯';
      
      return `<div class="panel" onclick="viewTarget(${t.id})" style="cursor:pointer; position:relative; overflow:hidden">
        <div style="position:absolute; top:0; right:0; width:60px; height:60px; background:linear-gradient(45deg, transparent 50%, var(--acid-dim) 50%); opacity:0.3"></div>
        <div class="panel-header" style="justify-content:space-between">
          <div style="display:flex; align-items:center; gap:6px"><div class="ph-dot" style="background:var(--acid)"></div>${pIcon} ${escapeHTML(t.platform)}</div>
          <span style="font-size:0.6rem; color:var(--text-tertiary); font-family:var(--font-mono)">ID: ${t.id.toString().slice(-6)}</span>
        </div>
        <div style="font-size:1.25rem; font-weight:800; margin-bottom:5px; color:var(--text-primary); letter-spacing:-0.5px">${escapeHTML(t.name)}</div>
        <div class="muted small" style="margin-bottom:15px; font-family:var(--font-mono); border-left:2px solid var(--border); padding-left:8px">${escapeHTML((t.scope || 'No scope defined').slice(0,60))}${t.scope && t.scope.length > 60 ? '...' : ''}</div>
        
        <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:flex-end">
          <div style="display:flex; flex-direction:column">
            <span class="muted" style="font-size:0.6rem; text-transform:uppercase; letter-spacing:1px">Recon Depth</span>
            <span style="font-size:0.9rem; font-weight:800; color:var(--acid)">${pct}% Complete</span>
          </div>
          <div style="text-align:right">
             <span class="muted" style="font-size:0.6rem; text-transform:uppercase; letter-spacing:1px">Logs</span>
             <div style="font-size:0.9rem; font-weight:800; color:var(--cyan)">${(t.logs || []).length}</div>
          </div>
        </div>
        
        <div style="height:6px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:3px; overflow:hidden; margin-bottom:15px">
          <div style="height:100%; width:${pct}%; background:linear-gradient(90deg, var(--acid-dim), var(--acid)); box-shadow:0 0 10px var(--acid-glow); transition: width 0.5s ease"></div>
        </div>
        
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:12px; margin-top:5px">
          <div style="display:flex; gap:6px">
            <span class="tag tag-acid" style="font-size:0.65rem; font-weight:800">ACTIVE HUNT</span>
            ${(t.subdomains && t.subdomains.length) ? `<span class="tag tag-cyan" style="font-size:0.65rem">${t.subdomains.length} SUBS</span>` : ''}
          </div>
          <div style="display:flex; gap:6px; align-items:center">
            <button class="btn-ghost btn-sm" onclick="event.stopPropagation(); deleteTarget(${t.id})" style="border:none; color:var(--red); font-size:0.7rem; padding:0 5px">🗑</button>
            <button class="btn-ghost btn-sm" style="font-size:0.65rem; padding:2px 8px; border-radius:4px">LAUNCH INTEL →</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  const statGrid = document.getElementById('target-stats-grid');
  if (statGrid) {
    const totalLogs = targets.reduce((s, t) => s + (t.logs || []).length, 0);
    const activeTasks = targets.reduce((s, t) => s + (t.checklist || []).filter(c => !c.done).length, 0);
    statGrid.innerHTML = `
      <div class="stat-card cyan"><div class="stat-icon">🎯</div><div class="stat-value cyan">${targets.length}</div><div class="stat-label">Total Targets</div></div>
      <div class="stat-card purple"><div class="stat-icon">📊</div><div class="stat-value purple">${totalLogs}</div><div class="stat-label">Recon Logs</div></div>
      <div class="stat-card acid"><div class="stat-icon">✅</div><div class="stat-value acid">${activeTasks}</div><div class="stat-label">Active Tasks</div></div>
      <div class="stat-card amber"><div class="stat-icon">💡</div><div class="stat-value amber">${Math.floor(targets.length * 1.5)}</div><div class="stat-label">AI Insights</div></div>
    `;
  }
}


function showAddTargetModal() { 
  const m = document.getElementById('modal-target');
  m.classList.remove('hidden');
  // Clear fields
  document.getElementById('mt-name').value = '';
  document.getElementById('mt-scope').value = '';
  // Force focus after a tiny delay to ensure modal is rendered
  setTimeout(() => {
    const input = document.getElementById('mt-name');
    input.focus();
    input.select();
  }, 50);
}

function saveTarget() {
  const name = document.getElementById('mt-name').value.trim();
  if (!name) return toast('Enter target name', 'error');
  const target = {
    id: Date.now(),
    name,
    platform: document.getElementById('mt-platform').value,
    scope: document.getElementById('mt-scope').value,
    notes: '',
    checklist: [
      // Phase 0: Intelligence & Scope
      { id: 1, phase: 'Phase 0: Intel & Scope', tool: 'Policy Check', text: 'Verify In-Scope Assets & Excluded Domains', done: false, findings: '', files: [] },
      { id: 2, phase: 'Phase 0: Intel & Scope', tool: 'Platform Info', text: 'Review Program Updates & Recent Awards', done: false, findings: '', files: [] },
      
      // Phase 1: Passive Recon
      { id: 3, phase: 'Phase 1: Passive Recon', tool: 'Subfinder', text: 'Passive Subdomain Discovery', done: false, findings: '', files: [] },
      { id: 4, phase: 'Phase 1: Passive Recon', tool: 'Amass / ASN', text: 'ASN Mapping & Intel Gathering', done: false, findings: '', files: [] },
      { id: 5, phase: 'Phase 1: Passive Recon', tool: 'GitHub Dorks', text: 'Secret Leak & Repository Scanning', done: false, findings: '', files: [] },
      { id: 6, phase: 'Phase 1: Passive Recon', tool: 'Wayback / Gau', text: 'URL Discovery & History Archive Fetching', done: false, findings: '', files: [] },
      { id: 7, phase: 'Phase 1: Passive Recon', tool: 'Shodan / Censys', text: 'Internet-Wide Infrastructure Mapping', done: false, findings: '', files: [] },

      // Phase 2: Active Enumeration
      { id: 8, phase: 'Phase 2: Active Enumeration', tool: 'HTTPX', text: 'Live Host Verification & Tech Profiling', done: false, findings: '', files: [] },
      { id: 9, phase: 'Phase 2: Active Enumeration', tool: 'Naabu / Nmap', text: 'Port Scanning & Service Discovery', done: false, findings: '', files: [] },
      { id: 10, phase: 'Phase 2: Active Enumeration', tool: 'FFUF / Gobuster', text: 'Directory & File Fuzzing (Common Lists)', done: false, findings: '', files: [] },
      { id: 11, phase: 'Phase 2: Active Enumeration', tool: 'Kube Hunter', text: 'Container & Kubernetes Exposure Check', done: false, findings: '', files: [] },
      { id: 12, phase: 'Phase 2: Active Enumeration', tool: 'DNSX', text: 'DNS Resolution & Record Verification', done: false, findings: '', files: [] },

      // Phase 3: Vulnerability Analysis
      { id: 13, phase: 'Phase 3: Vuln Analysis', tool: 'Nuclei', text: 'Automated Template Vulnerability Scan', done: false, findings: '', files: [] },
      { id: 14, phase: 'Phase 3: Vuln Analysis', tool: 'Burp Suite', text: 'Manual Interception & Parameter Testing', done: false, findings: '', files: [] },
      { id: 15, phase: 'Phase 3: Vuln Analysis', tool: 'Arjun', text: 'Hidden Parameter Discovery', done: false, findings: '', files: [] },
      { id: 16, phase: 'Phase 3: Vuln Analysis', tool: 'Smuggler', text: 'HTTP Request Smuggling Verification', done: false, findings: '', files: [] },

      // Phase 4: Exploitation & PoC
      { id: 17, phase: 'Phase 4: Exploitation', tool: 'Payload Lab', text: 'Craft & Verify Functional PoC Exploit', done: false, findings: '', files: [] },
      { id: 18, phase: 'Phase 4: Exploitation', tool: 'Internal Env', text: 'Verify Impact in Sandboxed Environment', done: false, findings: '', files: [] },
      
      // Phase 5: Reporting
      { id: 19, phase: 'Phase 5: Reporting', tool: 'bugbOS Builder', text: 'Construct Detailed Technical Report', done: false, findings: '', files: [] },
      { id: 20, phase: 'Phase 5: Reporting', tool: 'Final Review', text: 'Grammar, Proof-of-Impact & Link Verification', done: false, findings: '', files: [] }
    ],
    logs: []
  };
  targets.push(target);
  localStorage.setItem('bb_targets', JSON.stringify(targets));
  logActivity(`New target added: ${target.name}`, 'info');
  closeModal('modal-target');
  renderTargets();
  toast('Target added! ??', 'success');
}

function viewTarget(id) {
  currentTargetId = id;
  const t = targets.find(t => t.id === id);
  if (!t) return;

  // Ensure all arrays exist
  if (!t.logs)        t.logs        = [];
  if (!t.subdomains)  t.subdomains  = [];
  if (!t.hypotheses)  t.hypotheses  = [];
  if (!t.surface)     t.surface     = [];
  if (!t.checklist)   t.checklist   = [];
  if (!t.docs)        t.docs        = [];

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-target-detail').classList.add('active');

  // Header
  document.getElementById('td-name').textContent = t.name;
  const statusEl = document.getElementById('td-status');
  if (statusEl) { statusEl.textContent = t.status || 'ACTIVE'; }
  const platBadge = document.getElementById('td-platform-badge');
  if (platBadge) platBadge.textContent = t.platform ? `📍 ${t.platform}` : '';

  // Intel fields
  const noteEl = document.getElementById('td-notes');
  if (noteEl) noteEl.value = t.notes || '';
  const platEl = document.getElementById('td-platform');
  if (platEl) { platEl.value = t.platform || 'HackerOne'; }
  const bountyEl = document.getElementById('td-max-bounty');
  if (bountyEl) bountyEl.value = t.maxBounty || '';
  const tsEl = document.getElementById('td-techstack');
  if (tsEl) tsEl.value = t.techStack || '';
  const ipEl = document.getElementById('td-ipranges');
  if (ipEl) ipEl.value = t.ipRanges || '';
  const authEl = document.getElementById('td-auth-endpoints');
  if (authEl) authEl.value = t.authEndpoints || '';

  

  // Stats
  const doneCount = t.checklist.filter(c => c.done).length;
  const totalCount = t.checklist.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const bugsForTarget = bugs.filter(b => b.target && b.target.toLowerCase().includes((t.name||'').toLowerCase())).length;
  const daysActive = t.createdAt ? Math.floor((Date.now() - t.createdAt) / 86400000) : 0;

  const setStat = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setStat('td-stat-findings', t.logs.length);
  setStat('td-stat-subdomains', t.subdomains.length);
  setStat('td-stat-tasks', pct + '%');
  setStat('td-stat-bugs', bugsForTarget);
  setStat('td-stat-days', daysActive + 'd');

  // Render panels
  renderTargetChecklist(t);
  renderTargetDocs(t);
  showTargetTab('intel'); // default tab
  renderTargetLogs(t);
  renderSubdomains(t);
  renderHypotheses(t);
  renderAttackSurface(t);
}

function saveTargetNotes() {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  t.notes = document.getElementById('td-notes').value;
  saveTargets();
  toast('Target scope notes saved!', 'success');
}



async function processRichEditorImage(file, editorId) {
  const reader = new FileReader();
  reader.onload = async function(e) {
    let src = e.target.result;
    if (window.api && window.api.saveFile) {
      try {
        const base64Data = src.split(',')[1];
        const savedPath = await window.api.saveFile('img_' + Date.now() + '_' + file.name.replace(/[^a-z0-9.]/gi, '_'), base64Data);
        if (savedPath) {
          src = 'file:///' + savedPath.replace(/\\/g, '/');
        }
      } catch (err) {
        console.error("IPC Save Error:", err);
      }
    }
    const editor = document.getElementById(editorId);
    if (editor) {
      editor.focus();
      document.execCommand('insertImage', false, src);
    }
  };
  reader.readAsDataURL(file);
}

function insertTargetRichImage(input) {
  if (input.files && input.files[0]) {
    processRichEditorImage(input.files[0], 'td-rich-notes');
    input.value = '';
  }
}

function deleteTarget(id) {
  if (!confirm('Are you sure you want to delete this target and all its data?')) return;
  targets = targets.filter(t => t.id !== id);
  saveTargets();
  renderTargets();
  showView('targets');
  toast('Target removed from radar', 'info');
}

function renderSubdomains(t) {
  const list = document.getElementById('td-sub-list');
  const count = document.getElementById('td-sub-count');
  if (!list || !count) return;

  const subs = t.subdomains || [];
  count.textContent = subs.length;
  list.innerHTML = subs.map((s, i) => `
    <div class="subdomain-item">
      <span>${escapeHTML(s)}</span>
      <button class="btn-ghost btn-sm" onclick="deleteSubdomain(${i})" style="padding:0 5px; color:var(--red); border:none; background:transparent">✕</button>
    </div>
  `).join('') || '<div class="muted small" style="text-align:center; padding:10px">No subdomains added</div>';
}

function addSubdomains() {
  const input = document.getElementById('td-sub-input');
  const val = input.value.trim();
  if (!val) return;

  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;

  const newSubs = val.split(/[\n, ]+/).filter(s => s.trim().length > 0);
  if (!t.subdomains) t.subdomains = [];
  
  const uniqueSubs = newSubs.filter(s => !t.subdomains.includes(s));
  t.subdomains.push(...uniqueSubs);
  
  saveTargets();
  input.value = '';
  renderSubdomains(t);
  toast(`Added ${uniqueSubs.length} subdomains`, 'success');
}

function deleteSubdomain(idx) {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  t.subdomains.splice(idx, 1);
  saveTargets();
  renderSubdomains(t);
}

function clearSubdomains() {
  if (!confirm('Clear all subdomains for this target?')) return;
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  t.subdomains = [];
  saveTargets();
  renderSubdomains(t);
  toast('Subdomain list cleared', 'info');
}

function exportSubdomains() {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t || !t.subdomains || t.subdomains.length === 0) return toast('No subdomains to export', 'error');
  
  const blob = new Blob([t.subdomains.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${t.name}_subdomains.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

let currentTargetChecklistTaskId = null;

function renderTargetChecklist(t) {
  const container = document.getElementById('td-checklist');
  if (!container) return;
  
  // Dynamically extract all unique phases present in the checklist, sorted
  const phases = [...new Set((t.checklist || []).map(c => c.phase || 'Phase 1: Passive Recon'))].sort();
  
  // Phase Icon Mapping
  const phaseIcons = {
    'Phase 0: Intel & Scope': '📡',
    'Phase 1: Passive Recon': '🔍',
    'Phase 2: Active Enumeration': '⚡',
    'Phase 3: Vuln Analysis': '🔬',
    'Phase 4: Exploitation': '💣',
    'Phase 5: Reporting': '📋'
  };

  container.innerHTML = phases.map(phase => {
    const items = (t.checklist || []).filter(c => (c.phase || 'Phase 1: Passive Recon') === phase);
    const icon = phaseIcons[phase] || '⚙️';
    
    return `
      <div style="background:var(--bg-glass); border:1px solid var(--border); padding:12px; border-radius:var(--r-sm); display:flex; flex-direction:column; gap:8px">
        <div style="font-family:'Syne',sans-serif; font-size:0.75rem; font-weight:800; color:var(--cyan); text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid var(--border); padding-bottom:6px; margin-bottom:4px">${icon} ${phase}</div>
        <div style="display:flex; flex-direction:column; gap:6px; overflow-y:auto; max-height:400px">
          ${items.map(c => `
            <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-elevated); border:1px solid var(--border); padding:8px 10px; border-radius:var(--r-sm); cursor:pointer; transition: transform 0.1s" 
                 onmouseover="this.style.transform='translateX(2px)'" onmouseout="this.style.transform='none'"
                 onclick="openTargetChecklistItemDetail(${c.id})">
              <div style="display:flex; align-items:center; gap:8px; flex:1">
                <input type="checkbox" ${c.done ? 'checked' : ''} onclick="event.stopPropagation(); toggleTargetTask(${c.id})" style="width:14px; height:14px; accent-color:var(--acid); cursor:pointer">
                <div style="display:flex; flex-direction:column">
                  <span style="font-size:0.8rem; font-weight:700; color:${c.done ? 'var(--text-tertiary)' : 'var(--text-primary)'}; text-decoration:${c.done ? 'line-through' : 'none'}">${escapeHTML(c.text)}</span>
                  ${c.tool ? `<span style="font-size:0.65rem; color:var(--text-secondary); font-family:var(--font-mono)">⚙️ ${escapeHTML(c.tool)}</span>` : ''}
                </div>
              </div>
              <div style="display:flex; gap:4px; align-items:center" onclick="event.stopPropagation()">
                ${(c.findings || (c.files && c.files.length)) ? `<span class="tag tag-acid" style="font-size:0.6rem; padding:1px 4px; box-shadow: 0 0 5px var(--acid)">📂 POC</span>` : ''}
                <button class="btn-ghost btn-sm" onclick="deleteTargetChecklistItem(${c.id})" style="border:none; background:transparent; color:var(--red); padding:2px; min-width:20px; height:20px">✕</button>
              </div>
            </div>
          `).join('') || '<div class="muted small" style="text-align:center; padding:10px">No tasks in this phase</div>'}
        </div>
      </div>
    `;
  }).join('');
}


function toggleTargetTask(taskId) {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  const task = t.checklist.find(c => c.id === taskId);
  if (task) task.done = !task.done;
  saveTargets();
  renderTargetChecklist(t);
  renderTargetDocs(t);
  showTargetTab('intel'); // default tab
  if (window.updateStats) window.updateStats();
}

function addTargetChecklistItem() {
  const input = document.getElementById('td-new-item');
  const phaseSelect = document.getElementById('td-new-item-phase');
  const text = input.value.trim();
  if (!text) return;
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  
  t.checklist.push({
    id: Date.now(),
    phase: phaseSelect ? phaseSelect.value : 'Phase 1: Passive Recon',
    tool: '',
    text,
    done: false,
    findings: '',
    files: []
  });
  saveTargets();
  input.value = '';
  renderTargetChecklist(t);
  renderTargetDocs(t);
  showTargetTab('intel'); // default tab
  toast('Task added to phase!', 'success');
}

function deleteTargetChecklistItem(taskId) {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  t.checklist = t.checklist.filter(c => c.id !== taskId);
  saveTargets();
  renderTargetChecklist(t);
  renderTargetDocs(t);
  showTargetTab('intel'); // default tab
  toast('Task deleted', 'info');
}

function openTargetChecklistItemDetail(taskId) {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  const task = t.checklist.find(c => c.id === taskId);
  if (!task) return;
  
  currentTargetChecklistTaskId = taskId;
  
  // Set values
  document.getElementById('mtt-title').textContent = task.text;
  document.getElementById('mtt-phase').textContent = `${task.phase} ${task.tool ? '// Tool: ' + task.tool : ''}`;
  document.getElementById('mtt-findings').value = task.findings || '';
  
  renderTargetTaskFiles(task);
  
  // Show modal
  document.getElementById('modal-target-task-detail').classList.remove('hidden');
}

function saveTargetTaskDetail() {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  const task = t.checklist.find(c => c.id === currentTargetChecklistTaskId);
  if (!task) return;
  
  task.findings = document.getElementById('mtt-findings').value;
  saveTargets();
  closeModal('modal-target-task-detail');
  renderTargetChecklist(t);
  renderTargetDocs(t);
  showTargetTab('intel'); // default tab
  toast('Task details updated', 'success');
}

function showGDriveHelp() {
  document.getElementById('modal-gdrive-help').classList.remove('hidden');
}


// ─── SEV COLOR MAP ─────────────────────────────
const SEV_COLORS = { Critical:'#d95f5f', High:'#e07040', Medium:'#c9a84c', Low:'#6db97a', Info:'#7090c0' };
const SEV_EMOJI  = { Critical:'💀', High:'🔴', Medium:'🟠', Low:'🟡', Info:'ℹ️' };

function renderTargetLogs(t, filteredLogs) {
  const cards   = document.getElementById('td-tools-log-cards');
  const empty   = document.getElementById('td-tools-log-empty');
  if (!cards) return;

  const logs = filteredLogs !== undefined ? filteredLogs : (t.logs || []);

  // Update stats
  const statEl = document.getElementById('td-stat-findings');
  if (statEl) statEl.textContent = (t.logs || []).length;

  if (logs.length === 0) {
    cards.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  const actualT = t;
  cards.innerHTML = logs.map((log, i) => {
    const realIdx = (t.logs || []).indexOf(log);
    const sev = log.severity || 'Info';
    const sevColor = SEV_COLORS[sev] || '#7090c0';
    const sevEmoji = SEV_EMOJI[sev] || 'ℹ️';
    return `
    <div style="background:var(--bg-elevated);border:1px solid var(--border);border-left:3px solid ${sevColor};border-radius:var(--r-sm);padding:14px;transition:all 0.2s ease" onmouseover="this.style.borderColor='${sevColor}'" onmouseout="this.style.borderColor='var(--border)';this.style.borderLeftColor='${sevColor}'">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="background:rgba(255,255,255,0.06);color:var(--acid);font-family:var(--font-mono);font-size:0.72rem;padding:2px 8px;border-radius:3px;border:1px solid var(--border)">${escapeHTML(log.tool || 'Manual')}</span>
          <span style="background:${sevColor}20;color:${sevColor};font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:3px;border:1px solid ${sevColor}40">${sevEmoji} ${escapeHTML(sev)}</span>
          ${log.phase ? `<span style="background:var(--bg-glass);color:var(--text-tertiary);font-size:0.62rem;padding:2px 8px;border-radius:3px;border:1px solid var(--border)">${escapeHTML(log.phase)}</span>` : ''}
          <span style="color:var(--text-tertiary);font-size:0.65rem">${escapeHTML(log.date || '')}</span>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button class="btn-ghost btn-sm" onclick="editTargetLog(${realIdx})" style="font-size:0.7rem;padding:3px 8px">✏️ Edit</button>
          <button class="btn-ghost btn-sm" onclick="deleteTargetLog(${realIdx})" style="font-size:0.7rem;padding:3px 8px;color:var(--red)">✕</button>
        </div>
      </div>
      ${log.title ? `<div style="font-weight:600;font-size:0.92rem;color:var(--text-primary);margin-bottom:6px">${escapeHTML(log.title)}</div>` : ''}
      ${log.url ? `<div style="font-family:var(--font-mono);font-size:0.72rem;color:var(--cyan);margin-bottom:6px;word-break:break-all">🔗 ${escapeHTML(log.url)}</div>` : ''}
      ${log.command ? `<div style="font-family:var(--font-mono);font-size:0.72rem;background:var(--bg-void);color:var(--acid);padding:6px 10px;border-radius:3px;margin-bottom:8px;word-break:break-all">$ ${escapeHTML(log.command)}</div>` : ''}
      ${log.output ? `<div style="font-size:0.8rem;color:var(--text-secondary);white-space:pre-wrap;max-height:120px;overflow-y:auto;font-family:var(--font-mono);background:var(--bg-void);padding:8px;border-radius:3px;margin-bottom:${log.image?'8px':'0'}">${log.output}</div>` : ''}
      ${log.image ? `<img src="${log.image}" style="max-height:100px;border-radius:4px;border:1px solid var(--border);cursor:pointer;margin-top:6px" onclick="this.style.maxHeight=this.style.maxHeight==='100px'?'none':'100px'" title="Click to expand">` : ''}
    </div>`;
  }).join('');
}

function filterTargetLogs() {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  const phase = document.getElementById('td-log-filter-phase')?.value || 'all';
  const sev   = document.getElementById('td-log-filter-sev')?.value || 'all';
  let logs = t.logs || [];
  if (phase !== 'all') logs = logs.filter(l => (l.phase || '').includes(phase));
  if (sev !== 'all')   logs = logs.filter(l => (l.severity || 'Info') === sev);
  renderTargetLogs(t, logs);
}

function exportTargetLogsCSV() {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t || !t.logs || t.logs.length === 0) return toast('No findings to export!', 'error');
  const header = 'Tool,Title,Phase,Severity,URL,Command,Date\n';
  const rows = t.logs.map(l =>
    `"${(l.tool||'').replace(/"/g,'""')}","${(l.title||'').replace(/"/g,'""')}","${(l.phase||'').replace(/"/g,'""')}","${(l.severity||'Info')}","${(l.url||'').replace(/"/g,'""')}","${(l.command||'').replace(/"/g,'""')}","${(l.date||'')}"`
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${t.name}_findings.csv`; a.click();
  URL.revokeObjectURL(url);
  toast('CSV exported! 📊', 'success');
}

function exportFullTarget() {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  let md = `# Target Report: ${t.name}\nGenerated: ${new Date().toLocaleString()}\n\n`;
  md += `## 🎯 Target Intel\n- **Platform:** ${t.platform || 'N/A'}\n- **Max Bounty:** ${t.maxBounty || 'N/A'}\n- **Tech Stack:** ${t.techStack || 'N/A'}\n- **IP/ASN:** ${t.ipRanges || 'N/A'}\n\n`;
  md += `### Scope\n${t.notes || 'N/A'}\n\n`;
  if (t.subdomains && t.subdomains.length > 0) {
    md += `## 🌐 Subdomains (${t.subdomains.length})\n${t.subdomains.map(s => `- ${s}`).join('\n')}\n\n`;
  }
  if (t.hypotheses && t.hypotheses.length > 0) {
    md += `## 💡 Vulnerability Hypotheses\n${t.hypotheses.map(h => `- [${h.sev}] ${h.text}`).join('\n')}\n\n`;
  }
  if (t.surface && t.surface.length > 0) {
    md += `## 🗺 Attack Surface\n${t.surface.map(s => `- [${s.type}] ${s.endpoint}`).join('\n')}\n\n`;
  }
  if (t.logs && t.logs.length > 0) {
    md += `## 🛠 Tool Findings (${t.logs.length})\n\n`;
    t.logs.forEach(l => {
      md += `### ${l.tool || 'Finding'} — ${l.title || 'No title'}\n`;
      md += `**Severity:** ${l.severity || 'Info'} | **Phase:** ${l.phase || 'N/A'} | **Date:** ${l.date}\n\n`;
      if (l.url) md += `**URL:** \`${l.url}\`\n\n`;
      if (l.command) md += `**Command:** \`${l.command}\`\n\n`;
      if (l.output) md += `**Output:**\n\`\`\`\n${l.output}\n\`\`\`\n\n`;
      if (l.image) md += `*(Screenshot attached)*\n\n`;
      md += `---\n\n`;
    });
  }
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = `${t.name}_full_report.md`; a.click();
  URL.revokeObjectURL(url); toast('Full report exported! 📤', 'success');
}

function exportTargetJSON() {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  const json = JSON.stringify(t, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = `${t.name}_backup.json`; a.click();
  URL.revokeObjectURL(url); toast('JSON exported! 💾', 'success');
}

function saveTargetMeta() {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  t.platform   = document.getElementById('td-platform')?.value || '';
  t.maxBounty  = document.getElementById('td-max-bounty')?.value || '';
  t.techStack  = document.getElementById('td-techstack')?.value || '';
  t.ipRanges   = document.getElementById('td-ipranges')?.value || '';
  t.authEndpoints = document.getElementById('td-auth-endpoints')?.value || '';
  saveTargets();
}

function searchSubdomains(q) {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  const subs = q ? (t.subdomains || []).filter(s => s.toLowerCase().includes(q.toLowerCase())) : (t.subdomains || []);
  renderSubdomainList(subs);
}

function renderSubdomainList(subs) {
  const list = document.getElementById('td-sub-list');
  if (!list) return;
  if (!subs || subs.length === 0) { list.innerHTML = '<div class="muted small" style="padding:10px;text-align:center">No subdomains</div>'; return; }
  list.innerHTML = subs.map((s, i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-xs);padding:5px 10px;font-family:var(--font-mono);font-size:0.76rem">
      <span style="color:var(--cyan);word-break:break-all">${escapeHTML(s)}</span>
      <button onclick="deleteSubdomainByVal('${escapeHTML(s)}')" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;font-size:0.7rem;flex-shrink:0;padding:0 0 0 8px" title="Remove">✕</button>
    </div>`).join('');
}

function deleteSubdomainByVal(val) {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  t.subdomains = (t.subdomains || []).filter(s => s !== val);
  saveTargets();
  renderSubdomains(t);
  document.getElementById('td-stat-subdomains').textContent = (t.subdomains || []).length;
}

// Hypothesis board
function addHypothesis() {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  const text = document.getElementById('td-hypothesis-input')?.value.trim();
  const sev  = document.getElementById('td-hypothesis-sev')?.value || 'Medium';
  if (!text) return toast('Enter a hypothesis', 'error');
  if (!t.hypotheses) t.hypotheses = [];
  t.hypotheses.push({ id: Date.now(), text, sev, done: false });
  document.getElementById('td-hypothesis-input').value = '';
  saveTargets();
  renderHypotheses(t);
}

function renderHypotheses(t) {
  const list = document.getElementById('td-hypothesis-list');
  if (!list) return;
  const hyps = t.hypotheses || [];
  if (hyps.length === 0) { list.innerHTML = '<div class="muted small" style="padding:8px;text-align:center">No hypotheses yet</div>'; return; }
  const sevC = { Critical:'#d95f5f', High:'#e07040', Medium:'#c9a84c', Low:'#6db97a' };
  list.innerHTML = hyps.map((h, i) => `
    <div style="display:flex;align-items:center;gap:8px;background:var(--bg-elevated);border:1px solid var(--border);border-left:3px solid ${sevC[h.sev]||'#c9a84c'};border-radius:var(--r-xs);padding:8px 10px">
      <input type="checkbox" ${h.done?'checked':''} onchange="toggleHypothesis(${i})" style="accent-color:var(--acid);width:14px;height:14px;flex-shrink:0">
      <span style="flex:1;font-size:0.82rem;${h.done?'text-decoration:line-through;opacity:0.5':''}">${escapeHTML(h.text)}</span>
      <span style="font-size:0.62rem;font-weight:700;color:${sevC[h.sev]||'#c9a84c'}">${h.sev}</span>
      <button onclick="deleteHypothesis(${i})" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;font-size:0.7rem">✕</button>
    </div>`).join('');
}

function toggleHypothesis(i) {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t || !t.hypotheses || !t.hypotheses[i]) return;
  t.hypotheses[i].done = !t.hypotheses[i].done;
  saveTargets(); renderHypotheses(t);
}

function deleteHypothesis(i) {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t || !t.hypotheses) return;
  t.hypotheses.splice(i, 1);
  saveTargets(); renderHypotheses(t);
}

// Attack surface
function addAttackSurface() {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  const endpoint = document.getElementById('td-surface-input')?.value.trim();
  const type = document.getElementById('td-surface-type')?.value || 'API Endpoint';
  if (!endpoint) return toast('Enter an endpoint or surface area', 'error');
  if (!t.surface) t.surface = [];
  t.surface.push({ id: Date.now(), endpoint, type, tested: false });
  document.getElementById('td-surface-input').value = '';
  saveTargets(); renderAttackSurface(t);
}

function renderAttackSurface(t) {
  const list = document.getElementById('td-surface-list');
  if (!list) return;
  const items = t.surface || [];
  if (items.length === 0) { list.innerHTML = '<div class="muted small" style="padding:8px;text-align:center">No attack surface mapped</div>'; return; }
  const typeEmoji = { 'API Endpoint':'🔌','Web Page':'🌐','Mobile':'📱','S3 Bucket':'☁️','Admin Panel':'⚙️','Auth Flow':'🔑','Webhook':'🔗','GraphQL':'📊','WebSocket':'⚡' };
  list.innerHTML = items.map((s, i) => `
    <div style="display:flex;align-items:center;gap:8px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-xs);padding:6px 10px">
      <input type="checkbox" ${s.tested?'checked':''} onchange="toggleSurface(${i})" style="accent-color:var(--acid);width:14px;height:14px;flex-shrink:0" title="Mark as tested">
      <span style="font-size:0.72rem;background:var(--bg-glass);padding:1px 6px;border-radius:3px;flex-shrink:0;color:var(--text-secondary)">${typeEmoji[s.type]||'📌'} ${escapeHTML(s.type)}</span>
      <span style="flex:1;font-family:var(--font-mono);font-size:0.76rem;word-break:break-all;${s.tested?'text-decoration:line-through;opacity:0.5':''}">${escapeHTML(s.endpoint)}</span>
      <button onclick="deleteSurface(${i})" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;font-size:0.7rem;flex-shrink:0">✕</button>
    </div>`).join('');
}

function toggleSurface(i) {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t || !t.surface || !t.surface[i]) return;
  t.surface[i].tested = !t.surface[i].tested;
  saveTargets(); renderAttackSurface(t);
}

function deleteSurface(i) {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t || !t.surface) return;
  t.surface.splice(i, 1);
  saveTargets(); renderAttackSurface(t);
}


function showAddTargetLogModal() {
  const m = document.getElementById('modal-target-log');
  if (!m) return toast('Log modal not found!', 'error');
  m.classList.remove('hidden');
  document.getElementById('target-log-modal-title').textContent = '🛠 Log Tool Finding';
  // Clear all fields
  const clear = (id, val='') => { const el=document.getElementById(id); if(el){ if(el.tagName==='DIV')el.innerHTML=val; else el.value=val;} };
  clear('tl-index'); clear('tl-tool-name'); clear('tl-command');
  clear('tl-title'); clear('tl-url'); clear('tl-output');
  clear('tl-phase', 'Phase 1: Recon');
  clear('tl-severity', 'Info');
  // Add user's custom tools to autocomplete
  const customTools = JSON.parse(localStorage.getItem('bb_user_tools') || '[]');
  const datalist = document.getElementById('tl-tool-suggestions');
  if (datalist && customTools.length) {
    customTools.forEach(ct => {
      if (!datalist.querySelector(`option[value="${ct.name}"]`)) {
        const opt = document.createElement('option');
        opt.value = ct.name; datalist.appendChild(opt);
      }
    });
  }
}

function insertLogImage(input) {
  if (input.files && input.files[0]) {
    processRichEditorImage(input.files[0], 'tl-output');
    input.value = '';
  }
}

function saveTargetLog() {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;

  const get = (id) => { const el=document.getElementById(id); return el ? (el.tagName==='DIV'?el.innerHTML.trim():el.value.trim()) : ''; };
  const tool     = get('tl-tool-name');
  const command  = get('tl-command');
  const phase    = get('tl-phase');
  const severity = get('tl-severity') || 'Info';
  const title    = get('tl-title');
  const url      = get('tl-url');
  const output   = get('tl-output');
  const image    = '';
  const idxVal   = get('tl-index');

  if (!tool && !title && !output) {
    return toast('Please fill in at least Tool Name or Title!', 'error');
  }

  if (!t.logs) t.logs = [];
  const logEntry = {
    tool, command, phase, severity, title, url, output, image,
    date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
  };

  if (idxVal !== '') {
    t.logs[parseInt(idxVal)] = { ...t.logs[parseInt(idxVal)], ...logEntry };
    toast('Finding updated! ✏️', 'success');
  } else {
    t.logs.push(logEntry);
    toast('Finding logged! 📝', 'success');
  }

  // Update finding count stat
  const statEl = document.getElementById('td-stat-findings');
  if (statEl) statEl.textContent = t.logs.length;

  saveTargets();
  closeModal('modal-target-log');
  renderTargetLogs(t);
  logActivity(`Tool finding logged on ${t.name}: ${title || tool}`, 'success');
}

function editTargetLog(idx) {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t || !t.logs || !t.logs[idx]) return;
  const log = t.logs[idx];
  showAddTargetLogModal();
  document.getElementById('target-log-modal-title').textContent = '✏️ Edit Tool Finding';
  const set = (id, val) => { const el=document.getElementById(id); if(el){if(el.tagName==='DIV')el.innerHTML=val||'';else el.value=val||'';} };
  set('tl-index',     idx);
  set('tl-tool-name', log.tool);
  set('tl-command',   log.command);
  set('tl-phase',     log.phase || 'Phase 1: Recon');
  set('tl-severity',  log.severity || 'Info');
  set('tl-title',     log.title);
  set('tl-url',       log.url);
  set('tl-output',    log.output);
}

function exportTargetLogs() {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t || !t.logs || t.logs.length === 0) return toast('No logs to export!', 'error');

  let md = `# Recon & Findings Log: ${t.name}\nGenerated on: ${new Date().toLocaleString()}\n\n`;
  t.logs.forEach(log => {
    md += `## Tool: ${log.tool || 'Manual Finding'}\n`;
    md += `**Date:** ${log.date}\n\n`;
    md += `### Output/Details\n\`\`\`\n${log.output || 'No text output.'}\n\`\`\`\n\n`;
    if (log.image) md += `*(Screenshot attached in BugbOS)*\n\n`;
    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${t.name}_findings_log.md`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Logs exported successfully! 📥', 'success');
}


function deleteTargetLog(idx) {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  t.logs.splice(idx, 1);
  saveTargets();
  renderTargetLogs(t);
}

function renderTargetTaskFiles(task) {
  const container = document.getElementById('mtt-files-list');
  if (!container) return;
  
  if (!task.files || task.files.length === 0) {
    container.innerHTML = '<div class="muted small" style="text-align:center; padding:15px; border:1px dashed var(--border); border-radius:var(--r-sm)">No attached files or PoCs</div>';
    return;
  }
  
  container.innerHTML = task.files.map((file, idx) => {
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(file.path);
    const escapedPath = file.path.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `
      <div style="background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--r-sm); padding:8px 12px; display:flex; flex-direction:column; gap:8px">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <span style="font-size:0.75rem; font-family:var(--font-mono); color:var(--text-secondary); word-break:break-all">${escapeHTML(file.name)}</span>
          <button class="btn-ghost btn-sm" onclick="deleteTargetTaskFile(${idx})" style="border:none; color:var(--red); padding:0 4px">✕ Remove</button>
        </div>
        ${isImage ? `
          <div style="position:relative; cursor:pointer" onclick="openAttachedFile('${escapedPath}')">
            <img src="file:///${file.path.replace(/\\/g, '/')}" style="max-width:100%; max-height:120px; object-fit:contain; border:1px solid var(--border); border-radius:var(--r-xs)" />
            <div style="position:absolute; bottom:4px; right:4px; background:rgba(0,0,0,0.6); color:#fff; font-size:0.6rem; padding:2px 6px; border-radius:3px">🔍 Zoom</div>
          </div>
        ` : `
          <button class="btn-ghost btn-sm" onclick="openAttachedFile('${escapedPath}')" style="font-size:0.7rem; color:var(--cyan); text-decoration:underline; border:none; background:transparent; text-align:left; padding:0; cursor:pointer">📁 View Attached Document</button>
        `}
      </div>
    `;
  }).join('');
}

function openAttachedFile(filePath) {
  if (window.api && window.api.openPath) {
    window.api.openPath(filePath).then(success => {
      if (!success) toast('Could not open file in system default reader', 'error');
    });
  } else {
    toast('Native file opening only supported in Desktop App', 'info');
  }
}

async function uploadTargetTaskFile() {
  const fileInput = document.getElementById('mtt-file');
  if (!fileInput || fileInput.files.length === 0) return toast('Please select a file', 'error');
  
  const file = fileInput.files[0];
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  const task = t.checklist.find(c => c.id === currentTargetChecklistTaskId);
  if (!task) return;
  
  const reader = new FileReader();
  const base64Data = await new Promise((resolve) => {
    reader.onload = (e) => resolve(e.target.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  
  let savedPath = null;
  if (window.api && window.api.saveFile) {
    savedPath = await window.api.saveFile(file.name, base64Data);
  } else {
    // LocalStorage fallback for web context
    savedPath = 'poc_fallback_' + Date.now() + '_' + file.name;
    localStorage.setItem(savedPath, base64Data);
  }
  
  if (!task.files) task.files = [];
  task.files.push({ name: file.name, path: savedPath });
  saveTargets();
  fileInput.value = '';
  renderTargetTaskFiles(task);
  renderTargetChecklist(t);
  renderTargetDocs(t);
  showTargetTab('intel'); // default tab
  toast('File attached successfully! 📎', 'success');
}

function deleteTargetTaskFile(fileIdx) {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  const task = t.checklist.find(c => c.id === currentTargetChecklistTaskId);
  if (!task || !task.files) return;
  
  task.files.splice(fileIdx, 1);
  saveTargets();
  renderTargetTaskFiles(task);
  renderTargetChecklist(t);
  renderTargetDocs(t);
  showTargetTab('intel'); // default tab
  toast('File removed', 'info');
}


function saveTargets() {
  try {
    localStorage.setItem('bb_targets', JSON.stringify(targets));
    renderTargets();
    if (typeof onDataChange === 'function') onDataChange();
  } catch (e) {
    console.error("Storage Save Error:", e);
    if (e.name === 'QuotaExceededError') {
      toast('Storage Full! Avoid pasting massive raw images. Use the image upload button.', 'error');
    }
  }
}

function deleteCurrentTarget() {
  if (!confirm('Delete this target and all recon logs?')) return;
  targets = targets.filter(t => t.id !== currentTargetId);
  saveTargets();
  showView('targets');
}

function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById('view-' + viewId);
  if (view) view.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === viewId));
  if (viewId === 'targets') renderTargets();
  if (viewId === 'ai') resetAIView();
  if (viewId === 'analytics') buildAnalytics();
  if (viewId === 'focus') { renderSessionLog(); renderTimer(); }
  if (viewId === 'kanban') renderKanban();
  if (viewId === 'tracker') renderTracker();
  if (viewId === 'notes') renderNotes();
  if (viewId === 'payloads') renderPayloads();
  if (viewId === 'animations') renderAnimList();
  if (viewId === 'export') renderAutoSaveInfo();
  if (viewId === 'reports') populateReportTargetsDropdown();
  if (viewId === 'mindset') renderMindset();
  if (viewId === 'settings') initCustomization();
  // Update page title
  const titles = { 
    dashboard:'Dashboard', 
    tracker:'Bug Tracker', 
    kanban:'Kanban Board', 
    targets:'Target Intelligence', 
    ai:'AI Investigator', 
    analytics:'Analytics', 
    focus:'Focus Timer', 
    export:'Export & Backup', 
    mindset:'Pre-Hunting Session Planner', 
    recon:'Recon Mastery', 
    vulns:'Vulnerability Atlas', 
    animations:'Attack Animations', 
    tools:'Tool Arsenal', 
    casestudies:'Case Studies', 
    payloads:'Payload Arsenal', 
    notes:'My Notes', 
    reports:'Report Builder',
    settings:'Workspace Customization'
  };
  const el = document.getElementById('page-title');
  if (el && titles[viewId]) el.textContent = titles[viewId];
}


function resetAIView() {
  document.getElementById('ai-output').innerHTML = '<p class="muted">AI insights will appear here...</p>';
}

// ─── AI INVESTIGATOR ──────────────────────────────
const aiKnowledge = {
  'upload': [
    'Hypothesis: File signature bypass via hex editing.',
    'Hypothesis: Stored XSS via SVG file upload with embedded script.',
    'Hypothesis: RCE via polyglot image/php file.',
    'Hypothesis: Path traversal in filename to overwrite system files.'
  ],
  'login': [
    'Hypothesis: Username enumeration via timing or error message differences.',
    'Hypothesis: 2FA bypass via response manipulation or null OTP.',
    'Hypothesis: JWT algorithm confusion (RS256 to HS256).',
    'Hypothesis: Session fixation by reusing pre-login cookies.'
  ],
  'profile': [
    'Hypothesis: IDOR by changing user_id in the update request.',
    'Hypothesis: Self-XSS escalated to Stored XSS via admin view.',
    'Hypothesis: Mass assignment in user settings (e.g. adding \'is_admin\': true).'
  ],
  'search': [
    'Hypothesis: Reflected XSS in search query parameter.',
    'Hypothesis: SQL Injection via order/filter parameters.',
    'Hypothesis: Blind SSRF if search triggers a remote fetch/webhook.'
  ],
  'api': [
    'Hypothesis: Lack of rate limiting on sensitive endpoints.',
    'Hypothesis: Information disclosure in verbose error responses.',
    'Hypothesis: Broken Object Level Authorization (BOLA) on private resources.'
  ]
};

function generateHypothesis() {
  const input = document.getElementById('ai-input').value.toLowerCase();
  const out = document.getElementById('ai-output');
  if (!input) return toast('Describe something first!', 'error');
  
  out.innerHTML = '<div class="muted">Analyzing vectors...</div>';
  
  setTimeout(() => {
    let results = [];
    for (const [key, list] of Object.entries(aiKnowledge)) {
      if (input.includes(key)) {
        results.push(...list);
      }
    }
    
    if (results.length === 0) {
      results = [
        'Hypothesis: Check for business logic flaws in this workflow.',
        'Hypothesis: Inspect all parameters for IDOR vulnerability.',
        'Hypothesis: Test for input sanitization in all entry points.'
      ];
    }
    
    out.innerHTML = `
      <div style="color:var(--acid); font-weight:700; margin-bottom:10px">AI ANALYSIS COMPLETE</div>
      <ul style="list-style:none; display:flex; flex-direction:column; gap:10px">
        ${results.map(r => `
          <li style="background:var(--bg-glass); border-left:2px solid var(--acid); padding:8px 12px; border-radius:0 4px 4px 0">
            ${r}
          </li>
        `).join('')}
      </ul>
      <div style="margin-top:15px; font-size:0.75rem; color:var(--text-tertiary)">
        NOTE: These are AI-generated hypotheses. Manual verification required.
      </div>
    `;
    toast('Hypotheses generated!', 'success');
  }, 1000);
}

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('modal-search').classList.remove('hidden');
    setTimeout(() => document.getElementById('global-search-input').focus(), 50);
  }
  if (e.shiftKey && e.key === 'D') {
    e.preventDefault();
    console.log('HARDCORE DEBUG: Status -', localStorage.getItem('bb_gdrive_token') ? 'Connected' : 'Disconnected');
    toast('Hardcore Debug Info logged to DevTools Console', 'info');
  }
  if (e.key === 'Escape') {
    ['modal-search','modal-bug','modal-note','modal-target','modal-payload','modal-tool'].forEach(m => closeModal(m));
  }
});

function performGlobalSearch(q) {
  q = q.toLowerCase().trim();
  const res = document.getElementById('global-search-results');
  if (!q) { 
    res.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-tertiary)">Type to search...</div>'; 
    return; 
  }
  
  let html = '';
  
  bugs.filter(b => b.title.toLowerCase().includes(q) || b.target.toLowerCase().includes(q)).forEach(b => {
    html += `<div class="result-item" onclick="showView('tracker'); closeModal('modal-search')"><span class="result-type" style="background:var(--red-dim); color:var(--red)">BUG</span> ${escapeHTML(b.title)} (${escapeHTML(b.target)})</div>`;
  });
  
  targets.filter(t => t.name.toLowerCase().includes(q)).forEach(t => {
    html += `<div class="result-item" onclick="viewTarget(${t.id}); closeModal('modal-search')"><span class="result-type" style="background:var(--cyan-dim); color:var(--cyan)">TARGET</span> ${escapeHTML(t.name)}</div>`;
  });
  
  notes.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)).forEach(n => {
    html += `<div class="result-item" onclick="showView('notes'); closeModal('modal-search')"><span class="result-type" style="background:var(--purple-dim); color:var(--purple)">NOTE</span> ${escapeHTML(n.title)}</div>`;
  });
  
  // Search Payloads
  payloadData.forEach(cat => {
    cat.payloads.filter(p => p.name.toLowerCase().includes(q) || p.payload.toLowerCase().includes(q)).forEach(p => {
      html += `<div class="result-item" onclick="showView('payloads'); closeModal('modal-search')"><span class="result-type" style="background:var(--acid-dim); color:var(--acid)">PAYLOAD</span> ${escapeHTML(p.name)} [${cat.category}]</div>`;
    });
  });

  // Search Knowledge (Vuln Atlas)
  vulnData.filter(v => v.name.toLowerCase().includes(q) || v.desc.toLowerCase().includes(q)).forEach((v, i) => {
    html += `<div class="result-item" onclick="showView('vulns'); selectVuln(${i}); closeModal('modal-search')"><span class="result-type" style="background:var(--amber-dim); color:var(--amber)">VULN</span> ${v.name}</div>`;
  });

  res.innerHTML = html || `<div style="text-align:center; padding:40px; color:var(--text-tertiary)">No results found for "${q}"</div>`;
}

// ─── ACTIVITY FEED ────────────────────────────────
var activity = JSON.parse(localStorage.getItem('bb_activity') || '[]');

function logActivity(text, type = 'info') {
  const item = {
    id: Date.now(),
    text,
    type,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  activity.unshift(item);
  if (activity.length > 20) activity.pop();
  localStorage.setItem('bb_activity', JSON.stringify(activity));
  renderActivity();
}

function renderActivity() {
  const container = document.getElementById('activity-feed');
  if (!container) return;
  if (activity.length === 0) {
    container.innerHTML = '<div class="muted small" style="text-align:center; padding:20px">No activity recorded...</div>';
    return;
  }
  container.innerHTML = activity.map(a => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); padding:6px 10px; border-radius:4px; border-left:2px solid ${a.type === 'success' ? 'var(--acid)' : 'var(--cyan)'}">
      <div style="font-size:0.8rem; color:var(--text-secondary)">${a.text}</div>
      <div style="font-size:0.7rem; color:var(--text-tertiary)">${a.time}</div>
    </div>
  `).join('');
}

function rebootOS() {
  toast('Rebooting System...', 'info');
  setTimeout(() => {
    window.location.reload();
  }, 500);
}

function openExternalBrowser(url) {
  if (window.api && window.api.openExternal) {
    window.api.openExternal(url).then(success => {
      if (!success) window.open(url, '_blank');
    });
  } else {
    window.open(url, '_blank');
  }
}

// Window Controls
function windowMin() { if (window.api) window.api.minimize(); }
function windowMax() { if (window.api) window.api.maximize(); }
function windowClose() { if (window.api) window.api.close(); }

// ─── PRO PROFESSIONAL FEATURES ────────────────────

function quickToggleTheme() {
  const presets = ['acid', 'cyber', 'blood', 'purple', 'neo-brutalist', 'hand-drawn'];
  const current = currentSettings.theme || 'acid';
  let nextIdx = presets.indexOf(current) + 1;
  if (nextIdx >= presets.length) nextIdx = 0;
  
  if (typeof applyThemePreset === 'function') {
    applyThemePreset(presets[nextIdx]);
    toast(`Theme shifted to ${presets[nextIdx].toUpperCase()}`, 'info');
  }
}

function renderLogArsenal() {
  const list = document.getElementById('log-arsenal-list');
  if (!list) return;
  
  const customTools = JSON.parse(localStorage.getItem('bb_user_tools') || '[]');
  const allTools = [...toolsData, ...customTools];
  
  list.innerHTML = allTools.map(t => `<option value="${escapeHTML(t.name)}">${escapeHTML(t.name)}</option>`).join('');
}

function updateDashboardSessionWidget() {
  const card = document.getElementById('active-session-card');
  const content = document.getElementById('active-session-content');
  if (!card || !content) return;
  
  const state = JSON.parse(localStorage.getItem('bb_session_planner') || '{}');
  if (state.active) {
    card.style.display = 'block';
    const startTime = new Date(state.startTime || Date.now());
    const elapsed = Math.floor((Date.now() - startTime) / 60000);
    
    content.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px">
        <div>
          <div style="font-size:1.1rem; font-weight:800; color:var(--text-primary)">Targeting: ${escapeHTML(state.target || 'General Hunt')}</div>
          <div class="muted small">Session started at ${startTime.toLocaleTimeString()} (${elapsed}m elapsed)</div>
        </div>
        <button class="btn-ghost btn-sm" onclick="showView('session')">Manage Session &rarr;</button>
      </div>
    `;
  } else {
    card.style.display = 'none';
  }
}

// Update the viewTarget function to include Arsenal list
const originalViewTarget = viewTarget;
viewTarget = function(id) {
  originalViewTarget(id);
  renderLogArsenal();
};

function updateTelemetry() {
  const telMem = document.getElementById('tel-mem-usage');
  if (!telMem) return;
  const total = JSON.stringify(localStorage).length;
  telMem.textContent = `${(total / 1024).toFixed(1)} KB`;
}

// Initial load updates
document.addEventListener('DOMContentLoaded', () => {
  updateDashboardSessionWidget();
  updateTelemetry();
  setInterval(() => {
    updateDashboardSessionWidget();
    updateTelemetry();
  }, 60000);
});

// end page guard

// Intercept Paste & Drop for Rich Editors
document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('paste', (e) => {
    if (e.target && e.target.classList.contains('rich-editor')) {
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          if (e.clipboardData.items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            const file = e.clipboardData.items[i].getAsFile();
            const id = e.target.id;
            if (file && id) processRichEditorImage(file, id);
          }
        }
      }
    }
  });

  document.body.addEventListener('drop', (e) => {
    if (e.target && e.target.classList.contains('rich-editor')) {
      if (e.dataTransfer && e.dataTransfer.files) {
        let hasImage = false;
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          if (e.dataTransfer.files[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            hasImage = true;
            const file = e.dataTransfer.files[i];
            const id = e.target.id;
            if (file && id) processRichEditorImage(file, id);
          }
        }
        if (hasImage) e.preventDefault();
      }
    }
  });
});

// ─── TARGET TABS ─────────────────────────────────────
function showTargetTab(tabId) {
  document.querySelectorAll('.t-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.target-tab-content').forEach(c => {
    c.classList.add('hidden');
    c.classList.remove('active');
  });
  
  const btn = document.getElementById('btn-tab-' + tabId);
  if (btn) {
    btn.classList.add('active');
    // Special styling for active tab to make it pop
    document.querySelectorAll('.t-tab').forEach(t => { t.style.borderColor = 'transparent'; t.style.color = 'var(--text-secondary)'; });
    btn.style.borderColor = 'var(--acid)';
    btn.style.color = 'var(--acid)';
  }
  
  const content = document.getElementById('tab-' + tabId);
  if (content) {
    content.classList.remove('hidden');
    content.classList.add('active');
  }
}

// ─── TARGET RESEARCH DOCS ──────────────────────────────
function renderTargetDocs(t) {
  const list = document.getElementById('td-docs-list');
  const empty = document.getElementById('td-docs-empty');
  if (!list) return;
  
  if (!t.docs || t.docs.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  
  empty.style.display = 'none';
  list.innerHTML = t.docs.map(doc => `
    <div style="background:var(--bg-elevated);border:1px solid var(--border);border-left:3px solid var(--purple);border-radius:var(--r-sm);padding:15px;display:flex;flex-direction:column;justify-content:space-between">
      <div>
        <div style="font-weight:600;color:var(--text-primary);margin-bottom:6px">${escapeHTML(doc.title || 'Untitled Document')}</div>
        <div style="font-size:0.7rem;color:var(--text-tertiary)">📅 ${doc.date || ''}</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn-primary btn-sm" onclick="showDocEditor('${doc.id}')" style="flex:1">✏️ Edit</button>
        <button class="btn-ghost btn-sm" onclick="deleteTargetDoc('${doc.id}')" style="color:var(--red);border:1px solid var(--red-dim)">✕</button>
      </div>
    </div>
  `).join('');
}

function showDocEditor(docId = null) {
  document.getElementById('td-docs-list-panel').classList.add('hidden');
  document.getElementById('td-doc-editor-panel').classList.remove('hidden');
  
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  
  if (docId) {
    const doc = (t.docs || []).find(d => d.id === docId);
    if (doc) {
      document.getElementById('td-doc-id').value = doc.id;
      document.getElementById('td-doc-title').value = doc.title || '';
      document.getElementById('td-rich-notes').innerHTML = doc.content || '';
      document.getElementById('td-doc-editor-title').textContent = '✏️ Edit Document';
    }
  } else {
    document.getElementById('td-doc-id').value = '';
    document.getElementById('td-doc-title').value = '';
    document.getElementById('td-rich-notes').innerHTML = '';
    document.getElementById('td-doc-editor-title').textContent = '✨ New Document';
  }
}

function hideDocEditor() {
  document.getElementById('td-doc-editor-panel').classList.add('hidden');
  document.getElementById('td-docs-list-panel').classList.remove('hidden');
}

function saveTargetDoc() {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  
  if (!t.docs) t.docs = [];
  
  const docId = document.getElementById('td-doc-id').value;
  const title = document.getElementById('td-doc-title').value.trim() || 'Untitled Document';
  const content = document.getElementById('td-rich-notes').innerHTML;
  const date = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  
  if (docId) {
    const doc = t.docs.find(d => d.id === docId);
    if (doc) {
      doc.title = title;
      doc.content = content;
      doc.date = date; // update modified date
    }
  } else {
    t.docs.push({
      id: 'doc_' + Date.now(),
      title,
      content,
      date
    });
  }
  
  saveTargets();
  hideDocEditor();
  renderTargetDocs(t);
  toast('Document saved successfully! 📝', 'success');
}

function deleteTargetDoc(docId) {
  if (!confirm('Are you sure you want to delete this document?')) return;
  const t = targets.find(t => t.id === currentTargetId);
  if (!t || !t.docs) return;
  
  t.docs = t.docs.filter(d => d.id !== docId);
  saveTargets();
  renderTargetDocs(t);
  toast('Document deleted', 'info');
}
