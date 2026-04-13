import { app, BrowserWindow, session, shell, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import fs from 'fs';
import http from 'http';
import { spawn } from 'child_process';

const require = createRequire(import.meta.url);
const { PosPrinter } = require('electron-pos-printer');

/** Ventana principal del POS (para resolver impresora por defecto en Windows). */
let posMainWindow = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Better detection of development mode
const isDev = process.env.NODE_ENV === 'development' || 
              process.env.ELECTRON_IS_DEV === '1' ||
              !app.isPackaged;

// Check if dist folder exists
const distPath = path.join(__dirname, '../dist/index.html');
const distExists = fs.existsSync(distPath);

/** Proceso hijo `node` que sirve el API (better-sqlite3 debe coincidir con ese Node, no con Electron). */
let embeddedServerChild = null;

/** Ventana secundaria: consola SQLite (solo lectura). */
let dbConsoleWindow = null;

function checkViteServer() {
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
}

function createDbConsoleWindow() {
  if (dbConsoleWindow && !dbConsoleWindow.isDestroyed()) {
    dbConsoleWindow.focus();
    return dbConsoleWindow;
  }
  const w = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 520,
    minHeight: 400,
    title: 'BizneAI — Consola BD',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
    icon: path.join(__dirname, '../build/icon.png'),
  });
  w.once('ready-to-show', () => w.show());
  w.on('closed', () => {
    dbConsoleWindow = null;
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  const distExists = fs.existsSync(distPath);

  (async () => {
    try {
      if (isDev) {
        const viteRunning = await checkViteServer();
        if (viteRunning) {
          await w.loadURL('http://localhost:5173/#/db-console');
          return;
        }
      }
      if (distExists) {
        await w.loadFile(distPath, { hash: '/db-console' });
        return;
      }
      await w.loadURL(
        'data:text/html;charset=utf-8,' +
          encodeURIComponent(
            '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem"><p>No se encontró la UI (dist/). Ejecuta <code>npm run build</code> o inicia Vite en :5173.</p></body></html>'
          )
      );
    } catch (e) {
      console.error('[DbConsole] Error al cargar:', e);
    }
  })();

  dbConsoleWindow = w;
  return w;
}

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
  // Permitir WhatsApp: abrir en el navegador del sistema (WhatsApp Web)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const u = (url || '').toLowerCase();
    if (u.startsWith('https://wa.me/') || u.startsWith('https://web.whatsapp.com/')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    // window.open('') / about:blank: tickets, PDF y cuadro de impresión del sistema (receiptPrintService)
    if (u === '' || u === 'about:blank') {
      return { action: 'allow' };
    }
    return { action: 'deny' };
  });
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

  posMainWindow = mainWindow;
  return mainWindow;
}

