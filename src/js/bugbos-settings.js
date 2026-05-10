// bugbos-settings.js — Global UI customization engine
// Handles themes, layouts, typography, tab visibility, tab reordering, timer sounds.

const SPECIAL_THEMES = ['neo-brutalist', 'hand-drawn', 'premium-minimalist'];

// ALL tab definitions in sidebar order
const ALL_SIDEBAR_TABS = [
    { id: 'dashboard',  name: '🎯 Command Dashboard' },
    { id: 'tracker',    name: '📡 Bug Tracker' },
    { id: 'kanban',     name: '🗂️ Kanban Board' },
    { id: 'targets',    name: '🎯 Targets Intel' },
    { id: 'ai',         name: '🤖 AI Investigator' },
    { id: 'mindset',    name: '🧠 Session Planner' },
    { id: 'recon',      name: '🔍 Recon Mastery' },
    { id: 'vulns',      name: '⚡ Vulnerability Atlas' },
    { id: 'tools',      name: '🔧 Tools Arsenal' },
    { id: 'animations', name: '🎬 Attack Animations' },
    { id: 'notes',      name: '📝 My Notes' },
    { id: 'payloads',   name: '💣 Payload Arsenal' },
    { id: 'reports',    name: '📋 Report Builder' },
    { id: 'analytics',  name: '📊 Analytics Dashboard' },
    { id: 'focus',      name: '⏱️ Focus Timer' }
];

const defaultSettings = {
    theme: 'premium-minimalist',
    mode: 'dark',
    customColors: { acid: '#d4af37', cyan: '#f3f4f6', red: '#ef4444' },
    layout: 'flat',
    typography: 'inter',
    hiddenTabs: [],
    tabOrder: ALL_SIDEBAR_TABS.map(t => t.id),
    timerSoundType: 'system',
    timerSoundData: null,
    customComponentColors: {}
};

let currentSettings = { ...defaultSettings };

const SETTINGS_VERSION = 4;

// ─── Load / Save ─────────────────────────────────────────────────────────────

function loadSettings() {
    const saved = localStorage.getItem('bugbos_settings');
    const savedVersion = parseInt(localStorage.getItem('bugbos_settings_ver') || '0');

    if (saved && savedVersion >= SETTINGS_VERSION) {
        try {
            currentSettings = { ...defaultSettings, ...JSON.parse(saved) };
        } catch(e) { console.error('Settings parse error', e); }
    } else {
        currentSettings = { ...defaultSettings };
        localStorage.setItem('bugbos_settings_ver', SETTINGS_VERSION);
    }
    applyAllSettings();
}

function saveSettings() {
    localStorage.setItem('bugbos_settings', JSON.stringify(currentSettings));
}

// ─── Apply All ────────────────────────────────────────────────────────────────

function applyAllSettings() {
    applyThemeMode(currentSettings.mode || 'dark', false);
    applyThemePreset(currentSettings.theme, false);

    if (!SPECIAL_THEMES.includes(currentSettings.theme) && currentSettings.customColors) {
        const root = document.documentElement;
        root.style.setProperty('--acid', currentSettings.customColors.acid);
        root.style.setProperty('--cyan', currentSettings.customColors.cyan);
        root.style.setProperty('--red', currentSettings.customColors.red);
        const thmAcid = document.getElementById('thm-acid');
        const thmCyan = document.getElementById('thm-cyan');
        const thmRed = document.getElementById('thm-red');
        if (thmAcid) thmAcid.value = currentSettings.customColors.acid;
        if (thmCyan) thmCyan.value = currentSettings.customColors.cyan;
        if (thmRed) thmRed.value = currentSettings.customColors.red;
    }

    applyStructuralMode(currentSettings.layout, false);
    applyTypography(currentSettings.typography, false);

    // Sidebar tab ordering + visibility
    reorderSidebar();
    if (currentSettings.hiddenTabs && currentSettings.hiddenTabs.length) {
        currentSettings.hiddenTabs.forEach(id => _hideSidebarTab(id));
    }

    // Render the Tab Manager list in the settings panel
    renderSettingsTabList();

    // Timer sound select
    const soundSelect = document.getElementById('settings-timer-sound');
    const customWrap  = document.getElementById('settings-timer-custom-wrap');
    if (soundSelect) {
        soundSelect.value = currentSettings.timerSoundType || 'system';
        if (customWrap) customWrap.style.display = soundSelect.value === 'custom' ? 'block' : 'none';
    }

    applyCustomComponentColors();
}

