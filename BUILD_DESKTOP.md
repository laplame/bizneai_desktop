# 🖥️ Building Desktop Applications

This guide explains how to build desktop applications for macOS, Windows, and Linux using Electron.

## 📋 Prerequisites

### For macOS builds:
- macOS 10.14 or later
- Xcode Command Line Tools: `xcode-select --install`

### For Windows builds:
- Windows 10 or later
- Wine (for building on macOS/Linux): `brew install wine`

### For Linux builds:
- Ubuntu 18.04 or later
- Required packages: `sudo apt-get install -y rpm`

## 🚀 Quick Start

### 1. Generate Icons
```bash
npm run generate-icons
```

### 2. Build All Platforms
```bash
npm run build-desktop
```

This will build for all platforms (macOS, Windows, Linux) in one command.

## 🎯 Individual Platform Builds

### macOS
```bash
npm run build-desktop:mac
```
Output: `release/BizneAI POS-1.0.0.dmg`

### Windows
```bash
npm run build-desktop:win
```
Output: `release/BizneAI POS Setup 1.0.0.exe`

### Linux
```bash
npm run build-desktop:linux
```
Output: `release/BizneAI POS-1.0.0.AppImage`

## 📁 Output Files

After successful builds, you'll find the following files in the `release/` directory:

### macOS
- `BizneAI POS-1.0.0.dmg` - Installer for macOS
- `BizneAI POS-1.0.0-mac.zip` - Zipped application

### Windows
- `BizneAI POS Setup 1.0.0.exe` - Windows installer
- `BizneAI POS-1.0.0-win.zip` - Portable version

### Linux
- `BizneAI POS-1.0.0.AppImage` - AppImage format
- `BizneAI POS-1.0.0.deb` - Debian package

## 🔧 Configuration

### Icons
Icons are automatically generated in the `build/` directory:
- `icon.ico` - Windows icon
- `icon.icns` - macOS icon
- `icon.png` - Linux icon

### Build Configuration
The build configuration is in `package.json` under the `"build"` section:

```json
{
  "build": {
    "appId": "com.bizneai.pos",
    "productName": "BizneAI POS",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "blockchain/**/*",
      "node_modules/**/*",
      "package.json"
    ]
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Icons not found**
   ```bash
   npm run generate-icons
   ```

2. **Build fails on macOS**
   - Ensure Xcode Command Line Tools are installed
   - Run: `xcode-select --install`

3. **Windows build fails on macOS/Linux**
   - Install Wine: `brew install wine`
   - Or build on a Windows machine

4. **Linux build fails**
   - Install required packages: `sudo apt-get install -y rpm`
   - For AppImage: `sudo apt-get install -y appimagetool`

### Platform-Specific Notes

#### macOS
- Requires code signing for distribution
- DMG files work on macOS 10.14+
- Supports both Intel and Apple Silicon

#### Windows
- NSIS installer requires admin privileges
- Portable version doesn't require installation
- Compatible with Windows 10/11

#### Linux
- AppImage works on most distributions
- DEB package for Debian/Ubuntu
- RPM package for Red Hat/Fedora

## 🚀 Distribution

### macOS
1. Code sign the application (recommended)
2. Upload DMG to your website
3. Consider Mac App Store distribution

### Windows
1. Test the installer on clean Windows VM
2. Upload EXE to your website
3. Consider Microsoft Store distribution

### Linux
1. Test AppImage on different distributions
2. Upload to your website
3. Consider distribution through package managers

## 📦 Advanced Configuration

### Code Signing (macOS)
```bash
# Add to package.json build configuration
"mac": {
  "identity": "Your Developer ID",
  "hardenedRuntime": true,
  "gatekeeperAssess": false
}
```

### Auto Updater
```bash
# Install electron-updater
npm install electron-updater

# Configure in main.js
import { autoUpdater } from 'electron-updater'
```

### Custom Installer
```bash
# Modify NSIS configuration in package.json
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true
}
```

## 🎉 Success!

After building, you'll have professional desktop applications ready for distribution across all major platforms!

### Testing Checklist
- [ ] macOS app launches and functions correctly
- [ ] Windows installer works on clean system
- [ ] Linux AppImage runs on different distributions
- [ ] Blockchain functionality works in all builds
- [ ] All features (POS, mining, reports) function properly

### Distribution Checklist
- [ ] Code sign applications (recommended)
- [ ] Test on clean systems
- [ ] Create installation instructions
- [ ] Prepare release notes
- [ ] Upload to distribution channels 