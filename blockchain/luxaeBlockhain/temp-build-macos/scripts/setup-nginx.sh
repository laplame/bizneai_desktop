#!/bin/bash

echo "=== Setting up Nginx for Luxae ==="

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# Create Nginx configuration
echo "Creating Nginx configuration..."
sudo mkdir -p /etc/nginx/sites-available
sudo cp nginx/luxae.conf /etc/nginx/sites-available/

# Create symbolic link
sudo ln -sf /etc/nginx/sites-available/luxae.conf /etc/nginx/sites-enabled/

# Test configuration
echo "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Restarting Nginx..."
    sudo systemctl restart nginx
    echo "✓ Nginx configured successfully"
    
    # Show status
    echo "Current status:"
    sudo systemctl status nginx
else
    echo "✗ Nginx configuration test failed"
    exit 1
fi

# Configure firewall if UFW is present
if command -v ufw &> /dev/null; then
    echo "Configuring firewall..."
    sudo ufw allow 'Nginx Full'
    sudo ufw allow 3000  # API
    sudo ufw allow 3001  # Dashboard
    sudo ufw allow 30303 # P2P
    sudo ufw status
fi 