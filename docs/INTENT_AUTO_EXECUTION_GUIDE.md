# Guía de Ejecución Automática de Intents

## Resumen

El sistema de intents ahora soporta **ejecución automática con confirmación**. Cuando el usuario escribe un mensaje que contiene toda la información necesaria (producto, cantidad, etc.), el sistema:

1. **Detecta el intent** automáticamente
2. **Extrae los parámetros** del mensaje (producto, cantidad, precio, etc.)
3. **Muestra un modal de confirmación** con los datos extraídos
4. **Ejecuta la acción automáticamente** cuando el usuario confirma

## Flujo de Ejecución

```
Usuario escribe mensaje
    ↓
Sistema detecta intent
    ↓
Sistema extrae parámetros
    ↓
¿Tiene toda la información necesaria?
    ↓ SÍ
Muestra modal de confirmación
    ↓
Usuario confirma
    ↓
Ejecuta acción automáticamente
    ↓
Muestra mensaje de éxito
```

## Ejemplos de Uso

### Agregar Stock

**Mensaje:** `"agregar 10 piezas de Café x kilo"`

**Proceso:**
1. Detecta intent: `add_inventory_stock`
2. Extrae: producto="Café x kilo", cantidad=10
3. Muestra modal de confirmación
4. Al confirmar: Agrega 10 unidades al inventario automáticamente

**Mensaje:** `"add 20 units of Meat by Weight"`

**Proceso:**
1. Detecta intent: `add_inventory_stock`
2. Extrae: producto="Meat by Weight", cantidad=20
3. Muestra modal de confirmación
4. Al confirmar: Agrega 20 unidades al inventario automáticamente

### Quitar Stock

**Mensaje:** `"quitar 5 unidades de Café x kilo"`

**Proceso:**
1. Detecta intent: `remove_inventory_stock`
2. Extrae: producto="Café x kilo", cantidad=5
3. Muestra modal de confirmación
4. Al confirmar: Quita 5 unidades del inventario automáticamente

### Establecer Stock

**Mensaje:** `"establecer stock de Café x kilo en 50"`

**Proceso:**
1. Detecta intent: `set_inventory_stock`
2. Extrae: producto="Café x kilo", cantidad=50
3. Muestra modal de confirmación
4. Al confirmar: Establece el stock en 50 unidades automáticamente

### Capturar Venta

**Mensaje:** `"capturar venta de Café x kilo por $270"`

**Proceso:**
1. Detecta intent: `capture_sale`
2. Extrae: producto="Café x kilo", monto=$270
3. Muestra modal de confirmación
4. Al confirmar: Navega a POS con producto y monto prellenados

## Parámetros Extraídos

### Para Operaciones de Inventario

- **Productos**: Nombres de productos encontrados en el mensaje
- **Cantidad**: Número de unidades (piezas, unidades, etc.)
- **Operación**: Tipo de operación (agregar, quitar, establecer)
- **Notas**: Comentarios adicionales si están presentes

### Para Operaciones de Ventas

- **Productos**: Nombres de productos encontrados en el mensaje
- **Monto Total**: Precio o monto total de la venta
- **Método de Pago**: Efectivo, tarjeta, cripto, mixto (si está especificado)

## Casos Especiales

### Sin Información Completa

Si el mensaje no contiene toda la información necesaria (por ejemplo, falta el nombre del producto o la cantidad), el sistema:

1. Detecta el intent
2. Muestra el botón de acción normal
3. Abre el modal/pantalla correspondiente para que el usuario complete la información manualmente

### Múltiples Productos

Si el mensaje menciona múltiples productos, el sistema intenta extraer todos:

**Mensaje:** `"agregar 10 de Café x kilo y 5 de Meat by Weight"`

**Resultado:** Extrae ambos productos, pero usa la primera cantidad encontrada (10). El usuario puede ajustar en el modal de confirmación.

## Traducciones

El sistema soporta mensajes en **inglés y español**:

- Español: "agregar", "quitar", "establecer", "capturar venta"
- English: "add", "remove", "set", "capture sale"

## Archivos Relacionados

- `src/services/parameterExtractionService.ts` - Servicio de extracción de parámetros
- `src/services/intentDefinitions.ts` - Definiciones de intents
- `src/services/aiService.ts` - Servicio de AI que integra la extracción
- `app/bizne-ai.tsx` - Pantalla de chat que maneja la ejecución
- `lib/components/IntentConfirmationModal.tsx` - Modal de confirmación

## Pruebas

Se incluyen scripts de prueba en `scripts/`:

- `test-intent-extraction.js` - Prueba la extracción de parámetros
- `test-intent-flow.js` - Prueba el flujo completo de intents

Ejecutar pruebas:
```bash
node scripts/test-intent-flow.js
```

