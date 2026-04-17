# =================================================================
# install.ps1 — Instala as dependências Python de todos os serviços
# =================================================================
# Uso (primeira vez):
#   .\scripts\install.ps1
#
# Executa `python -m pip install -r requirements.txt` em cada um
# dos 4 serviços. Rode uma vez antes do primeiro .\start.ps1.
# =================================================================

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot

$servicos = @(
    "product-service",
    "inventory-service",
    "sales-service",
    "api-gateway"
)

Write-Host ""
Write-Host "================================================" -ForegroundColor Yellow
Write-Host "  Instalando dependencias (4 servicos)          " -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow
Write-Host ""

foreach ($svc in $servicos) {
    $path = Join-Path $ROOT "services\$svc"
    Write-Host ""
    Write-Host "--- $svc ---" -ForegroundColor Cyan
    Push-Location $path
    try {
        python -m pip install -r requirements.txt -q
        Write-Host "  OK" -ForegroundColor Green
    } catch {
        Write-Host "  ERRO: $_" -ForegroundColor Red
    }
    Pop-Location
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Pronto. Proximo passo:                        " -ForegroundColor Green
Write-Host "    .\scripts\start.ps1                         " -ForegroundColor White
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
