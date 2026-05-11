/**
 * bugbOS Quantum Sync Engine — WhatsApp-Style
 * Deep OAuth2 | Persistent Refresh Tokens | Auto-Reconciliation
 */

const SYNC_CONFIG = {
    FILENAME_PREFIX: 'bugbos_snapshot_',
    INTERVAL: 10 * 60 * 1000 // 10 minutes
};

let gdriveAccessToken  = localStorage.getItem('bb_gdrive_token')   || null;
let gdriveRefreshToken = localStorage.getItem('bb_gdrive_refresh')  || null;
let syncTimerStarted   = false;

/* ──────────────────────────────────────────────────────
   BOOT: called on DOMContentLoaded
────────────────────────────────────────────────────── */
async function initSyncEngine() {
    if (!gdriveRefreshToken) {
        updateSyncUI('OFFLINE');
        return;
    }

    // We have a stored refresh token — silently get a fresh access token
    const newToken = await silentRefresh();
    if (newToken) {
        gdriveAccessToken = newToken;
        updateSyncUI('CONNECTED');
        startSyncTimer();
        // Push in background — don't block UI
        quantumPush().catch(console.error);
    } else {
        // Refresh token expired — user must re-sign in
        gdriveRefreshToken = null;
        localStorage.removeItem('bb_gdrive_refresh');
        localStorage.removeItem('bb_gdrive_token');
        updateSyncUI('OFFLINE');
        toast('Session expired. Please sign in again.', 'info');
    }
}

/* ──────────────────────────────────────────────────────
   SILENT REFRESH
────────────────────────────────────────────────────── */
async function silentRefresh() {
    try {
        const res = await window.api.refreshGDriveToken(gdriveRefreshToken);
        if (res && res.access_token) {
            localStorage.setItem('bb_gdrive_token', res.access_token);
            return res.access_token;
        }
        return null;
    } catch (e) {
        console.error('[Sync] silentRefresh failed:', e);
        return null;
    }
}

/* ──────────────────────────────────────────────────────
   ONE-TAP ONBOARDING
────────────────────────────────────────────────────── */
async function startCloudOnboarding() {
    const btn = document.querySelector('.btn-sync-premium');
    if (btn) { btn.disabled = true; btn.querySelector('span').textContent = 'Connecting...'; }

    toast('Opening Google Sign-In...', 'info');

    try {
        const tokens = await window.api.authGDrive();

        if (!tokens || !tokens.access_token) {
            toast('Sign-in cancelled.', 'info');
            if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'Continue with Google'; }
            return;
        }

        gdriveAccessToken  = tokens.access_token;
        gdriveRefreshToken = tokens.refresh_token || null;

        localStorage.setItem('bb_gdrive_token', gdriveAccessToken);
        if (gdriveRefreshToken) {
            localStorage.setItem('bb_gdrive_refresh', gdriveRefreshToken);
        } else {
            console.warn('[Sync] No refresh_token received — user may need to re-auth next session.');
        }

        updateSyncUI('CONNECTED');
        toast('🛡️ Cloud Sentinel Active!', 'success');

        startSyncTimer();
        await quantumPush(true);

    } catch (e) {
        console.error('[Sync] Onboarding failed:', e);
        toast('Connection failed. Try again.', 'error');
        if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'Continue with Google'; }
    }
}

