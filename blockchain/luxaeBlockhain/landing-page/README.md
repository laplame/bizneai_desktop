# Luxae Landing Page

Landing page oficial de Luxae Blockchain con sistema de descargas integrado.

## 🚀 Características

- **Diseño Moderno**: Interfaz responsive con Tailwind CSS
- **Descargas Multiplataforma**: Paquetes para Linux, Windows y macOS
- **Integración Git**: Comandos para clonar el repositorio
- **API de Descargas**: Endpoints para obtener información de descargas
- **Health Check**: Monitoreo del estado del servidor

## 📦 Archivos de Descarga Disponibles

### Paquetes Completos
- `luxae-blockchain-v2.0.0.zip` - Paquete completo para todas las plataformas
- `luxae-blockchain-linux-v2.0.0.tar.gz` - Paquete específico para Linux
- `luxae-blockchain-windows-v2.0.0.zip` - Paquete específico para Windows
- `luxae-blockchain-macos-v2.0.0.tar.gz` - Paquete específico para macOS

### Instalación por Plataforma

#### Linux
```bash
# Descargar e instalar
wget http://localhost:8080/download/luxae-blockchain-linux-v2.0.0.tar.gz
tar -xzf luxae-blockchain-linux-v2.0.0.tar.gz
cd luxae-blockchain-linux-v2.0.0
chmod +x install-linux.sh
./install-linux.sh
npm start
```

#### Windows
```cmd
# Descargar e instalar
curl -O http://localhost:8080/download/luxae-blockchain-windows-v2.0.0.zip
# Extraer el ZIP y ejecutar install-windows.bat
npm start
```

#### macOS
```bash
# Descargar e instalar
curl -O http://localhost:8080/download/luxae-blockchain-macos-v2.0.0.tar.gz
tar -xzf luxae-blockchain-macos-v2.0.0.tar.gz
cd luxae-blockchain-macos-v2.0.0
chmod +x install-macos.sh
./install-macos.sh
npm start
```

## 🛠️ Instalación y Uso

### Requisitos Previos
- Node.js 18+
- npm

### Instalación Rápida

1. **Clonar el repositorio**:
```bash
git clone https://github.com/tu-usuario/luxae.git
cd luxae
```

2. **Iniciar la landing page**:
```bash
./start-landing-page-with-downloads.sh
```

3. **Acceder a la página**:
   - Landing Page: http://localhost:8080
   - API de Descargas: http://localhost:8080/api/downloads
   - Health Check: http://localhost:8080/health

### Instalación Manual

1. **Instalar dependencias**:
```bash
cd landing-page
npm install
```

2. **Crear paquetes de descarga** (si no existen):
```bash
cd ..
./create-download-packages.sh
```

3. **Iniciar servidor**:
```bash
cd landing-page
npm start
```

## 📡 API Endpoints

### Obtener Información de Descargas
```bash
GET /api/downloads
```

Respuesta:
```json
{
  "version": "2.0.0",
  "release_date": "2025-01-27T14:56:00Z",
  "packages": {
    "full": {
      "name": "luxae-blockchain-v2.0.0.zip",
      "size": "301K",
      "description": "Paquete completo para todas las plataformas"
    },
    "linux": {
      "name": "luxae-blockchain-linux-v2.0.0.tar.gz",
      "size": "262K",
      "description": "Paquete específico para Linux"
    }
  }
}
```

### Listar Archivos Disponibles
```bash
GET /api/downloads/list
```

Respuesta:
```json
{
  "files": [
    {
      "name": "luxae-blockchain-v2.0.0.zip",
      "size": 301765,
      "sizeFormatted": "294.7 KB",
      "url": "/download/luxae-blockchain-v2.0.0.zip",
      "lastModified": "2025-01-27T14:56:00.000Z"
    }
  ]
}
```

### Descargar Archivo
```bash
GET /download/{filename}
```

## 🔧 Scripts Disponibles

### Crear Paquetes de Descarga
```bash
./create-download-packages.sh
```

Este script crea:
- Paquete completo (ZIP)
- Paquete específico para Linux (tar.gz)
- Paquete específico para Windows (ZIP)
- Paquete específico para macOS (tar.gz)
- Scripts de instalación para cada plataforma

### Iniciar Landing Page con Descargas
```bash
./start-landing-page-with-downloads.sh
```

Este script:
- Verifica dependencias
- Crea paquetes de descarga si no existen
- Instala dependencias de la landing page
- Inicia el servidor

## 📁 Estructura de Archivos

```
landing-page/
├── index.html              # Página principal
├── server.js               # Servidor Express
├── package.json            # Dependencias
├── download/               # Archivos de descarga
│   ├── luxae-blockchain-v2.0.0.zip
│   ├── luxae-blockchain-linux-v2.0.0.tar.gz
│   ├── luxae-blockchain-windows-v2.0.0.zip
│   ├── luxae-blockchain-macos-v2.0.0.tar.gz
│   └── download-info.json
└── README.md              # Este archivo
```

## 🌐 URLs Importantes

- **Landing Page**: http://localhost:8080
- **Descargas**: http://localhost:8080/download/
- **API de Descargas**: http://localhost:8080/api/downloads
- **Lista de Archivos**: http://localhost:8080/api/downloads/list
- **Health Check**: http://localhost:8080/health

## 🔍 Monitoreo

### Health Check
```bash
curl http://localhost:8080/health
```

Respuesta:
```json
{
  "status": "healthy",
  "service": "Luxae Landing Page",
  "timestamp": "2025-01-27T14:56:00.000Z",
  "downloads": {
    "available": true,
    "count": 4
  }
}
```

## 🚀 Despliegue

### Variables de Entorno
- `PORT`: Puerto del servidor (default: 8080)

### Ejemplo de Despliegue
```bash
PORT=3000 npm start
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

- **GitHub Issues**: [Reportar problemas](https://github.com/tu-usuario/luxae/issues)
- **Documentación**: [Wiki del proyecto](https://github.com/tu-usuario/luxae/wiki)
- **Discord**: [Comunidad](https://discord.gg/luxae)

---

**Luxae Blockchain** - El futuro de las finanzas descentralizadas 🚀 