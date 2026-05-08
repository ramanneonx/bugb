const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow () {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#0a0a0c',
    show: false,
    titleBarStyle: 'hidden'
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  
  win.once('ready-to-show', () => {
    win.show();
  });
}

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

ipcMain.on('window-minimize', () => {
  BrowserWindow.getFocusedWindow().minimize();
});

ipcMain.on('window-maximize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.on('window-close', () => {
  BrowserWindow.getFocusedWindow().close();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
