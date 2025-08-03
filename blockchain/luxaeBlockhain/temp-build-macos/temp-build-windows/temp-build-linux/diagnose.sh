
#!/bin/bash
echo "=== Diagnóstico del Dashboard ==="
echo "Verificando node_modules..."
ls -l node_modules | wc -l
echo "Verificando dist..."
ls -l dist 2>/dev/null || echo "dist no existe"
echo "Verificando puertos en uso..."
lsof -i :3000,3001
echo "=== Fin del diagnóstico ==="

