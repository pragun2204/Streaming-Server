# Start Watch Party Development Stack on Windows
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting Watch Party Development Stack   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$Root = Split-Path -Parent $PSScriptRoot

# 1. Start LiveKit Server (if binary exists)
$LiveKitExe = Join-Path $Root "infra\livekit\bin\livekit-server.exe"
if (Test-Path $LiveKitExe) {
    Write-Host "[1/3] Launching LiveKit SFU on port 7880..." -ForegroundColor Green
    Start-Process -FilePath $LiveKitExe -ArgumentList "--dev" -NoNewWindow
} else {
    Write-Host "[1/3] LiveKit binary not found at $LiveKitExe, skipping local SFU launch." -ForegroundColor Yellow
}

# 2. Start FastAPI Backend
Write-Host "[2/3] Launching FastAPI Backend on port 8000..." -ForegroundColor Green
$PythonExe = Join-Path $Root "apps\api\.venv\Scripts\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python"
}
$BackendJob = Start-Process -FilePath $PythonExe -ArgumentList "-m uvicorn app.main:app --reload --port 8000" -WorkingDirectory (Join-Path $Root "apps\api") -PassThru

# 3. Start Vite Frontend
Write-Host "[3/3] Launching Vite Frontend on port 5173..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory (Join-Path $Root "apps\web")

Write-Host ""
Write-Host "Application is running!" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend API: http://localhost:8000/docs" -ForegroundColor White
Write-Host "LiveKit SFU: ws://localhost:7880" -ForegroundColor White
Write-Host ""
