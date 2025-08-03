import { z } from 'zod';

// Shop creation schema
export const createShopSchema = z.object({
  storeName: z.string().min(1, 'Store name is required').max(100),
  storeType: z.enum(['CoffeeShop', 'Restaurant', 'Retail', 'Service', 'Other']),
  storeLocation: z.string().min(1, 'Store location is required').max(200),
  streetAddress: z.string().min(1, 'Street address is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  zip: z.string().min(1, 'ZIP code is required').max(20),
  clientId: z.string().min(1, 'Client ID is required').max(50),
  ecommerceEnabled: z.boolean().default(true),
  kitchenEnabled: z.boolean().default(true),
  crypto: z.boolean().default(false),
  acceptedCryptocurrencies: z.array(z.string()).default([])
});

// Shop update schema
export const updateShopSchema = z.object({
  storeName: z.string().min(1).max(100).optional(),
  storeType: z.enum(['CoffeeShop', 'Restaurant', 'Retail', 'Service', 'Other']).optional(),
  storeLocation: z.string().min(1).max(200).optional(),
  streetAddress: z.string().min(1).max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  zip: z.string().min(1).max(20).optional(),
  clientId: z.string().min(1).max(50).optional(),
  ecommerceEnabled: z.boolean().optional(),
  kitchenEnabled: z.boolean().optional(),
  crypto: z.boolean().optional(),
  acceptedCryptocurrencies: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional()
});

// Shop query parameters schema
export const shopQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  storeType: z.enum(['CoffeeShop', 'Restaurant', 'Retail', 'Service', 'Other']).optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  search: z.string().optional(),
  ecommerceEnabled: z.string().transform(val => val === 'true').optional(),
  kitchenEnabled: z.string().transform(val => val === 'true').optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  language: z.enum(['en', 'es']).optional()
});

// Shop ID parameter schema
export const shopIdSchema = z.object({
  id: z.string().min(1, 'Shop ID is required')
});

// Crypto settings schema
export const cryptoSettingsSchema = z.object({
  crypto: z.boolean(),
  cryptoAddress: z.string().optional(),
  acceptedCryptocurrencies: z.array(z.string())
}); 