/** Convierte datos de venta en contenido para impresora térmica */
function buildReceiptPrintData({ storeName, saleId, date, items, subtotal, tax, total, paymentMethod, copyLabel }, pageSize = '80mm') {
  const isWide = pageSize === '80mm';
  const copyFontSize = isWide ? '17px' : '13px';
  const lines = [
    { type: 'text', value: storeName || 'BizneAI POS', style: { fontWeight: '700', textAlign: 'center', fontSize: isWide ? '18px' : '16px' } },
    { type: 'text', value: '------------------------', style: { textAlign: 'center', fontSize: '11px' } },
  ];
  if (copyLabel && String(copyLabel).trim()) {
    lines.push({
      type: 'text',
      value: String(copyLabel).trim(),
      style: {
        fontWeight: '800',
        textAlign: 'center',
        fontSize: copyFontSize,
        letterSpacing: '0.12em',
      },
    });
    lines.push({ type: 'text', value: '------------------------', style: { textAlign: 'center', fontSize: '11px' } });
  }
  lines.push(
    { type: 'text', value: `Ticket #${saleId}`, style: { fontWeight: '600', fontSize: '12px' } },
    { type: 'text', value: date, style: { fontSize: '10px', color: '#666' } },
    { type: 'text', value: '------------------------', style: { textAlign: 'center', fontSize: '11px' } },
    {
      type: 'table',
      style: { border: 'none' },
      tableHeader: ['Producto', 'Cant', 'Total'],
      tableHeaderStyle: { fontWeight: '600', borderBottom: '1px solid #000' },
      tableBody: items.map((i) => [
        String(i.productName || '').slice(0, 18),
        String(i.quantity || 1),
        `$${(i.totalPrice ?? i.unitPrice * (i.quantity || 1)).toFixed(2)}`,
      ]),
      tableBodyStyle: { fontSize: '10px', border: 'none' },
    },
    { type: 'text', value: '------------------------', style: { textAlign: 'center', fontSize: '11px' } },
    { type: 'text', value: `Subtotal:  $${Number(subtotal || 0).toFixed(2)}`, style: { fontSize: '11px' } },
    { type: 'text', value: `IVA:       $${Number(tax || 0).toFixed(2)}`, style: { fontSize: '11px' } },
    { type: 'text', value: `TOTAL:     $${Number(total || 0).toFixed(2)}`, style: { fontWeight: '700', fontSize: '14px' } },
    {
      type: 'text',
      value: `Pago: ${typeof paymentMethod === 'string' ? paymentMethod : paymentMethod != null ? String(paymentMethod) : 'Efectivo'}`,
      style: { fontSize: '10px', color: '#666' },
    },
    { type: 'text', value: '------------------------', style: { textAlign: 'center', fontSize: '11px' } },
    { type: 'text', value: '¡Gracias por su compra!', style: { textAlign: 'center', fontSize: '11px', fontStyle: 'italic' } },
  );
  return lines;
}

/**
 * Nombre de impresora para PosPrinter: el configurado o la predeterminada del sistema.
 * En Windows, `webContents.print({ silent: true })` suele fallar sin `deviceName` explícito.
 */
async function resolveThermalPrinterName(preferred) {
  const p = preferred && String(preferred).trim();
  if (p) return p;
  if (!posMainWindow || posMainWindow.isDestroyed()) return undefined;
  try {
    const list = await posMainWindow.webContents.getPrintersAsync();
    const def = list.find((x) => x.isDefault);
    return def?.name || list[0]?.name;
  } catch (e) {
    console.warn('[Print] No se pudo listar impresoras:', e?.message || e);
    return undefined;
  }
}

function probeBackendHealthOnce() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:3000/health', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForBackendReady(maxMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (await probeBackendHealthOnce()) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

/**
 * Node para arrancar el API embebido: primero binario en resources/embedded-node (instalador sin PATH),
 * luego `node` del PATH (desarrollo o usuario con Node instalado).
 */
function resolveNodeForEmbeddedBackend() {
  const binName = process.platform === 'win32' ? 'node.exe' : 'node';
  if (app.isPackaged && process.resourcesPath) {
    const bundled = path.join(process.resourcesPath, 'embedded-node', binName);
    if (fs.existsSync(bundled)) {
      return { command: bundled, shell: false };
    }
  }
  const devBundled = path.join(__dirname, '..', 'embedded-node', binName);
  if (!app.isPackaged && fs.existsSync(devBundled)) {
    return { command: devBundled, shell: false };
  }
  return { command: 'node', shell: process.platform === 'win32' };
}

function embeddedNodeBundledPath() {
  const binName = process.platform === 'win32' ? 'node.exe' : 'node';
  if (app.isPackaged && process.resourcesPath) {
    return path.join(process.resourcesPath, 'embedded-node', binName);
  }
  return path.join(__dirname, '..', 'embedded-node', binName);
}

