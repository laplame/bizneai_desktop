# Alta de tiendas – POST /api/shop

## Endpoint

```
POST https://www.bizneai.com/api/shop
```

## Validación estricta (solo 3 campos con reglas)

| Campo       | Regla |
|------------|--------|
| **storeName** | Obligatorio. Entre 1 y 100 caracteres (trim). |
| **whatsapp**  | Si se envía, debe ser un número válido: entre 10 y 15 dígitos (se ignoran espacios, guiones, paréntesis y `+`). |
| **gpsLocation** | Si se envía, debe ser formato válido (ver abajo). |

El resto de campos son **opcionales** y sin validación estricta (URLs, ciudad, dirección, etc. aceptan cualquier string o valor por defecto).

---

## JSON mínimo

Solo es obligatorio el nombre de la tienda:

```json
{
  "storeName": "Papelería Dalia Regina"
}
```

### Ejemplo con whatsapp y gps (validación estricta si se envían)

```json
{
  "storeName": "Papelería Dalia Regina",
  "whatsapp": "+52 55 1234 5678",
  "gpsLocation": { "latitude": 19.4326, "longitude": -99.1332 }
}
```

### Formato de `gpsLocation`

- **Opción 1 (legacy):** `{ "latitude": number, "longitude": number }`  
  - latitude: -90 a 90  
  - longitude: -180 a 180  

- **Opción 2 (GeoJSON):** `{ "type": "Point", "coordinates": [ longitude, latitude ] }`

Si envías `gpsLocation` y el formato es inválido, la API responde **400** con un mensaje descriptivo.

---

## Campos opcionales con valor por defecto

Si no se envían, el servidor usa estos valores:

| Campo           | Default        |
|----------------|----------------|
| storeLocation  | `""`           |
| streetAddress  | `""`           |
| city           | `""`           |
| state          | `""`           |
| zip            | `""`           |
| storeType      | `"GroceryStore"` |
| clientId       | generado (`client-{timestamp}-{random}`) |
| status         | `"active"`     |
| language       | `"es"`        |

---

## Ejemplo mínimo (curl)

```bash
curl -X POST https://www.bizneai.com/api/shop \
  -H "Content-Type: application/json" \
  -d '{"storeName": "Papelería Dalia Regina"}'
```

Con whatsapp y dirección (opcional):

```bash
curl -X POST https://www.bizneai.com/api/shop \
  -H "Content-Type: application/json" \
  -d '{
    "storeName": "Papelería Dalia Regina",
    "whatsapp": "5215512345678",
    "streetAddress": "Regina 104, Colonia Centro Hist",
    "city": "Ciudad de México",
    "state": "CDMX",
    "zip": "06000",
    "storeType": "StationeryStore"
  }'
```

---

## Respuestas de error

- **400** – Validación estricta:
  - `storeName` vacío o más de 100 caracteres.
  - `whatsapp` con menos de 10 o más de 15 dígitos.
  - `gpsLocation` con formato inválido.
- **400** – Errores de validación de Mongoose (incluye `details` por campo si aplica).
- **500** – Error interno (ej. base de datos).

---

## Implicación para la app

- La app envía `whatsapp` (no `phone`) a la API.
- La app puede mantener validación más estricta (nombre + WhatsApp + GPS) como regla de negocio.
- El servicio mapea `phone` → `whatsapp` al enviar y `whatsapp` → `phone` al recibir.
