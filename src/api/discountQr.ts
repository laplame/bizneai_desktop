/**
 * Discount QR API - Validar y canjear cupones DameCodigo (crypto-marketing / USDLXE cashback)
 * Endpoints reales del backend: POST /api/fx/validate-coupon, POST /api/fx/redeem-coupon
 * (la ruta anterior /api/discount-qr/verify nunca existió en el backend real).
 * @see docs/# Datos enviados al servidor y endpoints.md
 */

import { getLocalApiOrigin, shouldUseSalesMcpProxy } from '../utils/localApiBase';

const getApiOrigin = (): string => 'https://www.bizneai.com';

export interface DiscountQrCouponData {
  valid: boolean;
  code: string;
  discountAmount: number;
  currency: 'MXN' | 'USD';
  promotionTitle?: string;
  originalPrice?: number;
  finalPrice?: number;
  tokensPerCoupon?: number;
  usdlxeTokens?: number;
  redemptionsRemaining?: number;
  message?: string;
}

export interface DiscountQrResponse {
  success: boolean;
  data?: DiscountQrCouponData;
  error?: string;
}

interface DiscountQrRequestParams {
  code: string;
  shopId: string;
  orderTotal?: number;
  currency?: 'MXN' | 'USD';
}

async function postDiscountQr(
  path: 'validate-coupon' | 'redeem-coupon',
  params: DiscountQrRequestParams
): Promise<DiscountQrResponse> {
  const proxyPath = path === 'validate-coupon' ? 'fx/validate-coupon' : 'fx/redeem-coupon';
  const url = shouldUseSalesMcpProxy()
    ? `${getLocalApiOrigin()}/api/proxy/${proxyPath}`
    : `${getApiOrigin()}/api/fx/${path}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || data?.message || `Error ${response.status}`,
      };
    }

    return {
      success: Boolean(data?.success),
      data: data?.data,
      error: data?.error,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de conexión';
    return { success: false, error: message };
  }
}

/**
 * Valida un cupón DameCodigo sin canjearlo — POST /api/fx/validate-coupon.
 * Llamar antes de aplicar el descuento en el checkout.
 */
export async function verifyDiscountQr(
  code: string,
  shopId: string,
  orderTotal?: number,
  currency: 'MXN' | 'USD' = 'MXN'
): Promise<DiscountQrResponse> {
  return postDiscountQr('validate-coupon', { code, shopId, orderTotal, currency });
}

/**
 * Canjea definitivamente un cupón DameCodigo — POST /api/fx/redeem-coupon.
 * Solo llamar UNA vez, después de confirmar que el pago de la venta fue aceptado
 * (dispara el cashback USDLXE al cliente en DameCodigo).
 */
export async function redeemDiscountQr(
  code: string,
  shopId: string,
  orderTotal: number,
  currency: 'MXN' | 'USD' = 'MXN'
): Promise<DiscountQrResponse> {
  return postDiscountQr('redeem-coupon', { code, shopId, orderTotal, currency });
}
