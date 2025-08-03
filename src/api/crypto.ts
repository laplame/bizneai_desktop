// Crypto API Service
import { apiRequest } from './client';
import { 
  CryptoSettings,
  CryptoPayment,
  CryptoRate,
  SupportedCryptocurrency,
  ApiResponse 
} from '../types/api';

export const cryptoAPI = {
  // Get crypto exchange rates
  async getExchangeRates(): Promise<ApiResponse<CryptoRate[]>> {
    return apiRequest<CryptoRate[]>('/crypto/rates');
  },

  // Get supported cryptocurrencies
  async getSupportedCryptocurrencies(): Promise<ApiResponse<SupportedCryptocurrency[]>> {
    return apiRequest<SupportedCryptocurrency[]>('/crypto/supported');
  },

  // Process crypto payment
  async processCryptoPayment(paymentData: CryptoPayment): Promise<ApiResponse<any>> {
    return apiRequest<any>('/orders/crypto-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }
}; 