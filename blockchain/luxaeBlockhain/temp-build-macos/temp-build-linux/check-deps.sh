#!/bin/bash

echo "=== Verificando Dependencias de Luxae ==="

REQUIRED_DEPS=(
    "libp2p"
    "@chainsafe/libp2p-noise"
    "@libp2p/bootstrap"
    "@libp2p/mplex"
    "@libp2p/tcp"
    "@libp2p/peer-id"
    "@libp2p/peer-id-factory"
    "@libp2p/peer-store"
)

echo "Verificando node_modules..."
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules no encontrado"
    exit 1
fi

MISSING_DEPS=()
for dep in "${REQUIRED_DEPS[@]}"; do
    if [ ! -d "node_modules/$dep" ]; then
        MISSING_DEPS+=($dep)
    fi
done

if [ ${#MISSING_DEPS[@]} -eq 0 ]; then
    echo "✅ Todas las dependencias están instaladas"
else
    echo "❌ Faltan las siguientes dependencias:"
    printf '%s\n' "${MISSING_DEPS[@]}"
    
    echo "Instalando dependencias faltantes..."
    pnpm add "${MISSING_DEPS[@]}"
fi 