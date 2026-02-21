// Tipos de tienda hardcodeados desde la API
// https://bizneai.com/api/shop/store-types?language=es
// Solo se verifica si hay cambios en el primer inicio de sesión

export interface StoreTypeOption {
  value: string;
  mainCategory: string;
  label: {
    en: string;
    es: string;
  };
}

// Lista hardcodeada de tipos de tienda (31 tipos)
export const STORE_TYPES: StoreTypeOption[] = [
  {
    value: "GroceryStore",
    mainCategory: "grocery",
    label: {
      en: "Grocery Store / Convenience Store",
      es: "Tienda de Abarrotes / Miscelánea"
    }
  },
  {
    value: "JewelryStore",
    mainCategory: "jewelry",
    label: {
      en: "Jewelry Store",
      es: "Joyería"
    }
  },
  {
    value: "Restaurant",
    mainCategory: "restaurant",
    label: {
      en: "Restaurant",
      es: "Restaurante"
    }
  },
  {
    value: "CoffeeShop",
    mainCategory: "coffee_shop",
    label: {
      en: "Coffee Shop",
      es: "Cafetería"
    }
  },
  {
    value: "ClothingStore",
    mainCategory: "clothing",
    label: {
      en: "Clothing Store",
      es: "Tienda de Ropa"
    }
  },
  {
    value: "ShoeStore",
    mainCategory: "shoes",
    label: {
      en: "Shoe Store",
      es: "Zapatería"
    }
  },
  {
    value: "Pharmacy",
    mainCategory: "pharmacy",
    label: {
      en: "Pharmacy / Drugstore",
      es: "Farmacia"
    }
  },
  {
    value: "Bakery",
    mainCategory: "bakery",
    label: {
      en: "Bakery",
      es: "Panadería"
    }
  },
  {
    value: "IceCreamShop",
    mainCategory: "ice_cream",
    label: {
      en: "Ice Cream Shop",
      es: "Heladería"
    }
  },
  {
    value: "ElectronicsStore",
    mainCategory: "electronics",
    label: {
      en: "Electronics Store",
      es: "Tienda de Electrónicos"
    }
  },
  {
    value: "PetStore",
    mainCategory: "pet_store",
    label: {
      en: "Pet Store",
      es: "Tienda de Mascotas"
    }
  },
  {
    value: "LiquorStore",
    mainCategory: "liquor_store",
    label: {
      en: "Liquor Store / Wine Shop",
      es: "Tienda de Vinos y Licores"
    }
  },
  {
    value: "Bookstore",
    mainCategory: "bookstore",
    label: {
      en: "Bookstore",
      es: "Librería"
    }
  },
  {
    value: "GiftShop",
    mainCategory: "gift_shop",
    label: {
      en: "Gift Shop",
      es: "Tienda de Regalos"
    }
  },
  {
    value: "BeautySalon",
    mainCategory: "beauty_salon",
    label: {
      en: "Beauty Salon / Hair Salon",
      es: "Estética / Salón de Belleza"
    }
  },
  {
    value: "Spa",
    mainCategory: "spa",
    label: {
      en: "Spa / Massage Center",
      es: "Spa o Centro de Masajes"
    }
  },
  {
    value: "HardwareStore",
    mainCategory: "hardware",
    label: {
      en: "Hardware Store",
      es: "Ferretería"
    }
  },
  {
    value: "HealthFoodStore",
    mainCategory: "health_food",
    label: {
      en: "Health Food Store / Organic Products Store",
      es: "Tienda Naturista / Productos Orgánicos"
    }
  },
  {
    value: "SportingGoodsStore",
    mainCategory: "sporting_goods",
    label: {
      en: "Sporting Goods Store",
      es: "Tienda de Deportes"
    }
  },
  {
    value: "ToyStore",
    mainCategory: "toy_store",
    label: {
      en: "Toy Store",
      es: "Tienda de Juguetes"
    }
  },
  {
    value: "FashionBoutique",
    mainCategory: "fashion_boutique",
    label: {
      en: "Fashion Boutique",
      es: "Boutique de Moda"
    }
  },
  {
    value: "FurnitureStore",
    mainCategory: "furniture",
    label: {
      en: "Furniture Store",
      es: "Tienda de Muebles"
    }
  },
  {
    value: "AutoPartsStore",
    mainCategory: "auto_parts",
    label: {
      en: "Auto Parts Store",
      es: "Tienda de Autopartes"
    }
  },
  {
    value: "Laundry",
    mainCategory: "laundry",
    label: {
      en: "Laundry / Dry Cleaner",
      es: "Lavandería / Tintorería"
    }
  },
  {
    value: "CosmeticsStore",
    mainCategory: "cosmetics",
    label: {
      en: "Cosmetics Store",
      es: "Tienda de Cosméticos"
    }
  },
  {
    value: "CellPhoneStore",
    mainCategory: "cell_phone",
    label: {
      en: "Cell Phone & Accessories Store",
      es: "Tienda de Celulares y Accesorios"
    }
  },
  {
    value: "ComputerStore",
    mainCategory: "computer_store",
    label: {
      en: "Computer Store",
      es: "Tienda de Computadoras"
    }
  },
  {
    value: "ThriftStore",
    mainCategory: "thrift_store",
    label: {
      en: "Thrift Store / Second-hand Store",
      es: "Tienda de Segunda Mano / Ropa Usada"
    }
  },
  {
    value: "FlowerShop",
    mainCategory: "flower_shop",
    label: {
      en: "Flower Shop",
      es: "Floristería"
    }
  },
  {
    value: "ButcherShop",
    mainCategory: "butcher_shop",
    label: {
      en: "Butcher Shop",
      es: "Carnicería"
    }
  },
  {
    value: "StationeryStore",
    mainCategory: "stationery",
    label: {
      en: "Stationery Store",
      es: "Papelería"
    }
  }
];

