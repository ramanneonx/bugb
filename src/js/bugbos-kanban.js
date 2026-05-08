// bugbOS Kanban Module — Phase 6
// ══════════════════════════════════

const KANBAN_COLS = ['Recon', 'Testing', 'Reported', 'Triaged', 'Accepted', 'Paid'];

function renderKanban() {
  const board = document.getElementById('kanban-board');
  if (!board) return;

  board.innerHTML = KANBAN_COLS.map(col => {
    const colBugs = bugs.filter(b => b.status === col);
    const colors = {
      Recon: 'var(--cyan)', Testing: 'var(--amber)', Reported: 'var(--purple)',
      Triaged: 'var(--acid)', Accepted: '#00ff88', Paid: '#ffd700'
    };
    return `
      <div class="kanban-col" id="kcol-${col}" ondragover="event.preventDefault()" ondrop="dropBug(event, '${col}')">
        <div class="kanban-col-header" style="border-top:3px solid ${colors[col] || 'var(--border)'}">
          <div style="display:flex; justify-content:space-between; align-items:center">
            <span style="color:${colors[col]}; font-family:'Urbanist',sans-serif; font-weight:700; font-size:0.75rem; letter-spacing:1px; text-transform:uppercase">${col}</span>
            <span class="kanban-badge" style="background:${colors[col]}22; color:${colors[col]}">${colBugs.length}</span>
          </div>
        </div>
        <div class="kanban-cards" id="kcards-${col}">
          ${colBugs.map(b => buildKanbanCard(b)).join('')}
          ${colBugs.length === 0 ? '<div class="kanban-empty">Drop bugs here</div>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

function buildKanbanCard(b) {
  const sevColors = { P1: 'var(--red)', P2: 'var(--amber)', P3: 'var(--cyan)', P4: 'var(--text-tertiary)' };
  return `
    <div class="kanban-card" draggable="true"
      ondragstart="dragBug(event, ${b.id})"
      onclick="showKanbanDetail(${b.id})">
      <div class="kanban-sev" style="background:${sevColors[b.severity] || 'var(--border)'}22; color:${sevColors[b.severity] || 'var(--text-secondary)'}; border-left:3px solid ${sevColors[b.severity] || 'var(--border)'}">
        ${b.severity}
      </div>
      <div class="kanban-title">${b.title}</div>
      <div class="kanban-meta">
        <span>${b.target}</span>
        ${b.bounty ? `<span style="color:var(--acid)">$${b.bounty}</span>` : ''}
      </div>
    </div>
  `;
}

// ── Drag & Drop ───────────────────────────────────
let draggedBugId = null;

function dragBug(event, id) {
  draggedBugId = id;
  event.dataTransfer.effectAllowed = 'move';
}

function dropBug(event, newStatus) {
  event.preventDefault();
  if (!draggedBugId) return;
  
  const bug = bugs.find(b => b.id === draggedBugId);
  if (!bug || bug.status === newStatus) return;
  
  const oldStatus = bug.status;
  bug.status = newStatus;
  localStorage.setItem('bb_bugs', JSON.stringify(bugs));
  renderKanban();
  updateStats();
  logActivity(`Bug moved: "${bug.title}" → ${newStatus}`, 'info');
  toast(`Moved to ${newStatus} ✓`, 'success');
  draggedBugId = null;
}

// ── Bug Detail Modal from Kanban ──────────────────
function showKanbanDetail(id) {
  const bug = bugs.find(b => b.id === id);
  if (!bug) return;
  
  const sevColors = { P1: 'var(--red)', P2: 'var(--amber)', P3: 'var(--cyan)', P4: 'var(--text-tertiary)' };
  document.getElementById('kd-title').textContent = bug.title;
  document.getElementById('kd-severity').textContent = bug.severity;
  document.getElementById('kd-severity').style.color = sevColors[bug.severity] || 'var(--text-secondary)';
  document.getElementById('kd-target').textContent = bug.target;
  document.getElementById('kd-type').textContent = bug.type || 'N/A';
  document.getElementById('kd-status').textContent = bug.status;
  document.getElementById('kd-bounty').textContent = bug.bounty ? '$' + bug.bounty : 'Unpaid';
  document.getElementById('kd-date').textContent = bug.date;
  document.getElementById('kd-notes').textContent = bug.notes || 'No notes.';
  document.getElementById('kd-bug-id').value = id;
  
  document.getElementById('modal-kd').classList.remove('hidden');
}

function deleteKanbanBug() {
  const id = parseInt(document.getElementById('kd-bug-id').value);
  if (!confirm('Delete this bug?')) return;
  bugs = bugs.filter(b => b.id !== id);
  localStorage.setItem('bb_bugs', JSON.stringify(bugs));
  closeModal('modal-kd');
  renderKanban();
  updateStats();
  logActivity('Bug deleted from Kanban', 'info');
  toast('Bug deleted', 'info');
}

function editKanbanBugStatus(newStatus) {
  const id = parseInt(document.getElementById('kd-bug-id').value);
  const bug = bugs.find(b => b.id === id);
  if (!bug) return;
  bug.status = newStatus;
  localStorage.setItem('bb_bugs', JSON.stringify(bugs));
  closeModal('modal-kd');
  renderKanban();
  updateStats();
  logActivity(`Bug status updated to ${newStatus}`, 'success');
  toast(`Moved to ${newStatus}`, 'success');
}
