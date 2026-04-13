/**
 * Servicio de impresión de tickets térmicos (57/80mm)
 * Usa electron-pos-printer vía IPC cuando está en Electron
 */

export type ReceiptPageSize = '57mm' | '58mm' | '80mm';

/** Venta: primera impresión térmica = original; siguientes = copia. Catálogo/lista: sin leyenda de copia. */
export type ReceiptTicketKind = 'sale' | 'catalog';

export interface ReceiptPrintData {
  storeName?: string;
  saleId: string;
  date: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
  }>;
  subtotal: number;
  tax?: number;
  total: number;
  paymentMethod?: string;
  /** Si no se envía, se asume `sale` */
  ticketKind?: ReceiptTicketKind;
  /**
   * Leyenda ya resuelta (ORIGINAL / COPIA). La rellena `printReceipt` salvo que venga fijada (p. ej. pruebas).
   */
  copyLabel?: string;
}

const STORAGE_KEY = 'bizneai-receipt-print';
/** Contador de impresiones térmicas por ticket de venta (misma venta → 1ª original, resto copia) */
const TICKET_PRINT_COUNT_PREFIX = 'bizneai-ticket-print-count:';

export interface ReceiptPrintConfig {
  enabled: boolean;
  pageSize: ReceiptPageSize;
  printerName?: string;
  storeName?: string;
  /** Mostrar leyenda ORIGINAL / COPIA en tickets de venta (80 mm recomendado) */
  showTicketCopyType: boolean;
  /** Texto primera impresión de la venta */
  labelOriginal: string;
  /** Texto reimpresiones y siguientes */
  labelCopia: string;
}

const DEFAULT_CONFIG: ReceiptPrintConfig = {
  enabled: true,
  pageSize: '80mm',
  printerName: undefined,
  storeName: 'BizneAI POS',
  showTicketCopyType: true,
  labelOriginal: 'ORIGINAL',
  labelCopia: 'COPIA',
};

export function getReceiptPrintConfig(): ReceiptPrintConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {}
  return DEFAULT_CONFIG;
}

export function setReceiptPrintConfig(config: Partial<ReceiptPrintConfig>): void {
  const current = getReceiptPrintConfig();
  const next = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/** Leyenda para la siguiente impresión térmica de esta venta (sin incrementar contador). */
export function peekTicketCopyLabel(saleId: string): string | undefined {
  const cfg = getReceiptPrintConfig();
  if (!cfg.showTicketCopyType) return undefined;
  const key = `${TICKET_PRINT_COUNT_PREFIX}${saleId}`;
  const n = parseInt(localStorage.getItem(key) || '0', 10);
  return n === 0 ? cfg.labelOriginal : cfg.labelCopia;
}

function resolveCopyLabelForNextPrint(saleId: string, ticketKind: ReceiptTicketKind | undefined): string | undefined {
  if (ticketKind === 'catalog') return undefined;
  const cfg = getReceiptPrintConfig();
  if (!cfg.showTicketCopyType) return undefined;
  const key = `${TICKET_PRINT_COUNT_PREFIX}${saleId}`;
  const n = parseInt(localStorage.getItem(key) || '0', 10);
  return n === 0 ? cfg.labelOriginal : cfg.labelCopia;
}

function recordTicketPrinted(saleId: string, ticketKind: ReceiptTicketKind | undefined): void {
  if (ticketKind === 'catalog') return;
  const cfg = getReceiptPrintConfig();
  if (!cfg.showTicketCopyType) return;
  const key = `${TICKET_PRINT_COUNT_PREFIX}${saleId}`;
  const n = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, String(n + 1));
}

/** Detecta si estamos en Electron (desktop) */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.printReceipt;
}

/**
 * Imprime el ticket de venta en la impresora térmica configurada.
 * Solo funciona en Electron. Si no está habilitado o no hay impresora, no hace nada.
 */
