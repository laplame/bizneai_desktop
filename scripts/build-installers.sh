#!/bin/bash

# BizneAI Installer Build Script
# This script builds installers for different platforms

set -e

echo "🚀 BizneAI Installer Build Script"
echo "=================================="

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

# Check if we're on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "Detected macOS - Building Mac installers..."
    
    # Build the application
    print_status "Building application..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Application built successfully"
    else
        print_error "Application build failed"
        exit 1
    fi
    
    # Build Mac installers
    print_status "Building Mac installers..."
    npm run dist:mac
    
    if [ $? -eq 0 ]; then
        print_success "Mac installers created successfully"
        
        # List created files
        echo ""
        print_status "Created Mac installers:"
        ls -la release/*.dmg release/*.zip 2>/dev/null || true
        
        # Ask if user wants to test the installer
        echo ""
        read -p "Do you want to test the installer? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Testing installer..."
            ./scripts/test-installer.sh
        fi
        
    else
        print_error "Mac installer build failed"
        exit 1
    fi
    
    print_warning "Windows installers cannot be built on macOS due to cross-compilation limitations"
    print_status "To build Windows installers, run this script on a Windows machine"
    
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    print_status "Detected Windows - Building Windows installers..."
    
    # Build the application
    print_status "Building application..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Application built successfully"
    else
        print_error "Application build failed"
        exit 1
    fi
    
    # Build Windows installers
    print_status "Building Windows installers..."
    npm run dist:win
    
    if [ $? -eq 0 ]; then
        print_success "Windows installers created successfully"
        
        # List created files
        echo ""
        print_status "Created Windows installers:"
        ls -la release/*.exe release/*.msi 2>/dev/null || true
        
    else
        print_error "Windows installer build failed"
        exit 1
    fi
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_status "Detected Linux - Building Linux installers..."
    
    # Build the application
    print_status "Building application..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Application built successfully"
    else
        print_error "Application build failed"
        exit 1
    fi
    
    # Build Linux installers
    print_status "Building Linux installers..."
    npm run dist:linux
    
    if [ $? -eq 0 ]; then
        print_success "Linux installers created successfully"
        
        # List created files
        echo ""
        print_status "Created Linux installers:"
        ls -la release/*.AppImage release/*.deb 2>/dev/null || true
        
    else
        print_error "Linux installer build failed"
        exit 1
    fi
    
else
    print_error "Unsupported operating system: $OSTYPE"
    exit 1
fi

# Create a summary of all installers
echo ""
print_status "Build Summary:"
echo "=================="

if [ -d "release" ]; then
    echo "Installer files in release/ directory:"
    find release -name "*.dmg" -o -name "*.zip" -o -name "*.exe" -o -name "*.msi" -o -name "*.AppImage" -o -name "*.deb" | sort
    
    echo ""
    echo "File sizes:"
    du -h release/*.dmg release/*.zip release/*.exe release/*.msi release/*.AppImage release/*.deb 2>/dev/null || true
else
    print_warning "No release directory found"
fi

echo ""
print_success "Build process completed!"
print_status "Installers are ready in the release/ directory" 