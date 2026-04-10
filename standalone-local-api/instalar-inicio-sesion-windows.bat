@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
cd /d "%~dp0"

REM Tarea al INICIAR SESIÓN del usuario actual (no suele pedir admin).
REM Retardo 45 s para que red y escritorio estén listos.

set "TASK=BizneAI Local API"
set "WRAPPER=%~dp0ejecutar-api-con-reintento.cmd"

if not exist "%WRAPPER%" (
  echo No se encuentra ejecutar-api-con-reintento.cmd
  pause
  exit /b 1
)

schtasks /Delete /TN "%TASK%" /F >nul 2>&1

schtasks /Create /TN "%TASK%" /TR "\"%WRAPPER%\"" /SC ONLOGON /DELAY 0000:45 /RL LIMITED /F
if errorlevel 1 (
  echo.
  echo No se pudo crear la tarea. Prueba ejecutar este archivo como administrador
  echo o usa instalar-arranque-equipo-windows.bat
  pause
  exit /b 1
)

echo.
echo Listo: "%TASK%" quedará registrada para cada vez que inicies sesión en Windows.
echo El API escuchará en http://127.0.0.1:3000 (revisa firewall si falla).
echo.
echo Para quitar: desinstalar-tarea-windows.bat
echo.
pause
endlocal
