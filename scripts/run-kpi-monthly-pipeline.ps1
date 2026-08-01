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
$exportScript = Join-Path $projectRoot "scripts/export-kpi-monthly.ps1"
$buildScript = Join-Path $projectRoot "scripts/build-kpi-scorecard.ps1"
$summaryScript = Join-Path $projectRoot "scripts/build-kpi-monthly-summary.ps1"
$packageScript = Join-Path $projectRoot "scripts/package-kpi-evidence.ps1"

if (-not (Test-Path $exportScript)) {
  throw "Script tidak ditemukan: $exportScript"
}
if (-not (Test-Path $buildScript)) {
  throw "Script tidak ditemukan: $buildScript"
}
if (-not (Test-Path $summaryScript)) {
  throw "Script tidak ditemukan: $summaryScript"
}
if (-not (Test-Path $packageScript)) {
  throw "Script tidak ditemukan: $packageScript"
}

Write-Host "[SIMPELAPPI] Step 1/3 - Export KPI query output" -ForegroundColor Cyan
& $exportScript -PeriodMonth $PeriodMonth -DbHost $DbHost -DbPort $DbPort -DbName $DbName -DbUser $DbUser -OutputRoot $OutputRoot

Write-Host "[SIMPELAPPI] Step 2/3 - Build KPI scorecard draft" -ForegroundColor Cyan
& $buildScript -PeriodMonth $PeriodMonth -EvidenceRoot $OutputRoot

Write-Host "[SIMPELAPPI] Step 3/4 - Build KPI monthly summary" -ForegroundColor Cyan
& $summaryScript -PeriodMonth $PeriodMonth -EvidenceRoot $OutputRoot

Write-Host "[SIMPELAPPI] Step 4/5 - Build evidence index" -ForegroundColor Cyan
$periodDir = Join-Path $projectRoot (Join-Path $OutputRoot $PeriodMonth)
$indexFile = Join-Path $periodDir "kpi-evidence-index.md"

$files = Get-ChildItem -Path $periodDir -File | Sort-Object Name
$lines = @()
$lines += "# KPI Evidence Index"
$lines += ""
$lines += "Periode: $PeriodMonth"
$lines += "Generated at: $((Get-Date).ToString('s'))"
$lines += ""
$lines += "## Files"
$lines += ""
foreach ($f in $files) {
  $sizeKb = [math]::Round($f.Length / 1KB, 2)
  $lines += "- $($f.Name) ($sizeKb KB)"
}
$lines += ""
$lines += "## Next Actions"
$lines += ""
$lines += "1. Review kpi-scorecard-draft.md"
$lines += "2. Review kpi-monthly-summary.md"
$lines += "3. Lengkapi KPI N/A dari APM/incident/service desk"
$lines += "4. Finalisasi laporan di docs/SIMPELAPPI-KPI-MONTHLY-REPORT-TEMPLATE.md"

$lines -join "`n" | Set-Content -Path $indexFile -Encoding UTF8

Write-Host "[SIMPELAPPI] Step 5/5 - Package evidence" -ForegroundColor Cyan
& $packageScript -PeriodMonth $PeriodMonth -EvidenceRoot $OutputRoot

Write-Host "[SIMPELAPPI] Pipeline selesai." -ForegroundColor Green
Write-Host "[SIMPELAPPI] Evidence index: $indexFile" -ForegroundColor Green
