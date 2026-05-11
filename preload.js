const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    exportToPDF: (htmlContent, fileName) => ipcRenderer.invoke('export-pdf', { htmlContent, fileName }),
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    saveFile: (fileName, base64Data) => ipcRenderer.invoke('save-file', { fileName, base64Data }),
    openPath: (filePath) => ipcRenderer.invoke('open-path', filePath),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    authGDrive: () => ipcRenderer.invoke('auth-gdrive'),
    refreshGDriveToken: (refreshToken) => ipcRenderer.invoke('refresh-gdrive-token', refreshToken),
    saveOffline: (data) => ipcRenderer.invoke('save-offline', data),
    confirmClose: () => ipcRenderer.send('confirm-close'),
    onForceSyncAndClose: (callback) => ipcRenderer.on('force-sync-and-close', callback)
});