/* ──────────────────────────────────────────────────────
   PUSH ENGINE (One-way Snapshot)
────────────────────────────────────────────────────── */
async function quantumPush(isFirstLogin = false) {
    if (!gdriveAccessToken) return;

    updateSyncUI('SYNCING');

    try {
        // Always try to refresh token before any API calls
        const freshToken = await silentRefresh();
        if (freshToken) gdriveAccessToken = freshToken;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${SYNC_CONFIG.FILENAME_PREFIX}${timestamp}.json`;

        await uploadToVault(getPackagedData(), null, filename);

        localStorage.setItem('bb_last_sync', String(Date.now()));
        updateSyncUI('CONNECTED');

    } catch (e) {
        console.error('[Sync] Push error:', e);
        updateSyncUI('ERROR');
    }
}

/* ──────────────────────────────────────────────────────
   BACKGROUND TIMER
────────────────────────────────────────────────────── */
function startSyncTimer() {
    if (syncTimerStarted) return;
    syncTimerStarted = true;

    setInterval(() => quantumPush(), SYNC_CONFIG.INTERVAL);

    // Debounced data-change trigger (called from academy.js onDataChange)
    window.triggerCloudSync = () => {
        clearTimeout(window._syncDebounce);
        window._syncDebounce = setTimeout(() => {
            // Save offline backup immediately
            if (window.api && window.api.saveOffline) {
                window.api.saveOffline(JSON.stringify(getPackagedData())).catch(e => console.error('Offline save error:', e));
            }
        }, 5000); // 5s after last edit
    };
}

/* ──────────────────────────────────────────────────────
   DATA PACKAGING
────────────────────────────────────────────────────── */
function getPackagedData() {
    const load = (key, fallback) => {
        try { return JSON.parse(localStorage.getItem(key) || fallback); }
        catch { return JSON.parse(fallback); }
    };
    return {
        userId:     'system_user',
        lastSync:   Date.now(),
        deviceId:   getDeviceId(),
        appVersion: '3.0.0',
        data: {
            bugs:        load('bb_bugs',          '[]'),
            notes:       load('bb_notes',         '[]'),
            targets:     load('bb_targets',       '[]'),
            activity:    load('bb_activity',      '[]'),
            userTools:   load('bb_user_tools',    '[]'),
            userPayloads:load('bb_user_payloads', '[]'),
            settings:    load('bugbos_settings',  '{}')
        }
    };
}

function applyCloudData(d) {
    if (!d) return;
    const map = {
        bugs: 'bb_bugs', notes: 'bb_notes', targets: 'bb_targets',
        activity: 'bb_activity', userTools: 'bb_user_tools',
        userPayloads: 'bb_user_payloads', settings: 'bugbos_settings'
    };
    Object.entries(map).forEach(([dk, lk]) => {
        if (d[dk] !== undefined) localStorage.setItem(lk, JSON.stringify(d[dk]));
    });
}

function isLocalDataEmpty() {
    try {
        const bugs    = JSON.parse(localStorage.getItem('bb_bugs')    || '[]');
        const targets = JSON.parse(localStorage.getItem('bb_targets') || '[]');
        return bugs.length === 0 && targets.length === 0;
    } catch { return true; }
}

function getDeviceId() {
    let id = localStorage.getItem('bb_device_id');
    if (!id) {
        id = 'dev_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('bb_device_id', id);
    }
    return id;
}

/* ──────────────────────────────────────────────────────
   GOOGLE DRIVE API — low level
────────────────────────────────────────────────────── */
async function findCloudVault() {
    const q = encodeURIComponent(`name = '${SYNC_CONFIG.FILENAME}' and trashed = false`);
    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name)`,
        { headers: { Authorization: 'Bearer ' + gdriveAccessToken } }
    );
    if (!res.ok) { console.error('[Sync] findCloudVault HTTP', res.status); return null; }
    const data = await res.json();
    return (data.files && data.files.length > 0) ? data.files[0].id : null;
}

async function downloadFromVault(fileId) {
    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: 'Bearer ' + gdriveAccessToken } }
    );
    if (!res.ok) { console.error('[Sync] downloadFromVault HTTP', res.status); return null; }
    return await res.json();
}

async function uploadToVault(content, fileId = null, filename = 'bugbos_snapshot.json') {
    const boundary = 'qsync_boundary_7f3a';
    const metaJson  = JSON.stringify({ name: filename, parents: fileId ? undefined : ['appDataFolder'] });
    const bodyJson  = JSON.stringify(content);

    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaJson}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${bodyJson}\r\n--${boundary}--`;

    const url = fileId
        ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
        : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

    const res = await fetch(url, {
        method: fileId ? 'PATCH' : 'POST',
        headers: {
            Authorization: 'Bearer ' + gdriveAccessToken,
            'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body
    });

    if (res.status === 404 && fileId) return uploadToVault(content, null); // retry as new file
    if (!res.ok) console.error('[Sync] uploadToVault HTTP', res.status, await res.text());
    return res.ok;
}

/* ──────────────────────────────────────────────────────
   UI
────────────────────────────────────────────────────── */
function updateSyncUI(state) {
    const badge       = document.getElementById('gdrive-status-badge');
    const telBadge    = document.getElementById('tel-sync-status');
    const authBox     = document.getElementById('gdrive-auth-container');
    const activeBox   = document.getElementById('gdrive-active-controls');
    const subtitle    = document.getElementById('sync-subtitle');
    const icon        = document.getElementById('sync-main-icon');
    const lastTimeLbl = document.getElementById('sync-last-time');

    const setBadge = (text, cls) => {
        [badge, telBadge].forEach(el => { if (el) { el.textContent = text; el.className = cls; } });
    };

    switch (state) {
        case 'OFFLINE':
            setBadge('DISCONNECTED', 'badge-disconnected');
            if (authBox)   authBox.classList.remove('hidden');
            if (activeBox) activeBox.classList.add('hidden');
            if (subtitle)  subtitle.textContent = 'Sign in once. Synced forever.';
            if (icon)      icon.textContent = '📡';
            break;
        case 'CONNECTED':
            setBadge('PROTECTED', 'badge-connected');
            if (authBox)   authBox.classList.add('hidden');
            if (activeBox) activeBox.classList.remove('hidden');
            if (subtitle)  subtitle.textContent = 'Secure cloud backup active';
            if (icon)      icon.textContent = '🛡️';
            if (lastTimeLbl) lastTimeLbl.textContent =
                'LAST SYNC: ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            break;
        case 'SYNCING':
            setBadge('SYNCING...', 'badge-syncing');
            if (subtitle) subtitle.textContent = 'Synchronizing your workspace...';
            if (icon)     icon.textContent = '🔄';
            break;
        case 'ERROR':
            setBadge('INTERRUPTED', 'badge-error');
            if (subtitle) subtitle.textContent = 'Sync error — will retry shortly';
            if (icon)     icon.textContent = '⚠️';
            break;
    }
    if (typeof updateTelemetry === 'function') updateTelemetry();
}

function disconnectGDrive() {
    if (!confirm('Stop cloud protection? Your local data stays safe.')) return;
    gdriveAccessToken  = null;
    gdriveRefreshToken = null;
    syncTimerStarted   = false;
    ['bb_gdrive_token', 'bb_gdrive_refresh'].forEach(k => localStorage.removeItem(k));
    updateSyncUI('OFFLINE');
    toast('Cloud Sentinel deactivated.', 'info');
}

// Manual sync hook
window.silentSync = () => quantumPush().catch(console.error);

// Online reconnect sync
window.addEventListener('online', () => {
    toast('Connection restored. Syncing...', 'info');
    quantumPush().catch(console.error);
});

// Intercept window close for sync
if (window.api && window.api.onForceSyncAndClose) {
    window.api.onForceSyncAndClose(async () => {
        toast('Saving offline...', 'info');
        if (window.api.saveOffline) {
            await window.api.saveOffline(JSON.stringify(getPackagedData())).catch(e => console.error('Offline save error:', e));
        }
        if (gdriveAccessToken) {
            toast('Syncing to cloud...', 'info');
            // Fire and forget, but wait up to 2s
            await Promise.race([
                quantumPush(),
                new Promise(r => setTimeout(r, 2000))
            ]);
        }
        window.api.confirmClose();
    });
}

/* ──────────────────────────────────────────────────────
   SNAPSHOT RESTORE API
────────────────────────────────────────────────────── */
async function listCloudSnapshots() {
    if (!gdriveAccessToken) return [];
    try {
        const freshToken = await silentRefresh();
        if (freshToken) gdriveAccessToken = freshToken;

        const q = encodeURIComponent(`name contains '${SYNC_CONFIG.FILENAME_PREFIX}' and trashed = false`);
        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name,createdTime)&orderBy=createdTime desc`,
            { headers: { Authorization: 'Bearer ' + gdriveAccessToken } }
        );
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        return data.files || [];
    } catch (e) {
        console.error('[Sync] Error listing snapshots:', e);
        return [];
    }
}

