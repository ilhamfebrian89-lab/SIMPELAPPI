param(
  [string]$BaseUrl = "http://localhost:8080/api/v1",
  [string]$EnvFile = "docs/postman/simpelappi-local.postman_environment.json",
  [string]$TestPassword = $env:SIMPELAPPI_TEST_PASSWORD
)

$ErrorActionPreference = "Stop"

if (-not $TestPassword) {
  throw "TestPassword belum diset. Gunakan parameter -TestPassword atau env var SIMPELAPPI_TEST_PASSWORD."
}

Write-Host "[SIMPELAPPI] Running Newman collections..." -ForegroundColor Cyan

$collections = @(
  "docs/postman/simpelappi-v1.postman_collection.json",
  "docs/postman/simpelappi-v1-negative-tests.postman_collection.json",
  "docs/postman/simpelappi-v1-own-unit-tests.postman_collection.json"
)

foreach ($collection in $collections) {
  Write-Host "`n[RUN] $collection" -ForegroundColor Yellow
  npx --yes newman@6.2.1 run $collection --environment $EnvFile --env-var "baseUrl=$BaseUrl" --env-var "password=$TestPassword" --reporters cli,junit --reporter-junit-export "newman-$(Split-Path $collection -Leaf).xml"
  if ($LASTEXITCODE -ne 0) {
    throw "Newman gagal untuk collection: $collection (exit code $LASTEXITCODE)"
  }
}

Write-Host "`n[SIMPELAPPI] Newman run completed." -ForegroundColor Green
