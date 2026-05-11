const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// Force Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Focus the already open main window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createWindow () {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
        preload: path.join(__dirname, 'preload.js')
      },
      backgroundColor: '#0a0a0c',
      show: false,
      titleBarStyle: 'hidden'
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
    
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });

    // Force external links to open in system browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https://accounts.google.com')) {
        return { action: 'allow' }; // Allow internal window for auth
      }
      shell.openExternal(url);
      return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

// === Native Google OAuth for Electron (Deep Auth Implementation) ===
// Credentials are stored in gdrive-config.json (gitignored) for security.
// Each user sets up their own Google OAuth credentials — see README for setup.
let GOOGLE_CONFIG = {
  CLIENT_ID: '',
  CLIENT_SECRET: '',
  REDIRECT_URI: 'http://localhost'
};
try {
  const configPath = path.join(__dirname, 'gdrive-config.json');
  if (fs.existsSync(configPath)) {
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    GOOGLE_CONFIG.CLIENT_ID = cfg.CLIENT_ID || '';
    GOOGLE_CONFIG.CLIENT_SECRET = cfg.CLIENT_SECRET || '';
  }
} catch(e) { console.warn('gdrive-config.json not found or invalid — GDrive sync disabled.'); }


ipcMain.handle('auth-gdrive', async (event) => {
  return new Promise((resolve) => {
    if (!GOOGLE_CONFIG.CLIENT_ID || !GOOGLE_CONFIG.CLIENT_SECRET) {
      dialog.showErrorBox(
        'Google Drive Sync Error',
        'Google OAuth Credentials are missing.\nPlease ensure gdrive-config.json is present in the app directory or provide your own API keys.'
      );
      resolve(null);
      return;
    }

    // For Desktop Apps, Google requires using the System Browser + Local HTTP Server
    const PORT = 31337;
    const REDIRECT_URI = `http://localhost:${PORT}`;
    
    const scopes = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CONFIG.CLIENT_ID}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&access_type=offline` +
      `&prompt=consent`;

    // 1. Start a local HTTP server to listen for the OAuth callback
    const http = require('http');
    const server = http.createServer(async (req, res) => {
      try {
        const urlObj = new URL(req.url, `http://localhost:${PORT}`);
        const code = urlObj.searchParams.get('code');
        const error = urlObj.searchParams.get('error');

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>Auth Failed</h1><p>You can close this tab.</p>');
          server.close();
          resolve(null);
          return;
        }

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication Successful!</h1><p>BugbOS is now connected to Google Drive. You can safely close this tab and return to the app.</p><script>window.close();</script>');
          
          server.close();

          // 2. Exchange authorization code for tokens
          const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              code,
              client_id: GOOGLE_CONFIG.CLIENT_ID,
              client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
              redirect_uri: REDIRECT_URI,
              grant_type: 'authorization_code'
            })
          });
          
          const tokens = await tokenRes.json();
          if (tokens.error) {
            console.error('[GDrive Auth] Token exchange error:', tokens.error_description);
            resolve(null);
          } else {
            console.log('[GDrive Auth] Tokens received successfully');
            resolve(tokens);
          }
        }
      } catch (err) {
        console.error('[GDrive Auth] Server error:', err);
        server.close();
        resolve(null);
      }
    });

    server.listen(PORT, () => {
      // 3. Open the system browser
      shell.openExternal(authUrl);
    });

    // Timeout after 3 minutes if user doesn't complete auth
    setTimeout(() => {
      if (server.listening) {
        server.close();
        resolve(null);
      }
    }, 3 * 60 * 1000);
  });
});

// Helper for Token Refresh
ipcMain.handle('refresh-gdrive-token', async (event, refreshToken) => {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CONFIG.CLIENT_ID,
        client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    return await res.json();
  } catch (e) {
    console.error('Refresh failed', e);
    return null;
  }
});

ipcMain.handle('export-pdf', async (event, { htmlContent, fileName }) => {
  const win = new BrowserWindow({ show: false });
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  
  const pdfPath = path.join(app.getPath('desktop'), fileName || 'bug-report.pdf');
  
  const data = await win.webContents.printToPDF({
    printBackground: true,
    marginsType: 1,
    pageSize: 'A4'
  });

  fs.writeFileSync(pdfPath, data);
  win.close();
  return pdfPath;
});

ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  win.webContents.send('force-sync-and-close');
});

ipcMain.on('confirm-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.handle('save-offline', async (event, data) => {
  try {
    const offlinePath = path.join(app.getPath('userData'), 'offline_vault.json');
    fs.writeFileSync(offlinePath, data);
    return offlinePath;
  } catch (e) {
    console.error('Failed to save offline backup:', e);
    return null;
  }
});

// === File System IPC for Recon Mastery ===
ipcMain.handle('save-file', async (event, { fileName, base64Data }) => {
  try {
    const appDataPath = app.getPath('userData');
    const uploadsDir = path.join(appDataPath, 'bugbos_uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, `${Date.now()}_${fileName}`);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    
    return filePath;
  } catch (error) {
    console.error('Failed to save file:', error);
    throw error;
  }
});

ipcMain.handle('open-path', async (event, filePath) => {
  try {
    if (filePath) {
      await shell.openPath(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to open path:', error);
    return false;
  }
});

ipcMain.handle('open-external', async (event, url) => {
  try {
    if (url) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to open external URL:', error);
    return false;
  }
});

