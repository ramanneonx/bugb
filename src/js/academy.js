// ═══════════════════════════════════════════════════
// bugbOS v3.0 — Core Logic (academy.html only)
// ═══════════════════════════════════════════════════

// Guard: only run on the academy page (has #page-title)
if (!document.getElementById('page-title')) {
  // Wrong page — do nothing
} else {

// STATE
let bugs  = JSON.parse(localStorage.getItem('bb_bugs')  || '[]');
let notes = JSON.parse(localStorage.getItem('bb_notes') || '[]');
let editingNoteId = null;
let currentAnimKey = null;
let animNotes = JSON.parse(localStorage.getItem('bb_anim_notes') || '{}');

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
    el.innerHTML = `<div class="pipe-card-title"><span class="sev-badge sev-${b.severity}">${b.severity}</span> ${b.title}</div><div class="pipe-card-meta">${b.target || ''}</div>`;
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
      <td><strong style="font-size:.9rem">${b.title}</strong><div style="font-size:.72rem;color:var(--text-tertiary)">${b.type}</div></td>
      <td style="color:var(--cyan);font-family:var(--font-mono);font-size:.82rem">${b.target}</td>
      <td><span class="tag tag-acid" style="font-size:.65rem">${b.type}</span></td>
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
      <div class="note-card-title">${n.title}</div>
      <div class="note-card-body">${(n.body||'').slice(0,160)}${(n.body||'').length>160?'...':''}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
        <span class="note-card-tag">${n.tag||'General'}</span>
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
  updateStats();
  renderMindset();
  renderRecon();
  renderVulnIndex();
  renderTools();
  renderCases();
  renderPayloads();
  renderTargets();
  renderActivity();
  buildAnalytics();
  initTimer();
  renderKanban();
});



// ─── RENDERING FUNCTIONS ─────────────────────────────

function renderMindset() {
  const container = document.getElementById('mindset-cards');
  if (!container) return;
  container.innerHTML = mindsetData.map(item => `
    <div class="study-card">
      <div class="sc-tag" style="background:${item.color}22; color:${item.color}">${item.tag}</div>
      <div class="sc-title">${item.title}</div>
      <div class="sc-body">${item.body}</div>
    </div>
  `).join('');
}

function renderTools() {
  const container = document.getElementById('tools-content');
  if (!container) return;
  container.innerHTML = toolsData.map(tool => `
    <div class="tool-card">
      <div class="tool-name">${tool.name}</div>
      <div class="tool-desc">${tool.desc}</div>
      <div class="tool-cmd">${tool.cmd}</div>
      <button class="btn-ghost btn-sm" style="margin-top:10px" onclick="copyText('${tool.cmd.replace(/'/g, "\\'").replace(/\n/g, '\\n')}')">Copy Command</button>
    </div>
  `).join('');
}

function renderCases() {
  const container = document.getElementById('cases-content');
  if (!container) return;
  container.innerHTML = casesData.map(c => `
    <div class="case-card">
      <div class="case-title">${c.title}</div>
      <div class="case-target">${c.target} | <span style="color:var(--acid)">${c.bounty}</span></div>
      <div class="case-steps" style="white-space:pre-line">${c.body}</div>
      ${c.link ? `<a href="${c.link}" target="_blank" class="case-link">Read Full Writeup &rarr;</a>` : ''}
    </div>
  `).join('');
}

