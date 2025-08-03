#!/bin/bash

# Luxae Blockchain Nginx Installation Script
# This script installs and configures Nginx as a reverse proxy for the Luxae application
# with comprehensive security measures and SSL support

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_status "Starting Luxae Nginx installation..."

# Update system packages
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y nginx openssl ufw certbot python3-certbot-nginx

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p /var/www/luxae
mkdir -p /var/log/nginx
mkdir -p /etc/ssl/private
mkdir -p /etc/ssl/certs

# Backup existing nginx configuration
if [ -f /etc/nginx/nginx.conf ]; then
    print_status "Backing up existing nginx configuration..."
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# Copy the nginx configuration
print_status "Installing Luxae nginx configuration..."
cp nginx-luxae.conf /etc/nginx/sites-available/luxae

# Create SSL certificate (self-signed for development)
print_status "Generating SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/luxae.key \
    -out /etc/ssl/certs/luxae.crt \
    -subj "/C=US/ST=State/L=City/O=Luxae/OU=IT/CN=luxae.local"

# Set proper permissions
chmod 600 /etc/ssl/private/luxae.key
chmod 644 /etc/ssl/certs/luxae.crt

# Enable the site
print_status "Enabling Luxae site..."
ln -sf /etc/nginx/sites-available/luxae /etc/nginx/sites-enabled/

# Remove default nginx site
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Create application directory structure
print_status "Setting up application directories..."
mkdir -p /var/www/luxae/dist
chown -R www-data:www-data /var/www/luxae
chmod -R 755 /var/www/luxae

# Configure firewall
print_status "Configuring firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Backend API
ufw allow 8060/tcp  # Blockchain RPC
ufw deny 8080/tcp   # Block common attack port

# Configure system limits for nginx
print_status "Configuring system limits..."
cat >> /etc/security/limits.conf << EOF

# Nginx limits
www-data soft nofile 65536
www-data hard nofile 65536
root soft nofile 65536
root hard nofile 65536
EOF

# Configure nginx worker processes
print_status "Optimizing nginx configuration..."
cat > /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # MIME Types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Include site configurations
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

# Create systemd service for nginx optimization
print_status "Creating nginx optimization service..."
cat > /etc/systemd/system/nginx-optimize.service << 'EOF'
[Unit]
Description=Nginx Optimization Service
After=network.target

[Service]
Type=oneshot
ExecStart=/bin/bash -c 'echo 1048576 > /proc/sys/net/core/somaxconn'
ExecStart=/bin/bash -c 'echo 1048576 > /proc/sys/net/core/netdev_max_backlog'
ExecStart=/bin/bash -c 'echo 1048576 > /proc/sys/net/ipv4/tcp_max_syn_backlog'
ExecStart=/bin/bash -c 'echo 1 > /proc/sys/net/ipv4/tcp_syncookies'
ExecStart=/bin/bash -c 'echo 1 > /proc/sys/net/ipv4/tcp_tw_reuse'
ExecStart=/bin/bash -c 'echo 1 > /proc/sys/net/ipv4/ip_forward'
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the optimization service
systemctl enable nginx-optimize.service
systemctl start nginx-optimize.service

# Test nginx configuration
print_status "Testing nginx configuration..."
if nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Restart nginx
print_status "Restarting nginx..."
systemctl restart nginx
systemctl enable nginx

# Create health check script
print_status "Creating health check script..."
cat > /usr/local/bin/luxae-health-check.sh << 'EOF'
#!/bin/bash

# Health check for Luxae services
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000/health"
BLOCKCHAIN_URL="http://localhost:8060"

echo "Checking Luxae services..."

# Check frontend
if curl -f -s $FRONTEND_URL > /dev/null; then
    echo "✓ Frontend is running"
else
    echo "✗ Frontend is not responding"
fi

# Check backend
if curl -f -s $BACKEND_URL > /dev/null; then
    echo "✓ Backend is running"
else
    echo "✗ Backend is not responding"
fi

# Check blockchain
if curl -f -s $BLOCKCHAIN_URL > /dev/null; then
    echo "✓ Blockchain is running"
else
    echo "✗ Blockchain is not responding"
fi

