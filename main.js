const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    // Hacker style window
    backgroundColor: '#0a0a0c',
    show: false
  });

  // Load the new bugbOS academy interface
  win.loadFile(path.join(__dirname, 'src', 'academy.html'));
  
  win.once('ready-to-show', () => {
    win.show();
    // Optional: Open DevTools automatically for debugging
    // win.webContents.openDevTools();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
