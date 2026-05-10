// bugbOS Focus Timer Module — Phase 7
// ══════════════════════════════════════

let timerInterval = null;
let customWorkMinutes = parseFloat(localStorage.getItem('bb_custom_work')) || 25;
let customBreakMinutes = parseFloat(localStorage.getItem('bb_custom_break')) || 5;
let timerSeconds = customWorkMinutes * 60;
let timerRunning = false;
let timerMode = 'work'; // 'work' | 'break'
let sessionLog = JSON.parse(localStorage.getItem('bb_sessions') || '[]');

function initTimer() {
  const workEl = document.getElementById('custom-work-time');
  const breakEl = document.getElementById('custom-break-time');
  if (workEl) workEl.value = customWorkMinutes;
  if (breakEl) breakEl.value = customBreakMinutes;
  updateTimerButtons();
  renderTimer();
  renderSessionLog();
}

function toggleTimerSettings() {
  const panel = document.getElementById('timer-settings-panel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  }
}

function updateTimerSettings() {
  const workInput = parseFloat(document.getElementById('custom-work-time').value) || 25;
  const breakInput = parseFloat(document.getElementById('custom-break-time').value) || 5;
  
  customWorkMinutes = Math.max(0.1, Math.min(workInput, 120));
  customBreakMinutes = Math.max(0.1, Math.min(breakInput, 60));
  
  localStorage.setItem('bb_custom_work', customWorkMinutes);
  localStorage.setItem('bb_custom_break', customBreakMinutes);
  
  updateTimerButtons();
  
  if (!timerRunning) {
    resetTimer();
  }
}

function updateTimerButtons() {
  const btnWork = document.getElementById('btn-mode-work');
  const btnBreak = document.getElementById('btn-mode-break');
  if (btnWork) btnWork.textContent = `${customWorkMinutes} MIN HUNT`;
  if (btnBreak) btnBreak.textContent = `${customBreakMinutes} MIN BREAK`;
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

let targetEndTime = 0;

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  document.getElementById('btn-timer-start').classList.add('hidden');
  document.getElementById('btn-timer-pause').classList.remove('hidden');
  const wrapper = document.getElementById('premium-timer-wrapper');
  if (wrapper) wrapper.classList.add('running');

  targetEndTime = Date.now() + (timerSeconds * 1000);

  timerInterval = setInterval(() => {
    const remaining = Math.round((targetEndTime - Date.now()) / 1000);

    if (remaining <= 0) {
      timerSeconds = 0;
      renderTimer();
      clearInterval(timerInterval);
      timerRunning = false;
      timerExpired();
    } else {
      timerSeconds = remaining;
      renderTimer();
    }
  }, 1000);

  logActivity(`Hunt session started (${timerMode === 'work' ? customWorkMinutes + ' min' : customBreakMinutes + ' min break'})`, 'info');
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  document.getElementById('btn-timer-start').classList.remove('hidden');
  document.getElementById('btn-timer-pause').classList.add('hidden');
  const wrapper = document.getElementById('premium-timer-wrapper');
  if (wrapper) wrapper.classList.remove('running');
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = timerMode === 'work' ? customWorkMinutes * 60 : customBreakMinutes * 60;
  renderTimer();
  document.getElementById('btn-timer-start').classList.remove('hidden');
  document.getElementById('btn-timer-pause').classList.add('hidden');
  const wrapper = document.getElementById('premium-timer-wrapper');
  if (wrapper) wrapper.classList.remove('running');
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
    // Check custom settings
    let type = 'system';
    let data = null;
    
    // Check if currentSettings exists globally (it does from bugbos-settings.js)
    if (typeof currentSettings !== 'undefined') {
        type = currentSettings.timerSoundType || 'system';
        data = currentSettings.timerSoundData;
    }

    if (type === 'custom' && data) {
        const audio = new Audio(data);
        audio.play();
    } else if (type === 'system') {
        const audio = new AudioContext();
        const oscillator = audio.createOscillator();
        oscillator.connect(audio.destination);
        oscillator.frequency.setValueAtTime(880, audio.currentTime);
        oscillator.start();
        oscillator.stop(audio.currentTime + 0.3);
    }
    // if 'mute', do nothing
  } catch (e) {}

  // Trigger Robot Overlay Animation
  const overlay = document.getElementById('timer-robot-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    overlay.classList.add('robot-enter');
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.classList.remove('robot-enter');
    }, 4000);
  }


  // Log the session
  if (timerMode === 'work') {
    const goal = document.getElementById('timer-goal')?.value || 'No goal set';
    const session = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      goal,
      duration: `${customWorkMinutes} min`
    };
    sessionLog.unshift(session);
    if (sessionLog.length > 50) sessionLog.pop();
    localStorage.setItem('bb_sessions', JSON.stringify(sessionLog));
    renderSessionLog();
    logActivity('Hunt session completed', 'success');
  }

  // Auto-switch mode
  timerMode = timerMode === 'work' ? 'break' : 'work';
  timerSeconds = timerMode === 'work' ? customWorkMinutes * 60 : customBreakMinutes * 60;
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
        <div style="font-size:0.8rem; font-weight:700; color:var(--text-primary)">${escapeHTML(s.goal)}</div>
        <div class="muted small">${escapeHTML(s.date)} at ${escapeHTML(s.time)} · ${escapeHTML(s.duration)}</div>
      </div>
      <span class="tag tag-acid">✓</span>
    </div>
  `).join('');
}
