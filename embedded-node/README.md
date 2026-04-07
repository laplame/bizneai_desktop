# Node embebido (opcional)

Para que el instalador **no dependa** de que el usuario tenga Node.js en el PATH, puedes colocar aquí el binario oficial de **Node.js** (misma arquitectura que el instalador: p. ej. **win-x64** para Windows 64 bits).

1. Descarga el **archivo ZIP** de Node LTS desde [https://nodejs.org](https://nodejs.org) (no el instalador MSI).
2. Extrae el ZIP y copia solo el ejecutable:
   - **Windows:** `node.exe` → ponlo en esta carpeta como `embedded-node/node.exe`
   - **macOS / Linux:** el binario `node` → `embedded-node/node` (y `chmod +x` si hace falta)

La versión de Node debería ser **la misma familia mayor** que usáis en desarrollo y en CI al ejecutar `npm install` (para que `better-sqlite3` sea compatible).

Los binarios no suelen subirse a Git (peso); en **GitHub Actions** puedes añadir un paso que descargue y extraiga Node aquí **antes** de `electron-builder`.

Si esta carpeta **no** contiene `node` / `node.exe`, la app sigue intentando el comando `node` del sistema (PATH), como hasta ahora.
