import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { scheduleMirrorKeyToSqlite } from '../services/posPersistService';

interface StoreIdentifiers {
  _id: string | null;
  clientId: string | null;
  shopId: string | null; // Shop ID from server URL (MCP)
  storeName: string | null;
  storeType: string | null;
  mcpUrl: string | null; // MCP API URL
}

interface StoreContextType {
  storeIdentifiers: StoreIdentifiers;
  setStoreIdentifiers: (identifiers: Partial<StoreIdentifiers>) => void;
  isStoreConfigured: boolean;
  clearStoreIdentifiers: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [storeIdentifiers, setStoreIdentifiersState] = useState<StoreIdentifiers>({
    _id: null,
    clientId: null,
    shopId: null,
    storeName: null,
    storeType: null,
    mcpUrl: null
  });

  // Cargar identificadores guardados al inicializar
  useEffect(() => {
    const loadStoreIdentifiers = () => {
      try {
        const savedIdentifiers = localStorage.getItem('bizneai-store-identifiers');
        if (savedIdentifiers) {
          const parsed = JSON.parse(savedIdentifiers);
          setStoreIdentifiersState(parsed);
        }
      } catch (error) {
        console.error('Error loading store identifiers:', error);
      }
    };

    loadStoreIdentifiers();
  }, []);

  const setStoreIdentifiers = (identifiers: Partial<StoreIdentifiers>) => {
    const updatedIdentifiers = { ...storeIdentifiers, ...identifiers };
    setStoreIdentifiersState(updatedIdentifiers);
    
    // Guardar en localStorage
    try {
      localStorage.setItem('bizneai-store-identifiers', JSON.stringify(updatedIdentifiers));
      scheduleMirrorKeyToSqlite('bizneai-store-identifiers');
    } catch (error) {
      console.error('Error saving store identifiers:', error);
    }
  };

  const clearStoreIdentifiers = () => {
    setStoreIdentifiersState({
      _id: null,
      clientId: null,
      shopId: null,
      storeName: null,
      storeType: null,
      mcpUrl: null
    });
    localStorage.removeItem('bizneai-store-identifiers');
    scheduleMirrorKeyToSqlite('bizneai-store-identifiers');
  };

  const isStoreConfigured = !!(storeIdentifiers._id && storeIdentifiers.clientId);

  const value: StoreContextType = {
    storeIdentifiers,
    setStoreIdentifiers,
    isStoreConfigured,
    clearStoreIdentifiers
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}; 