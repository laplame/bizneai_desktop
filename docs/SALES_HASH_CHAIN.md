# Cadena de Hash de Ventas – Validación, Bloques de Consolidación y Recompensa LUXAE

Este documento describe cómo funciona la sección de **hash de la cadena de ventas** en la pantalla de Ventas: validación de la cadena, creación de bloques de consolidación y la recompensa de **50 LUX** (LUXAE).

---

## 1. Resumen del sistema

El sistema de **Merkle Tree Sales History** proporciona:

- **Historial inmutable** de todas las operaciones de venta (crear, editar, eliminar)
- **Validación criptográfica** mediante hashes SHA-256 y árboles Merkle
- **Bloques diarios** que consolidan las transacciones del día
- **Recompensa de 50 LUX** al generar un bloque con transacciones válidas

---

## 2. Flujo de la cadena de ventas

### 2.1 Registro de transacciones

Cada operación sobre una venta genera una **transacción** con hash único:

| Operación | Servicio | Método |
|-----------|----------|--------|
| Crear venta | `salesHistoryService.createSale()` | `merkleTreeService.recordSaleCreation()` |
| Editar venta | `salesHistoryService.updateSale()` | `merkleTreeService.recordSaleUpdate()` |
| Eliminar venta | `salesHistoryService.deleteSale()` | `merkleTreeService.recordSaleDeletion()` |

**Flujo al crear una venta:**

```
1. Usuario procesa pago en el carrito
2. salesHistoryService.createSale(sale) se llama
3. La venta se guarda en salesDatabase
4. merkleTreeService.recordSaleCreation(sale) crea la transacción
5. Se genera hash SHA-256 de los datos de la transacción
6. La transacción se añade a la lista de transacciones pendientes
7. Se guarda en AsyncStorage (@BizneAI_merkle_tree)
```

### 2.2 Estructura de una transacción

```typescript
interface SalesTransaction {
  id: string;           // TXN-{timestamp}-{random}
  type: 'create' | 'update' | 'delete';
  saleId: string;
  saleData?: Sale;      // Datos de la venta (para create/update)
  previousData?: Sale;  // Datos anteriores (para update/delete)
  timestamp: string;    // ISO 8601
  hash: string;        // SHA-256 del contenido
  merkleProof?: string[];  // Prueba Merkle (se genera al crear el bloque)
}
```

### 2.3 Generación del hash

- **Algoritmo:** SHA-256 (Expo Crypto)
- **Datos hasheados:** `id`, `type`, `saleId`, `timestamp`, `saleData` (sanitizado), `previousData` (sanitizado)
- **Sanitización:** Se incluyen solo campos relevantes (items, totales, paymentType, etc.) para consistencia

---

## 3. Bloques de consolidación

### 3.1 ¿Qué es un bloque?

Un **bloque diario** agrupa todas las transacciones de un día y genera:

- **Raíz Merkle:** hash que resume todas las transacciones del día
- **Hash del bloque:** hash del bloque completo (incluye merkleRoot, previousBlockHash, unixTime)
- **Cadena enlazada:** cada bloque referencia el hash del bloque anterior

### 3.2 Estructura de un bloque

```typescript
interface DailyBlock {
  id: string;              // BLOCK-{YYYY-MM-DD}-{timestamp}
  date: string;            // YYYY-MM-DD
  merkleRoot: string;      // Raíz del árbol Merkle
  transactions: SalesTransaction[];
  previousBlockHash?: string;  // Hash del bloque anterior
  blockHash: string;       // Hash de todo el bloque
  createdAt: string;
  transactionCount: number;
  unixTime?: number;
}
```

### 3.3 Construcción del árbol Merkle

1. Se toman las transacciones del día
2. Cada transacción es una hoja (su hash)
3. Se combinan pares: `hash(left + right)` hasta obtener un solo nodo raíz
4. Si hay número impar de nodos, el último se duplica
5. La raíz es el **merkleRoot** del bloque

### 3.4 Prueba Merkle (Merkle Proof)

Para cada transacción se genera una **prueba Merkle**: la secuencia de hashes hermanos necesaria para reconstruir la raíz desde el hash de la transacción. Esto permite verificar que una transacción pertenece al bloque sin tener que reconstruir todo el árbol.

---

## 4. Validación de la cadena

### 4.1 Verificación de una transacción

```typescript
// Verificar que una transacción pertenece a su bloque
const isValid = await merkleTreeService.verifyTransaction(transactionId);
```

- Se busca la transacción y su bloque
- Se reconstruye la raíz usando el hash de la transacción + merkleProof
- Si coincide con `block.merkleRoot` → válida

### 4.2 Verificación de integridad de la cadena

