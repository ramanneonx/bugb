// bugbOS Analytics Module — Phase 4
// ═══════════════════════════════════

function buildAnalytics() {
  renderSeverityChart();
  renderTypeChart();
  renderStatusChart();
  renderBountyTimeline();
  renderPlatformChart();
  renderWinRate();
}

// ── Severity Distribution ─────────────────────────
function renderSeverityChart() {
  const container = document.getElementById('chart-severity');
  if (!container) return;

  const map = { P1: 0, P2: 0, P3: 0, P4: 0 };
  bugs.forEach(b => { if (map[b.severity] !== undefined) map[b.severity]++; });

  const total = bugs.length || 1;
  const colors = { P1: 'var(--red)', P2: 'var(--amber)', P3: 'var(--cyan)', P4: 'var(--acid)' };
  const labels = { P1: 'Critical', P2: 'High', P3: 'Medium', P4: 'Low' };

  container.innerHTML = Object.entries(map).map(([sev, count]) => {
    const pct = Math.round((count / total) * 100);
    return `
      <div class="bar-row">
        <div class="bar-label">
          <span class="sev-badge" style="background:${colors[sev]}22; color:${colors[sev]}">${sev}</span>
          <span class="muted small">${labels[sev]}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%; background:${colors[sev]}; box-shadow: 0 0 10px ${colors[sev]}55"></div>
        </div>
        <div class="bar-value">${count}</div>
      </div>
    `;
  }).join('');
}

// ── Bug Type Distribution ─────────────────────────
function renderTypeChart() {
  const container = document.getElementById('chart-type');
  if (!container) return;

  const map = {};
  bugs.forEach(b => {
    const t = b.type || 'Other';
    map[t] = (map[t] || 0) + 1;
  });

  const total = bugs.length || 1;
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const palette = ['var(--acid)', 'var(--cyan)', 'var(--amber)', 'var(--red)', 'var(--purple)', 'var(--text-secondary)'];

  container.innerHTML = sorted.map(([type, count], i) => {
    const pct = Math.round((count / total) * 100);
    return `
      <div class="bar-row">
        <div class="bar-label"><span class="muted small">${type}</span></div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%; background:${palette[i % palette.length]}"></div>
        </div>
        <div class="bar-value">${count}</div>
      </div>
    `;
  }).join('') || '<div class="muted small" style="padding:20px">No bug data yet.</div>';
}

// ── Status Breakdown ──────────────────────────────
function renderStatusChart() {
  const container = document.getElementById('chart-status');
  if (!container) return;

  const map = { Reported: 0, Triaged: 0, Accepted: 0, Paid: 0, Duplicate: 0, Informative: 0 };
  bugs.forEach(b => { if (map[b.status] !== undefined) map[b.status]++; });

  const total = bugs.length || 1;
  const colors = {
    Reported: 'var(--cyan)', Triaged: 'var(--amber)',
    Accepted: 'var(--acid)', Paid: '#00ff88',
    Duplicate: 'var(--red)', Informative: 'var(--text-tertiary)'
  };

  container.innerHTML = Object.entries(map).map(([status, count]) => {
    const pct = Math.round((count / total) * 100);
    return `
      <div class="bar-row">
        <div class="bar-label"><span class="muted small" style="color:${colors[status]}">${status}</span></div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%; background:${colors[status]}"></div>
        </div>
        <div class="bar-value">${count}</div>
      </div>
    `;
  }).join('');
}

// ── Bounty Timeline ───────────────────────────────
function renderBountyTimeline() {
  const container = document.getElementById('chart-bounty');
  if (!container) return;

  const monthly = {};
  bugs.forEach(b => {
    if (!b.bounty || !b.date) return;
    const parts = b.date.split('/');
    const key = parts.length >= 2 ? `${parts[0]}/${parts[2] || new Date().getFullYear()}` : b.date;
    monthly[key] = (monthly[key] || 0) + (parseFloat(b.bounty) || 0);
  });

  if (Object.keys(monthly).length === 0) {
    container.innerHTML = '<div class="muted small" style="padding:20px">No bounties tracked yet.</div>';
    return;
  }

  const max = Math.max(...Object.values(monthly)) || 1;
  container.innerHTML = `
    <div class="timeline-chart">
      ${Object.entries(monthly).slice(-6).map(([month, amount]) => {
        const h = Math.max(4, Math.round((amount / max) * 100));
        return `
          <div class="timeline-col">
            <div class="timeline-amount">$${amount.toLocaleString()}</div>
            <div class="timeline-bar" style="height:${h}px"></div>
            <div class="timeline-label">${month}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ── Platform Distribution ─────────────────────────
function renderPlatformChart() {
  const container = document.getElementById('chart-platform');
  if (!container) return;

  const map = {};
  targets.forEach(t => {
    const p = t.platform || 'Unknown';
    map[p] = (map[p] || 0) + 1;
  });

  const total = targets.length || 1;
  const palette = ['var(--acid)', 'var(--cyan)', 'var(--amber)', 'var(--red)', 'var(--purple)'];
  const entries = Object.entries(map);

  if (entries.length === 0) {
    container.innerHTML = '<div class="muted small" style="padding:20px">No targets added yet.</div>';
    return;
  }

  container.innerHTML = entries.map(([platform, count], i) => {
    const pct = Math.round((count / total) * 100);
    return `
      <div class="bar-row">
        <div class="bar-label"><span class="muted small">${platform}</span></div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%; background:${palette[i % palette.length]}"></div>
        </div>
        <div class="bar-value">${count}</div>
      </div>
    `;
  }).join('');
}

// ── Win Rate / Outcome Donut ──────────────────────
function renderWinRate() {
  const container = document.getElementById('chart-winrate');
  if (!container) return;

  const paid = bugs.filter(b => b.status === 'Paid').length;
  const accepted = bugs.filter(b => b.status === 'Accepted').length;
  const dup = bugs.filter(b => b.status === 'Duplicate').length;
  const total = bugs.length;

  const rate = total > 0 ? Math.round(((paid + accepted) / total) * 100) : 0;
  const totalEarned = bugs.reduce((s, b) => s + (parseFloat(b.bounty) || 0), 0);

  container.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px">
      <div class="metric-block">
        <div class="metric-val acid">${rate}%</div>
        <div class="metric-label">Win Rate</div>
      </div>
      <div class="metric-block">
        <div class="metric-val amber">$${totalEarned.toLocaleString()}</div>
        <div class="metric-label">Total Earned</div>
      </div>
      <div class="metric-block">
        <div class="metric-val cyan">${paid}</div>
        <div class="metric-label">Paid Bugs</div>
      </div>
      <div class="metric-block">
        <div class="metric-val red">${dup}</div>
        <div class="metric-label">Duplicates</div>
      </div>
    </div>
  `;
}
