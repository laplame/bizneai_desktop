const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: process.versions,
  printReceipt: (receiptData, pageSize, printerName, generic80mmFallback) =>
    ipcRenderer.invoke('print-receipt', { receiptData, pageSize, printerName, generic80mmFallback }),
  openDbConsole: () => ipcRenderer.invoke('open-db-console'),
  minimizeDbConsoleWindow: () => ipcRenderer.invoke('db-console-minimize'),
  closeDbConsoleWindow: () => ipcRenderer.invoke('db-console-close'),
  probeLocalApi: () => ipcRenderer.invoke('probe-local-api'),
  pickTicketLogo: () => ipcRenderer.invoke('pick-ticket-logo'),
  removeTicketLogo: () => ipcRenderer.invoke('remove-ticket-logo'),
  ticketLogoDataUrl: (absPath) => ipcRenderer.invoke('ticket-logo-data-url', absPath),
}); 