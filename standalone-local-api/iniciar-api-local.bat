@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

REM Datos SQLite y subidas (misma idea que Electron: carpeta dedicada)
set "BIZNEAI_USER_DATA=%~dp0data"
set "BIZNEAI_EMBEDDED=1"
if not defined PORT set "PORT=3000"

REM Node portable: coloca node.exe (y DLLs) en la subcarpeta .\node\
if exist "%~dp0node\node.exe" (
  "%~dp0node\node.exe" "%~dp0start.cjs"
) else (
  where node >nul 2>&1
  if errorlevel 1 (
    echo.
    echo [ERROR] No se encontró Node.js.
    echo Opción A: Instala Node.js LTS desde https://nodejs.org y vuelve a ejecutar este archivo.
    echo Opción B: Descarga el ZIP "Windows Binary" de Node para tu arquitectura y descomprime
    echo           el contenido en la carpeta "%~dp0node" ^(debe existir node\node.exe^).
    echo.
    pause
    exit /b 1
  )
  node "%~dp0start.cjs"
)

pause
endlocal
