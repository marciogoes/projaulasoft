# =================================================================
# start.ps1 — Sobe todo o sistema Pharmacy Microservices
# =================================================================
# Uso (a partir da raiz do projeto):
#   .\scripts\start.ps1
#
# O que faz:
#   1. Abre 4 janelas PowerShell — uma para cada microsserviço
#   2. Abre uma 5a janela servindo o frontend estático
#   3. Aguarda os serviços responderem
#   4. Abre o navegador em http://localhost:5000
#
# Para parar tudo:
#   .\scripts\stop.ps1
#
# Pré-requisito: deps instaladas em cada serviço. Se der erro,
#   rode primeiro: .\scripts\install.ps1
# =================================================================

$ErrorActionPreference = "Stop"

# Pasta raiz do projeto (1 nível acima de scripts/)
$ROOT = Split-Path -Parent $PSScriptRoot

function Start-MicroService {
    param(
        [string]$Name,
        [int]$Port,
        [string]$RelativePath
    )
    $path = Join-Path $ROOT $RelativePath
    if (-not (Test-Path $path)) {
        Write-Host "  ✗ Pasta não encontrada: $path" -ForegroundColor Red
        return
    }
    Write-Host "  ▶  $Name em :$Port" -ForegroundColor Cyan
    Start-Process powershell -ArgumentList @(
        '-NoExit',
        '-Command',
        "`$host.ui.RawUI.WindowTitle = '$Name (:$Port)'; cd '$path'; python -m uvicorn app.main:app --port $Port --reload"
    )
}

function Test-PortOpen {
    param([int]$Port, [int]$TimeoutSeconds = 30)
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:$Port/health" -TimeoutSec 1 -ErrorAction Stop
            if ($r.StatusCode -eq 200) { return $true }
        } catch { }
        Start-Sleep -Milliseconds 500
        $elapsed += 0.5
    }
    return $false
}

# --- Banner ---
Write-Host ""
Write-Host "================================================" -ForegroundColor Yellow
Write-Host "  Pharmacy Microservices - Iniciando            " -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Raiz do projeto: $ROOT" -ForegroundColor Gray
Write-Host ""

# --- Sobe os 4 microsserviços ---
Write-Host "[1/3] Subindo microsserviços..." -ForegroundColor White
Start-MicroService -Name "product-service"   -Port 8001 -RelativePath "services\product-service"
Start-MicroService -Name "inventory-service" -Port 8002 -RelativePath "services\inventory-service"
Start-MicroService -Name "sales-service"     -Port 8003 -RelativePath "services\sales-service"
Start-MicroService -Name "api-gateway"       -Port 8000 -RelativePath "services\api-gateway"

# --- Aguarda health checks responderem ---
Write-Host ""
Write-Host "[2/3] Aguardando serviços responderem..." -ForegroundColor White
$services = @(
    @{ Name="product-service";   Port=8001 },
    @{ Name="inventory-service"; Port=8002 },
    @{ Name="sales-service";     Port=8003 },
    @{ Name="api-gateway";       Port=8000 }
)
$allOk = $true
foreach ($s in $services) {
    Write-Host "  ." -NoNewline
    if (Test-PortOpen -Port $s.Port -TimeoutSeconds 30) {
        Write-Host ("`r  OK  {0,-20} :{1}" -f $s.Name, $s.Port) -ForegroundColor Green
    } else {
        Write-Host ("`r  X   {0,-20} :{1} (nao respondeu em 30s)" -f $s.Name, $s.Port) -ForegroundColor Red
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Host ""
    Write-Host "AVISO: Alguns serviços não subiram. Veja as janelas abertas" -ForegroundColor Yellow
    Write-Host "  para ver o erro, ou rode: .\scripts\install.ps1" -ForegroundColor Yellow
    Write-Host ""
}

# --- Sobe o frontend ---
Write-Host ""
Write-Host "[3/3] Subindo frontend estático..." -ForegroundColor White
$frontendPath = Join-Path $ROOT "frontend"
if (Test-Path $frontendPath) {
    Write-Host "  ▶  frontend em :5000" -ForegroundColor Cyan
    Start-Process powershell -ArgumentList @(
        '-NoExit',
        '-Command',
        "`$host.ui.RawUI.WindowTitle = 'frontend (:5000)'; cd '$frontendPath'; python -m http.server 5000"
    )
    Start-Sleep -Seconds 2

    Write-Host ""
    Write-Host "Abrindo navegador em http://localhost:5000" -ForegroundColor Green
    Start-Process "http://localhost:5000"
} else {
    Write-Host "  ⚠  Pasta frontend/ não encontrada — pulando" -ForegroundColor Yellow
}

# --- Resumo ---
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Sistema no ar                                 " -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:  " -NoNewline; Write-Host "http://localhost:5000" -ForegroundColor Cyan
Write-Host "  Gateway:   " -NoNewline; Write-Host "http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  Product:   " -NoNewline; Write-Host "http://localhost:8001/docs" -ForegroundColor Cyan
Write-Host "  Inventory: " -NoNewline; Write-Host "http://localhost:8002/docs" -ForegroundColor Cyan
Write-Host "  Sales:     " -NoNewline; Write-Host "http://localhost:8003/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Popular dados de exemplo:"
Write-Host "    python scripts\seed_data.py" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Parar tudo:"
Write-Host "    .\scripts\stop.ps1" -ForegroundColor Yellow
Write-Host "    (ou feche as 5 janelas PowerShell abertas)"
Write-Host ""
