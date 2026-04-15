# Lógica del Botón "Abrir Dashboard" (Sección Códigos)

## Propósito
El dashboard web permite **seleccionar qué productos incluir** en un **PDF de etiquetas con códigos de barras en tamaño carta** (letter: 8.5" x 11").

## Flujo actual (`ProductCodesView.tsx`)

```
handleOpenDashboard()
    │
    ├─ filteredProducts.length === 0 → Alert "Sin productos"
    │
    ├─ checkBackupExists() 
    │      └─ Busca keys en AsyncStorage que contengan "_backup_"
    │      └─ (son backups de migración de datos, NO "backup online")
    │
    ├─ SI hasBackup:
    │   ├─ getDashboardUrl() → https://www.bizneai.com/shop/{shopId}/dashboard
    │   ├─ SI shopId válido (no provisional):
    │   │   └─ Linking.openURL(dashboardUrl)
    │   └─ SI NO shopId:
    │       └─ showContactDeveloperAlert()
    │
    └─ SI NO hasBackup:
        └─ showContactDeveloperAlert()
```

## Problemas identificados

### 1. `checkBackupExists` usa la métrica incorrecta
- **Qué hace:** Busca keys como `products_backup_v1.3.0` (backups de migración de DB)
- **Problema:** Esos backups se crean cuando la app migra datos. Un usuario nuevo o uno que nunca migró puede no tenerlos
- **Consecuencia:** Usuarios válidos con shop registrado podrían ver "Contactar desarrollador" innecesariamente

### 2. Requisito real
- El dashboard en bizneai.com necesita **shopId registrado** (no provisional) para cargar productos del servidor
- La condición correcta debería ser: **¿tiene shop real registrado?**

### 3. Mensajes de texto
- Actual: "catálogo de fotos con códigos de barras"
- Correcto: "seleccionar productos e imprimir PDF de etiquetas en tamaño carta"

## Corrección aplicada ✅

1. **Reemplazado `checkBackupExists`** por verificación de shop registrado:
   - Usa `getRealShopId()` (shop no provisional)
   - Si no hay shop real → `showRegisterShopAlert()` con mensaje: "Registra tu negocio para acceder al dashboard de etiquetas"

2. **Flujo simplificado:**
   - ¿Tiene shopId real? → Abrir `https://www.bizneai.com/shop/{shopId}/dashboard`
   - ¿No tiene? → Alert "Negocio no registrado" con instrucciones

3. **Textos i18n actualizados** (es/en):
   - `dashboardMessage`: "Selecciona los productos e imprime el PDF de etiquetas con códigos en tamaño carta"
   - `registerRequired` / `registerRequiredMessage`: para cuando no hay shop registrado