// ─── Theme Mode ───────────────────────────────────────────────────────────────

function toggleThemeMode() {
    const newMode = currentSettings.mode === 'light' ? 'dark' : 'light';
    applyThemeMode(newMode, true);
}

function applyThemeMode(mode, save = true) {
    currentSettings.mode = mode;
    document.body.setAttribute('data-mode', mode);
    const btn = document.getElementById('btn-theme-mode');
    if (btn) {
        btn.innerHTML = mode === 'light' ? '☀️ Light' : '🌙 Dark';
        btn.style.color = mode === 'light' ? '#000' : '';
        btn.style.background = mode === 'light' ? '#fff' : '';
    }
    if (save) saveSettings();
}

// ─── Theme Presets ────────────────────────────────────────────────────────────

function applyThemePreset(preset, save = true) {
    currentSettings.theme = preset;
    const root = document.documentElement;

    if (SPECIAL_THEMES.includes(preset)) {
        document.body.setAttribute('data-theme', preset);
        document.body.removeAttribute('data-layout');
        const varsToRemove = [
            '--acid','--acid-dim','--acid-glow',
            '--cyan','--cyan-dim','--cyan-glow',
            '--red','--red-dim',
            '--purple','--purple-dim','--purple-glow',
            '--bg-void','--bg-base','--bg-surface','--bg-elevated',
            '--bg-glass','--bg-glass-md',
            '--text-primary','--text-secondary','--text-tertiary','--text-accent',
            '--border','--border-md','--border-acid',
            '--shadow-xs','--shadow-sm','--shadow-md','--shadow-lg',
            '--font-ui','--font-display','--font-mono',
            '--menu-bg','--tab-bg',
            '--r-xs','--r-sm','--r-md','--r-lg','--r-xl'
        ];
        varsToRemove.forEach(v => root.style.removeProperty(v));
        if (save) saveSettings();
        return;
    }

    document.body.removeAttribute('data-theme');

    let acid = '#00ff9f', cyan = '#00e5ff', red = '#ff2d55', purple = '#9b59b6';
    switch(preset) {
        case 'acid':    acid='#00ff9f'; cyan='#00e5ff'; red='#ff2d55'; purple='#9b59b6'; break;
        case 'crimson': acid='#ff2d55'; cyan='#ff6d00'; red='#d50000'; purple='#8e24aa'; break;
        case 'cobalt':  acid='#00e5ff'; cyan='#2979ff'; red='#ff1744'; purple='#3d5afe'; break;
        case 'purple':  acid='#d500f9'; cyan='#651fff'; red='#ff1744'; purple='#aa00ff'; break;
    }

    currentSettings.customColors = { acid, cyan, red };

    root.style.setProperty('--acid', acid);
    root.style.setProperty('--acid-dim', hexToRgbA(acid, 0.12));
    root.style.setProperty('--acid-glow', hexToRgbA(acid, 0.35));
    root.style.setProperty('--cyan', cyan);
    root.style.setProperty('--cyan-dim', hexToRgbA(cyan, 0.1));
    root.style.setProperty('--cyan-glow', hexToRgbA(cyan, 0.35));
    root.style.setProperty('--red', red);
    root.style.setProperty('--red-dim', hexToRgbA(red, 0.12));
    root.style.setProperty('--purple', purple);
    root.style.setProperty('--purple-dim', hexToRgbA(purple, 0.12));
    root.style.setProperty('--purple-glow', hexToRgbA(purple, 0.4));

    const thmAcid = document.getElementById('thm-acid');
    const thmCyan = document.getElementById('thm-cyan');
    const thmRed  = document.getElementById('thm-red');
    if (thmAcid) thmAcid.value = acid;
    if (thmCyan) thmCyan.value = cyan;
    if (thmRed)  thmRed.value  = red;

    if (save) saveSettings();
}

