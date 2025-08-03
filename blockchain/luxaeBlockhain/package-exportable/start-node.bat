@echo off
echo 🚀 Iniciando Luxae Blockchain Node...
cd node && npm install && start /b npm run start:api-v2
cd ../frontend && npm install && start /b npm run dev
echo ✅ Nodo iniciado en http://localhost:5173
pause
