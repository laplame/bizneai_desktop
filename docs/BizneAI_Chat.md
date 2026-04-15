# API: BizneAI Chat (CRUD)

Servicio para recuperar y gestionar los datos del **BizneAI Chat** de la app.

**Base path:** `/api/bizneai-chat`

---

## Modelo (tokens, timestamp, costo, chatId)

El modelo permite recuperar y calcular en el servidor el uso por chat: tokens, timestamp y costo.

- **Colección MongoDB:** `bizneai_chat`
- **Archivo:** `server/src/models/BizneAIChat.ts`

| Campo         | Tipo     | Requerido | Descripción                                      |
|---------------|----------|-----------|--------------------------------------------------|
| `chatId`      | string   | sí        | ID del chat/sesión en la app                     |
| `inputTokens` | number   | sí        | Tokens de entrada (prompt)                       |
| `outputTokens`| number   | sí        | Tokens de salida (respuesta)                    |
| `totalTokens` | number   | sí        | Total (input + output)                           |
| `timestamp`   | Date     | sí        | Momento de la interacción                        |
| `cost`        | number   | no        | Costo estimado en USD                           |
| `modelName`   | string   | no        | Modelo usado (ej. gemini-2.0-flash-lite)        |
| `aiProvider`  | string   | no        | Proveedor (groq, gemini, openai, claude)         |
| `userId`      | string   | no        | ID de usuario                                   |
| `deviceId`    | string   | no        | ID de dispositivo                               |
| `shopId`      | string   | no        | ID de tienda (para filtrar por shop)            |
| `metadata`    | object   | no        | Metadatos adicionales                           |
| `createdAt`   | Date     | auto      | Creación                                        |
| `updatedAt`   | Date     | auto      | Última actualización                            |

La app **BizneAI Chat** envía cada interacción con el asistente a `POST /api/bizneai-chat` con estos campos (extrae tokens de la respuesta del proveedor Gemini/Groq y calcula el costo en cliente).

---

## Enrutamiento de respuestas (Groq vs Gemini)

Las respuestas del chat se generan con **Groq** o **Gemini** según el tipo de mensaje:

| Caso | API usada | Condición |
|------|-----------|-----------|
| Mensaje con **imagen, audio o video** | **Gemini** | Siempre (multimodal). Requiere clave Gemini en Ajustes. |
| Mensaje **solo texto** (análisis de negocio) | **Groq** | Tienda registrada (no provisional) y clave Groq configurada (env/extra). |
| Mensaje **solo texto** sin Groq | **Gemini** | Fallback: se usa Gemini 2.5 Flash-Lite si hay clave Gemini. |

- **Groq:** `https://api.groq.com/openai/v1/chat/completions` — modelo por defecto `llama-3.3-70b-versatile` (o el configurado en el servicio de proveedores).
- **Gemini:** `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` — modelo por defecto `gemini-2.0-flash-lite` (imagen/audio/video) o `gemini-2.5-flash-lite` (texto en fallback).

En consola se registra cada envío con `[BizneAI] 📡 Sending to GROQ` o `[BizneAI] 📡 Sending to GEMINI` para verificar qué API se usó.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/bizneai-chat` | Listar registros (paginado) |
| GET | `/api/bizneai-chat/:id` | Obtener un registro por ID |
| POST | `/api/bizneai-chat` | Crear registro |
| PUT | `/api/bizneai-chat/:id` | Actualizar registro |
| DELETE | `/api/bizneai-chat/:id` | Eliminar registro |

---

### GET /api/bizneai-chat (listar)

**Query:**

- `page` (opcional): número de página (default 1).
- `limit` (opcional): registros por página (default 20, máx. 100).

**Respuesta:**

```json
{
  "success": true,
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

---

### GET /api/bizneai-chat/:id (obtener uno)

**Respuesta:** `{ "success": true, "data": { ... } }`  
**404** si no existe.

---

### POST /api/bizneai-chat (crear)

**Body:** objeto con la información a guardar. Se acepta:

- `{ "data": { ... } }` → se guarda en el campo `data`.
- O el body directo → se guarda como `data`.

**Respuesta:** `201` y `{ "success": true, "data": { ... } }`.

---

### PUT /api/bizneai-chat/:id (actualizar)

**Body:** igual que en POST (objeto o `{ "data": { ... } }`).

**Respuesta:** `{ "success": true, "data": { ... } }`.  
**404** si no existe.

---

### DELETE /api/bizneai-chat/:id (eliminar)

**Respuesta:** `{ "success": true, "message": "Registro eliminado" }`.  
**404** si no existe.

---

## Próximo paso

Cuando tengas el **modelo definitivo** (campos y tipos), se puede actualizar:

1. `server/src/models/BizneAIChat.ts` – interfaz y schema de Mongoose.
2. Si hace falta, las rutas en `server/src/routes/bizneaiChat.ts` para validación o mapeo.
