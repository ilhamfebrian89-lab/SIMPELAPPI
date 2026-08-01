param(
  [Parameter(Mandatory = $true)]
  [string]$PeriodMonth,
  [string]$EvidenceRoot = "evidence/kpi"
)

$ErrorActionPreference = "Stop"

if ($PeriodMonth -notmatch "^\d{4}-\d{2}$") {
  throw "PeriodMonth harus format YYYY-MM, contoh 2026-08"
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$periodDir = Join-Path $projectRoot (Join-Path $EvidenceRoot $PeriodMonth)

if (-not (Test-Path $periodDir)) {
  throw "Folder evidence tidak ditemukan: $periodDir"
}

$requiredFiles = @(
  "kpi-monthly-query-output.txt",
  "kpi-monthly-run-meta.txt",
  "kpi-scorecard-draft.md",
  "kpi-scorecard-draft.csv",
  "kpi-monthly-summary.md",
  "kpi-evidence-index.md"
)

$missing = @()
foreach ($f in $requiredFiles) {
  $fp = Join-Path $periodDir $f
  if (-not (Test-Path $fp)) {
    $missing += $f
  }
}

if ($missing.Count -gt 0) {
  throw "File evidence belum lengkap: $($missing -join ', ')"
}

$archiveName = "simpelappi-kpi-evidence-$PeriodMonth.zip"
$archivePath = Join-Path $periodDir $archiveName

if (Test-Path $archivePath) {
  Remove-Item $archivePath -Force
}

$filesToPack = $requiredFiles | ForEach-Object { Join-Path $periodDir $_ }
Compress-Archive -Path $filesToPack -DestinationPath $archivePath

$manifestPath = Join-Path $periodDir "kpi-evidence-manifest.txt"
$lines = @()
$lines += "period_month=$PeriodMonth"
$lines += "archive_file=$archivePath"
$lines += "generated_at=$((Get-Date).ToString('s'))"
$lines += "files="
foreach ($f in $requiredFiles) {
  $lines += "- $f"
}
$lines | Set-Content -Path $manifestPath -Encoding UTF8

Write-Host "[SIMPELAPPI] Evidence package created." -ForegroundColor Green
Write-Host "- Archive: $archivePath" -ForegroundColor Green
Write-Host "- Manifest: $manifestPath" -ForegroundColor Green
