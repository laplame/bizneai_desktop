#!/bin/bash

echo "=== Diagnóstico Detallado del Dashboard ==="

echo -e "\n1. Verificando estructura de archivos:"
ls -la

echo -e "\n2. Verificando node_modules:"
if [ -d "node_modules" ]; then
    echo "✓ node_modules existe"
    echo "Total módulos: $(ls -l node_modules | wc -l)"
else
    echo "✗ node_modules no existe"
fi

echo -e "\n3. Verificando dist:"
if [ -d "dist" ]; then
    echo "✓ dist existe"
    ls -la dist
else
    echo "✗ dist no existe"
fi

echo -e "\n4. Verificando puertos:"
echo "Puerto 3000:"
lsof -i :3000 || echo "- Libre"
echo "Puerto 3001:"
lsof -i :3001 || echo "- Libre"

echo -e "\n5. Verificando react-icons:"
if [ -d "node_modules/react-icons" ]; then
    echo "✓ react-icons instalado"
    ls -la node_modules/react-icons/fa
else
    echo "✗ react-icons no encontrado"
fi

echo -e "\n=== Fin del diagnóstico ===\n"

