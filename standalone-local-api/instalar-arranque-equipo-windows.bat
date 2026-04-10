@echo off
chcp 65001 >nul
REM Requiere ejecutar como ADMINISTRADOR.
REM Arranca el API al encender el PC, aunque nadie haya iniciado sesión aún.
REM Recomendado: carpeta node\ con node.exe portable (SYSTEM no tiene PATH de Node).

cd /d "%~dp0"
net session >nul 2>&1
if errorlevel 1 (
  echo.
  echo Este script debe ejecutarse como administrador:
  echo clic derecho -^> "Ejecutar como administrador"
  pause
  exit /b 1
)

if not exist "%~dp0node\node.exe" (
  echo.
  echo AVISO: No hay .\node\node.exe portable. La cuenta SYSTEM del arranque
  echo no suele tener "node" en el PATH. Coloca el ZIP de Node para Windows
  echo descomprimido en la subcarpeta "node" ^(debe existir node\node.exe^).
  echo.
  pause
)

set "TASK=BizneAI Local API (arranque)"
set "WRAPPER=%~dp0ejecutar-api-con-reintento.cmd"

schtasks /Delete /TN "%TASK%" /F >nul 2>&1

schtasks /Create /TN "%TASK%" /TR "\"%WRAPPER%\"" /SC ONSTART /DELAY 0001:00 /RU SYSTEM /RL HIGHEST /F
if errorlevel 1 (
  echo Fallo al crear la tarea.
  pause
  exit /b 1
)

echo.
echo Tarea "%TASK%" creada: el API intentará iniciar al arranque del equipo.
echo Datos: %~dp0data
echo.
pause
