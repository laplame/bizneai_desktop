/**
 * Discount QR API - Verificar códigos de descuento
 * POST /api/discount-qr/verify
 * @see docs/# Datos enviados al servidor y endpoints.md
 */

import { getLocalApiOrigin, shouldUseSalesMcpProxy } from '../utils/localApiBase';

const getApiOrigin = (): string => 'https://www.bizneai.com';

export interface DiscountQrVerifyRequest {
  qrValue: string;
}

export interface DiscountQrVerifyResponse {
  success: boolean;
  valid?: boolean;
  discount?: {
    type?: string;
    value?: number;
    percentage?: number;
    description?: string;
  };
  error?: string;
  message?: string;
}

/**
 * Verifica un código QR de descuento
 * POST /api/discount-qr/verify
 */
export async function verifyDiscountQr(qrValue: string): Promise<DiscountQrVerifyResponse> {
  const url = shouldUseSalesMcpProxy()
    ? `${getLocalApiOrigin()}/api/proxy/discount-qr/verify`
    : `${getApiOrigin()}/api/discount-qr/verify`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ qrValue }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        valid: false,
        error: data?.error || data?.message || `Error ${response.status}`,
      };
    }

    return {
      success: true,
      valid: data?.valid ?? true,
      discount: data?.discount,
      error: data?.error,
      message: data?.message,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de conexión';
    return { success: false, valid: false, error: message };
  }
}