/** Arranca el bundle Express+SQLite en :3000 (Node embebido o del PATH). */
async function ensureEmbeddedBackend() {
  const userData = app.getPath('userData');
  process.env.BIZNEAI_USER_DATA = userData;
  process.env.BIZNEAI_EMBEDDED = '1';

  if (await probeBackendHealthOnce()) {
    console.log('[Backend] API local ya activa en :3000');
    return;
  }

  const launcherPath = path.join(__dirname, 'embedded-server-launcher.cjs');
  const bundlePath = path.join(__dirname, '../dist-backend/bizneai-server.cjs');
  if (!fs.existsSync(bundlePath) || !fs.existsSync(launcherPath)) {
    console.warn(
      '[Backend] Falta dist-backend/bizneai-server.cjs o electron/embedded-server-launcher.cjs. Ejecuta npm run build:server, o npm run electron:dev con el API en marcha.'
    );
    return;
  }

  const { command: nodeCmd, shell: nodeShell } = resolveNodeForEmbeddedBackend();
  try {
    embeddedServerChild = spawn(nodeCmd, [launcherPath], {
      env: {
        ...process.env,
        BIZNEAI_USER_DATA: userData,
        BIZNEAI_EMBEDDED: '1',
      },
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: nodeShell,
    });
    embeddedServerChild.on('error', (err) => {
      console.error(
        '[Backend] No se pudo ejecutar Node para el API:',
        err.message,
        fs.existsSync(embeddedNodeBundledPath()) ? '(embebido)' : '(¿Node en PATH?)'
      );
    });
    embeddedServerChild.on('exit', (code, signal) => {
      if (code != null && code !== 0) {
        console.warn('[Backend] Proceso API terminó con código', code, signal || '');
      }
      embeddedServerChild = null;
    });
  } catch (e) {
    console.error('[Backend] Error al spawn del API:', e?.message || e);
    return;
  }

  const ok = await waitForBackendReady(20000);
  if (ok) {
    const src = fs.existsSync(embeddedNodeBundledPath()) ? 'Node embebido' : 'Node del PATH';
    console.log(`[Backend] SQLite + Express (${src}) en http://127.0.0.1:3000`);
  } else {
    console.warn('[Backend] /health no respondió a tiempo (¿puerto 3000 ocupado o error en el bundle?)');
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  await ensureEmbeddedBackend();

  /** Para la consola BD: el renderer comprueba si :3000 responde (misma lógica que el arranque). */
  ipcMain.handle('probe-local-api', async () => {
    const ok = await probeBackendHealthOnce();
    const bundlePath = path.join(__dirname, '../dist-backend/bizneai-server.cjs');
    const launcherPath = path.join(__dirname, 'embedded-server-launcher.cjs');
    const emb = embeddedNodeBundledPath();
    return {
      ok,
      bundleExists: fs.existsSync(bundlePath),
      launcherExists: fs.existsSync(launcherPath),
      embeddedNodeExists: fs.existsSync(emb),
      platform: process.platform,
    };
  });

  // Handler para imprimir ticket de venta
  ipcMain.handle('open-db-console', () => {
    createDbConsoleWindow();
    return { ok: true };
  });

  ipcMain.handle('db-console-minimize', () => {
    if (dbConsoleWindow && !dbConsoleWindow.isDestroyed()) {
      dbConsoleWindow.minimize();
    }
    return { ok: true };
  });

  ipcMain.handle('db-console-close', () => {
    if (dbConsoleWindow && !dbConsoleWindow.isDestroyed()) {
      dbConsoleWindow.close();
    }
    return { ok: true };
  });

  ipcMain.handle('print-receipt', async (_event, { receiptData, pageSize = '80mm', printerName }) => {
    try {
      const printData = buildReceiptPrintData(receiptData, pageSize);
      const resolvedName = await resolveThermalPrinterName(printerName);
      const options = {
        preview: false,
        silent: true,
        copies: 1,
        pageSize,
        timeOutPerLine: 400,
        margin: '0 0 0 0',
        ...(resolvedName && { printerName: resolvedName }),
      };
      await PosPrinter.print(printData, options);
      return { success: true };
    } catch (err) {
      console.error('[Print] Error:', err);
      return { success: false, error: err?.message || String(err) };
    }
  });

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

app.on('before-quit', () => {
  if (embeddedServerChild && !embeddedServerChild.killed) {
    try {
      embeddedServerChild.kill('SIGTERM');
    } catch {
      /* ignore */
    }
    embeddedServerChild = null;
  }
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 