export async function printReceipt(data: ReceiptPrintData): Promise<{ success: boolean; error?: string }> {
  if (!isElectron()) {
    return { success: false, error: 'No disponible (solo en app desktop)' };
  }

  const config = getReceiptPrintConfig();
  if (!config.enabled) {
    return { success: true }; // No es error, simplemente no imprime
  }

  const ticketKind: ReceiptTicketKind = data.ticketKind ?? 'sale';
  const copyLabel =
    data.copyLabel !== undefined
      ? data.copyLabel
      : resolveCopyLabelForNextPrint(data.saleId, ticketKind);

  const receiptData: ReceiptPrintData = {
    ...data,
    storeName: data.storeName || config.storeName || 'BizneAI POS',
    ticketKind,
    copyLabel,
  };

  try {
    const result = await window.electronAPI!.printReceipt!(
      receiptData,
      config.pageSize,
      config.printerName
    );
    const ok = result?.success === true;
    if (ok) {
      recordTicketPrinted(data.saleId, ticketKind);
    }
    return result ?? { success: false, error: 'Sin respuesta' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[ReceiptPrint] Error:', msg);
    return { success: false, error: msg };
  }
}

export function resolveStoreNameForPrint(): string {
  try {
    const sc = localStorage.getItem('bizneai-store-config');
    if (sc) {
      const j = JSON.parse(sc) as { storeName?: string; businessName?: string };
      return j.storeName || j.businessName || '';
    }
  } catch {
    /* ignore */
  }
  return getReceiptPrintConfig().storeName || 'BizneAI POS';
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Ancho CSS según configuración (simula ticket térmico en vista previa) */
function receiptPreviewWidthCss(pageSize: ReceiptPageSize): string {
  if (pageSize === '80mm') return '80mm';
  if (pageSize === '58mm') return '58mm';
  return '57mm';
}

/**
 * Abre HTML y dispara el cuadro de impresión del sistema (PDF / impresoras).
 * En Electron, `window.open('')` debía permitirse en main (about:blank); si aún falla, usa iframe oculto.
 */
function openHtmlInPrintWindow(html: string): { success: boolean; error?: string } {
  try {
    const w = window.open('', '_blank', 'noopener,noreferrer,width=420,height=720');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      return { success: true };
    }
  } catch {
    /* fallback iframe */
  }
  try {
    const htmlNoScript = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Ticket');
    iframe.style.cssText =
      'position:fixed;left:0;top:0;width:100%;height:100%;border:0;z-index:999999;background:#fff;opacity:0.01';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    if (!doc) {
      iframe.remove();
      return {
        success: false,
        error:
          'No se pudo abrir la ventana de impresión. En la app de escritorio, reinicia tras actualizar; o revisa que no bloquees ventanas emergentes.',
      };
    }
    doc.open();
    doc.write(htmlNoScript);
    doc.close();
    const win = iframe.contentWindow;
    if (!win) {
      iframe.remove();
      return { success: false, error: 'No se pudo preparar la impresión.' };
    }
    const cleanup = () => {
      try {
        iframe.remove();
      } catch {
        /* ignore */
      }
    };
    win.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        cleanup();
      }
    }, 400);
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

/**
 * Abre una ventana con un ticket de prueba y el cuadro de impresión del sistema
 * (elige impresora térmica, impresora normal o «Guardar como PDF»).
 * Funciona en Electron y en navegador.
 */
