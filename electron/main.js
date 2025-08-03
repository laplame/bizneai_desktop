import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import SimpleBlockchainService from './simple-blockchain-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

// Initialize blockchain service
const blockchainService = new SimpleBlockchainService();

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/icon.png'), // Optional: add an icon
    title: 'BizneAI POS System with Blockchain', // Set window title
  });

  // Load the app
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    app.quit();
  });

  return mainWindow;
}

// Blockchain IPC handlers
ipcMain.handle('blockchain:start', async () => {
  try {
    const result = await blockchainService.startBlockchain();
    return { success: result };
  } catch (error) {
    console.error('Error starting blockchain:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('blockchain:stop', async () => {
  try {
    const result = await blockchainService.stopBlockchain();
    return { success: result };
  } catch (error) {
    console.error('Error stopping blockchain:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('blockchain:status', async () => {
  try {
    const status = await blockchainService.getBlockchainStatus();
    return status;
  } catch (error) {
    console.error('Error getting blockchain status:', error);
    return { status: 'error', error: error.message };
  }
});

ipcMain.handle('blockchain:mining:status', async () => {
  try {
    const miningInfo = await blockchainService.getMiningInfo();
    return miningInfo;
  } catch (error) {
    console.error('Error getting mining status:', error);
    return { isMining: false, error: error.message };
  }
});

ipcMain.handle('blockchain:mining:start', async () => {
  try {
    const result = await blockchainService.startMining();
    return result;
  } catch (error) {
    console.error('Error starting mining:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('blockchain:mining:stop', async () => {
  try {
    const result = await blockchainService.stopMining();
    return result;
  } catch (error) {
    console.error('Error stopping mining:', error);
    return { success: false, error: error.message };
  }
});

// Discrete mining handlers
ipcMain.handle('blockchain:mining:discrete:start', async () => {
  try {
    const result = await blockchainService.startDiscreteMining();
    return result;
  } catch (error) {
    console.error('Error starting discrete mining:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('blockchain:mining:discrete:stop', async () => {
  try {
    const result = await blockchainService.stopDiscreteMining();
    return result;
  } catch (error) {
    console.error('Error stopping discrete mining:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('blockchain:data', async () => {
  try {
    const data = await blockchainService.getBlockchainData();
    return data;
  } catch (error) {
    console.error('Error getting blockchain data:', error);
    return { error: error.message };
  }
});

// Network status handlers
ipcMain.handle('blockchain:network:status', async () => {
  try {
    const status = await blockchainService.getNetworkStatus();
    return status;
  } catch (error) {
    console.error('Error getting network status:', error);
    return { error: error.message };
  }
});

ipcMain.handle('blockchain:network:nodes', async () => {
  try {
    const nodes = await blockchainService.getNetworkNodes();
    return nodes;
  } catch (error) {
    console.error('Error getting network nodes:', error);
    return { error: error.message };
  }
});

ipcMain.handle('blockchain:wallet:info', async (event, address) => {
  try {
    const walletInfo = await blockchainService.getWalletInfo(address);
    return walletInfo;
  } catch (error) {
    console.error('Error getting wallet info:', error);
    return { error: error.message };
  }
});

ipcMain.handle('blockchain:transaction:send', async (event, { fromAddress, toAddress, amount }) => {
  try {
    const result = await blockchainService.sendTransaction(fromAddress, toAddress, amount);
    return result;
  } catch (error) {
    console.error('Error sending transaction:', error);
    return { success: false, error: error.message };
  }
});

// POS transaction handler
ipcMain.handle('blockchain:pos:transaction', async (event, { saleId, amount, items }) => {
  try {
    const result = await blockchainService.sendPosTransaction(saleId, amount, items);
    return result;
  } catch (error) {
    console.error('Error sending POS transaction:', error);
    return { success: false, error: error.message };
  }
});

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  const mainWindow = createWindow();

  // Handle app activation on macOS
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Graceful shutdown
  app.on('before-quit', async () => {
    console.log('Shutting down blockchain services...');
    await blockchainService.stopBlockchain();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 