# 🚀 Luxae Blockchain - Nginx Setup Guide

Este repositorio contiene la configuración completa de Nginx para la aplicación Luxae Blockchain con medidas de seguridad avanzadas y proxy inverso.

## 📋 Archivos Incluidos

- `nginx-luxae.conf` - Configuración principal de Nginx
- `install-nginx-luxae.sh` - Script de instalación para servidores Linux
- `setup-local-dev.sh` - Script de configuración para desarrollo local (macOS)
- `NGINX-SETUP-README.md` - Este archivo de documentación

## 🛡️ Características de Seguridad Implementadas

### 🔒 Headers de Seguridad
- **X-Frame-Options**: Previene clickjacking
- **X-Content-Type-Options**: Previene MIME sniffing
- **X-XSS-Protection**: Protección contra XSS
- **Strict-Transport-Security**: Fuerza HTTPS
- **Content-Security-Policy**: Política de seguridad de contenido
- **Referrer-Policy**: Control de referrer
- **Permissions-Policy**: Control de permisos del navegador

### 🚫 Protección contra Ataques
- **Rate Limiting**: Limita peticiones por IP
- **User Agent Filtering**: Bloquea bots maliciosos
- **Request Filtering**: Bloquea patrones de ataque comunes
- **File Access Control**: Deniega acceso a archivos sensibles
- **SSL/TLS Hardening**: Configuración SSL robusta

### 📊 Monitoreo y Logging
- **Log Rotation**: Rotación automática de logs
- **Health Checks**: Endpoints de verificación de salud
- **Monitoring Scripts**: Scripts de monitoreo automático
- **Error Pages**: Páginas de error personalizadas

## 🖥️ Instalación en Servidor Linux

### Requisitos Previos
- Ubuntu/Debian Linux
- Acceso root (sudo)
- Conexión a internet

### Pasos de Instalación

1. **Descargar los archivos**
```bash
# Copiar los archivos al servidor
scp nginx-luxae.conf install-nginx-luxae.sh user@server:/tmp/
```

2. **Ejecutar el script de instalación**
```bash
# Conectar al servidor
ssh user@server

# Ejecutar como root
sudo bash /tmp/install-nginx-luxae.sh
```

3. **Verificar la instalación**
```bash
# Verificar estado de Nginx
sudo systemctl status nginx

# Verificar configuración
sudo nginx -t

# Verificar servicios
sudo /usr/local/bin/luxae-health-check.sh
```

### Configuración Post-Instalación

1. **Configurar dominio real**
```bash
# Editar la configuración
sudo nano /etc/nginx/sites-available/luxae

# Cambiar luxae.local por tu dominio real
server_name tu-dominio.com www.tu-dominio.com;
```