export function openReceiptPrintPreviewDialog(): { success: boolean; error?: string } {
  const cfg = getReceiptPrintConfig();
  const storeName = resolveStoreNameForPrint();
  const copyLabel = cfg.showTicketCopyType ? cfg.labelOriginal : '';
  const saleId = `PREVIEW-${Date.now()}`;
  const date = new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
  const items = [
    { productName: 'Artículo de prueba A', quantity: 1, unitPrice: 25.0, totalPrice: 25.0 },
    { productName: 'Artículo de prueba B', quantity: 2, unitPrice: 12.5, totalPrice: 25.0 },
  ];
  const subtotal = 43.1;
  const tax = 6.9;
  const total = 50.0;
  const width = receiptPreviewWidthCss(cfg.pageSize);

  const rows = items
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.productName)}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">$${i.totalPrice.toFixed(2)}</td></tr>`
    )
    .join('');

  const copyBlock = copyLabel
    ? `<div class="copy-label">${escapeHtml(copyLabel)}</div><div class="rule">------------------------</div>`
    : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Prueba ticket</title>
  <style>
    @page { size: ${width} auto; margin: 4mm; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 12px;
      max-width: ${width};
      margin-left: auto;
      margin-right: auto;
      font-size: 11px;
      color: #111;
    }
    .store { font-weight: 700; text-align: center; font-size: 16px; margin-bottom: 4px; }
    .rule { text-align: center; letter-spacing: 1px; color: #333; margin: 6px 0; font-size: 10px; }
    .copy-label { font-weight: 800; text-align: center; font-size: 15px; letter-spacing: 0.1em; margin: 8px 0; }
    .ticket-id { font-weight: 600; margin: 4px 0; }
    .muted { color: #555; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { padding: 4px 2px; border-bottom: 1px solid #ddd; }
    th { font-size: 9px; text-align: left; border-bottom: 1px solid #000; }
    .tot { margin: 4px 0; }
    .total-line { font-weight: 700; font-size: 14px; margin-top: 6px; }
    .footer { text-align: center; margin-top: 12px; font-style: italic; color: #444; }
    .hint { margin-top: 16px; padding: 8px; background: #f1f5f9; border-radius: 6px; font-size: 10px; color: #475569; }
    @media print { .no-print { display: none !important; } }
  </style></head><body>
  <div class="store">${escapeHtml(storeName)}</div>
  <div class="rule">------------------------</div>
  ${copyBlock}
  <div class="ticket-id">Ticket #${escapeHtml(saleId)}</div>
  <div class="muted">${escapeHtml(date)}</div>
  <div class="rule">------------------------</div>
  <table><thead><tr><th>Producto</th><th style="text-align:center">Cant</th><th style="text-align:right">Total</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="rule">------------------------</div>
  <div class="tot">Subtotal: $${subtotal.toFixed(2)}</div>
  <div class="tot">IVA: $${tax.toFixed(2)}</div>
  <div class="total-line">TOTAL: $${total.toFixed(2)}</div>
  <div class="muted">Pago: Prueba / vista previa</div>
  <div class="rule">------------------------</div>
  <div class="footer">¡Gracias por su compra!</div>
  <p class="hint no-print">Se abrirá el cuadro de impresión. Puedes elegir tu impresora de tickets, otra impresora o <strong>Guardar como PDF</strong>.</p>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.focus(); window.print(); }, 300);
    });
  </script>
  </body></html>`;

  return openHtmlInPrintWindow(html);
}

function formatPaymentLabelForPreview(method?: string): string {
  if (!method) return 'Efectivo';
  const m: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    crypto: 'Crypto',
    codi: 'CODI',
  };
  return m[method] || method;
}

/**
 * Misma vista que la prueba de Configuración, pero con datos reales de venta/lista.
 * Útil cuando PosPrinter falla o no hay app desktop (elige impresora o PDF).
 */
export function openReceiptPrintPreviewForData(data: ReceiptPrintData): { success: boolean; error?: string } {
  const cfg = getReceiptPrintConfig();
  const storeName = data.storeName || resolveStoreNameForPrint();
  const width = receiptPreviewWidthCss(cfg.pageSize);
  const copyLabel =
    data.copyLabel !== undefined
      ? data.copyLabel
      : data.ticketKind === 'catalog'
        ? undefined
        : cfg.showTicketCopyType
          ? peekTicketCopyLabel(data.saleId)
          : undefined;

  const rows = data.items
    .map((i) => {
      const total = i.totalPrice ?? i.unitPrice * (i.quantity || 1);
      return `<tr><td>${escapeHtml(String(i.productName || ''))}</td><td style="text-align:center">${escapeHtml(String(i.quantity ?? 1))}</td><td style="text-align:right">$${Number(total).toFixed(2)}</td></tr>`;
    })
    .join('');

  const copyBlock =
    copyLabel && String(copyLabel).trim()
      ? `<div class="copy-label">${escapeHtml(String(copyLabel).trim())}</div><div class="rule">------------------------</div>`
      : '';

  const payLabel = formatPaymentLabelForPreview(data.paymentMethod);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Ticket</title>
  <style>
    @page { size: ${width} auto; margin: 4mm; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 12px;
      max-width: ${width};
      margin-left: auto;
      margin-right: auto;
      font-size: 11px;
      color: #111;
    }
    .store { font-weight: 700; text-align: center; font-size: 16px; margin-bottom: 4px; }
    .rule { text-align: center; letter-spacing: 1px; color: #333; margin: 6px 0; font-size: 10px; }
    .copy-label { font-weight: 800; text-align: center; font-size: 15px; letter-spacing: 0.1em; margin: 8px 0; }
    .ticket-id { font-weight: 600; margin: 4px 0; }
    .muted { color: #555; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { padding: 4px 2px; border-bottom: 1px solid #ddd; }
    th { font-size: 9px; text-align: left; border-bottom: 1px solid #000; }
    .tot { margin: 4px 0; }
    .total-line { font-weight: 700; font-size: 14px; margin-top: 6px; }
    .footer { text-align: center; margin-top: 12px; font-style: italic; color: #444; }
    .hint { margin-top: 16px; padding: 8px; background: #f1f5f9; border-radius: 6px; font-size: 10px; color: #475569; }
    @media print { .no-print { display: none !important; } }
  </style></head><body>
  <div class="store">${escapeHtml(storeName)}</div>
  <div class="rule">------------------------</div>
  ${copyBlock}
  <div class="ticket-id">Ticket #${escapeHtml(data.saleId)}</div>
  <div class="muted">${escapeHtml(data.date)}</div>
  <div class="rule">------------------------</div>
  <table><thead><tr><th>Producto</th><th style="text-align:center">Cant</th><th style="text-align:right">Total</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="rule">------------------------</div>
  <div class="tot">Subtotal: $${Number(data.subtotal || 0).toFixed(2)}</div>
  <div class="tot">IVA: $${Number(data.tax ?? 0).toFixed(2)}</div>
  <div class="total-line">TOTAL: $${Number(data.total || 0).toFixed(2)}</div>
  <div class="muted">Pago: ${escapeHtml(payLabel)}</div>
  <div class="rule">------------------------</div>
  <div class="footer">¡Gracias por su compra!</div>
  <p class="hint no-print">Se abrirá el cuadro de impresión. Puedes elegir tu impresora de tickets o <strong>Guardar como PDF</strong>.</p>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.focus(); window.print(); }, 300);
    });
  </script>
  </body></html>`;

  return openHtmlInPrintWindow(html);
}

