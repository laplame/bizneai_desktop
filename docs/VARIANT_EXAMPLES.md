# Ejemplos JSON de Variantes por Tipo

Este documento muestra ejemplos de la estructura JSON de variantes para diferentes tipos de productos.

## 📋 Variantes Predefinidas por Tipo

### 1. Tipo: `size` (Talla)

```json
{
  "size": [
    {
      "name": "Small",
      "value": "S",
      "priceModifier": 0
    },
    {
      "name": "Medium",
      "value": "M",
      "priceModifier": 0
    },
    {
      "name": "Large",
      "value": "L",
      "priceModifier": 3.00
    },
    {
      "name": "XL",
      "value": "XL",
      "priceModifier": 5.00
    },
    {
      "name": "XXL",
      "value": "XXL",
      "priceModifier": 7.00
    },
    {
      "name": "XXXL",
      "value": "XXXL",
      "priceModifier": 10.00
    }
  ]
}
```

### 2. Tipo: `color` (Color)

```json
{
  "color": [
    {
      "name": "Red",
      "value": "red",
      "priceModifier": 0
    },
    {
      "name": "Blue",
      "value": "blue",
      "priceModifier": 2.00
    },
    {
      "name": "Green",
      "value": "green",
      "priceModifier": 0
    },
    {
      "name": "Black",
      "value": "black",
      "priceModifier": 0
    },
    {
      "name": "White",
      "value": "white",
      "priceModifier": 0
    },
    {
      "name": "Yellow",
      "value": "yellow",
      "priceModifier": 1.00
    },
    {
      "name": "Purple",
      "value": "purple",
      "priceModifier": 2.00
    },
    {
      "name": "Orange",
      "value": "orange",
      "priceModifier": 1.00
    }
  ]
}
```

### 3. Tipo: `model` (Modelo)

```json
{
  "model": [
    {
      "name": "Classic",
      "value": "classic",
      "priceModifier": 0
    },
    {
      "name": "Premium",
      "value": "premium",
      "priceModifier": 10.00
    },
    {
      "name": "Standard",
      "value": "standard",
      "priceModifier": 0
    },
    {
      "name": "Deluxe",
      "value": "deluxe",
      "priceModifier": 15.00
    }
  ]
}
```

### 4. Tipo: `custom` (Personalizado)

```json
{
  "custom": []
}
```

*Nota: El tipo `custom` no tiene opciones predefinidas. El usuario puede crear variantes personalizadas.*

---

## 🛍️ Ejemplo Completo: Producto con Variantes

### Ejemplo 1: Camiseta con Tallas (Una Variante)

```json
{
  "name": "Camiseta Básica",
  "description": "Camiseta de algodón 100%",
  "price": 25.00,
  "category": "Clothing",
  "hasVariants": true,
  "variantGroups": [
    {
      "id": "group-size-123456",
      "type": "size",
      "label": "Talla",
      "name": "Size",
      "isPrimary": true,
      "order": 0,
      "variants": [
        {
          "id": "variant-size-S-123456",
          "name": "Small",
          "value": "S",
          "priceModifier": 0,
          "order": 0
        },
        {
          "id": "variant-size-M-123456",
          "name": "Medium",
          "value": "M",
          "priceModifier": 0,
          "order": 1
        },
        {
          "id": "variant-size-L-123456",
          "name": "Large",
          "value": "L",
          "priceModifier": 3.00,
          "order": 2
        },
        {
          "id": "variant-size-XL-123456",
          "name": "XL",
          "value": "XL",
          "priceModifier": 5.00,
          "order": 3
        }
      ]
    }
  ],
  "primaryVariantGroup": "group-size-123456"
}
```

### Ejemplo 2: Bebida con Tamaños (Una Variante)

```json
{
  "name": "Café Frappé",
  "description": "Bebida fría de café",
  "price": 5.00,
  "category": "Drinks",
  "hasVariants": true,
  "variantGroups": [
    {
      "id": "group-size-789012",
      "type": "size",
      "label": "Talla",
      "name": "Size",
      "isPrimary": true,
      "order": 0,
      "variants": [
        {
          "id": "variant-size-S-789012",
          "name": "Small",
          "value": "S",
          "priceModifier": 0,
          "order": 0
        },
        {
          "id": "variant-size-M-789012",
          "name": "Medium",
          "value": "M",
          "priceModifier": 1.50,
          "order": 1
        },
        {
          "id": "variant-size-L-789012",
          "name": "Large",
          "value": "L",
          "priceModifier": 3.00,
          "order": 2
        }
      ]
    }
  ],
  "primaryVariantGroup": "group-size-789012"
}
```

### Ejemplo 3: Producto con Color y Talla (Múltiples Variantes)

