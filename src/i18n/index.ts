import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  es: {
    translation: {
      // Carrito / Cart
      cart: {
        title: 'Carrito de Compras',
        empty: 'Tu carrito está vacío',
        startToSell: 'Comenzar a vender',
        quantity: 'Cantidad',
        weight: 'Peso',
        unitPrice: 'Precio unitario',
        customerInfo: 'Información del cliente',
        customerName: 'Nombre del cliente',
        tableNumber: 'Número de mesa',
        orderNotes: 'Notas del pedido',
        subtotalExclTax: 'Subtotal (sin imp.):',
        taxAmount: 'Impuestos:',
        totalInclTax: 'Total (incl. imp.):',
        proceedToCheckout: 'Proceder al pago',
        addToWaitlist: 'Agregar a lista de espera',
        adding: 'Agregando...',
        clearCart: 'Vaciar carrito',
        clearCartConfirm: '¿Estás seguro de que quieres vaciar todo el carrito?',
        viewTickets: 'Ver tickets',
        editNotes: 'Editar notas',
        notesForProduct: 'Notas para este producto',
        noNotes: 'Sin notas',
        decreaseQuantity: 'Disminuir cantidad',
        increaseQuantity: 'Aumentar cantidad',
        removeItem: 'Eliminar producto'
      },
      // Productos
      products: {
        noProducts: 'No se encontraron productos',
        tryAdjusting: 'Intenta ajustar la búsqueda o el filtro de categoría',
        searchPlaceholder: 'Buscar productos o escanear código de barras...',
        scanBarcode: 'Escanear código de barras',
        stockLow: 'Stock bajo',
        outOfStock: 'Sin stock',
        addStock: 'Ir a inventario para agregar',
        addToCart: 'Agregar al carrito',
        noStockClick: 'Sin stock - Ir a inventario para agregar',
        hasVariants: 'Tiene opciones (tamaño, extras, etc.)'
      },
      // Modal variantes
      variantModal: {
        addToCart: 'Agregar al carrito',
        cancel: 'Cancelar',
        quantity: 'Cantidad',
        quantityKg: 'Cantidad (kg)',
        notes: 'Notas (ej. sin hielo, leche de almendras)',
        notesPlaceholder: 'Instrucciones especiales para este producto...',
        total: 'Total'
      },
      persistence: {
        connected: 'Persistencia local: conectada',
        disconnected: 'Persistencia local: desconectada',
        checking: 'Comprobando…',
        titleConnected: 'El API en este equipo guarda datos en disco (SQLite). Las fotos del catálogo pueden servirse en local tras sincronizar.',
        titleDisconnected: 'Sin API local o sin base en disco: los datos solo viven en el navegador hasta que vuelva el servicio.',
        catalogOnline: 'Catálogo en línea',
        catalogOffline: 'Catálogo sin conexión',
        catalogChecking: 'Comprobando catálogo…',
        titleCatalogOnline: 'El servidor MCP responde; puedes sincronizar el catálogo.',
        titleCatalogOffline: 'No se alcanza el MCP (red o servidor). Seguirás con los datos ya descargados.',
        photosCachedToast: 'Se guardaron {{count}} fotos en disco para verlas sin conexión'
      }
    }
  },
  en: {
    translation: {
      cart: {
        title: 'Shopping Cart',
        empty: 'Your cart is empty',
        startToSell: 'Start selling',
        quantity: 'Quantity',
        weight: 'Weight',
        unitPrice: 'Unit price',
        customerInfo: 'Customer info',
        customerName: 'Customer name',
        tableNumber: 'Table number',
        orderNotes: 'Order notes',
        subtotalExclTax: 'Subtotal (excl. tax):',
        taxAmount: 'Tax:',
        totalInclTax: 'Total (incl. tax):',
        proceedToCheckout: 'Proceed to checkout',
        addToWaitlist: 'Add to waitlist',
        adding: 'Adding...',
        clearCart: 'Clear cart',
        clearCartConfirm: 'Are you sure you want to clear the entire cart?',
        viewTickets: 'View tickets',
        editNotes: 'Edit notes',
        notesForProduct: 'Notes for this product',
        noNotes: 'No notes',
        decreaseQuantity: 'Decrease quantity',
        increaseQuantity: 'Increase quantity',
        removeItem: 'Remove item'
      },
      products: {
        noProducts: 'No products found',
        tryAdjusting: 'Try adjusting search or category filter',
        searchPlaceholder: 'Search products or scan barcode...',
        scanBarcode: 'Scan barcode',
        stockLow: 'Low stock',
        outOfStock: 'Out of stock',
        addStock: 'Go to inventory to add',
        addToCart: 'Add to cart',
        noStockClick: 'Out of stock - Go to inventory to add',
        hasVariants: 'Has options (size, extras, etc.)'
      },
      variantModal: {
        addToCart: 'Add to cart',
        cancel: 'Cancel',
        quantity: 'Quantity',
        quantityKg: 'Quantity (kg)',
        notes: 'Notes (e.g. no ice, almond milk)',
        notesPlaceholder: 'Special instructions for this product...',
        total: 'Total'
      },
      persistence: {
        connected: 'Local persistence: connected',
        disconnected: 'Local persistence: disconnected',
        checking: 'Checking…',
        titleConnected: 'The local API is saving data to disk (SQLite). Catalog photos can be served locally after sync.',
        titleDisconnected: 'No local API or database: data stays in the browser until the service is available again.',
        catalogOnline: 'Catalog online',
        catalogOffline: 'Catalog offline',
        catalogChecking: 'Checking catalog…',
        titleCatalogOnline: 'MCP server is reachable; you can sync the catalog.',
        titleCatalogOffline: 'Cannot reach MCP (network or server). You can keep working with cached data.',
        photosCachedToast: '{{count}} product photos saved locally for offline viewing'
      }
    }
  }
};

const savedLanguage = (typeof localStorage !== 'undefined' && localStorage.getItem('bizneai-language')) || 'es';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