/**
 * Tras una venta: PosPrinter silencioso en Electron si «Impresión automática» está activa.
 * Si la térmica falla, abre el ticket con cuadro del sistema (PDF / elegir impresora).
 * Si la impresión automática está desactivada, no imprime ni abre diálogo (salvo `forceInteractive`).
 */
export async function printReceiptThermalOrDialog(
  data: ReceiptPrintData,
  opts?: { forceInteractive?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const config = getReceiptPrintConfig();
  const userExplicit = opts?.forceInteractive === true;

  if (!config.enabled && !userExplicit) {
    return { success: true };
  }

  if (isElectron() && config.enabled) {
    const r = await printReceipt(data);
    if (r.success) return r;
    console.warn('[ReceiptPrint] Térmica falló, usando cuadro de impresión:', r.error);
    const pv = openReceiptPrintPreviewForData(data);
    if (!pv.success) {
      return { success: false, error: r.error || pv.error || 'No se pudo imprimir' };
    }
    return { success: true };
  }

  if (isElectron() && userExplicit && !config.enabled) {
    return openReceiptPrintPreviewForData(data);
  }

  return openReceiptPrintPreviewForData(data);
}

/**
 * Envía un ticket de prueba a la impresora térmica (Electron / PosPrinter), sin depender de «Impresión automática».
 * No incrementa el contador Original/Copia de ventas reales.
 */
export async function printReceiptTestThermal(): Promise<{ success: boolean; error?: string }> {
  if (!isElectron()) {
    return { success: false, error: 'Solo disponible en la app de escritorio (Electron).' };
  }

  const cfg = getReceiptPrintConfig();
  const receiptData: ReceiptPrintData = {
    storeName: resolveStoreNameForPrint(),
    saleId: `TEST-${Date.now()}`,
    date: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
    items: [
      { productName: 'Prueba térmica A', quantity: 1, unitPrice: 10, totalPrice: 10 },
      { productName: 'Prueba térmica B', quantity: 1, unitPrice: 5, totalPrice: 5 },
    ],
    subtotal: 12.93,
    tax: 2.07,
    total: 15,
    paymentMethod: 'Prueba térmica',
    ticketKind: 'catalog',
    copyLabel: cfg.showTicketCopyType ? cfg.labelOriginal : undefined,
  };

  const full: ReceiptPrintData = {
    ...receiptData,
    storeName: receiptData.storeName || cfg.storeName || 'BizneAI POS',
  };

  try {
    const result = await window.electronAPI!.printReceipt!(full, cfg.pageSize, cfg.printerName);
    const ok = result?.success === true;
    if (ok) return { success: true };
    const pv = openReceiptPrintPreviewForData(full);
    if (!pv.success) {
      return { success: false, error: result?.error || pv.error || 'No se pudo abrir el cuadro de impresión' };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[ReceiptPrint] Prueba térmica:', msg);
    const pv = openReceiptPrintPreviewForData(full);
    if (pv.success) return { success: true };
    return { success: false, error: msg };
  }
}

/** Navegador / Electron: tabla imprimible y cuadro de impresión (PDF). */
function openBrowserPrintCatalog(lines: Array<{ name: string; price: number }>, storeName: string): void {
  const sum = lines.reduce((a, l) => a + l.price, 0);
  const rows = lines
    .map(
      (l) =>
        `<tr><td>${escapeHtml(l.name)}</td><td style="text-align:right">$${l.price.toFixed(2)}</td></tr>`
    )
    .join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Catálogo</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 16px; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 1.25rem; margin: 0 0 8px; }
    .meta { color: #64748b; font-size: 0.875rem; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 8px 6px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; font-size: 0.8rem; }
    @media print { .no-print { display: none } }
  </style></head><body>
  <h1>${escapeHtml(storeName)}</h1>
  <p class="meta">Lista de productos — ${new Date().toLocaleString('es-MX')}</p>
  <table><thead><tr><th>Producto</th><th style="text-align:right">Precio</th></tr></thead><tbody>${rows}</tbody>
  <tfoot><tr><th>Referencias (${lines.length})</th><th style="text-align:right">$${sum.toFixed(2)}</th></tr></tfoot></table>
  <p class="meta no-print" style="margin-top:16px">Usa Ctrl+P / Cmd+P para imprimir o guardar PDF.</p>
  <script>window.onload=function(){window.print();}</script>
  </body></html>`;
  const r = openHtmlInPrintWindow(html);
  if (!r.success) {
    throw new Error(r.error || 'No se pudo abrir la impresión');
  }
}

/**
 * Imprime la lista de productos (vista actual: filtros/búsqueda aplicados).
 * En Electron usa la impresora térmica configurada; en navegador abre diálogo de impresión.
 */
export async function printProductCatalog(
  lines: Array<{ name: string; price: number }>
): Promise<{ success: boolean; error?: string }> {
  if (lines.length === 0) {
    return { success: false, error: 'No hay productos en la lista' };
  }

  const storeName = resolveStoreNameForPrint();
  const subtotal = lines.reduce((s, l) => s + l.price, 0);

  const catalogData: ReceiptPrintData = {
    storeName,
    saleId: `LISTA-${Date.now()}`,
    date: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
    items: lines.map((l) => ({
      productName: l.name,
      quantity: 1,
      unitPrice: l.price,
      totalPrice: l.price,
    })),
    subtotal,
    tax: 0,
    total: subtotal,
    paymentMethod: 'Lista de precios',
    ticketKind: 'catalog',
  };

  if (isElectron() && getReceiptPrintConfig().enabled) {
    const thermal = await printReceipt(catalogData);
    if (thermal.success) return thermal;
    try {
      openBrowserPrintCatalog(lines, storeName);
      return { success: true };
    } catch (e) {
      const preview = openReceiptPrintPreviewForData(catalogData);
      if (preview.success) return { success: true };
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: thermal.error || preview.error || msg };
    }
  }

  try {
    openBrowserPrintCatalog(lines, storeName);
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}