function customThemeColorChanged() {
    document.body.removeAttribute('data-theme');
    const acid = document.getElementById('thm-acid').value;
    const cyan  = document.getElementById('thm-cyan').value;
    const red   = document.getElementById('thm-red').value;
    currentSettings.customColors = { acid, cyan, red };
    const root = document.documentElement;
    root.style.setProperty('--acid', acid);
    root.style.setProperty('--acid-dim', hexToRgbA(acid, 0.12));
    root.style.setProperty('--acid-glow', hexToRgbA(acid, 0.35));
    root.style.setProperty('--cyan', cyan);
    root.style.setProperty('--cyan-dim', hexToRgbA(cyan, 0.1));
    root.style.setProperty('--cyan-glow', hexToRgbA(cyan, 0.35));
    root.style.setProperty('--red', red);
    root.style.setProperty('--red-dim', hexToRgbA(red, 0.12));
    currentSettings.theme = 'custom';
    saveSettings();
}

// ─── Layout Modes ─────────────────────────────────────────────────────────────

const LAYOUT_NAMES = {
    flat: 'Premium Minimal (Flat)',
    glass: 'Glassmorphism',
    neo: 'Neo Structure',
    compact: 'Compact Density',
    terminal: 'Hacker Terminal'
};

function setLayout(mode) {
    applyStructuralMode(mode, true);
    document.querySelectorAll('.layout-mode-btn').forEach(btn => {
        btn.style.borderColor = '';
        btn.style.background  = '';
    });
    document.querySelectorAll('.layout-mode-btn').forEach(btn => {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${mode}'`)) {
            btn.style.borderColor = 'var(--acid)';
            btn.style.background  = 'var(--acid-dim)';
        }
    });
    const label = document.getElementById('current-layout-label');
    if (label) label.textContent = LAYOUT_NAMES[mode] || mode;
    if (typeof toast === 'function') toast(`Layout: ${LAYOUT_NAMES[mode] || mode}`, 'success');
}

function applyStructuralMode(mode, save = true) {
    currentSettings.layout = mode;
    if (mode === 'none' || !mode) {
        document.body.removeAttribute('data-layout');
    } else {
        document.body.setAttribute('data-layout', mode);
    }
    if (save) saveSettings();
}

// ─── Typography ───────────────────────────────────────────────────────────────

function applyTypography(fontType, save = true) {
    currentSettings.typography = fontType;
    const root = document.documentElement;
    let uiFont, displayFont, monoFont;

    switch(fontType) {
        case 'default':
            uiFont = "'Plus Jakarta Sans', 'Urbanist', sans-serif";
            displayFont = "'Syne', 'Urbanist', sans-serif";
            monoFont = "'JetBrains Mono', monospace";
            break;
        case 'inter':
            uiFont = "'Inter', 'Helvetica Neue', sans-serif";
            displayFont = "'Inter', 'Helvetica Neue', sans-serif";
            monoFont = "'JetBrains Mono', monospace";
            break;
        case 'mono':
            uiFont = displayFont = monoFont = "'JetBrains Mono', monospace";
            break;
        case 'serif':
            uiFont = displayFont = "'Georgia', serif";
            monoFont = "'Courier New', monospace";
            break;
        case 'custom':
            const cFont = currentSettings.customFontName || 'sans-serif';
            uiFont = displayFont = `"${cFont}", sans-serif`;
            monoFont = `"${cFont}", monospace`;
            break;
        default:
            uiFont = "'Plus Jakarta Sans', 'Urbanist', sans-serif";
            displayFont = "'Syne', 'Urbanist', sans-serif";
            monoFont = "'JetBrains Mono', monospace";
    }

    root.style.setProperty('--font-ui', uiFont);
    root.style.setProperty('--font-display', displayFont);
    root.style.setProperty('--font-mono', monoFont);

    let dynStyle = document.getElementById('dynamic-typography');
    if (!dynStyle) {
        dynStyle = document.createElement('style');
        dynStyle.id = 'dynamic-typography';
        document.head.appendChild(dynStyle);
    }
    dynStyle.textContent = `
        *:not(code):not(pre):not(.mono):not([class*="font-mono"]) { font-family: ${uiFont} !important; }
        body, button, input, select, textarea, label, span, div, p, a,
        h1, h2, h3, h4, h5, h6, .nav-item, .panel-header, .view-header h2,
        .btn-primary, .btn-ghost, .btn-acid, .btn-danger, .btn-secondary, .btn-sm,
        .form-group label, .modal-header, .stat-label, .tag, .topbar-chip,
        .filter-btn, .hero-title, .hero-sub, .brand-text-os, .brand-text-sub,
        .page-title, .nav-section, .muted, .small, .modal-actions button,
        #timer-display, #timer-mode, .timer-mode-btn, .toast {
            font-family: ${uiFont} !important;
        }
        code, pre, .mono, .font-mono, .code-box, .tool-cmd, .cmd-snippet, kbd, #timer-display {
            font-family: ${monoFont} !important;
        }
        .hero-title, .brand-text-os, .stat-value { font-family: ${displayFont} !important; }
    `;

    if (save) saveSettings();
}