// Función para verificar si hay cambios en la lista de tipos de tienda
// Solo se ejecuta en el primer inicio de sesión
export async function checkStoreTypesForUpdates(language: string = 'es'): Promise<{
  hasChanges: boolean;
  updatedTypes?: StoreTypeOption[];
  message?: string;
}> {
  try {
    // Verificar si ya se hizo la verificación inicial
    const hasCheckedBefore = localStorage.getItem('bizneai-store-types-checked');
    
    // Si ya se verificó antes, no hacer nada
    if (hasCheckedBefore === 'true') {
      return { hasChanges: false };
    }

    // Hacer la petición a la API
    const response = await fetch(`https://bizneai.com/api/shop/store-types?language=${language}`);
    
    if (!response.ok) {
      console.warn('No se pudo verificar actualizaciones de tipos de tienda');
      // Marcar como verificado para no intentar de nuevo
      localStorage.setItem('bizneai-store-types-checked', 'true');
      return { hasChanges: false };
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      const apiTypes: StoreTypeOption[] = data.data;
      
      // Comparar con la lista hardcodeada
      const currentValues = new Set(STORE_TYPES.map(t => t.value));
      const apiValues = new Set(apiTypes.map(t => t.value));
      
      // Verificar si hay diferencias
      const hasNewTypes = Array.from(apiValues).some(v => !currentValues.has(v));
      const hasRemovedTypes = Array.from(currentValues).some(v => !apiValues.has(v));
      
      if (hasNewTypes || hasRemovedTypes) {
        // Guardar la nueva lista
        localStorage.setItem('bizneai-store-types', JSON.stringify(apiTypes));
        localStorage.setItem('bizneai-store-types-checked', 'true');
        
        return {
          hasChanges: true,
          updatedTypes: apiTypes,
          message: hasNewTypes 
            ? 'Se encontraron nuevos tipos de tienda disponibles'
            : 'Algunos tipos de tienda fueron removidos'
        };
      }
    }

    // Marcar como verificado
    localStorage.setItem('bizneai-store-types-checked', 'true');
    return { hasChanges: false };
  } catch (error) {
    console.error('Error verificando tipos de tienda:', error);
    // Marcar como verificado para no intentar de nuevo en caso de error
    localStorage.setItem('bizneai-store-types-checked', 'true');
    return { hasChanges: false };
  }
}

// Función para obtener los tipos de tienda disponibles
// Prioriza la lista guardada en localStorage si existe, sino usa la hardcodeada
export function getStoreTypes(language: string = 'es'): StoreTypeOption[] {
  try {
    const savedTypes = localStorage.getItem('bizneai-store-types');
    if (savedTypes) {
      const parsed = JSON.parse(savedTypes);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error cargando tipos de tienda guardados:', error);
  }
  
  // Retornar lista hardcodeada por defecto
  return STORE_TYPES;
}

// Función para obtener el label en el idioma especificado
export function getStoreTypeLabel(storeType: string, language: string = 'es'): string {
  const types = getStoreTypes(language);
  const type = types.find(t => t.value === storeType);
  
  if (type) {
    return type.label[language as 'es' | 'en'] || type.label.es;
  }
  
  return storeType; // Retornar el valor si no se encuentra
}

