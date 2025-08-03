#!/bin/bash

# Test Installer Script
# This script tests the BizneAI installer to ensure it works correctly

set -e

echo "🧪 Testing BizneAI Installer"
echo "============================="

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

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This test script is designed for macOS"
    exit 1
fi

# Find the latest DMG file
DMG_FILE=""
if [[ $(uname -m) == "arm64" ]]; then
    DMG_FILE="release/BizneAI POS-1.0.0-arm64.dmg"
else
    DMG_FILE="release/BizneAI POS-1.0.0.dmg"
fi

if [[ ! -f "$DMG_FILE" ]]; then
    print_error "Installer not found: $DMG_FILE"
    print_status "Available installers:"
    ls -la release/*.dmg 2>/dev/null || true
    exit 1
fi

print_status "Found installer: $DMG_FILE"
print_status "File size: $(du -h "$DMG_FILE" | cut -f1)"

# Check if the DMG is valid
print_status "Validating DMG file..."
if hdiutil verify "$DMG_FILE" >/dev/null 2>&1; then
    print_success "DMG file is valid"
else
    print_error "DMG file is corrupted"
    exit 1
fi

# Mount the DMG
print_status "Mounting DMG for testing..."
MOUNT_POINT=$(hdiutil attach "$DMG_FILE" | grep "/Volumes/" | awk '{print $3}')
if [[ -z "$MOUNT_POINT" ]]; then
    print_error "Failed to mount DMG"
    exit 1
fi

print_success "DMG mounted at: $MOUNT_POINT"

# Check if the app exists in the DMG
APP_PATH="$MOUNT_POINT/BizneAI POS.app"
if [[ ! -d "$APP_PATH" ]]; then
    print_error "App not found in DMG: $APP_PATH"
    hdiutil detach "$MOUNT_POINT" >/dev/null 2>&1 || true
    exit 1
fi

print_success "App found in DMG: $APP_PATH"

# Check app bundle structure
print_status "Checking app bundle structure..."
if [[ -d "$APP_PATH/Contents/MacOS" ]] && [[ -d "$APP_PATH/Contents/Resources" ]]; then
    print_success "App bundle structure is correct"
else
    print_error "App bundle structure is invalid"
    hdiutil detach "$MOUNT_POINT" >/dev/null 2>&1 || true
    exit 1
fi

# Check for required files
print_status "Checking for required files..."
REQUIRED_FILES=(
    "Contents/MacOS/BizneAI POS"
    "Contents/Resources/app.asar"
    "Contents/Info.plist"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$APP_PATH/$file" ]]; then
        print_success "✓ $file"
    else
        print_error "✗ Missing: $file"
        hdiutil detach "$MOUNT_POINT" >/dev/null 2>&1 || true
        exit 1
    fi
done

# Check app permissions
print_status "Checking app permissions..."
if [[ -x "$APP_PATH/Contents/MacOS/BizneAI POS" ]]; then
    print_success "App executable has correct permissions"
else
    print_error "App executable missing execute permissions"
    hdiutil detach "$MOUNT_POINT" >/dev/null 2>&1 || true
    exit 1
fi

# Test app launch (optional - can be skipped)
print_status "Testing app launch (this will open the app briefly)..."
print_warning "The app will launch briefly for testing. Close it when it appears."

# Launch the app in background
open "$APP_PATH" &
APP_PID=$!

# Wait a moment for the app to start
sleep 3

# Check if the app is running
if ps -p $APP_PID > /dev/null 2>&1; then
    print_success "App launched successfully"
    
    # Give user time to see the app
    print_status "App is running. Close it when ready..."
    read -p "Press Enter when you've closed the app..."
    
    # Kill the app if it's still running
    if ps -p $APP_PID > /dev/null 2>&1; then
        kill $APP_PID 2>/dev/null || true
        print_status "App closed"
    fi
else
    print_warning "Could not verify app launch (this might be normal)"
fi

# Unmount the DMG
print_status "Unmounting DMG..."
hdiutil detach "$MOUNT_POINT" >/dev/null 2>&1 || true

print_success "Installer test completed successfully!"
print_status "The installer appears to be working correctly."
print_status "You can now distribute: $DMG_FILE" 