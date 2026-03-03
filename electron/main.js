import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Better detection of development mode
const isDev = process.env.NODE_ENV === 'development' || 
              process.env.ELECTRON_IS_DEV === '1' ||
              !app.isPackaged;

// Check if dist folder exists
const distPath = path.join(__dirname, '../dist/index.html');
const distExists = fs.existsSync(distPath);

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      // Disable autofill to prevent DevTools errors
      autoplayPolicy: 'no-user-gesture-required',
      spellcheck: false
    },
    icon: path.join(__dirname, '../build/icon.png'), // Use build folder icon
    title: 'BizneAI POS System',
    show: false, // Don't show until ready
  });

  // Show window when ready (maximized / full screen)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  // Evitar que la ventana navegue a URLs externas (siempre mostrar POS local)
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const parsed = new URL(url);
    const isLocal = parsed.hostname === 'localhost' || parsed.protocol === 'file:' || parsed.protocol === 'data:';
    if (!isLocal) {
      event.preventDefault();
    }
  });

  // Filter out non-critical DevTools console errors
  // These Autofill errors are harmless and come from DevTools trying to use features
  // that aren't available in Electron's context
  mainWindow.webContents.on('console-message', (event, level, message) => {
    // Ignore Autofill errors from DevTools (these are harmless)
    if (typeof message === 'string' && 
        (message.includes('Autofill.enable') || 
         message.includes('Autofill.setAddresses') ||
         message.includes("'Autofill.enable' wasn't found") ||
         message.includes("'Autofill.setAddresses' wasn't found"))) {
      return; // Don't log these errors
    }
    // Log [SALE] flujo POST para verificar en terminal
    if (typeof message === 'string' && message.includes('[SALE]')) {
      console.log(`[Renderer] ${message}`);
    }
    // Log other console messages normally (only errors and warnings)
    if (level >= 2) { // Warning (2) and Error (3) levels
      const levelName = level === 2 ? 'WARNING' : 'ERROR';
      console.log(`[Console ${levelName}] ${message}`);
    }
  });

  // Filter Autofill errors after page loads
  mainWindow.webContents.on('did-finish-load', () => {
    // Override console.error in the renderer to filter Autofill errors
    mainWindow.webContents.executeJavaScript(`
      (function() {
        const originalError = console.error;
        console.error = function(...args) {
          const message = args.join(' ');
          // Filter out Autofill errors
          if (message.includes('Autofill.enable') || 
              message.includes('Autofill.setAddresses') ||
              message.includes("'Autofill.enable' wasn't found") ||
              message.includes("'Autofill.setAddresses' wasn't found")) {
            return; // Silently ignore
          }
          originalError.apply(console, args);
        };
      })();
    `).catch(() => {
      // Ignore if execution fails
    });
  });

  // Check if Vite dev server is running
  const checkViteServer = () => {
    return new Promise((resolve) => {
      const req = http.get('http://localhost:5173', (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => {
        resolve(false);
      });
      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
    });
  };

  // Load the app - SIEMPRE carga el POS local (nunca bizneai.com)
  const loadApp = async () => {
    const viteUrl = 'http://localhost:5173';
    if (isDev) {
      const viteRunning = await checkViteServer();
      if (viteRunning) {
        mainWindow.loadURL(viteUrl);
        console.log('✅ POS cargado desde Vite (localhost:5173)');
        return;
      }
      console.log('⚠️ Vite no está corriendo. Usando dist/ o mostrando instrucciones...');
      
      // Fallback to dist if dev server is not available
      if (distExists) {
        mainWindow.loadFile(distPath);
        console.log('✅ Loaded from dist folder');
      } else {
        // Show error if neither is available
        mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>BizneAI POS - Error</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                }
                .error-container {
                  text-align: center;
                  padding: 2rem;
                  background: rgba(0,0,0,0.3);
                  border-radius: 12px;
                  max-width: 600px;
                }
                h1 { margin-top: 0; }
                code {
                  background: rgba(0,0,0,0.5);
                  padding: 0.5rem;
                  border-radius: 4px;
                  display: block;
                  margin: 1rem 0;
                }
              </style>
            </head>
            <body>
              <div class="error-container">
                <h1>⚠️ Servidor de Desarrollo No Disponible</h1>
                <p>Para iniciar la aplicación en modo desarrollo, ejecuta:</p>
                <code>npm run electron:dev</code>
                <p>O primero construye la aplicación:</p>
                <code>npm run build</code>
                <p style="margin-top: 2rem; font-size: 0.9em; opacity: 0.8;">
                  Luego ejecuta: <code style="display: inline;">npm run electron</code>
                </p>
              </div>
            </body>
          </html>
        `));
        console.error('❌ Neither Vite dev server nor dist folder available');
      }
  } else {
    // In production, load the built files
      if (distExists) {
        mainWindow.loadFile(distPath);
        console.log('✅ Loaded from dist folder (production)');
      } else {
        console.error('❌ dist folder not found! Run: npm run build');
        app.quit();
  }
    }
  };

  loadApp().catch(err => {
    console.error('Error loading app:', err);
    app.quit();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    app.quit();
  });

  // Handle loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    if (errorCode === -106) {
      // ERR_INTERNET_DISCONNECTED or similar
      console.log('Trying to load from dist folder instead...');
      if (distExists) {
        mainWindow.loadFile(distPath);
      }
    }
  });

  return mainWindow;
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Vaciar cache para evitar cargar legacy UI/UX y builds anteriores
  const ses = session.defaultSession;
  try {
    await ses.clearCache();
    await ses.clearStorageData({ storages: ['cachestorage'] });
    console.log('✅ Cache del sistema vaciado');
  } catch (err) {
    console.warn('⚠️ Error al vaciar cache:', err?.message || err);
  }

  const mainWindow = createWindow();

  // Handle app activation on macOS
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 