```json
{
  "name": "Pantalón Jeans",
  "description": "Pantalón jeans clásico",
  "price": 79.99,
  "category": "Clothing",
  "hasVariants": true,
  "variantGroups": [
    {
      "id": "group-color-345678",
      "type": "color",
      "label": "Color",
      "name": "Color",
      "isPrimary": true,
      "order": 0,
      "variants": [
        {
          "id": "variant-color-blue-345678",
          "name": "Blue",
          "value": "blue",
          "priceModifier": 0,
          "order": 0
        },
        {
          "id": "variant-color-black-345678",
          "name": "Black",
          "value": "black",
          "priceModifier": 0,
          "order": 1
        }
      ]
    },
    {
      "id": "group-size-345678",
      "type": "size",
      "label": "Talla",
      "name": "Size",
      "isPrimary": false,
      "order": 1,
      "variants": [
        {
          "id": "variant-size-30-345678",
          "name": "30",
          "value": "30",
          "priceModifier": 0,
          "order": 0
        },
        {
          "id": "variant-size-32-345678",
          "name": "32",
          "value": "32",
          "priceModifier": 0,
          "order": 1
        },
        {
          "id": "variant-size-34-345678",
          "name": "34",
          "value": "34",
          "priceModifier": 0,
          "order": 2
        }
      ]
    }
  ],
  "primaryVariantGroup": "group-color-345678"
}
```

### Ejemplo 4: Producto con Modelo (Una Variante)

```json
{
  "name": "Smartphone",
  "description": "Teléfono inteligente",
  "price": 299.99,
  "category": "Electronics",
  "hasVariants": true,
  "variantGroups": [
    {
      "id": "group-model-901234",
      "type": "model",
      "label": "Modelo",
      "name": "Model",
      "isPrimary": true,
      "order": 0,
      "variants": [
        {
          "id": "variant-model-classic-901234",
          "name": "Classic",
          "value": "classic",
          "priceModifier": 0,
          "order": 0
        },
        {
          "id": "variant-model-premium-901234",
          "name": "Premium",
          "value": "premium",
          "priceModifier": 10.00,
          "order": 1
        },
        {
          "id": "variant-model-deluxe-901234",
          "name": "Deluxe",
          "value": "deluxe",
          "priceModifier": 15.00,
          "order": 2
        }
      ]
    }
  ],
  "primaryVariantGroup": "group-model-901234"
}
```

### Ejemplo 5: Producto con Variantes Personalizadas

```json
{
  "name": "Producto Personalizado",
  "description": "Producto con variantes personalizadas",
  "price": 50.00,
  "category": "Other",
  "hasVariants": true,
  "variantGroups": [
    {
      "id": "group-custom-567890",
      "type": "custom",
      "label": "Personalizado",
      "name": "Custom",
      "isPrimary": true,
      "order": 0,
      "variants": [
        {
          "id": "variant-custom-option1-567890",
          "name": "Opción 1",
          "value": "option1",
          "priceModifier": 5.00,
          "order": 0
        },
        {
          "id": "variant-custom-option2-567890",
          "name": "Opción 2",
          "value": "option2",
          "priceModifier": 10.00,
          "order": 1
        }
      ]
    }
  ],
  "primaryVariantGroup": "group-custom-567890"
}
```

---

## 📊 Estructura de VariantGroup

Cada grupo de variantes tiene la siguiente estructura:

```json
{
  "id": "string",              // ID único del grupo (ej: "group-size-123456")
  "type": "size|color|model|custom",  // Tipo de variante
  "label": "string",           // Etiqueta para mostrar en UI (ej: "Talla", "Color")
  "name": "string",            // Nombre del grupo (ej: "Size", "Color")
  "isPrimary": boolean,         // Si es el grupo principal (afecta más el precio)
  "order": number,              // Orden de visualización
  "variants": [                 // Array de variantes
    {
      "id": "string",          // ID único de la variante
      "name": "string",        // Nombre de la variante (ej: "Small", "Red")
      "value": "string",       // Valor de la variante (ej: "S", "red")
      "priceModifier": number, // Modificador de precio (se suma al precio base)
      "order": number,          // Orden de visualización
      "stock": number,          // (Opcional) Stock específico de la variante
      "sku": "string",          // (Opcional) SKU específico de la variante
      "isDefault": boolean      // (Opcional) Si es la variante por defecto
    }
  ]
}
```

---

## 💰 Cálculo de Precio con Variantes

El precio final se calcula así:

```
Precio Final = Precio Base + Modificador del Grupo Principal + (Otros Modificadores × 0.5)
```

**Ejemplo:**
- Precio Base: $25.00
- Grupo Principal (Talla L): +$3.00
- Grupo Secundario (Color Blue): +$2.00

```
Precio Final = $25.00 + $3.00 + ($2.00 × 0.5) = $29.00
```

---

## 🔍 Notas Importantes

1. **`isPrimary`**: Solo un grupo puede ser primario. El modificador del grupo primario se aplica al 100%, los demás al 50%.

2. **`priceModifier`**: Puede ser positivo (aumenta precio) o negativo (disminuye precio).

3. **`order`**: Controla el orden de visualización tanto de grupos como de variantes.

4. **`value`**: Es el identificador interno de la variante (ej: "S", "red", "classic").

5. **`name`**: Es el nombre que se muestra al usuario (ej: "Small", "Red", "Classic").