# Check nginx
if systemctl is-active --quiet nginx; then
    echo "✓ Nginx is running"
else
    echo "✗ Nginx is not running"
fi
EOF

chmod +x /usr/local/bin/luxae-health-check.sh

# Create deployment script
print_status "Creating deployment script..."
cat > /usr/local/bin/deploy-luxae.sh << 'EOF'
#!/bin/bash

# Luxae deployment script
set -e

echo "Deploying Luxae application..."

# Build frontend
echo "Building frontend..."
cd /var/www/luxae
npm run build

# Copy dist files
echo "Copying dist files..."
cp -r dist/* /var/www/luxae/dist/

# Set permissions
chown -R www-data:www-data /var/www/luxae/dist
chmod -R 755 /var/www/luxae/dist

# Reload nginx
echo "Reloading nginx..."
systemctl reload nginx

echo "Deployment completed successfully!"
EOF

chmod +x /usr/local/bin/deploy-luxae.sh

# Create log rotation configuration
print_status "Configuring log rotation..."
cat > /etc/logrotate.d/luxae-nginx << 'EOF'
/var/log/nginx/luxae_*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
EOF

# Create monitoring script
print_status "Creating monitoring script..."
cat > /usr/local/bin/luxae-monitor.sh << 'EOF'
#!/bin/bash

# Luxae monitoring script
LOG_FILE="/var/log/luxae-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Starting Luxae monitoring..." >> $LOG_FILE

# Check nginx status
if ! systemctl is-active --quiet nginx; then
    echo "[$DATE] ERROR: Nginx is down, attempting restart..." >> $LOG_FILE
    systemctl restart nginx
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    echo "[$DATE] WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
if (( $(echo "$MEMORY_USAGE > 90" | bc -l) )); then
    echo "[$DATE] WARNING: Memory usage is ${MEMORY_USAGE}%" >> $LOG_FILE
fi

echo "[$DATE] Monitoring completed" >> $LOG_FILE
EOF

chmod +x /usr/local/bin/luxae-monitor.sh

# Add monitoring to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/luxae-monitor.sh") | crontab -

# Create SSL certificate renewal script
print_status "Creating SSL certificate renewal script..."
cat > /usr/local/bin/renew-ssl.sh << 'EOF'
#!/bin/bash

# SSL certificate renewal script
echo "Renewing SSL certificates..."

# For Let's Encrypt certificates
if command -v certbot &> /dev/null; then
    certbot renew --quiet
fi

# Reload nginx
systemctl reload nginx

echo "SSL certificates renewed successfully!"
EOF

chmod +x /usr/local/bin/renew-ssl.sh

# Add SSL renewal to crontab
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/local/bin/renew-ssl.sh") | crontab -

# Final status check
print_status "Performing final status check..."
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running successfully"
else
    print_error "Nginx failed to start"
    exit 1
fi

# Display installation summary
echo ""
print_success "Luxae Nginx installation completed successfully!"
echo ""
echo "=== Installation Summary ==="
echo "✓ Nginx installed and configured"
echo "✓ SSL certificates generated"
echo "✓ Firewall configured"
echo "✓ Security headers implemented"
echo "✓ Rate limiting enabled"
echo "✓ Log rotation configured"
echo "✓ Monitoring scripts installed"
echo ""
echo "=== Important Information ==="
echo "• Nginx configuration: /etc/nginx/sites-available/luxae"
echo "• SSL certificates: /etc/ssl/certs/luxae.crt"
echo "• Application directory: /var/www/luxae"
echo "• Logs: /var/log/nginx/luxae_*.log"
echo "• Health check: /usr/local/bin/luxae-health-check.sh"
echo "• Deployment script: /usr/local/bin/deploy-luxae.sh"
echo "• Monitoring script: /usr/local/bin/luxae-monitor.sh"
echo ""
echo "=== Next Steps ==="
echo "1. Add your domain to /etc/hosts: 127.0.0.1 luxae.local"
echo "2. Build your frontend: npm run build"
echo "3. Copy dist files to: /var/www/luxae/dist/"
echo "4. Start your backend services on ports 3000 and 8060"
echo "5. Test the installation: /usr/local/bin/luxae-health-check.sh"
echo ""
print_success "Installation completed! 🚀" 