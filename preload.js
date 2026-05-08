const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    exportToPDF: (htmlContent, fileName) => ipcRenderer.invoke('export-pdf', { htmlContent, fileName })
});
