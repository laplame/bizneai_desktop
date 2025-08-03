#!/bin/bash

# Luxae Local Development Setup Script
# This script sets up the local development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_status "Setting up Luxae local development environment..."

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "Detected macOS system"
    
    # Install Homebrew if not installed
    if ! command -v brew &> /dev/null; then
        print_status "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    # Install required packages
    print_status "Installing required packages..."
    brew install nginx openssl
    
    # Create SSL certificate for local development
    print_status "Generating SSL certificate for local development..."
    mkdir -p /usr/local/etc/nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /usr/local/etc/nginx/ssl/luxae.key \
        -out /usr/local/etc/nginx/ssl/luxae.crt \
        -subj "/C=US/ST=State/L=City/O=Luxae/OU=IT/CN=luxae.local"
    
    # Set proper permissions
    chmod 600 /usr/local/etc/nginx/ssl/luxae.key
    chmod 644 /usr/local/etc/nginx/ssl/luxae.crt
    
    # Create nginx configuration for local development
    print_status "Creating nginx configuration for local development..."
    cat > /usr/local/etc/nginx/sites-available/luxae << 'EOF'
# Nginx Configuration for Luxae Local Development

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

# Upstream definitions
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

# Main server block
server {
    listen 80;
    server_name luxae.local www.luxae.local;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name luxae.local www.luxae.local;
    
    # SSL Configuration
    ssl_certificate /usr/local/etc/nginx/ssl/luxae.crt;
    ssl_certificate_key /usr/local/etc/nginx/ssl/luxae.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' ws://localhost:3000 wss://localhost:3000; frame-ancestors 'self';" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # Remove server signature
    server_tokens off;
    
    # File upload limits
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
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
    
    # Root directory for static files
    root /Users/$(whoami)/Documents/Blockchain/luxaeBlockhain/frontend-luxae/dist;
    index index.html;
    
    # Security: Block malicious user agents
    if ($http_user_agent ~* (curl|wget|python|bot|crawler|spider|scraper)) {
        return 403;
    }
    
    # Security: Block suspicious requests
    if ($request_uri ~* "\.(php|asp|aspx|jsp|cgi)$") {
        return 404;
    }
    
    # Security: Block common attack patterns
    if ($request_uri ~* "(eval\(|base64_decode|javascript:|vbscript:|onload|onerror)" {
        return 403;
    }
    
    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        # CORS headers for API
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
        add_header Access-Control-Expose-Headers "Content-Length,Content-Range" always;
        
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $http_origin;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
        
        proxy_pass http://luxae_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # WebSocket endpoint for real-time updates
    location /ws {
        limit_req zone=api burst=10 nodelay;
        
        proxy_pass http://luxae_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
    
    # Blockchain RPC endpoint
    location /rpc/ {
        limit_req zone=api burst=15 nodelay;
        
        # Additional security for RPC
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
        
        proxy_pass http://luxae_blockchain;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Static files with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff" always;
        try_files $uri =404;
    }
    
    # HTML files with no caching
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        try_files $uri =404;
    }
    
    # Main application - serve React app
    location / {
        limit_req zone=general burst=50 nodelay;
        
        try_files $uri $uri/ /index.html;
        
        # Security headers for main app
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Deny access to backup files
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Custom error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /404.html {
        root /Users/$(whoami)/Documents/Blockchain/luxaeBlockhain/frontend-luxae/dist;
        internal;
    }
    
    location = /50x.html {
        root /Users/$(whoami)/Documents/Blockchain/luxaeBlockhain/frontend-luxae/dist;
        internal;
    }
    
    # Logging
    access_log /usr/local/var/log/nginx/luxae_access.log;
    error_log /usr/local/var/log/nginx/luxae_error.log;
}
EOF

    # Enable the site
    print_status "Enabling Luxae site..."
    mkdir -p /usr/local/etc/nginx/sites-enabled
    ln -sf /usr/local/etc/nginx/sites-available/luxae /usr/local/etc/nginx/sites-enabled/
    
    # Update nginx.conf to include sites-enabled
    if ! grep -q "sites-enabled" /usr/local/etc/nginx/nginx.conf; then
        print_status "Updating nginx.conf to include sites-enabled..."
        sed -i '' '/include \/usr\/local\/etc\/nginx\/conf\.d\/\*\.conf;/a\
    include /usr/local/etc/nginx/sites-enabled/*;' /usr/local/etc/nginx/nginx.conf
    fi
    
    # Create log directory
    mkdir -p /usr/local/var/log/nginx
    
    # Add domain to hosts file
    print_status "Adding domain to hosts file..."
    if ! grep -q "luxae.local" /etc/hosts; then
        echo "127.0.0.1 luxae.local www.luxae.local" | sudo tee -a /etc/hosts
    fi
    
    # Start nginx
    print_status "Starting nginx..."
    brew services start nginx
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_status "Detected Linux system"
    print_warning "For Linux, please use the install-nginx-luxae.sh script instead"
    exit 1
else
    print_error "Unsupported operating system"
    exit 1
fi

# Create health check script for local development
print_status "Creating health check script for local development..."
cat > luxae-health-check-local.sh << 'EOF'
#!/bin/bash

# Health check for Luxae local development services
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000/health"
BLOCKCHAIN_URL="http://localhost:8060"
NGINX_URL="https://luxae.local"

echo "Checking Luxae local development services..."

# Check frontend
if curl -f -s $FRONTEND_URL > /dev/null; then
    echo "✓ Frontend is running on port 5173"
else
    echo "✗ Frontend is not responding on port 5173"
fi

# Check backend
if curl -f -s $BACKEND_URL > /dev/null; then
    echo "✓ Backend is running on port 3000"
else
    echo "✗ Backend is not responding on port 3000"
fi

# Check blockchain
if curl -f -s $BLOCKCHAIN_URL > /dev/null; then
    echo "✓ Blockchain is running on port 8060"
else
    echo "✗ Blockchain is not responding on port 8060"
fi

# Check nginx
if curl -f -s -k $NGINX_URL > /dev/null; then
    echo "✓ Nginx is running and serving HTTPS"
else
    echo "✗ Nginx is not responding"
fi

echo ""
echo "=== Development URLs ==="
echo "• Frontend (Dev): http://localhost:5173"
echo "• Frontend (Prod): https://luxae.local"
echo "• Backend API: http://localhost:3000"
echo "• Blockchain RPC: http://localhost:8060"
echo "• Health Check: https://luxae.local/health"
EOF

chmod +x luxae-health-check-local.sh

# Create development deployment script
print_status "Creating development deployment script..."
cat > deploy-local.sh << 'EOF'
#!/bin/bash

# Luxae local development deployment script
set -e

echo "Deploying Luxae application for local development..."

# Build frontend
echo "Building frontend..."
cd frontend-luxae
npm run build

# Reload nginx
echo "Reloading nginx..."
brew services reload nginx

echo "Local deployment completed successfully!"
echo "Access your application at: https://luxae.local"
EOF

chmod +x deploy-local.sh

# Final status check
print_status "Performing final status check..."
if brew services list | grep -q "nginx.*started"; then
    print_success "Nginx is running successfully"
else
    print_error "Nginx failed to start"
    exit 1
fi

# Display installation summary
echo ""
print_success "Luxae local development setup completed successfully!"
echo ""
echo "=== Installation Summary ==="
echo "✓ Nginx installed and configured"
echo "✓ SSL certificates generated"
echo "✓ Security headers implemented"
echo "✓ Rate limiting enabled"
echo "✓ Local domain configured"
echo ""
echo "=== Important Information ==="
echo "• Nginx configuration: /usr/local/etc/nginx/sites-available/luxae"
echo "• SSL certificates: /usr/local/etc/nginx/ssl/"
echo "• Application directory: $(pwd)/frontend-luxae/dist"
echo "• Health check: ./luxae-health-check-local.sh"
echo "• Deployment script: ./deploy-local.sh"
echo ""
echo "=== Development URLs ==="
echo "• Frontend (Dev): http://localhost:5173"
echo "• Frontend (Prod): https://luxae.local"
echo "• Backend API: http://localhost:3000"
echo "• Blockchain RPC: http://localhost:8060"
echo ""
echo "=== Next Steps ==="
echo "1. Start your backend services on ports 3000 and 8060"
echo "2. Build your frontend: cd frontend-luxae && npm run build"
echo "3. Test the installation: ./luxae-health-check-local.sh"
echo "4. Deploy changes: ./deploy-local.sh"
echo ""
print_success "Local development setup completed! 🚀" 