2. **Configurar SSL real (Let's Encrypt)**
```bash
# Instalar certificado SSL real
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

3. **Configurar firewall**
```bash
# Verificar reglas de firewall
sudo ufw status

# Agregar reglas adicionales si es necesario
sudo ufw allow from trusted-ip to any port 22
```

## 💻 Configuración para Desarrollo Local (macOS)

### Instalación Automática

```bash
# Ejecutar el script de configuración local
./setup-local-dev.sh
```

### Instalación Manual

1. **Instalar Homebrew y Nginx**
```bash
# Instalar Homebrew si no está instalado
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Nginx
brew install nginx openssl
```

2. **Configurar SSL local**
```bash
# Crear certificado SSL
mkdir -p /usr/local/etc/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /usr/local/etc/nginx/ssl/luxae.key \
    -out /usr/local/etc/nginx/ssl/luxae.crt \
    -subj "/C=US/ST=State/L=City/O=Luxae/OU=IT/CN=luxae.local"
```

3. **Configurar hosts local**
```bash
# Agregar dominio local
echo "127.0.0.1 luxae.local www.luxae.local" | sudo tee -a /etc/hosts
```

4. **Copiar configuración**
```bash
# Copiar configuración de Nginx
sudo cp nginx-luxae.conf /usr/local/etc/nginx/sites-available/luxae
sudo ln -sf /usr/local/etc/nginx/sites-available/luxae /usr/local/etc/nginx/sites-enabled/
```

5. **Iniciar servicios**
```bash
# Iniciar Nginx
brew services start nginx

# Verificar estado
brew services list | grep nginx
```

## 🔧 Configuración de Puertos

### Puertos Utilizados
- **80**: HTTP (redirige a HTTPS)
- **443**: HTTPS (aplicación principal)
- **3000**: Backend API
- **8060**: Blockchain RPC
- **5173**: Frontend Development

### Configuración de Upstream
```nginx
upstream luxae_frontend {
    server 127.0.0.1:5173;
    keepalive 32;
}

upstream luxae_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream luxae_blockchain {
    server 127.0.0.1:8060;
    keepalive 32;
}
```

## 📁 Estructura de Directorios

```
/var/www/luxae/                    # Directorio de la aplicación (Linux)
├── dist/                          # Archivos compilados del frontend
└── logs/                          # Logs de la aplicación

/usr/local/etc/nginx/              # Configuración de Nginx (macOS)
├── sites-available/
│   └── luxae                     # Configuración del sitio
├── sites-enabled/
│   └── luxae -> ../sites-available/luxae
└── ssl/
    ├── luxae.crt                 # Certificado SSL
    └── luxae.key                 # Clave privada SSL

/etc/nginx/                        # Configuración de Nginx (Linux)
├── sites-available/
│   └── luxae                     # Configuración del sitio
├── sites-enabled/
│   └── luxae -> ../sites-available/luxae
└── ssl/
    ├── luxae.crt                 # Certificado SSL
    └── luxae.key                 # Clave privada SSL
```

## 🚀 Scripts de Utilidad

### Scripts de Servidor
- `/usr/local/bin/luxae-health-check.sh` - Verificación de servicios
- `/usr/local/bin/deploy-luxae.sh` - Script de despliegue
- `/usr/local/bin/luxae-monitor.sh` - Monitoreo automático
- `/usr/local/bin/renew-ssl.sh` - Renovación de certificados SSL

### Scripts de Desarrollo Local
- `./luxae-health-check-local.sh` - Verificación de servicios locales
- `./deploy-local.sh` - Despliegue local

## 🔍 Verificación y Testing

### Verificar Configuración
```bash
# Verificar sintaxis de Nginx
sudo nginx -t

# Verificar servicios
./luxae-health-check-local.sh  # Local
sudo /usr/local/bin/luxae-health-check.sh  # Servidor
```

### Testing de Seguridad
```bash
# Verificar headers de seguridad
curl -I https://luxae.local

# Verificar rate limiting
for i in {1..20}; do curl https://luxae.local/api/test; done

# Verificar SSL
openssl s_client -connect luxae.local:443 -servername luxae.local
```

## 📊 Monitoreo y Logs

### Logs de Nginx
```bash
# Logs de acceso
sudo tail -f /var/log/nginx/luxae_access.log

# Logs de error
sudo tail -f /var/log/nginx/luxae_error.log

# Logs de monitoreo
sudo tail -f /var/log/luxae-monitor.log
```

### Monitoreo de Recursos
```bash
# Verificar uso de memoria
free -h

# Verificar uso de disco
df -h

# Verificar procesos de Nginx
ps aux | grep nginx
```

## 🔧 Troubleshooting

### Problemas Comunes

1. **Nginx no inicia**
```bash
# Verificar configuración
sudo nginx -t

# Verificar logs
sudo tail -f /var/log/nginx/error.log

# Verificar puertos
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

2. **Certificado SSL no válido**
```bash
# Verificar certificado
openssl x509 -in /etc/ssl/certs/luxae.crt -text -noout

# Regenerar certificado
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/luxae.key \
    -out /etc/ssl/certs/luxae.crt
```

3. **Rate limiting muy estricto**
```bash
# Ajustar límites en la configuración
sudo nano /etc/nginx/sites-available/luxae

# Cambiar rate limits
limit_req zone=api burst=50 nodelay;  # Aumentar burst
```

### Comandos de Mantenimiento

```bash
# Recargar configuración
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar estado
sudo systemctl status nginx

# Ver logs en tiempo real
sudo tail -f /var/log/nginx/luxae_access.log
```

## 🔐 Configuración de Seguridad Avanzada

### Firewall (UFW)
```bash
# Verificar reglas
sudo ufw status

# Agregar reglas adicionales
sudo ufw allow from trusted-ip to any port 22
sudo ufw deny from malicious-ip
```

### Fail2Ban (Opcional)
```bash
# Instalar Fail2Ban
sudo apt install fail2ban

# Configurar para Nginx
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### ModSecurity (Opcional)
```bash
# Instalar ModSecurity
sudo apt install libapache2-mod-security2

# Configurar reglas WAF
sudo cp /usr/share/modsecurity-crs/rules/* /etc/nginx/modsecurity/
```

## 📈 Optimización de Rendimiento

### Configuración de Nginx
```nginx
# Optimizaciones en nginx.conf
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_comp_level 6;
```

### Configuración del Sistema
```bash
# Aumentar límites de archivos
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimizar kernel
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" >> /etc/sysctl.conf
sysctl -p
```

## 🚀 Despliegue en Producción

### Checklist de Producción
- [ ] Configurar dominio real
- [ ] Instalar certificado SSL real
- [ ] Configurar firewall
- [ ] Configurar monitoreo
- [ ] Configurar backups
- [ ] Configurar logs centralizados
- [ ] Configurar alertas

### Variables de Entorno
```bash
# Configurar variables de entorno
export LUXAE_ENV=production
export LUXAE_DOMAIN=tu-dominio.com
export LUXAE_SSL_EMAIL=admin@tu-dominio.com
```

## 📞 Soporte

### Recursos Útiles
- [Documentación de Nginx](https://nginx.org/en/docs/)
- [Guía de Seguridad de Nginx](https://nginx.org/en/docs/http/ngx_http_ssl_module.html)
- [Let's Encrypt](https://letsencrypt.org/docs/)

### Comandos de Diagnóstico
```bash
# Verificar configuración completa
sudo nginx -T

# Verificar certificados SSL
sudo certbot certificates

# Verificar logs de sistema
sudo journalctl -u nginx -f

# Verificar conectividad
curl -v https://luxae.local
```

---

## 🎯 Resumen

Esta configuración proporciona:

✅ **Proxy inverso completo** para frontend y backend  
✅ **Seguridad avanzada** con headers y rate limiting  
✅ **SSL/TLS** con certificados automáticos  
✅ **Monitoreo** y logging completo  
✅ **Optimización** de rendimiento  
✅ **Scripts de automatización** para instalación y mantenimiento  

¡Tu aplicación Luxae Blockchain está lista para producción con la máxima seguridad! 🚀 