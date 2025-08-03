@echo off
setlocal enabledelayedexpansion

echo 🚀 BizneAI Windows Installer Build Script
echo ==========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH
    pause
    exit /b 1
)

echo [INFO] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Application build failed
    pause
    exit /b 1
)
echo [SUCCESS] Application built successfully

echo [INFO] Building Windows installers...
call npm run dist:win
if %errorlevel% neq 0 (
    echo [ERROR] Windows installer build failed
    pause
    exit /b 1
)
echo [SUCCESS] Windows installers created successfully

echo.
echo [INFO] Build Summary:
echo ====================
if exist release (
    echo Installer files in release/ directory:
    dir /b release\*.exe release\*.msi 2>nul
    
    echo.
    echo File sizes:
    for %%f in (release\*.exe release\*.msi) do (
        if exist "%%f" (
            for %%A in ("%%f") do echo %%~zA bytes - %%~nxA
        )
    )
) else (
    echo [WARNING] No release directory found
)

echo.
echo [SUCCESS] Build process completed!
echo [INFO] Installers are ready in the release/ directory
pause 