// bugbOS Focus Timer Module — Phase 7
// ══════════════════════════════════════

let timerInterval = null;
let timerSeconds = 25 * 60;
let timerRunning = false;
let timerMode = 'work'; // 'work' | 'break'
let sessionLog = JSON.parse(localStorage.getItem('bb_sessions') || '[]');

function initTimer() {
  renderTimer();
  renderSessionLog();
}

function renderTimer() {
  const display = document.getElementById('timer-display');
  const modeEl = document.getElementById('timer-mode');
  if (!display) return;

  const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const secs = (timerSeconds % 60).toString().padStart(2, '0');
  display.textContent = `${mins}:${secs}`;
  if (modeEl) modeEl.textContent = timerMode === 'work' ? '🎯 HUNT SESSION' : '☕ BREAK TIME';
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  document.getElementById('btn-timer-start').classList.add('hidden');
  document.getElementById('btn-timer-pause').classList.remove('hidden');

  timerInterval = setInterval(() => {
    timerSeconds--;
    renderTimer();

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerExpired();
    }
  }, 1000);

  logActivity(`Hunt session started (${timerMode === 'work' ? '25 min' : '5 min break'})`, 'info');
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  document.getElementById('btn-timer-start').classList.remove('hidden');
  document.getElementById('btn-timer-pause').classList.add('hidden');
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = timerMode === 'work' ? 25 * 60 : 5 * 60;
  renderTimer();
  document.getElementById('btn-timer-start').classList.remove('hidden');
  document.getElementById('btn-timer-pause').classList.add('hidden');
}

function switchTimerMode(mode) {
  timerMode = mode;
  resetTimer();
  document.querySelectorAll('.timer-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

function timerExpired() {
  toast(timerMode === 'work' ? '🎯 Hunt session complete! Take a break.' : '☕ Break over! Time to hunt.', 'success');

  try {
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    oscillator.connect(audio.destination);
    oscillator.frequency.setValueAtTime(880, audio.currentTime);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.3);
  } catch (e) {}

  // Log the session
  if (timerMode === 'work') {
    const goal = document.getElementById('timer-goal')?.value || 'No goal set';
    const session = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      goal,
      duration: '25 min'
    };
    sessionLog.unshift(session);
    if (sessionLog.length > 50) sessionLog.pop();
    localStorage.setItem('bb_sessions', JSON.stringify(sessionLog));
    renderSessionLog();
    logActivity('Hunt session completed', 'success');
  }

  // Auto-switch mode
  timerMode = timerMode === 'work' ? 'break' : 'work';
  timerSeconds = timerMode === 'work' ? 25 * 60 : 5 * 60;
  renderTimer();
}

function renderSessionLog() {
  const container = document.getElementById('session-log');
  if (!container) return;

  if (!sessionLog.length) {
    container.innerHTML = '<div class="muted small" style="padding:20px; text-align:center">No sessions logged yet. Start your first hunt!</div>';
    return;
  }

  container.innerHTML = sessionLog.slice(0, 10).map(s => `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; background:var(--bg-glass); padding:10px 14px; border-radius:var(--r-sm); border-left:2px solid var(--acid)">
      <div>
        <div style="font-size:0.8rem; font-weight:700; color:var(--text-primary)">${s.goal}</div>
        <div class="muted small">${s.date} at ${s.time} · ${s.duration}</div>
      </div>
      <span class="tag tag-acid">✓</span>
    </div>
  `).join('');
}
