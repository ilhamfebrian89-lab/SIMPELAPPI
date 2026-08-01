param(
  [Parameter(Mandatory = $true)]
  [string]$PeriodMonth,
  [string]$DbHost = "localhost",
  [string]$DbPort = "5432",
  [string]$DbName = "simpelappi",
  [string]$DbUser = "simpelappi",
  [string]$OutputRoot = "evidence/kpi"
)

$ErrorActionPreference = "Stop"

if ($PeriodMonth -notmatch "^\d{4}-\d{2}$") {
  throw "PeriodMonth harus format YYYY-MM, contoh 2026-08"
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$queryFile = Join-Path $projectRoot "scripts/kpi-monthly-report.sql"

if (-not (Test-Path $queryFile)) {
  throw "File query tidak ditemukan: $queryFile"
}

$outputDir = Join-Path $projectRoot (Join-Path $OutputRoot $PeriodMonth)
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

$outputFile = Join-Path $outputDir "kpi-monthly-query-output.txt"
$runMetaFile = Join-Path $outputDir "kpi-monthly-run-meta.txt"

Write-Host "[SIMPELAPPI] Menjalankan ekstraksi KPI untuk $PeriodMonth" -ForegroundColor Cyan
Write-Host "[SIMPELAPPI] Output folder: $outputDir" -ForegroundColor Cyan

$env:PGPASSWORD = $env:PGPASSWORD
if (-not $env:PGPASSWORD) {
  Write-Warning "PGPASSWORD belum diset. Jika DB memerlukan password, set env var PGPASSWORD sebelum menjalankan script."
}

$psqlCmd = @(
  "-h", $DbHost,
  "-p", $DbPort,
  "-U", $DbUser,
  "-d", $DbName,
  "-v", "period_month='$PeriodMonth'",
  "-f", $queryFile
)

$startTime = Get-Date

try {
  psql @psqlCmd | Tee-Object -FilePath $outputFile
}
catch {
  throw "Gagal menjalankan query KPI: $($_.Exception.Message)"
}

$endTime = Get-Date

@(
  "period_month=$PeriodMonth",
  "db_host=$DbHost",
  "db_port=$DbPort",
  "db_name=$DbName",
  "db_user=$DbUser",
  "query_file=$queryFile",
  "output_file=$outputFile",
  "started_at=$($startTime.ToString('s'))",
  "ended_at=$($endTime.ToString('s'))"
) | Set-Content -Path $runMetaFile -Encoding UTF8

Write-Host "[SIMPELAPPI] Ekstraksi KPI selesai." -ForegroundColor Green
Write-Host "[SIMPELAPPI] Hasil query: $outputFile" -ForegroundColor Green
Write-Host "[SIMPELAPPI] Metadata run: $runMetaFile" -ForegroundColor Green
