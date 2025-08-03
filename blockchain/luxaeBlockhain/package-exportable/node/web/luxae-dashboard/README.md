# Luxae Dashboard

## Inicio Rápido

### Método 1: Inicio Completo del Sistema
Para iniciar todo el sistema (blockchain + dashboard) use el script principal:

```bash
# Desde la raíz del proyecto
./start-all.sh
```

### Método 2: Solo Dashboard
Si ya tiene el nodo blockchain corriendo y solo quiere iniciar el dashboard:

```bash
cd src/web/luxae-dashboard

# Instalar dependencias
pnpm install

# Iniciar en modo desarrollo
pnpm dev

# O construir y servir para producción
pnpm build
pnpm start
```

## Scripts Disponibles

- `pnpm dev`: Inicia el dashboard en modo desarrollo
- `pnpm build`: Construye la aplicación para producción
- `pnpm start`: Sirve la aplicación construida
- `pnpm kill-ports`: Libera el puerto 3001 si está en uso
- `pnpm clean`: Limpia la carpeta dist

## Configuración

El dashboard utiliza las siguientes variables de entorno:

```env
VITE_API_URL=http://localhost:3000  # URL de la API blockchain
PORT=3001                           # Puerto para servir el dashboard
```

## Estructura del Proyecto

```
luxae-dashboard/
├── src/
│   ├── components/     # Componentes React
│   ├── config/        # Configuración (axios, etc)
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Utilidades
│   └── App.jsx        # Componente principal
├── public/            # Archivos estáticos
├── server.js          # Servidor Express para producción
└── vite.config.js     # Configuración de Vite
```

## Desarrollo

1. El dashboard se comunica con el nodo blockchain a través de la API REST
2. Usa React Query para el manejo de estado y caché
3. Chakra UI para los componentes de interfaz
4. Vite como bundler y herramienta de desarrollo

## Producción

Para desplegar en producción:

1. Construir la aplicación:
```bash
pnpm build
```

2. Servir los archivos estáticos:
```bash
pnpm start
```

El servidor Express servirá los archivos estáticos y manejará el enrutamiento del lado del cliente.

## Puertos
- Dashboard: http://localhost:3001
- API Blockchain: http://localhost:3000

## Notas
- El dashboard corre en el puerto 3001
- La API de la blockchain corre en el puerto 3000
- Asegúrate de que ambos puertos estén disponibles 