function applyCustomFont() {
    const input = document.getElementById('custom-font-input');
    const fontName = input && input.value.trim();
    if (!fontName) {
        if (typeof toast === 'function') toast('Please enter a font name (e.g. Arial, Consolas)', 'error');
        return;
    }
    currentSettings.customFontName = fontName;
    applyTypography('custom', true);
    if (typeof toast === 'function') toast(`✓ "${fontName}" applied!`, 'success');
}

function previewCustomFont(fontName) {
    const preview = document.getElementById('font-preview-text');
    if (!preview) return;
    if (!fontName || fontName.length < 2) { preview.style.display = 'none'; return; }
    preview.style.display = 'block';
    preview.style.fontFamily = `"${fontName}", sans-serif`;
}

function setFontQuick(fontName) {
    const input = document.getElementById('custom-font-input');
    if (input) { input.value = fontName; previewCustomFont(fontName); }
    currentSettings.customFontName = fontName;
    applyTypography('custom', true);
    if (typeof toast === 'function') toast(`✓ "${fontName}" applied to entire app!`, 'success');
}

// ─── Tab Visibility & Reordering ──────────────────────────────────────────────

function renderSettingsTabList() {
    const list = document.getElementById('settings-tab-list');
    if (!list) return;

    // Merge saved order with full tab list
    const savedOrder = currentSettings.tabOrder || ALL_SIDEBAR_TABS.map(t => t.id);
    const orderedTabs = [];
    savedOrder.forEach(id => {
        const tab = ALL_SIDEBAR_TABS.find(t => t.id === id);
        if (tab) orderedTabs.push(tab);
    });
    // Append any tabs that were added since the order was saved
    ALL_SIDEBAR_TABS.forEach(t => {
        if (!orderedTabs.find(o => o.id === t.id)) orderedTabs.push(t);
    });

    list.innerHTML = orderedTabs.map((tab, index) => {
        const isHidden = currentSettings.hiddenTabs.includes(tab.id);
        const isFirst  = index === 0;
        const isLast   = index === orderedTabs.length - 1;
        return `
        <div style="display:flex; align-items:center; gap:10px; background:var(--bg-glass); padding:8px 12px; border-radius:var(--r-sm); border:1px solid var(--border);">
            <input type="checkbox" ${isHidden ? '' : 'checked'}
                onchange="setTabVisible('${tab.id}', this.checked)"
                style="width:16px; height:16px; accent-color:var(--acid); cursor:pointer; flex-shrink:0">
            <span style="font-size:0.85rem; flex:1;">${tab.name}</span>
            <div style="display:flex; gap:3px;">
                <button class="btn-ghost btn-sm" onclick="moveTab('${tab.id}',-1)"
                    style="padding:1px 6px; font-size:0.65rem; line-height:1.4; opacity:${isFirst ? 0.3 : 1}"
                    ${isFirst ? 'disabled' : ''}>▲</button>
                <button class="btn-ghost btn-sm" onclick="moveTab('${tab.id}',1)"
                    style="padding:1px 6px; font-size:0.65rem; line-height:1.4; opacity:${isLast ? 0.3 : 1}"
                    ${isLast ? 'disabled' : ''}>▼</button>
            </div>
        </div>`;
    }).join('');
}

