# Run All Automated Test Suites
$Root = Split-Path -Parent $PSScriptRoot

Write-Host ">>> Running Backend Tests (pytest)..." -ForegroundColor Cyan
Push-Location (Join-Path $Root "apps\api")
$PythonExe = Join-Path $Root "apps\api\.venv\Scripts\python.exe"
if (-not (Test-Path $PythonExe)) { $PythonExe = "python" }
& $PythonExe -m pytest -v
$BackendExit = $LASTEXITCODE
Pop-Location

Write-Host ">>> Running Frontend Tests (vitest)..." -ForegroundColor Cyan
Push-Location (Join-Path $Root "apps\web")
npm run test
$FrontendExit = $LASTEXITCODE
Pop-Location

if ($BackendExit -eq 0 -and $FrontendExit -eq 0) {
    Write-Host ">>> ALL TESTS PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Host ">>> SOME TESTS FAILED!" -ForegroundColor Red
    exit 1
}
