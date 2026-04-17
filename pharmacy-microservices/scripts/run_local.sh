#!/usr/bin/env bash
# ---------------------------------------------------------------
# run_local.sh — Sobe os 4 serviços localmente (sem Docker).
#
# Útil para desenvolvimento rápido com hot reload.
# Cada serviço roda em background; Ctrl+C mata todos.
# ---------------------------------------------------------------

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# URLs para comunicação entre serviços (apontam para localhost)
export PRODUCT_SERVICE_URL="http://localhost:8001"
export INVENTORY_SERVICE_URL="http://localhost:8002"
export SALES_SERVICE_URL="http://localhost:8003"

PIDS=()

cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null || true
    done
    wait 2>/dev/null || true
    echo "✅ Encerrado."
}
trap cleanup EXIT INT TERM

start_service() {
    local nome="$1"
    local porta="$2"
    local dir="services/$nome"
    echo "▶️  Subindo $nome em :$porta"
    (
        cd "$dir"
        python -m uvicorn app.main:app --reload --port "$porta" \
            > "/tmp/${nome}.log" 2>&1
    ) &
    PIDS+=($!)
}

echo "🚀 Pharmacy Microservices — modo local"
echo ""

start_service "product-service"   8001
start_service "inventory-service" 8002
start_service "sales-service"     8003
start_service "api-gateway"       8000

echo ""
echo "📡 Serviços:"
echo "   Gateway:      http://localhost:8000/docs"
echo "   Product:      http://localhost:8001/docs"
echo "   Inventory:    http://localhost:8002/docs"
echo "   Sales:        http://localhost:8003/docs"
echo ""
echo "📋 Logs em /tmp/<service>.log"
echo ""
echo "⚠️  Pressione Ctrl+C para parar todos."
echo ""

# Aguarda indefinidamente (até Ctrl+C)
wait