```typescript
const integrity = await merkleTreeService.verifyChainIntegrity();
// integrity.isValid, integrity.errors
```

Se comprueba:

1. **Raíz Merkle de cada bloque:** reconstruir el árbol y verificar que la raíz coincide
2. **Pruebas Merkle:** cada transacción verifica contra la raíz de su bloque
3. **Cadena de bloques:** `block[i].previousBlockHash === block[i-1].blockHash`

### 4.3 Servicio de integridad

`salesHistoryService.verifyIntegrity()` devuelve un reporte con:

- `isValid`
- `totalTransactions`, `validTransactions`, `invalidTransactions`
- `errors`
- `merkleRootStatus`, `chainIntegrity`

---

## 5. Generación de bloques en la UI

### 5.1 Ubicación en la app

- **Pantalla:** `app/sales.tsx` – pestaña **Historial**
- **Banner de reconciliación:** se muestra cuando hay transacciones del día sin bloquear
- **Botón "Generar Bloque":** en el encabezado del historial y en el modal de reconciliación

### 5.2 Flujo de generación

1. Usuario pulsa "Generar Bloque" o "Generar bloque del día"
2. **Verificación humana:** modal para confirmar que es una persona (anti-abuso)
3. Se comprueba que no se haya generado un bloque en la última hora (cooldown)
4. Se comprueba que existan transacciones del día
5. `salesHistoryService.generateDailyBlock(today)` → `merkleTreeService.generateDailyBlock()`
6. Se guarda la hora de generación en AsyncStorage
7. Se muestra el modal de recompensa **50 LUX** (si hay transacciones)
8. Se actualiza el historial

### 5.3 Restricciones

- **Cooldown:** 1 hora entre generaciones (clave `@BizneAI_lastBlockGeneration`)
- **Transacciones mínimas:** debe haber al menos una transacción del día
- **Auto-generación de ayer:** si hay transacciones de ayer sin bloque, se puede generar automáticamente al abrir la pantalla

---

## 6. Recompensa de 50 LUX (LUXAE)

### 6.1 Cuándo se muestra

El modal de recompensa aparece **solo si**:

1. Se generó un bloque correctamente
2. El bloque tiene `transactionCount > 0`

### 6.2 Contenido del modal

- **Título:** "Congratulations!"
- **Cantidad:** "50 LUX"
- **Mensaje:** "You've claimed 50 LUX! Validate your KYC to use cryptoassets on the Smart ID blockchain."
- **Botones:** "Validate KYC" y "Later"
- **Auto-cierre:** a los 5 segundos

### 6.3 Ubicación en el código

- Estado: `showLuxRewardModal`
- Se activa en `executeBlockGeneration()` y en el timer de auto-generación
- Estilos: `luxRewardModalContent`, `luxRewardAmount`, etc.

---

## 7. Almacenamiento

| Clave AsyncStorage | Contenido |
|--------------------|-----------|
| `@BizneAI_merkle_tree` | Lista de transacciones |
| `@BizneAI_daily_blocks` | Lista de bloques diarios |
| `@BizneAI_sales_history` | Historial de ventas (entradas con hash y merkleProof) |
| `@BizneAI_lastBlockGeneration` | Fecha/hora de la última generación de bloque |

---

## 8. Archivos relevantes

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/services/merkleTreeService.ts` | Árbol Merkle, hashes, bloques, verificación |
| `src/services/salesHistoryService.ts` | Orquestación, createSale/updateSale/deleteSale, generateDailyBlock |
| `app/sales.tsx` | UI de ventas, historial, modal de reconciliación, modal 50 LUX |
| `docs/SALES_SYSTEM.md` | Documentación general del sistema de ventas |

---

## 9. Diagrama de flujo simplificado

```
[Venta creada] → recordSaleCreation() → Transacción con hash
[Venta editada] → recordSaleUpdate() → Transacción con hash
[Venta eliminada] → recordSaleDeletion() → Transacción con hash
                          ↓
              Transacciones en memoria + AsyncStorage
                          ↓
[Usuario genera bloque] → generateDailyBlock(date)
                          ↓
              Árbol Merkle de transacciones del día
                          ↓
              Merkle proofs para cada transacción
                          ↓
              Bloque creado (merkleRoot, blockHash, previousBlockHash)
                          ↓
              Bloque guardado + Modal 50 LUX
```

---

## 10. Resumen

- **Cadena de hash:** cada operación de venta genera una transacción con hash SHA-256.
- **Validación:** Merkle proofs y verificación de cadena de bloques.
- **Bloques de consolidación:** se generan manualmente (o por timer) y agrupan las transacciones del día.
- **Recompensa 50 LUX:** se muestra al generar un bloque con transacciones; incentiva la consolidación diaria y la validación KYC en Smart ID.
