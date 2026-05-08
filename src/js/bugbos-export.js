// bugbOS Export Module — Phase 5
// ════════════════════════════════

// ── Export Bugs as CSV ────────────────────────────
function exportBugsCSV() {
  if (!bugs.length) return toast('No bugs to export', 'error');

  const headers = ['ID', 'Title', 'Severity', 'Target', 'Type', 'Status', 'Bounty', 'Date', 'Notes'];
  const rows = bugs.map(b => [
    b.id, `"${b.title}"`, b.severity, `"${b.target}"`,
    b.type, b.status, b.bounty, b.date, `"${(b.notes || '').replace(/"/g, "'")}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile('bugbos-bugs.csv', csv, 'text/csv');
  logActivity('Exported bugs to CSV', 'success');
  toast('Bugs exported as CSV ✅', 'success');
}

// ── Export Notes as Markdown ──────────────────────
function exportNotesMarkdown() {
  if (!notes.length) return toast('No notes to export', 'error');

  const md = notes.map(n => `# ${n.title}\n\n${n.body || '(no content)'}\n\n---\n`).join('\n');
  downloadFile('bugbos-notes.md', md, 'text/markdown');
  logActivity('Exported notes to Markdown', 'success');
  toast('Notes exported ✅', 'success');
}

// ── Export Report as Markdown ─────────────────────
function exportReport() {
  const content = document.getElementById('report-output')?.textContent;
  if (!content || content.includes('Fill the form')) return toast('Generate a report first', 'error');
  downloadFile('bug-report.md', content, 'text/markdown');
  toast('Report downloaded ✅', 'success');
}

// ── Full OS Backup as JSON ────────────────────────
function exportFullBackup() {
  const backup = {
    version: '3.0',
    exportDate: new Date().toISOString(),
    bugs,
    notes,
    targets,
    activity
  };
  const json = JSON.stringify(backup, null, 2);
  downloadFile(`bugbos-backup-${Date.now()}.json`, json, 'application/json');
  logActivity('Full OS backup created', 'success');
  toast('Full backup downloaded ✅', 'success');
}

// ── Import JSON Backup ────────────────────────────
function importBackup(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.bugs) { bugs = data.bugs; localStorage.setItem('bb_bugs', JSON.stringify(bugs)); }
      if (data.notes) { notes = data.notes; localStorage.setItem('bb_notes', JSON.stringify(notes)); }
      if (data.targets) { targets = data.targets; localStorage.setItem('bb_targets', JSON.stringify(targets)); }
      if (data.activity) { activity = data.activity; localStorage.setItem('bb_activity', JSON.stringify(activity)); }
      updateStats();
      renderTargets();
      renderNotes();
      renderActivity();
      logActivity('OS backup imported successfully', 'success');
      toast('Backup imported! Data restored ✅', 'success');
    } catch {
      toast('Invalid backup file', 'error');
    }
  };
  reader.readAsText(input.files[0]);
}

// ── Helper: Download a File ───────────────────────
function downloadFile(filename, content, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}