function renderRecon() {
  const container = document.getElementById('recon-content');
  if (!container) return;
  container.innerHTML = reconData.map(phase => `
    <div class="phase-block">
      <div class="phase-title">${phase.phase}</div>
      <div class="phase-body">
        ${phase.items.map(item => `
          <div class="phase-item">
            <div class="phase-item-title">${item.title}</div>
            <div class="phase-item-body">${item.body}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderVulnIndex() {
  const container = document.getElementById('vuln-index-list');
  if (!container) return;
  container.innerHTML = vulnData.map((vuln, idx) => `
    <div class="vuln-index-item" onclick="selectVuln(${idx})">
      <div style="width:10px; height:10px; border-radius:50%; background:${vuln.color}"></div>
      ${vuln.name}
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
  const noteKey = `vuln_note_${vuln.name}`;
  const savedNote = localStorage.getItem(noteKey) || '';
  document.getElementById('vd-notes-display').innerHTML = savedNote || '<p class="muted">No personal notes yet. Click Edit to add your own methodologies and payloads.</p>';
  document.getElementById('vd-editor').innerHTML = savedNote;
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
  localStorage.setItem(`vuln_note_${title}`, content);
  document.getElementById('vd-notes-display').innerHTML = content;
  toggleVulnEditor();
  toast('Methodology saved! 📚', 'success');
}

function renderPayloads(filter = 'all') {
  const filterBar = document.getElementById('payload-filter-bar');
  const grid = document.getElementById('payload-grid');
  if (!filterBar || !grid) return;
  
  // Render filters
  filterBar.innerHTML = `<button class="filter-btn ${filter === 'all' ? 'active' : ''}" onclick="renderPayloads('all')">All</button>` + 
    payloadData.map(cat => `
      <button class="filter-btn ${filter === cat.category ? 'active' : ''}" onclick="renderPayloads('${cat.category}')">${cat.category}</button>
    `).join('');
    
  // Render payloads
  const filteredData = filter === 'all' ? payloadData : payloadData.filter(c => c.category === filter);
  grid.innerHTML = filteredData.map(cat => `
    <div class="panel">
      <div class="panel-header"><div class="ph-dot" style="background:${cat.color}"></div>${cat.category} Arsenal</div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:12px">
        ${cat.payloads.map(p => `
          <div class="phase-item" style="display:flex; flex-direction:column; justify-content:space-between">
            <div>
              <div class="phase-item-title" style="color:${cat.color}">${p.name}</div>
              <div class="tool-cmd" style="margin:8px 0; font-size:.7rem">${p.payload}</div>
            </div>
            <button class="btn-ghost btn-sm" onclick="copyText('${p.payload.replace(/'/g, "\\'").replace(/\n/g, '\\n')}')">Copy</button>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard!', 'info'));
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
  
  const noteKey = `anim_note_${vuln.name}`;
  const savedNote = localStorage.getItem(noteKey) || `<p class="muted">Advanced tactical notes for ${vuln.name} will appear here. Click Edit to customize.</p>`;
  document.getElementById('anim-note-content').innerHTML = savedNote;
}

function editAnimNote() {
  const activeAnim = document.querySelector('.anim-item.active');
  if (!activeAnim) return toast('Select an animation first', 'error');
  
  const idx = Array.from(activeAnim.parentNode.children).indexOf(activeAnim);
  const vuln = vulnData[idx];
  currentAnimKey = `anim_note_${vuln.name}`;
  
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
let targets = JSON.parse(localStorage.getItem('bb_targets') || '[]');
let currentTargetId = null;

function renderTargets() {
  const container = document.getElementById('targets-grid');
  if (!container) return;

  if (targets.length === 0) {
    container.innerHTML = '<div class="panel full-width" style="text-align:center; padding:40px; color:var(--text-tertiary)">No targets yet. Click + Add Target.</div>';
  } else {
    container.innerHTML = targets.map(t => {
      const totalTasks = (t.checklist || []).length;
      const doneTasks = (t.checklist || []).filter(c => c.done).length;
      const pct = totalTasks > 0 ? Math.floor((doneTasks / totalTasks) * 100) : 0;
      return `<div class="panel" onclick="viewTarget(${t.id})" style="cursor:pointer">
        <div class="panel-header"><div class="ph-dot"></div>${t.platform}</div>
        <div style="font-size:1.2rem; font-weight:800; margin-bottom:5px">${t.name}</div>
        <div class="muted small" style="margin-bottom:12px">${(t.scope || '').slice(0,60)}...</div>
        <div style="margin-bottom:6px; display:flex; justify-content:space-between; font-size:0.7rem">
          <span class="muted">RECON PROGRESS</span><span style="color:var(--acid)">${pct}%</span>
        </div>
        <div style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; margin-bottom:15px">
          <div style="height:100%; width:${pct}%; background:var(--acid); box-shadow:0 0 10px var(--acid)"></div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center">
          <span class="tag tag-acid">ACTIVE</span>
          <span class="muted small">${(t.logs || []).length} logs</span>
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


function showAddTargetModal() { document.getElementById('modal-target').classList.remove('hidden'); }

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
      { id: 1, text: 'Subdomain Enumeration', done: false },
      { id: 2, text: 'Live Host Detection', done: false },
      { id: 3, text: 'Port Scanning', done: false },
      { id: 4, text: 'Directory Fuzzing', done: false }
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
  
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-target-detail').classList.add('active');
  
  document.getElementById('td-name').textContent = t.name;
  document.getElementById('td-notes').value = t.notes || '';
  renderTargetChecklist(t);
  renderTargetLogs(t);
}

function renderTargetChecklist(t) {
  const container = document.getElementById('td-checklist');
  container.innerHTML = (t.checklist || []).map(c => `
    <li class="${c.done ? 'done' : ''}">
      <input type="checkbox" ${c.done ? 'checked' : ''} onchange="toggleTargetTask(${c.id})">
      ${c.text}
    </li>
  `).join('');
}


function toggleTargetTask(taskId) {
  const t = targets.find(t => t.id === currentTargetId);
  if (!t) return;
  const task = t.checklist.find(c => c.id === taskId);
  if (task) task.done = !task.done;
  saveTargets();
  renderTargetChecklist(t);
}

function addTargetChecklistItem() {
  const input = document.getElementById('td-new-item');
  const text = input.value.trim();
  if (!text) return;
  const t = targets.find(t => t.id === currentTargetId);
  t.checklist.push({ id: Date.now(), text, done: false });
  saveTargets();
  input.value = '';
  renderTargetChecklist(t);
}

function renderTargetLogs(t) {
  const tbody = document.getElementById('td-tools-log');
  tbody.innerHTML = (t.logs || []).map((l, i) => `
    <tr>
      <td class="mono">${l.tool}</td>
      <td style="white-space:pre-wrap">${l.out}</td>
      <td>${l.date}</td>
      <td><button class="btn-danger btn-sm" onclick="deleteTargetLog(${i})">✕</button></td>
    </tr>
  `).join('');
}


function addTargetToolLog() {
  const tool = document.getElementById('td-tool-name').value.trim();
  const out = document.getElementById('td-tool-out').value.trim();
  if (!tool || !out) return toast('Fill both fields', 'error');
  
  const t = targets.find(t => t.id === currentTargetId);
  t.logs.unshift({ tool, out, date: new Date().toLocaleDateString() });
  saveTargets();
  
  document.getElementById('td-tool-name').value = '';
  document.getElementById('td-tool-out').value = '';
  renderTargetLogs(t);
  logActivity(`Recon log added for ${t.name}`, 'info');
  toast('Log added!', 'info');
}

function deleteTargetLog(idx) {
  const t = targets.find(t => t.id === currentTargetId);
  t.logs.splice(idx, 1);
  saveTargets();
  renderTargetLogs(t);
}

function saveTargetNotes() {
  const t = targets.find(t => t.id === currentTargetId);
  t.notes = document.getElementById('td-notes').value;
  saveTargets();
  toast('Notes saved!', 'success');
}

function saveTargets() {
  localStorage.setItem('bb_targets', JSON.stringify(targets));
  renderTargets();
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
    mindset:'Mindset & Strategy', 
    recon:'Recon Mastery', 
    vulns:'Vulnerability Atlas', 
    animations:'Attack Animations', 
    tools:'Tool Arsenal', 
    casestudies:'Case Studies', 
    payloads:'Payload Arsenal', 
    notes:'My Notes', 
    reports:'Report Builder' 
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

// ─── GLOBAL SEARCH ───────────────────────────────
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('modal-search').classList.remove('hidden');
    document.getElementById('global-search-input').focus();
  }
  if (e.key === 'Escape') {
    closeModal('modal-search');
    closeModal('modal-bug');
    closeModal('modal-note');
    closeModal('modal-target');
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
  
  // Search Bugs
  bugs.filter(b => b.title.toLowerCase().includes(q) || b.target.toLowerCase().includes(q)).forEach(b => {
    html += `<div class="result-item" onclick="showView('tracker'); closeModal('modal-search')"><span class="result-type" style="background:var(--red-dim); color:var(--red)">BUG</span> ${b.title} (${b.target})</div>`;
  });
  
  // Search Targets
  targets.filter(t => t.name.toLowerCase().includes(q)).forEach(t => {
    html += `<div class="result-item" onclick="viewTarget(${t.id}); closeModal('modal-search')"><span class="result-type" style="background:var(--cyan-dim); color:var(--cyan)">TARGET</span> ${t.name}</div>`;
  });
  
  // Search Notes
  notes.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)).forEach(n => {
    html += `<div class="result-item" onclick="editNote(${n.id}); closeModal('modal-search')"><span class="result-type" style="background:var(--purple-dim); color:var(--purple)">NOTE</span> ${n.title}</div>`;
  });
  
  // Search Payloads
  payloadData.forEach(cat => {
    cat.payloads.filter(p => p.name.toLowerCase().includes(q) || p.payload.toLowerCase().includes(q)).forEach(p => {
      html += `<div class="result-item" onclick="showView('payloads'); closeModal('modal-search')"><span class="result-type" style="background:var(--acid-dim); color:var(--acid)">PAYLOAD</span> ${p.name} [${cat.category}]</div>`;
    });
  });

  // Search Knowledge (Vuln Atlas)
  vulnData.filter(v => v.name.toLowerCase().includes(q) || v.desc.toLowerCase().includes(q)).forEach((v, i) => {
    html += `<div class="result-item" onclick="showView('vulns'); selectVuln(${i}); closeModal('modal-search')"><span class="result-type" style="background:var(--amber-dim); color:var(--amber)">VULN</span> ${v.name}</div>`;
  });

  res.innerHTML = html || `<div style="text-align:center; padding:40px; color:var(--text-tertiary)">No results found for "${q}"</div>`;
}

// ─── ACTIVITY FEED ────────────────────────────────
let activity = JSON.parse(localStorage.getItem('bb_activity') || '[]');

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

} // end page guard