async function restoreSnapshot(fileId) {
    if (!gdriveAccessToken || !fileId) return false;
    updateSyncUI('SYNCING');
    try {
        const freshToken = await silentRefresh();
        if (freshToken) gdriveAccessToken = freshToken;

        const cloudVault = await downloadFromVault(fileId);
        if (cloudVault && cloudVault.data) {
            applyCloudData(cloudVault.data);
            localStorage.setItem('bb_last_sync', String(Date.now()));
            toast('📦 Snapshot restored successfully!', 'success');
            setTimeout(() => location.reload(), 1500);
            return true;
        }
    } catch (e) {
        console.error('[Sync] Restore failed:', e);
        toast('Failed to restore snapshot.', 'error');
        updateSyncUI('CONNECTED');
    }
    return false;
}

// Boot
document.addEventListener('DOMContentLoaded', initSyncEngine);

window.showCloudSnapshotsModal = async () => {
    const modal = document.getElementById('modal-cloud-snapshots');
    if (!modal) return;
    modal.style.display = 'flex';
    
    const listEl = document.getElementById('cloud-snapshots-list');
    listEl.innerHTML = '<div style="text-align:center; padding:20px" class="muted small">Loading snapshots from Google Drive...</div>';
    
    if (!gdriveAccessToken) {
        listEl.innerHTML = '<div style="text-align:center; padding:20px; color:var(--red)">Not connected to Google Drive. Please enable Cloud Sentinel first.</div>';
        return;
    }
    
    const snapshots = await listCloudSnapshots();
    
    if (snapshots.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; padding:20px" class="muted small">No cloud snapshots found.</div>';
        return;
    }
    
    listEl.innerHTML = '';
    snapshots.forEach(snap => {
        const date = new Date(snap.createdTime);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.padding = '12px';
        item.style.background = 'var(--bg-glass)';
        item.style.border = '1px solid var(--border)';
        item.style.borderRadius = 'var(--r-sm)';
        
        item.innerHTML = `
            <div>
                <div style="font-weight:700">Snapshot</div>
                <div class="muted small">${dateStr}</div>
            </div>
            <button class="btn-ghost btn-sm" style="color:var(--acid); border-color:var(--acid)">Restore</button>
        `;
        
        const restoreBtn = item.querySelector('button');
        restoreBtn.onclick = async () => {
            if (confirm('Are you sure you want to restore this snapshot? All current local data will be permanently overwritten!')) {
                restoreBtn.textContent = 'Restoring...';
                restoreBtn.disabled = true;
                const success = await restoreSnapshot(snap.id);
                if (!success) {
                    restoreBtn.textContent = 'Restore Failed';
                }
            }
        };
        
        listEl.appendChild(item);
    });
};
