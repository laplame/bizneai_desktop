/**
 * Visibilidad del módulo Cocina: tipo restaurante/cafetería + kitchenEnabled en config.
 * Los POS retail u otros tipos no deben ver Cocina aunque el flag venga en true por error.
 */

export function isRestaurantOrCafeStoreType(storeType: string | null | undefined): boolean {
  if (!storeType) return false;
  const t = String(storeType).trim();
  return (
    t === 'restaurant' ||
    t === 'coffee-shop' ||
    t === 'CoffeeShop' ||
    t === 'Restaurant'
  );
}

function readKitchenEnabledFlag(): boolean {
  try {
    const savedConfig = localStorage.getItem('bizneai-store-config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig) as { kitchenEnabled?: boolean };
      if (parsed.kitchenEnabled === true) return true;
    }
    const serverRaw = localStorage.getItem('bizneai-server-config');
    if (serverRaw) {
      const server = JSON.parse(serverRaw) as { kitchenEnabled?: boolean };
      if (server.kitchenEnabled === true) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Misma prioridad que AppContent: contexto > bizneai-store-config > bizneai-store-type > identificadores (respaldo).
 */
function resolveStoreTypeForKitchen(storeTypeFromContext: string | null | undefined): string | null {
  if (storeTypeFromContext && String(storeTypeFromContext).trim() !== '') {
    return String(storeTypeFromContext).trim();
  }
  try {
    const savedConfig = localStorage.getItem('bizneai-store-config');
    if (savedConfig) {
      const p = JSON.parse(savedConfig) as { storeType?: string };
      if (p.storeType && String(p.storeType).trim() !== '') return String(p.storeType).trim();
    }
  } catch {
    /* ignore */
  }
  const legacy = localStorage.getItem('bizneai-store-type');
  if (legacy && legacy.trim() !== '') return legacy.trim();
  try {
    const ids = localStorage.getItem('bizneai-store-identifiers');
    if (ids) {
      const p = JSON.parse(ids) as { storeType?: string };
      if (p.storeType && String(p.storeType).trim() !== '') return String(p.storeType).trim();
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Indica si debe mostrarse el menú / flujo Cocina (sidebar, enviar a cocina, etc.).
 * @param storeTypeFromContext — `storeIdentifiers.storeType` del contexto cuando exista.
 */
export function getKitchenModuleVisibility(storeTypeFromContext?: string | null): boolean {
  const storeType = resolveStoreTypeForKitchen(storeTypeFromContext);
  return isRestaurantOrCafeStoreType(storeType) && readKitchenEnabledFlag();
}
