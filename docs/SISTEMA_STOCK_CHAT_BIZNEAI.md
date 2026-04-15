# Sistema de Actualización de Stock en Chat BizneAI

## Resumen
Sistema inteligente de sincronización bidireccional de stock que está disponible en el Chat BizneAI mediante comandos de voz o texto. El sistema compara timestamps para decidir automáticamente si debe subir información al servidor o traerla del servidor.

## Función Principal

### `smartSyncProductStock()`

**Ubicación**: `src/services/mcpInventoryService.ts`

Función que sincroniza el stock de un producto de forma bidireccional, comparando timestamps para decidir la acción más apropiada.

#### Parámetros

```typescript
smartSyncProductStock(
  productId: string | number,
  quantity?: number,
  operation: 'add' | 'subtract' | 'set' | 'sync' = 'sync',
  options: SmartStockSyncOptions = {}
)
```

#### Operaciones

1. **'sync'** (default): Sincronización inteligente
   - Compara timestamps entre local y servidor
   - Si servidor es más reciente → trae del servidor
   - Si local es más reciente → sube al servidor
   - Si son iguales → no hace cambios

2. **'set'**: Establece stock a un valor específico
   - Actualiza local y servidor

3. **'add'**: Agrega cantidad al stock
   - Actualiza local y servidor

4. **'subtract'**: Resta cantidad del stock
   - Actualiza local y servidor

## Integración en Chat BizneAI

### Helper Function

**Ubicación**: `app/bizne-ai.tsx`

Función helper `smartSyncProductStockHelper()` que envuelve la función principal y proporciona mensajes amigables al usuario.

### Funciones que usan Smart Sync

1. **executeAddInventoryStock()**: Agrega stock usando `'add'`
2. **executeRemoveInventoryStock()**: Resta stock usando `'subtract'`
3. **executeSetInventoryStock()**: Establece stock usando `'set'`
4. **executeSyncInventoryStock()**: Sincroniza stock usando `'sync'`

## Disponibilidad en el AI

La función está documentada en el system prompt del AI (`src/services/aiService.ts`), permitiendo que el asistente:

- Reconozca comandos de voz/texto para actualizar stock
- Use la función automáticamente cuando sea necesario
- Informe al usuario sobre las acciones realizadas

### Comandos Reconocidos

El AI puede reconocer comandos como:

- "Actualiza el stock de [producto] a [cantidad] unidades"
- "Agrega [cantidad] unidades de [producto]"
- "Resta [cantidad] unidades de [producto]"
- "Sincroniza el stock de [producto]"
- "¿Cuánto stock hay de [producto]?"

## Flujo de Sincronización Inteligente

### 1. Comparación de Timestamps

```
┌─────────────────────────────────────┐
│  Obtener timestamps                 │
│  - lastLocalUpdate                  │
│  - lastServerUpdate                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Comparar timestamps                │
│  - localTime > serverTime?          │
│  - serverTime > localTime?          │
│  - Son iguales?                     │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌─────────────┐  ┌─────────────┐
│ Local más   │  │ Servidor más│
│ reciente    │  │ reciente    │
│             │  │             │
│ → Subir al  │  │ → Traer del │
│   servidor  │  │   servidor  │
└─────────────┘  └─────────────┘
```

### 2. Acciones Automáticas

- **Si servidor es más reciente**: Actualiza local desde servidor
- **Si local es más reciente**: Actualiza servidor desde local
- **Si son iguales**: No hace cambios
- **Si no hay timestamps**: Sincroniza ambos lados

## Ejemplo de Uso en Chat

### Usuario dice: "Agrega 10 unidades de Tijera maped"

1. **AI detecta el comando** de agregar stock
2. **Busca el producto** "Tijera maped"
3. **Llama a `smartSyncProductStockHelper()`** con:
   - productId: ID del producto
   - quantity: 10
   - operation: 'add'
4. **La función**:
   - Obtiene stock actual local y del servidor
   - Compara timestamps
   - Decide si traer del servidor primero (si servidor es más reciente)
   - Agrega 10 unidades
   - Actualiza tanto local como servidor
5. **AI responde**: "✅ Stock actualizado: Tijera maped ahora tiene 20 unidades (antes: 10)"

## Respuestas del Sistema

### Acción: 'fetched'
```
✅ Stock actualizado desde el servidor: [producto] ahora tiene [cantidad] unidades (antes: [anterior])
```

### Acción: 'updated'
```
✅ Stock actualizado en el servidor: [producto] ahora tiene [cantidad] unidades (antes: [anterior])
```

### Acción: 'synced'
```
✅ Stock sincronizado: [producto] tiene [cantidad] unidades (local: [local], servidor: [servidor])
```

### Acción: 'no_change'
```
ℹ️ No se requirieron cambios: [producto] tiene [cantidad] unidades
```

## Ventajas del Sistema

1. **Inteligente**: Decide automáticamente si subir o traer información
2. **Bidireccional**: Mantiene sincronización entre local y servidor
3. **Basado en timestamps**: Usa la última actualización para decidir
4. **Disponible por voz**: Funciona con comandos de voz
5. **Contexto en AI**: El AI sabe cómo usar la función
6. **Mensajes claros**: Informa al usuario qué acción se realizó

## Fallback

Si la sincronización inteligente falla, el sistema usa métodos tradicionales como fallback para asegurar que la operación se complete.

## Logs

El sistema genera logs detallados:
- `[MCPInventory] Starting smart stock sync`
- `[BizneAI Chat] ✅ [mensaje de éxito]`
- `[BizneAI Chat] ❌ Error: [mensaje de error]`

## Próximos Pasos

1. ✅ Función creada y exportada
2. ✅ Integrada en Chat BizneAI
3. ✅ Documentada en system prompt del AI
4. ✅ Helper function creada
5. ✅ Funciones de inventario actualizadas para usar smart sync

El sistema está listo para usar en el Chat BizneAI mediante comandos de voz o texto.

