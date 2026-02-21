const { contextBridge } = require('electron');

// Expose a simple API for development
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    versions: process.versions
  });
} 