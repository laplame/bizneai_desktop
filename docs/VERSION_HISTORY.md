# Historial de versiones e implementación por commit

**Versión actual:** 1.24.0 (app.json)  
**Última actualización del historial:** Enero 2026

---

## v1.24.0 - Ticket compacto, impresora predeterminada, QR en ticket (Enero 31, 2026)

### Cambios principales
- **Impresora predeterminada** – Botón "Usar predeterminada" en Configuración > Tickets > Bluetooth; la impresión automática usa la impresora guardada
- **Ticket compacto** – Menor tamaño de fuente, sin líneas en blanco, etiquetas abreviadas; menor uso de papel
- **QR del ticket digital** – Siempre incluido con URL del ticket (shopId/ticket/saleId)
- **Nombre del negocio** – Alineado a la izquierda en el ticket

### Archivos modificados
- `src/services/ticketPrintService.ts` – Formato compacto, alineación, QR
- `src/services/ticketBluetoothService.ts` – Carga config guardada; set default printer
- `src/components/TicketConfiguration.tsx` – Botón "Usar predeterminada"
- `app.json`, `package.json`, `android/app/build.gradle` – version 1.24.0

Ver `features/VERSION_1.24.0_SUMMARY.md` y `VERSION_1.24.0_SUMMARY_ES.md`.

---

## Commits desde el último update (post 1.22.0 docs)

Comits realizados desde `88b496f` (docs: Update version history and documentation for v1.22.0):

| Commit | Fecha | Implementado |
|--------|-------|--------------|
| `b8c5c8d` | 2026-02-10 | **feat: ventas sync al abrir, protección impresión, BizneAI Chat API y alert si deshabilitado** — Sync de ventas al abrir app; protección de impresión; integración BizneAI Chat API; alerta cuando chat deshabilitado; TicketTabs mejorado; i18n |
| `a70d1b3` | 2026-02-04 | **Merge cafe-olas:** Groq/Gemini routing, OCR, model updates, reasoning_effort fix |
| `7bdab26` | 2026-02-04 | Se modificó la sección de razonamiento de Groq |
| `77e7451` | 2026-02-04 | **Se agregó pantalla reportes** — `app/reports/` con layout y secciones; reportsStorageService; integración con CollapsibleMenu |
| `e45762a` | 2026-02-01 | **feat(shipments):** Logos de paqueteras más grandes; 99M, AMPM, Paquet Express, Tres Guerras; traducciones de servicio |
| `e9b6f9e` | 2026-01-31 | Merge cafe-olas: API CP y localidades en envíos |
| `c425f2c` | 2026-01-31 | **feat(shipments):** API CP y localidades en cards de envíos — cpApiService; códigos postales y localidades en UI de envíos |
| `c01b383` | 2026-01-23 | **feat:** Bluetooth printing improvements, ticket system enhancements, traducciones |
| `0e52e51` | 2026-01-17 | Agregar verificación de envío de códigos de productos al API MCP |
| `4b4d036` | 2026-01-17 | Agregar verificación de envío de códigos de productos al API MCP |
| `f1cc40f` | 2026-01-14 | **feat:** Integrar react-native-thermal-printer y mejorar flujo de productos con variantes |
| `ac58845` | 2026-01-11 | Transformación a inventario para cambiar estado de producto |
| `4c3306f` | 2026-01-08 | chore: Update various services and build configurations |
| `6d806ca` | 2026-01-08 | **feat(kitchen):** Mostrar tiempo de completado en servidor en historial de órdenes |
| `a646c99` | 2026-01-08 | **Version 1.23.0:** Optimized restock performance, shipping improvements, guide request feature |
| `0420781` | 2026-01-06 | Actualización del README |

---

## Resumen por versión

### v1.24.0 (Enero 2026)

**Incluye ticket compacto, impresora predeterminada, QR en ticket.**

- Ticket compacto: menos papel, etiquetas abreviadas
- Botón "Usar predeterminada" para impresora Bluetooth
- QR del ticket digital siempre incluido
- Nombre del negocio alineado a la izquierda

---

### v1.23.0 (Enero 2026)

**Incluye commits desde `a646c99` hasta `b8c5c8d`.**

#### Funcionalidades principales
- **Variantes de peso y precios personalizados** (VERSION_1.23.0_WEIGHT_VARIANTS.md)
- **Pantalla de reportes** (`app/reports/`)
- **Groq/Gemini routing** — texto → Groq, imagen/audio/video → Gemini
- **OCR** para imágenes en BizneAI Chat
- **Sync de ventas al abrir** la app
- **BizneAI Chat API** — modelo BizneAIChat, rutas bizneaiChat
- **Envíos:** API CP (códigos postales), localidades, logos paqueteras (99M, AMPM, Paquet Express, Tres Guerras)
- **Impresión térmica** — react-native-thermal-printer
- **Kitchen:** tiempo de completado en historial
- **Protección de impresión** y mejoras en TicketTabs

#### Archivos/docs creados o modificados
- `docs/BIZNEAI_CHAT_ARCHIVOS.md`
- `docs/BIZNEAI_CHAT_IMAGENES_OCR.md`
- `docs/BizneAI_Chat.md`
- `app/reports/` (layout, index, [section])
- `server/src/models/BizneAIChat.ts`
- `server/src/routes/bizneaiChat.ts`
- `src/services/cpApiService.ts`
- `src/services/mcpSalesService.ts`
- `src/services/reportsStorageService.ts`
- `assets/images/` (logos paqueteras)

---

### v1.22.0 (Diciembre 2025)

**Último update documentado antes de este historial.**

- Mejoras en inventario y restock
- Build local APK con EAS
- Sincronización bidireccional de stock

Ver `features/VERSION_1.22.0_SUMMARY.md` y `VERSION_1.22.0_SUMMARY_ES.md`.

---

## Cambios recientes (pendientes de commit)

Implementados en sesión reciente (documentados aquí para trazabilidad):

### API y arquitectura
- **Base URL unificada** a `https://www.bizneai.com/api` en api.ts, crudEventListenerService, shopService
- **docs/API_BASE_URL.md** — Referencia única de base URL
- Docs actualizados: SHOP_ENDPOINTS, MCP_CRUD_VERIFICATION, REVISION_SUBIDA_IMAGENES_CHAT, TICKET_JSON_EXAMPLE, CONFIGURATION_ARCHITECTURE, FEATURES_CONFIGURATION_COMPLETE

### Instalación y actualización
- **Versión desde app.json** — Ya no se hardcodea en appInitializationService
- **Lógica instalación vs actualización:** Solo se borra BD en instalación nueva; en actualizaciones se preservan datos
- **docs/INSTALACION_NUEVA_BD.md** — Reglas y detección
- **docs/DATA_MIGRATION_SYSTEM.md** — Actualizado para usar app.json

### Logs y UX
- **variantGroups undefined** — Log reducido (una vez por sesión) en ecommerceUploadService

---

## Cómo actualizar este historial

1. Tras cada release, añadir bloque de versión con commits incluidos.
2. Para cada commit relevante, resumir en una línea qué se implementó.
3. Mantener `app.json` como fuente de la versión actual.
4. Referenciar docs en `docs/` y `features/` cuando existan.
