export interface StoreConfig {
  storeName: string;
  storeType: string;
  storeLocation: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  clientId: string;
  ecommerceEnabled: boolean;
  kitchenEnabled: boolean;
  crypto: boolean;
  acceptedCryptocurrencies: string[];
}

export interface StoreType {
  value: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export interface Cryptocurrency {
  value: string;
  label: string;
} 