function setTabVisible(tabId, isVisible) {
    if (isVisible) {
        currentSettings.hiddenTabs = currentSettings.hiddenTabs.filter(id => id !== tabId);
        _showSidebarTab(tabId);
    } else {
        if (!currentSettings.hiddenTabs.includes(tabId)) currentSettings.hiddenTabs.push(tabId);
        _hideSidebarTab(tabId);
    }
    saveSettings();
}

// Legacy alias — keep in case any HTML still uses the old name
function toggleTabVisibility(checkbox) {
    const tabId = checkbox.getAttribute('data-tab');
    setTabVisible(tabId, checkbox.checked);
}

function moveTab(tabId, direction) {
    let order = currentSettings.tabOrder
        ? [...currentSettings.tabOrder]
        : ALL_SIDEBAR_TABS.map(t => t.id);

    const idx = order.indexOf(tabId);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= order.length) return;

    [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
    currentSettings.tabOrder = order;
    saveSettings();
    renderSettingsTabList();
    reorderSidebar();
    if (typeof toast === 'function') toast('Tab order updated!', 'success');
}

function reorderSidebar() {
    const nav = document.querySelector('.sidebar-nav');
    if (!nav) return;

    const order = currentSettings.tabOrder || ALL_SIDEBAR_TABS.map(t => t.id);
    const items = Array.from(nav.querySelectorAll('a.nav-item[data-view]'));

    // Detach all
    items.forEach(i => i.remove());

    // Re-attach in order
    order.forEach(id => {
        const item = items.find(i => i.getAttribute('data-view') === id);
        if (item) nav.appendChild(item);
    });

    // Append any that weren't in the order list
    items.forEach(i => {
        if (!nav.contains(i)) nav.appendChild(i);
    });
}

function _hideSidebarTab(tabId) {
    const tab = document.querySelector(`a.nav-item[data-view="${tabId}"]`);
    if (tab) tab.style.display = 'none';
}

function _showSidebarTab(tabId) {
    const tab = document.querySelector(`a.nav-item[data-view="${tabId}"]`);
    if (tab) tab.style.display = '';
}

// ─── Reset ────────────────────────────────────────────────────────────────────

function resetThemeToDefault() {
    currentSettings = JSON.parse(JSON.stringify(defaultSettings));
    document.body.removeAttribute('data-theme');
    applyAllSettings();
    saveSettings();
    if (typeof toast === 'function') toast('Settings reset to default', 'info');
}

// ─── Component Colors ─────────────────────────────────────────────────────────

function applyCustomComponentColors() {
    if (SPECIAL_THEMES.includes(currentSettings.theme)) return;
    const root = document.documentElement;
    const cc = currentSettings.customComponentColors || {};
    root.style.setProperty('--menu-bg', cc['menu'] || 'var(--bg-base)');
    root.style.setProperty('--tab-bg',  cc['tabs']  || 'transparent');
}

function updateComponentColor(component, color) {
    if (!currentSettings.customComponentColors) currentSettings.customComponentColors = {};
    currentSettings.customComponentColors[component] = color;
    applyCustomComponentColors();
    saveSettings();
}

// ─── Timer Sound Settings ─────────────────────────────────────────────────────

function updateTimerSoundSettings() {
    const sel = document.getElementById('settings-timer-sound');
    if (!sel) return;
    const type = sel.value;
    currentSettings.timerSoundType = type;
    const wrap = document.getElementById('settings-timer-custom-wrap');
    if (wrap) wrap.style.display = type === 'custom' ? 'block' : 'none';
    saveSettings();
    if (typeof toast === 'function') toast('Timer sound preference saved', 'success');
}

function uploadTimerSound(input) {
    if (!input.files || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        currentSettings.timerSoundData = e.target.result;
        saveSettings();
        if (typeof toast === 'function') toast('Custom sound uploaded & saved!', 'success');
        try { new Audio(e.target.result).play(); } catch(_) {}
    };
    reader.readAsDataURL(input.files[0]);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgbA(hex, alpha) {
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        let c = hex.substring(1).split('');
        if (c.length === 3) c = [c[0],c[0],c[1],c[1],c[2],c[2]];
        c = '0x' + c.join('');
        return `rgba(${(c>>16)&255},${(c>>8)&255},${c&255},${alpha})`;
    }
    return `rgba(0,0,0,${alpha})`;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => { loadSettings(); });
