Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OneRoot CRM - Ngrok Tunnel Launcher   " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# 1. Start Backend if not already running on port 5000
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if (-not $port5000) {
    Write-Host "[1/3] Starting Backend Server (Port 5000)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\sales_crm_backend-master\sales_crm_backend-master'; npm run dev"
    Start-Sleep -Seconds 4
} else {
    Write-Host "[1/3] Backend Server already running on port 5000." -ForegroundColor Gray
}

# 2. Start Frontend if not already running on port 3000
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if (-not $port3000) {
    Write-Host "[2/3] Starting Frontend Server (Port 3000)..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\sales_crm-master\sales_crm-master'; npm run dev"
    Start-Sleep -Seconds 5
} else {
    Write-Host "[2/3] Frontend Server already running on port 3000." -ForegroundColor Gray
}

# 3. Start Ngrok Tunnel on Port 3000
Write-Host "[3/3] Starting Ngrok Tunnel on Port 3000..." -ForegroundColor Green
$ngrokCmd = (Get-Command ngrok.cmd -ErrorAction SilentlyContinue).Source
if (-not $ngrokCmd) {
    $ngrokCmd = "$env:APPDATA\npm\ngrok.cmd"
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$ngrokCmd' http 3000"
Start-Sleep -Seconds 3

# Fetch the public URL from ngrok API
try {
    $tunnels = (Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction Stop).tunnels
    $publicUrl = ($tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1).public_url
    if ($publicUrl) {
        Write-Host ""
        Write-Host "==========================================================" -ForegroundColor Green
        Write-Host "  CRM Public Ngrok URL: $publicUrl" -ForegroundColor Yellow
        Write-Host "==========================================================" -ForegroundColor Green
        Write-Host ""
        Start-Process $publicUrl
    }
} catch {
    Write-Host "Ngrok started! Check the ngrok window or http://127.0.0.1:4040 for the public URL." -ForegroundColor Yellow
}
