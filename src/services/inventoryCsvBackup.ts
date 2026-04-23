import { scheduleMirrorKeyToSqlite } from './posPersistService';

const LS_LAST_AUTO_DAY = 'bizneai-inventory-csv-autobackup-day';

export type InventoryCsvRowInput = {
  name: string;
  category: string;
  stock: number;
  minStock: number;
  maxStock: number;
  sku: string;
  updatedAt: string;
  stockStatusLabel: string;
};

function escapeCsvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Mismo esquema que la exportación manual de la vista Inventario. */
export function buildInventoryCsv(products: InventoryCsvRowInput[]): string {
  const headers = [
    'Nombre',
    'Categoría',
    'Stock',
    'Stock Mínimo',
    'Stock Máximo',
    'Estado',
    'SKU',
    'Última Actualización',
  ];
  if (products.length === 0) {
    return `${headers.join(',')}\n`;
  }
  const rows = products.map((p) =>
    [
      p.name,
      p.category,
      p.stock,
      p.minStock,
      p.maxStock,
      p.stockStatusLabel,
      p.sku,
      p.updatedAt,
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  return `${headers.join(',')}\n${rows.join('\n')}`;
}

export function todayLocalIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getLastAutoInventoryBackupDay(): string | null {
  try {
    return localStorage.getItem(LS_LAST_AUTO_DAY);
  } catch {
    return null;
  }
}

function setLastAutoInventoryBackupDay(isoDate: string): void {
  try {
    localStorage.setItem(LS_LAST_AUTO_DAY, isoDate);
    scheduleMirrorKeyToSqlite(LS_LAST_AUTO_DAY);
  } catch {
    /* ignore */
  }
}

export type InventoryBackupKind = 'daily' | 'export';

/**
 * Electron: `userData/.Backup/YYYY-MM-DD/inventario.csv` (diario) o `inventario-export-HHmmss.csv`.
 * Navegador: no escribe disco (solo descarga manual desde el componente).
 */
export async function writeInventoryCsvToBackupFolder(
  csv: string,
  kind: InventoryBackupKind
): Promise<{ ok: boolean; path?: string; error?: string }> {
  const api = typeof window !== 'undefined' ? window.electronAPI : undefined;
  if (!api?.writeInventoryBackupCsv) {
    return { ok: false, error: 'not_electron' };
  }
  return api.writeInventoryBackupCsv({ csvText: csv, kind });
}

/**
 * Un respaldo CSV al día (primera visita a Inventario con datos). Solo Electron escribe en `.Backup`.
 */
export async function maybeRunDailyInventoryCsvBackup(rows: InventoryCsvRowInput[]): Promise<void> {
  if (rows.length === 0) return;
  if (typeof window === 'undefined' || !window.electronAPI?.writeInventoryBackupCsv) return;
  const today = todayLocalIsoDate();
  if (getLastAutoInventoryBackupDay() === today) return;
  const csv = buildInventoryCsv(rows);
  const r = await writeInventoryCsvToBackupFolder(csv, 'daily');
  if (r.ok) {
    setLastAutoInventoryBackupDay(today);
  }
}
