@echo off
REM Arranca el API en primer plano (bloquea hasta que Node termine).
cd /d "%~dp0"
set "BIZNEAI_USER_DATA=%~dp0data"
set "BIZNEAI_EMBEDDED=1"
if not defined PORT set "PORT=3000"
if exist "%~dp0node\node.exe" (
  "%~dp0node\node.exe" "%~dp0start.cjs"
) else (
  node "%~dp0start.cjs"
)
exit /b %ERRORLEVEL%
