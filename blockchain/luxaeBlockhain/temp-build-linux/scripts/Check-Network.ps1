Write-Host "=== Diagnóstico de Red Luxae ===" -ForegroundColor Cyan

function Test-Endpoint {
    param (
        [string]$Url,
        [string]$Name
    )
    
    Write-Host "`nVerificando $Name..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "$Url/health" -UseBasicParsing -TimeoutSec 5
        Write-Host " ✓ Disponible" -ForegroundColor Green
        return $true
    } catch {
        Write-Host " ✗ No responde" -ForegroundColor Red
        return $false
    }
}

# Verificar nodos locales
Test-Endpoint -Url "http://localhost:3000" -Name "API Local"
Test-Endpoint -Url "http://localhost:3001" -Name "Dashboard Local"

# Verificar nodos remotos
Test-Endpoint -Url "http://161.22.47.84/api" -Name "API Remota"
Test-Endpoint -Url "http://161.22.47.84" -Name "Dashboard Remoto"

# Verificar puerto P2P
Write-Host "`nVerificando conectividad P2P..."
$testConnection = Test-NetConnection -ComputerName "161.22.47.84" -Port 30303 -WarningAction SilentlyContinue
if ($testConnection.TcpTestSucceeded) {
    Write-Host "✓ Puerto P2P (30303) accesible" -ForegroundColor Green
} else {
    Write-Host "✗ Puerto P2P (30303) no accesible" -ForegroundColor Red
}

# Mostrar información de red
Write-Host "`nInformación de Red:" -ForegroundColor Cyan
Get-NetIPAddress | Where-Object { $_.AddressFamily -eq 'IPv4' } | Format-Table IPAddress,InterfaceAlias

# Verificar latencia
Write-Host "`nVerificando latencia al servidor..." -ForegroundColor Cyan
Test-Connection -ComputerName "161.22.47.84" -Count 4 