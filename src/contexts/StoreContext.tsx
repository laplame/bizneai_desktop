import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface StoreIdentifiers {
  _id: string | null;
  clientId: string | null;
  storeName: string | null;
  storeType: string | null;
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
    storeName: null,
    storeType: null
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
    } catch (error) {
      console.error('Error saving store identifiers:', error);
    }
  };

  const clearStoreIdentifiers = () => {
    setStoreIdentifiersState({
      _id: null,
      clientId: null,
      storeName: null,
      storeType: null
    });
    localStorage.removeItem('bizneai-store-identifiers');
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