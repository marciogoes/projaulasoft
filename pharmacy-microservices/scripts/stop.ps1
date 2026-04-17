# =================================================================
# stop.ps1 - Para todos os servicos do Pharmacy Microservices
# =================================================================
# Uso:
#   .\scripts\stop.ps1
#
# Mata processos escutando nas portas 8000, 8001, 8002, 8003 e 5000.
# Usa $procId em vez de $pid (variavel reservada no PowerShell).
# =================================================================

Write-Host ""
Write-Host "Parando servicos..." -ForegroundColor Yellow
Write-Host ""

$portas = @(
    @{ Port=8000; Name="api-gateway" },
    @{ Port=8001; Name="product-service" },
    @{ Port=8002; Name="inventory-service" },
    @{ Port=8003; Name="sales-service" },
    @{ Port=5000; Name="frontend" }
)

foreach ($p in $portas) {
    $connection = Get-NetTCPConnection -LocalPort $p.Port -State Listen -ErrorAction SilentlyContinue
    if ($connection) {
        $procId = $connection.OwningProcess | Select-Object -First 1
        if ($procId) {
            try {
                $proc = Get-Process -Id $procId -ErrorAction Stop
                Stop-Process -Id $procId -Force -ErrorAction Stop
                Write-Host ("  [OK] {0,-20} :{1} (PID {2}, {3})" -f $p.Name, $p.Port, $procId, $proc.ProcessName) -ForegroundColor Green
            } catch {
                Write-Host ("  [X]  {0,-20} :{1} - nao foi possivel parar" -f $p.Name, $p.Port) -ForegroundColor Red
            }
        }
    } else {
        Write-Host ("  [.]  {0,-20} :{1} (ja estava livre)" -f $p.Name, $p.Port) -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Pronto." -ForegroundColor Green
Write-Host ""
Write-Host "As janelas PowerShell abertas podem permanecer visiveis -" -ForegroundColor Gray
Write-Host "feche-as manualmente se quiser." -ForegroundColor Gray
Write-Host ""
