# BizneAI Desktop — Auditoría funcional (datos, procesos y flujos)

**Fecha:** 2026-07-10
**Método:** Revisión estática integral del código + verificación de compilación/tests. No es
un click-through en runtime de cada botón; donde eso hace falta lo marco como "verificar en runtime".
**Estado base:** `tsc` ✅ · `vitest` 43/43 ✅ · `build` ✅ · app corriendo sin errores.

---

## Resumen ejecutivo

El núcleo transaccional es **sólido**: carrito, cálculo de impuestos, descuento de stock en la
venta, ledger Merkle y la cola de reenvío offline están bien construidos y (en el caso de
impuestos/carrito/merkle) cubiertos por tests. El hallazgo importante es de **integridad de datos**
en el reporte de ventas, que mezcla ventas **ficticias** con las reales. El resto son detalles.

| # | Severidad | Área | Hallazgo |
|---|---|---|---|
| 1 | 🔴 Alta | Reportes | Ventas de muestra (aleatorias) se mezclan con ventas reales |
| 2 | 🟡 Media | Ventas | IDs de ticket por `Math.random` → colisiones (tickets duplicados) |
| 3 | 🟢 Baja | Inventario | "Quitar" stock puede dejar stock negativo |
| 4 | 🟢 Baja | Ticket | Total de VirtualTicket pasa `* 1.16` fijo (enmascarado) |
| 5 | 🟢 Baja | Cobro | `discount` fijo en 0 (sin descuentos en el flujo de venta) |
| 6 | ℹ️ Info | Kiosko | En el panel de pedido, ± en productos por peso trata la cantidad como unidad |

---

## Hallazgos detallados

### 1. 🔴 Ventas ficticias en el reporte de ventas
[SalesReports.tsx:84](../src/components/SalesReports.tsx) define `generateSampleSales()` — genera
ventas **aleatorias** (`Math.random`, `source: 'sample'`). Se muestran, **fusionadas con las ventas
reales del ledger Merkle**, en tres casos:
- El servidor no devuelve transacciones → [SalesReports.tsx:186](../src/components/SalesReports.tsx)
- Error al cargar del servidor → [SalesReports.tsx:195](../src/components/SalesReports.tsx)
- Sin `shopId` configurado → [SalesReports.tsx:209](../src/components/SalesReports.tsx)

**Impacto:** una tienda real ve **ingresos inventados** mezclados con ventas verdaderas (el toast
dice "Mostrando muestra y ventas locales"). Riesgo para contabilidad y decisiones.
**Recomendación:** mostrar solo ventas reales (Merkle local + servidor); estado vacío si no hay.
Limitar `generateSampleSales()` a un modo demo explícito (`import.meta.env.DEV` o flag).

### 2. 🟡 Colisión de IDs de ticket
[App.tsx:1039](../src/App.tsx): `TKT-${Math.floor(Math.random()*100000)+10000}` — espacio de ~100k.
Por la paradoja del cumpleaños, la probabilidad de colisión pasa del 50% alrededor de las ~370
ventas → **números de ticket duplicados**. También el fallback en
[App.tsx:2531](../src/App.tsx).
**Recomendación:** ID secuencial persistido (contador local) o basado en tiempo + sufijo aleatorio
(p. ej. `TKT-${yyyymmdd}-${seq}`), garantizando unicidad.

### 3. 🟢 Stock negativo al "quitar" manualmente
[InventoryManagement.tsx:295](../src/components/InventoryManagement.tsx):
`const newStock = selectedProduct.stock - stockQuantity;` sin `Math.max(0, …)`. Si se quita más de
lo disponible, el stock queda negativo. (El descuento por venta sí lo protege con `Math.max(0, …)`.)
**Recomendación:** `Math.max(0, stock - qty)` y/o avisar si excede.

