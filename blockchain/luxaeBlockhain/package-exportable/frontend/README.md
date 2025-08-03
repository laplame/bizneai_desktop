# Luxae Blockchain Frontend

Un frontend moderno y reactivo para la blockchain Luxae, construido con React, Vite y Tailwind CSS.

## 🚀 Características

- **Dashboard en tiempo real** con estadísticas de la blockchain
- **Explorador de bloques** con información detallada
- **Monitorización de transacciones** y validadores
- **Interfaz moderna** con Tailwind CSS
- **Responsive design** para móviles y desktop
- **Actualizaciones automáticas** cada 30 segundos
- **Navegación intuitiva** con React Router

## 🛠️ Tecnologías

- **React 18** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de CSS
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **Heroicons** - Iconos
- **Chart.js** - Gráficos (preparado)

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Preview de producción
npm run preview
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Luxae Blockchain
VITE_APP_VERSION=1.0.0
```

### Conectar con la Blockchain

El frontend se conecta automáticamente a la API de la blockchain en `http://localhost:3000`. Asegúrate de que:

1. La blockchain esté ejecutándose
2. La API esté disponible en el puerto 3000
3. CORS esté configurado correctamente

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Navigation.jsx   # Navegación principal
│   └── Dashboard.jsx    # Dashboard principal
├── pages/              # Páginas de la aplicación
│   └── BlockchainPage.jsx
├── hooks/              # Custom hooks
│   └── useBlockchain.js
├── services/           # Servicios de API
│   └── api.js
├── utils/              # Utilidades
└── styles/             # Estilos adicionales
```

## 🎨 Componentes Principales

### Navigation
Navegación principal con menú responsive y navegación por rutas.

### Dashboard
Dashboard principal con:
- Estadísticas en tiempo real
- Últimos bloques
- Últimas transacciones
- Estado de la red

### BlockchainPage
Explorador detallado de la blockchain con tabla de bloques.

## 🔌 API Integration

El frontend se conecta a los siguientes endpoints:

- `GET /api/blockchain` - Información general
- `GET /api/blockchain/blocks` - Lista de bloques
- `GET /api/transactions` - Transacciones
- `GET /api/validators` - Validadores
- `GET /api/network/status` - Estado de la red
- `POST /api/transactions` - Crear transacciones

## 🎯 Próximas Funcionalidades

- [ ] Página de transacciones detallada
- [ ] Página de validadores
- [ ] Página de estado de red
- [ ] Gráficos y estadísticas avanzadas
- [ ] Creación de transacciones
- [ ] Wallet integration
- [ ] Dark mode
- [ ] Notificaciones en tiempo real

## 🚀 Deployment

### Desarrollo Local
```bash
npm run dev
```

### Producción
```bash
npm run build
npm run preview
```

### Con Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles.

---

**Luxae Blockchain Frontend** - Interfaz moderna para la blockchain del futuro.
