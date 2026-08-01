param(
  [string]$BaseUrl = "http://localhost:8080/api/v1",
  [string]$EnvFile = "docs/postman/simpelappi-local.postman_environment.json"
)

$ErrorActionPreference = "Stop"

Write-Host "[SIMPELAPPI] Running Newman collections..." -ForegroundColor Cyan

$collections = @(
  "docs/postman/simpelappi-v1.postman_collection.json",
  "docs/postman/simpelappi-v1-negative-tests.postman_collection.json",
  "docs/postman/simpelappi-v1-own-unit-tests.postman_collection.json"
)

foreach ($collection in $collections) {
  Write-Host "`n[RUN] $collection" -ForegroundColor Yellow
  npx newman run $collection --environment $EnvFile --env-var "baseUrl=$BaseUrl" --reporters cli,junit --reporter-junit-export "newman-$(Split-Path $collection -Leaf).xml"
}

Write-Host "`n[SIMPELAPPI] Newman run completed." -ForegroundColor Green
