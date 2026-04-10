@echo off
REM Vigilancia: reinicia el API si cae. Si :3000 ya responde (p. ej. otro proceso), no lanza un segundo Node.
cd /d "%~dp0"
if not exist "%~dp0logs" mkdir "%~dp0logs" 2>nul
:loop
call :health_ok
if %errorlevel%==0 (
  timeout /t 45 /nobreak >nul
  goto loop
)
call "%~dp0ejecutar-api.cmd" >> "%~dp0logs\api-reinicios.log" 2>&1
echo %date% %time% El proceso del API terminó. Nuevo intento en 10 segundos... >> "%~dp0logs\api-reinicios.log"
timeout /t 10 /nobreak >nul
goto loop

:health_ok
powershell -NoProfile -Command "try { $r=Invoke-WebRequest -Uri 'http://127.0.0.1:3000/health' -TimeoutSec 2 -UseBasicParsing; exit([int]($r.StatusCode -ne 200)) } catch { exit 1 }"
exit /b %ERRORLEVEL%
