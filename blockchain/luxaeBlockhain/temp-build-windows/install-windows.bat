@echo off
echo Instalando Luxae Blockchain en Windows...

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js no está instalado. Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

REM Instalar dependencias
npm install

REM Crear directorios necesarios
mkdir data 2>nul
mkdir chaindb 2>nul
mkdir blockchainDB 2>nul
mkdir validator-keys 2>nul
mkdir consensus 2>nul
mkdir logs 2>nul

echo Instalacion completada. Ejecuta 'npm start' para iniciar el nodo.
pause
