param(
    [Parameter(Position=0)]
    [string]$Target = "help"
)

function Green  ([string]$m) { Write-Host $m -ForegroundColor Green }
function Yellow ([string]$m) { Write-Host $m -ForegroundColor Yellow }
function Cyan   ([string]$m) { Write-Host $m -ForegroundColor Cyan }
function Red    ([string]$m) { Write-Host $m -ForegroundColor Red }
function Sep    { Write-Host ("=" * 48) -ForegroundColor Cyan }

function Run ([string]$Cmd, [string]$Dir = ".") {
    Push-Location $Dir
    try {
        Invoke-Expression $Cmd
        if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
            Red "FAILED (exit $LASTEXITCODE): $Cmd"
            exit $LASTEXITCODE
        }
    } finally {
        Pop-Location
    }
}

$t = $Target.ToLower().Trim()

if ($t -eq "help") {
    Write-Host ""
    Write-Host "+------------------------------------------------------+" -ForegroundColor Cyan
    Write-Host "|   Plastic Logbook System - PowerShell Task Runner    |" -ForegroundColor Cyan
    Write-Host "|   Usage:  .\make.ps1 [target]                        |" -ForegroundColor Cyan
    Write-Host "+------------------------------------------------------+" -ForegroundColor Cyan
    Write-Host ""
    Yellow "INSTALL"
    Write-Host "  install                Install all dependencies"
    Write-Host "  install-backend        Backend only"
    Write-Host "  install-frontend       Frontend only"
    Write-Host ""
    Yellow "DEV SERVERS"
    Write-Host "  dev                    Start backend (nodemon)"
    Write-Host "  dev-frontend           Start React dev server"
    Write-Host ""
    Yellow "TESTS - ALL"
    Write-Host "  test                   Run ALL backend tests"
    Write-Host "  test-frontend          Run React frontend tests"
    Write-Host "  test-watch             Watch mode"
    Write-Host "  test-coverage          Backend tests + HTML coverage"
    Write-Host "  test-coverage-open     Coverage + open in browser"
    Write-Host "  test-ci                Full CI suite (backend + frontend)"
    Write-Host ""
    Yellow "UNIT TESTS"
    Write-Host "  test-unit              All unit tests"
    Write-Host "  test-unit-auth         authController"
    Write-Host "  test-unit-product      productController"
    Write-Host "  test-unit-middleware   authMiddleware"
    Write-Host ""
    Yellow "INTEGRATION TESTS"
    Write-Host "  test-integration               All integration tests"
    Write-Host "  test-integration-auth          Auth API"
    Write-Host "  test-integration-products      Products API"
    Write-Host "  test-integration-customers     Customers API"
    Write-Host "  test-integration-general       Health check and 404"
    Write-Host ""
    Yellow "DOCKER"
    Write-Host "  docker-build           Build Docker images"
    Write-Host "  docker-up              Start mongo + backend"
    Write-Host "  docker-prod            Start full production stack"
    Write-Host "  docker-test            Run tests inside Docker"
    Write-Host "  docker-down            Stop all containers"
    Write-Host "  docker-logs            Tail container logs"
    Write-Host "  docker-clean           Remove containers, volumes, images"
    Write-Host ""
    Yellow "OTHER"
    Write-Host "  clean                  Remove node_modules and build artifacts"
    Write-Host ""
}
elseif ($t -eq "install") {
    Cyan "Installing backend..."; Run "npm install" "backend"
    Cyan "Installing frontend..."; Run "npm install" "frontend"
    Green "All dependencies installed."
}
elseif ($t -eq "install-backend") {
    Cyan "Installing backend..."; Run "npm install" "backend"; Green "Done."
}
elseif ($t -eq "install-frontend") {
    Cyan "Installing frontend..."; Run "npm install" "frontend"; Green "Done."
}
elseif ($t -eq "dev") {
    Cyan "Starting backend dev server..."; Run "npm run dev" "backend"
}
elseif ($t -eq "dev-frontend") {
    Cyan "Starting React dev server..."; Run "npm start" "frontend"
}
elseif ($t -eq "test") {
    Write-Host ""; Sep; Cyan "  Running ALL Backend Tests"; Sep
    Run "npm test" "backend"
    Green "Backend tests complete."
}
elseif ($t -eq "test-frontend") {
    Write-Host ""; Sep; Cyan "  Running Frontend Tests"; Sep
    $env:CI = "true"
    Run "npm test -- --watchAll=false --passWithNoTests" "frontend"
    Green "Frontend tests complete."
}
elseif ($t -eq "test-watch") {
    Cyan "Watch mode (Ctrl+C to stop)..."
    Run "npm run test:watch" "backend"
}
elseif ($t -eq "test-coverage") {
    Write-Host ""; Sep; Cyan "  Coverage Report"; Sep
    Run "npm run test:coverage" "backend"
    Green "Coverage saved to backend/coverage/"
}
elseif ($t -eq "test-coverage-open") {
    & "$PSScriptRoot\make.ps1" "test-coverage"
    Start-Process "backend\coverage\lcov-report\index.html"
}
elseif ($t -eq "test-ci") {
    Write-Host ""; Sep; Cyan "  CI Mode - Full Suite"; Sep
    & "$PSScriptRoot\make.ps1" "test"
    & "$PSScriptRoot\make.ps1" "test-frontend"
    Green "All CI tests passed!"
}
elseif ($t -eq "test-unit") {
    Write-Host ""; Yellow "Unit Tests - All"; Write-Host ("-" * 40)
    Run "npx jest tests/unit/ --runInBand --forceExit --detectOpenHandles --verbose" "backend"
    Green "Unit tests done."
}
elseif ($t -eq "test-unit-auth") {
    Yellow "Unit: authController"
    Run "npx jest tests/unit/authController.test.js --runInBand --forceExit --detectOpenHandles --verbose" "backend"
}
elseif ($t -eq "test-unit-product") {
    Yellow "Unit: productController"
    Run "npx jest tests/unit/productController.test.js --runInBand --forceExit --detectOpenHandles --verbose" "backend"
}
elseif ($t -eq "test-unit-middleware") {
    Yellow "Unit: authMiddleware"
    Run "npx jest tests/unit/authMiddleware.test.js --runInBand --forceExit --detectOpenHandles --verbose" "backend"
}
elseif ($t -eq "test-integration") {
    Write-Host ""; Yellow "Integration Tests - All"; Write-Host ("-" * 40)
    Run "npx jest tests/integration/ --runInBand --forceExit --detectOpenHandles --verbose" "backend"
    Green "Integration tests done."
}
elseif ($t -eq "test-integration-auth") {
    Yellow "Integration: Auth API"
    Run "npx jest tests/integration/auth.test.js --runInBand --forceExit --detectOpenHandles --verbose" "backend"
}
elseif ($t -eq "test-integration-products") {
    Yellow "Integration: Products API"
    Run "npx jest tests/integration/products.test.js --runInBand --forceExit --detectOpenHandles --verbose" "backend"
}
elseif ($t -eq "test-integration-customers") {
    Yellow "Integration: Customers API"
    Run "npx jest tests/integration/customers.test.js --runInBand --forceExit --detectOpenHandles --verbose" "backend"
}
elseif ($t -eq "test-integration-general") {
    Yellow "Integration: Health and 404"
    Run "npx jest tests/integration/general.test.js --runInBand --forceExit --detectOpenHandles --verbose" "backend"
}
elseif ($t -eq "docker-build") {
    Cyan "Building Docker images..."; Run "docker-compose build"; Green "Done."
}
elseif ($t -eq "docker-up") {
    Cyan "Starting backend + MongoDB..."
    Run "docker-compose up -d mongo backend"
    Green "Running at http://localhost:5000"
}
elseif ($t -eq "docker-prod") {
    Cyan "Starting full production stack..."
    Run "docker-compose --profile production up -d"
    Green "Frontend: http://localhost:80 | Backend: http://localhost:5000"
}
elseif ($t -eq "docker-test") {
    Cyan "Running tests inside Docker..."
    Run "docker-compose --profile test up --abort-on-container-exit --exit-code-from backend-test"
    Green "Docker test run complete."
}
elseif ($t -eq "docker-down") {
    Cyan "Stopping containers..."; Run "docker-compose down"; Green "Done."
}
elseif ($t -eq "docker-logs") {
    Run "docker-compose logs -f"
}
elseif ($t -eq "docker-clean") {
    Red "Removing containers, volumes, images..."
    Run "docker-compose down -v --rmi local --remove-orphans"
    Green "Docker cleanup done."
}
elseif ($t -eq "clean") {
    Red "Removing node_modules and build artifacts..."
    @("backend\node_modules","frontend\node_modules","frontend\build","backend\coverage") |
        Where-Object { Test-Path $_ } |
        ForEach-Object { Remove-Item -Recurse -Force $_ }
    Green "Clean complete."
}
else {
    Red "Unknown target: '$Target'"
    Write-Host "Run '.\make.ps1 help' to see all targets."
    exit 1
}
