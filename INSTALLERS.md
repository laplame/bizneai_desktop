# 🚀 BizneAI Installers

This document provides information about the BizneAI installers for different platforms.

## 📦 Available Installers

### macOS Installers
- **BizneAI POS-1.0.0.dmg** (298MB) - Intel Mac installer
- **BizneAI POS-1.0.0-arm64.dmg** (294MB) - Apple Silicon Mac installer
- **BizneAI POS-1.0.0-mac.zip** (294MB) - Intel Mac portable
- **BizneAI POS-1.0.0-arm64-mac.zip** (289MB) - Apple Silicon Mac portable

### Windows Installers
*Note: Windows installers must be built on a Windows machine*

- **BizneAI POS Setup 1.0.0.exe** - Windows installer (NSIS)
- **BizneAI POS-1.0.0.exe** - Windows portable executable

### Linux Installers
*Note: Linux installers must be built on a Linux machine*

- **BizneAI POS-1.0.0.AppImage** - Linux AppImage
- **BizneAI POS_1.0.0_amd64.deb** - Debian/Ubuntu package

## 🛠️ Building Installers

### Prerequisites
- Node.js 16+ 
- npm
- Git

### macOS Build
```bash
# Clone the repository
git clone https://github.com/bizneai/pos-system.git
cd pos-system

# Install dependencies
npm install

# Build Mac installers
./scripts/build-installers.sh
```

### Windows Build
```cmd
# Clone the repository
git clone https://github.com/bizneai/pos-system.git
cd pos-system

# Install dependencies
npm install

# Build Windows installers
scripts\build-installers.bat
```

### Linux Build
```bash
# Clone the repository
git clone https://github.com/bizneai/pos-system.git
cd pos-system

# Install dependencies
npm install

# Build Linux installers
./scripts/build-installers.sh
```

## 📋 Installation Instructions

### macOS Installation
1. Download the appropriate `.dmg` file for your Mac:
   - Intel Mac: `BizneAI POS-1.0.0.dmg`
   - Apple Silicon: `BizneAI POS-1.0.0-arm64.dmg`

2. Double-click the `.dmg` file to mount it

3. Drag the "BizneAI POS" application to your Applications folder

4. Launch the application from Applications

**Note:** On first launch, you may need to:
- Right-click the app and select "Open" to bypass Gatekeeper
- Go to System Preferences > Security & Privacy and click "Open Anyway"

### Windows Installation
1. Download `BizneAI POS Setup 1.0.0.exe`

2. Run the installer as Administrator

3. Follow the installation wizard

4. Launch the application from the Start Menu or Desktop shortcut

### Linux Installation
#### AppImage (Recommended)
1. Download `BizneAI POS-1.0.0.AppImage`

2. Make it executable:
   ```bash
   chmod +x "BizneAI POS-1.0.0.AppImage"
   ```

3. Run the AppImage:
   ```bash
   ./"BizneAI POS-1.0.0.AppImage"
   ```

#### Debian/Ubuntu Package
1. Download `BizneAI POS_1.0.0_amd64.deb`

2. Install the package:
   ```bash
   sudo dpkg -i "BizneAI POS_1.0.0_amd64.deb"
   ```

3. Launch the application from your application menu

## 🔧 System Requirements

### Minimum Requirements
- **macOS**: 10.14+ (Intel) or 11.0+ (Apple Silicon)
- **Windows**: Windows 10 64-bit
- **Linux**: Ubuntu 18.04+ or equivalent

### Recommended Requirements
- **RAM**: 8GB+
- **Storage**: 2GB free space
- **Display**: 1920x1080 or higher
- **Network**: Internet connection for updates and cloud features

## 🚀 Features Included

### Core Features
- ✅ Product Management with AI-powered similarity detection
- ✅ Image upload with Cloudinary optimization
- ✅ Kitchen Order Management
- ✅ Waitlist Management
- ✅ Payment Processing
- ✅ Chat System with AI responses
- ✅ Inventory Management
- ✅ Ticket Generation
- ✅ Crypto Payment Support
- ✅ Barcode Scanning

### Technical Features
- ✅ Electron-based desktop application
- ✅ React + TypeScript frontend
- ✅ Node.js backend with Express
- ✅ SQLite database
- ✅ Blockchain integration (Luxae)
- ✅ Real-time updates with Socket.IO
- ✅ Multi-platform support

## 🔒 Security Features

### macOS
- Hardened Runtime enabled
- Code signing (when available)
- Sandboxed execution
- Gatekeeper compliance

### Windows
- Digital signature (when available)
- UAC compatibility
- Windows Defender compatible

### Linux
- AppImage security features
- Package signing (when available)

## 🐛 Troubleshooting

### Common Issues

#### macOS
**"App can't be opened because it's from an unidentified developer"**
1. Right-click the app
2. Select "Open"
3. Click "Open" in the dialog

**App crashes on launch**
1. Check Console.app for error messages
2. Ensure you have sufficient disk space
3. Try running from Terminal: `/Applications/BizneAI\ POS.app/Contents/MacOS/BizneAI\ POS`

#### Windows
**"Windows protected your PC"**
1. Click "More info"
2. Click "Run anyway"

**Installation fails**
1. Run as Administrator
2. Disable antivirus temporarily
3. Check Windows Defender settings

#### Linux
**AppImage won't run**
```bash
chmod +x "BizneAI POS-1.0.0.AppImage"
./"BizneAI POS-1.0.0.AppImage"
```

**Permission denied**
```bash
sudo chmod +x "BizneAI POS-1.0.0.AppImage"
```

### Getting Help
- **GitHub Issues**: https://github.com/bizneai/pos-system/issues
- **Documentation**: https://docs.bizneai.com
- **Support Email**: support@bizneai.com

## 📊 File Sizes

| Platform | Installer | Size | Type |
|----------|-----------|------|------|
| macOS Intel | DMG | 298MB | Installer |
| macOS Apple Silicon | DMG | 294MB | Installer |
| macOS Intel | ZIP | 294MB | Portable |
| macOS Apple Silicon | ZIP | 289MB | Portable |
| Windows | EXE | ~300MB | Installer |
| Windows | EXE | ~300MB | Portable |
| Linux | AppImage | ~300MB | Portable |
| Linux | DEB | ~300MB | Package |

## 🔄 Updates

### Automatic Updates
The application checks for updates automatically and will notify you when a new version is available.

### Manual Updates
1. Download the latest installer for your platform
2. Uninstall the current version
3. Install the new version

### Beta Releases
Beta releases are available for testing new features. These are marked with version numbers like `1.0.0-beta.1`.

## 📝 Release Notes

### Version 1.0.0
- Initial release
- Complete POS system with all core features
- Multi-platform support
- AI-powered product management
- Blockchain integration

## 🤝 Contributing

To contribute to the installer build process:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the build process
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Last updated**: December 2024  
**Version**: 1.0.0  
**Build Date**: $(date) 