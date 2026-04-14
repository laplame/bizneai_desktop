/// <reference types="vite/client" />

interface ElectronAPI {
  platform?: string;
  versions?: Record<string, string>;
  printReceipt?: (
    receiptData: ReceiptPrintData,
    pageSize?: '57mm' | '58mm' | '80mm',
    printerName?: string,
    generic80mmFallback?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  openDbConsole?: () => Promise<{ ok?: boolean }>;
  minimizeDbConsoleWindow?: () => Promise<{ ok?: boolean }>;
  closeDbConsoleWindow?: () => Promise<{ ok?: boolean }>;
  probeLocalApi?: () => Promise<{
    ok: boolean;
    bundleExists?: boolean;
    launcherExists?: boolean;
    embeddedNodeExists?: boolean;
    platform?: string;
  }>;
  pickTicketLogo?: () => Promise<{ path: string | null; error?: string }>;
  removeTicketLogo?: () => Promise<{ ok?: boolean }>;
  ticketLogoDataUrl?: (absPath: string) => Promise<string>;
}

interface ReceiptPrintData {
  storeName?: string;
  saleId: string;
  date: string;
  items: Array<{ productName: string; quantity: number; unitPrice: number; totalPrice?: number }>;
  subtotal: number;
  tax?: number;
  total: number;
  paymentMethod?: string;
  ticketKind?: 'sale' | 'catalog';
  copyLabel?: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
