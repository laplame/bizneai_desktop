# Luxae Network

Luxae es una blockchain Proof of Stake (PoS) con un token nativo ERC-777 compatible.

## Bloque Génesis

> "Cuando aceptas dinero en pago por tu esfuerzo, lo haces sólo con el convencimiento de que lo cambiarás por el producto del esfuerzo de otros. No son los mendigos ni los saqueadores los que dan su valor al dinero. Ni un océano de lágrimas ni todas las armas del mundo pueden transformar esos papeles de tu cartera en el pan que necesitarás para sobrevivir mañana. Esos papeles, que deberían haber sido oro, son una prenda de honor – tu derecho a la energía de los hombres que producen. Tu cartera es tu manifestación de esperanza de que en algún lugar del mundo a tu alrededor hay hombres que no transgredirán ese principio moral que es el origen del dinero."

## Token Luxae (LXA)

- **Nombre**: Luxae
- **Símbolo**: LXA
- **Decimales**: 18
- **Suministro Total**: 1,000,000,000 LXA
- **Estándar**: ERC-777 Compatible

### Características del Token
- Totalmente compatible con ERC-777
- Integrado con el mecanismo PoS
- Transferible y divisible
- Soporte para operadores y hooks
- Sistema de staking nativo

### Especificaciones Técnicas
- Tiempo de bloque: 15 segundos
- Recompensa por bloque: 0.5 LXA
- Stake mínimo: 1,000 LXA
- Período de bloqueo de stake: 7 días

## Configuración de Red P2P

Para conectar múltiples nodos:

1. En el primer nodo:
```bash
pnpm node-info
```
Esto mostrará la información necesaria para la conexión, incluyendo el string de conexión.

2. En los nodos adicionales:
- Editar `src/p2p/config.js`
- Actualizar `bootstrapNodes` con el string de conexión del primer nodo
- Iniciar el nodo: `pnpm start`

3. Verificar conexiones:
```bash
pnpm monitor
```

## Requisitos
- Node.js ≥ 16.0.0
- pnpm
- 2GB RAM mínimo
- 50GB espacio en disco
- Conexión a internet estable

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/luxae.git
cd luxae

# Instalar dependencias
pnpm install

# Generar claves del validador
pnpm generate-keys

# Iniciar el nodo
pnpm start
```

## Scripts Disponibles

```bash
# Iniciar nodo validador
pnpm start

# Iniciar API
pnpm start:api

# Generar claves
pnpm generate-keys

# Monitor de red
pnpm monitor

# Información del nodo
pnpm node-info
```

## Arquitectura
- Red P2P con libp2p
- Consenso PoS (Proof of Stake)
- API REST para interacción
- Smart Contracts compatibles con EVM
- Sistema de monitorización en tiempo real

## API y Endpoints
- `/api/blockchain` - Información de la blockchain
- `/api/validators` - Lista de validadores
- `/api/transactions` - Gestión de transacciones
- `/api/status` - Estado del nodo
- `/api/contracts` - Gestión de contratos

## Monitorización
El dashboard web proporciona:
- Estado de la red en tiempo real
- Lista de validadores activos
- Transacciones pendientes
- Estadísticas de la blockchain
- Información del token

## Mantenimiento
- Backups regulares recomendados
- Monitorización de recursos
- Actualización de nodos
- Gestión de logs

## Contribuir
Las contribuciones son bienvenidas. Por favor:
1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Crea un Pull Request

## Licencia
MIT

## Inicio Rápido

Para iniciar todo el sistema Luxae (blockchain y dashboard) en un solo paso:

```bash
# Dar permisos de ejecución al script (solo la primera vez)
chmod +x start-all.sh

# Iniciar el sistema
./start-all.sh
```

El script realizará las siguientes acciones:
- Verifica y libera los puertos necesarios (3000 y 3001)
- Instala las dependencias si es necesario
- Inicia el nodo blockchain en segundo plano (puerto 3000)
- Construye y sirve el dashboard (puerto 3001)

## Puertos Utilizados
- 3000: API Blockchain y P2P
- 3001: Dashboard Web
- 30303: Comunicación P2P entre nodos

## Deployment with Nginx

1. Install dependencies:
```bash
sudo apt update
sudo apt install -y nginx
```

2. Run the setup script:
```bash
./scripts/setup-nginx.sh
```

3. Your services will be available at:
- Dashboard: http://161.22.47.84/
- API: http://161.22.47.84/api/
- P2P: ws://161.22.47.84/p2p/

4. SSL Setup (recommended):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

5. Monitor logs:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

