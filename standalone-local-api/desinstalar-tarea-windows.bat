@echo off
chcp 65001 >nul
schtasks /Delete /TN "BizneAI Local API" /F 2>nul
schtasks /Delete /TN "BizneAI Local API (arranque)" /F 2>nul
echo Tareas BizneAI eliminadas (si existían).
pause