### 4. 🟢 Total de VirtualTicket con IVA fijo
[App.tsx:2530](../src/App.tsx) pasa `total = cart.reduce(...) * 1.16`. Está **enmascarado** porque
`VirtualTicket` recalcula internamente con `computeCartTaxBreakdownFromCartItems` + `loadTaxSettings`
(respeta tasa configurable y flags por producto). Aun así el prop es engañoso.
**Recomendación:** pasar `cartTax.total` (ya memoizado) en lugar del `* 1.16` hardcodeado.

### 5. 🟢 Descuentos no soportados en el cobro
[App.tsx:1051](../src/App.tsx): `const discount = 0;` fijo. El flujo de venta no aplica descuentos.
Es una **brecha de feature**, no un bug. Documentar o implementar si se requiere.

### 6. ℹ️ Kiosko: ± de cantidad en productos por peso
En [KioskView.tsx](../src/components/KioskView.tsx), el panel "Ver mi pedido" usa `± cantidad`;
para productos por peso esto ajusta el peso en pasos de 1. Caso borde menor (el POS normal edita
peso aparte). A afinar si se venden productos por peso en autoservicio.

---

## Estado por ventana (revisión estática)

| Ventana | Estado | Notas |
|---|---|---|
| POS / Carrito | ✅ Sólido | Ops de carrito con 43 tests; descuento de stock correcto |
| Gestión de productos | ✅ Sólido | CRUD + variantes + componentes/BOM |
| Inventario | 🟡 | Ver #3 (stock negativo al quitar) |
| Clientes | ✅ Sólido | Registro + ledger de cuenta (crédito) consistente |
| **Reportes de ventas** | 🔴 | Ver #1 (datos ficticios) |
| Lista de espera | ✅ Sólido | Reserva de inventario → cobro → completado |
| Cocina | ✅ Sólido | Visibilidad por tipo de tienda |
| Impuestos | ✅ Sólido | Tasa configurable, inclusivo/exclusivo, exentos (con tests) |
| Configuración | ✅ Sólido | + activación de kiosko (nueva) |
| Kiosko autoservicio | ✅ Funcional | Nuevo; ver #6 |

**Fortalezas verificadas:** cálculo de impuestos (por línea, con flags por producto), descuento de
stock en venta (peso vs unidad, espejo a SQLite), integridad del ledger Merkle (bloques/cadena),
cola de ventas pendientes con reintento, persistencia offline (localStorage → SQLite), caché de
imágenes de producto en disco.

**Pendiente de prueba en runtime** (no verificable estáticamente): impresión térmica y cuadro de
sistema, cada método de pago en `CheckoutModal`, casos de sincronización MCP con red intermitente,
flujo completo de kiosko en pantalla táctil real.

---

## Ejecutable local de Windows (BD local)

**No se puede compilar en macOS.** [scripts/build-local-api-exe.mjs](../scripts/build-local-api-exe.mjs)
bloquea explícitamente cualquier plataforma que no sea `win32` porque `better-sqlite3` es nativo y el
`.exe` embebe Node 24 (ABI 137) → requiere el binario win32.

**Cómo se produce (ya está listo el pipeline):**
- **CI (recomendado):** [.github/workflows/build-windows.yml](../.github/workflows/build-windows.yml)
  corre en `windows-latest` con Node 24.14.1 y ejecuta `npm run build:local-api-exe`, subiendo
  `release/BizneAI-Local-API-Backend.exe` como artefacto `BizneAI-POS-Windows`.
  Disparar: push a `main`/`master`, o **Actions → Build Windows (PC) → Run workflow** (workflow_dispatch),
  o `gh workflow run build-windows.yml`.
- **En una máquina/VM Windows** con Node 24.14.1:
  `npm ci && npm run build:server && npm run pack:local-api && npm run build:local-api-exe`
  → `release/BizneAI-Local-API-Backend.exe`.

El bundle del servidor (`dist-backend/bizneai-server.cjs`, 184 KB) — la entrada del `.exe` — se
compiló y verificó en esta máquina (es cross-platform). **Nota:** CI compila desde el código
**commiteado**; los cambios recientes (kiosko, imágenes de stock, mejoras de SQLite) están sin
commitear, así que hay que commitear/push antes para que el `.exe` los incluya.
