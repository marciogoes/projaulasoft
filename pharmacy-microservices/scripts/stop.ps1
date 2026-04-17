# =================================================================
# stop.ps1 - Para todos os servicos do Pharmacy Microservices
# =================================================================
# Uso:
#   .\scripts\stop.ps1
#
# Mata processos escutando nas portas 8000, 8001, 8002, 8003, 5500.
# (Tenta tambem 5000 caso alguem tenha usado a versao antiga)
# =================================================================

Write-Host ""
Write-Host "Parando servicos..." -ForegroundColor Yellow
Write-Host ""

$portas = @(
    @{ Port=8000; Name="api-gateway" },
    @{ Port=8001; Name="product-service" },
    @{ Port=8002; Name="inventory-service" },
    @{ Port=8003; Name="sales-service" },
    @{ Port=5500; Name="frontend" },
    @{ Port=5000; Name="frontend (legacy)" }
)

foreach ($p in $portas) {
    $connection = Get-NetTCPConnection -LocalPort $p.Port -State Listen -ErrorAction SilentlyContinue
    if ($connection) {
        $procId = $connection.OwningProcess | Select-Object -First 1
        if ($procId) {
            try {
                $proc = Get-Process -Id $procId -ErrorAction Stop
                Stop-Process -Id $procId -Force -ErrorAction Stop
                Write-Host ("  [OK] {0,-22} :{1} (PID {2}, {3})" -f $p.Name, $p.Port, $procId, $proc.ProcessName) -ForegroundColor Green
            } catch {
                Write-Host ("  [X]  {0,-22} :{1} - nao foi possivel parar" -f $p.Name, $p.Port) -ForegroundColor Red
            }
        }
    } else {
        Write-Host ("  [.]  {0,-22} :{1} (ja estava livre)" -f $p.Name, $p.Port) -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Pronto." -ForegroundColor Green
Write-Host ""
