# 🔧 BizneAI Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. Module Loading Error: `Cannot find module 'call-bind-apply-helpers'`

**Error Message:**
```
A JavaScript error occurred in the main process
Uncaught Exception: Error: Cannot find module 'call-bind-apply-helpers'
```

**Cause:** This error occurs when native modules are not properly bundled in the Electron app.

**Solution:**
1. Run the dependency fix script:
   ```bash
   npm run fix-deps
   ```

2. Rebuild the installer:
   ```bash
   npm run dist:mac
   ```

3. If the problem persists, try:
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   npm run fix-deps
   npm run dist:mac
   ```

### 2. App Crashes on Launch

**Symptoms:**
- App opens briefly then closes
- No error dialog appears
- App doesn't respond

**Solutions:**

#### macOS
1. Check Console.app for error messages:
   ```bash
   open -a Console
   ```

2. Run the app from Terminal to see errors:
   ```bash
   /Applications/BizneAI\ POS.app/Contents/MacOS/BizneAI\ POS
   ```

3. Check disk space:
   ```bash
   df -h
   ```

#### Windows
1. Run as Administrator
2. Check Event Viewer for errors
3. Disable antivirus temporarily

#### Linux
1. Run from terminal:
   ```bash
   ./"BizneAI POS-1.0.0.AppImage" --verbose
   ```

### 3. Gatekeeper/Code Signing Issues

**macOS Error:** "App can't be opened because it's from an unidentified developer"

**Solution:**
1. Right-click the app
2. Select "Open"
3. Click "Open" in the dialog
4. Or go to System Preferences > Security & Privacy > General and click "Open Anyway"

### 4. Build Failures

#### Native Module Compilation Errors
```bash
# Rebuild native modules
npm run fix-deps

# Or manually
npx electron-rebuild
```

#### TypeScript Compilation Errors
```bash
# Clean and rebuild
rm -rf dist
npm run build
```

#### Electron Builder Errors
```bash
# Clear electron-builder cache
rm -rf node_modules/.cache
rm -rf release
npm run dist:mac
```

### 5. Performance Issues

**Symptoms:**
- App is slow to start
- UI is unresponsive
- High CPU usage

**Solutions:**
1. Check system resources:
   ```bash
   # macOS
   top -o cpu
   
   # Windows
   taskmgr
   
   # Linux
   htop
   ```

2. Disable unnecessary features:
   - Turn off real-time updates
   - Reduce image quality settings
   - Close other applications

### 6. Database Issues

**Error:** "SQLite database error"

**Solutions:**
1. Check database file permissions
2. Ensure sufficient disk space
3. Reset database (if safe):
   ```bash
   # Backup first
   cp ~/Library/Application\ Support/BizneAI\ POS/database.sqlite ~/Desktop/backup.sqlite
   
   # Remove database file (will be recreated)
   rm ~/Library/Application\ Support/BizneAI\ POS/database.sqlite
   ```

### 7. Network Issues

**Error:** "Cannot connect to server"

**Solutions:**
1. Check internet connection
2. Verify firewall settings
3. Try different network
4. Check if server is running (for local development)

### 8. Image Upload Issues

**Error:** "Failed to upload image"

**Solutions:**
1. Check Cloudinary credentials
2. Verify image format (JPEG, PNG, WebP)
3. Check file size (max 10MB)
4. Ensure internet connection

## 🛠️ Development Issues

### Build Scripts Not Working

1. Check script permissions:
   ```bash
   chmod +x scripts/*.sh
   ```

2. Verify Node.js version:
   ```bash
   node --version  # Should be 16+
   ```

3. Check npm version:
   ```bash
   npm --version
   ```

### TypeScript Errors

1. Clean TypeScript cache:
   ```bash
   rm -rf tsconfig.tsbuildinfo
   npm run build
   ```

2. Check TypeScript version:
   ```bash
   npx tsc --version
   ```

### ESLint Errors

1. Fix auto-fixable issues:
   ```bash
   npm run lint -- --fix
   ```

2. Check ESLint configuration:
   ```bash
   npx eslint --print-config src/
   ```

## 🔍 Debugging Tools

### macOS Debugging
```bash
# Check app logs
log show --predicate 'process == "BizneAI POS"' --last 1h

# Check system logs
sudo log show --predicate 'eventMessage CONTAINS "BizneAI"' --last 1h

# Run app with debugging
/Applications/BizneAI\ POS.app/Contents/MacOS/BizneAI\ POS --enable-logging
```

### Windows Debugging
```cmd
# Check Event Viewer
eventvwr.msc

# Run with debugging
"BizneAI POS.exe" --enable-logging
```

### Linux Debugging
```bash
# Check system logs
journalctl -f

# Run with debugging
./"BizneAI POS-1.0.0.AppImage" --enable-logging
```

## 📞 Getting Help

### Before Contacting Support

1. **Check this troubleshooting guide**
2. **Search existing issues** on GitHub
3. **Try the solutions above**
4. **Collect error information**:
   - Screenshot of error dialog
   - Console/terminal output
   - System information
   - Steps to reproduce

### Contact Information

- **GitHub Issues**: https://github.com/bizneai/pos-system/issues
- **Documentation**: https://docs.bizneai.com
- **Support Email**: support@bizneai.com

### When Reporting Issues

Please include:
1. **Operating System** and version
2. **App version** (from About menu)
3. **Error message** (exact text)
4. **Steps to reproduce**
5. **System information** (RAM, storage, etc.)
6. **Screenshots** if applicable

## 🔄 Recovery Procedures

### Complete Reset (Use with caution)

**macOS:**
```bash
# Remove app data
rm -rf ~/Library/Application\ Support/BizneAI\ POS
rm -rf ~/Library/Preferences/com.bizneai.pos.plist

# Reinstall app
# Download and install fresh copy
```

**Windows:**
```cmd
# Remove app data
rmdir /s "%APPDATA%\BizneAI POS"
rmdir /s "%LOCALAPPDATA%\BizneAI POS"

# Reinstall app
# Download and install fresh copy
```

**Linux:**
```bash
# Remove app data
rm -rf ~/.config/BizneAI\ POS
rm -rf ~/.local/share/BizneAI\ POS

# Reinstall app
# Download and install fresh copy
```

---

**Last updated**: July 30, 2024  
**Version**: 1.0.0 