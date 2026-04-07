const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: process.versions,
  printReceipt: (receiptData, pageSize, printerName) =>
    ipcRenderer.invoke('print-receipt', { receiptData, pageSize, printerName }),
  openDbConsole: () => ipcRenderer.invoke('open-db-console'),
  minimizeDbConsoleWindow: () => ipcRenderer.invoke('db-console-minimize'),
  closeDbConsoleWindow: () => ipcRenderer.invoke('db-console-close'),
  probeLocalApi: () => ipcRenderer.invoke('probe-local-api'),
}); 