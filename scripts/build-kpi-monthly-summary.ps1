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
$csvFile = Join-Path $periodDir "kpi-scorecard-draft.csv"
$metaFile = Join-Path $periodDir "kpi-monthly-run-meta.txt"
$summaryFile = Join-Path $periodDir "kpi-monthly-summary.md"

if (-not (Test-Path $csvFile)) {
  throw "File scorecard tidak ditemukan: $csvFile. Jalankan build-kpi-scorecard.ps1 terlebih dahulu."
}

$rows = Import-Csv -Path $csvFile
if (-not $rows -or $rows.Count -eq 0) {
  throw "Data scorecard kosong pada: $csvFile"
}

$totalKpi = $rows.Count
$filledKpi = ($rows | Where-Object { $_.Actual -and $_.Actual -ne "N/A" }).Count
$naKpi = $totalKpi - $filledKpi

$filledItems = $rows | Where-Object { $_.Actual -and $_.Actual -ne "N/A" }
$previewItems = $filledItems | Select-Object -First 5

$metaLines = @()
if (Test-Path $metaFile) {
  $metaLines = Get-Content -Path $metaFile
}

$summary = @()
$summary += "# KPI Monthly Summary"
$summary += ""
$summary += "Period: $PeriodMonth"
$summary += "Generated at: $((Get-Date).ToString('s'))"
$summary += ""
$summary += "## Executive Snapshot"
$summary += ""
$summary += "- Total KPI tracked: $totalKpi"
$summary += "- KPI with actual value: $filledKpi"
$summary += "- KPI pending external data: $naKpi"
$summary += ""

if ($previewItems.Count -gt 0) {
  $summary += "## KPI With Available Actuals"
  $summary += ""
  foreach ($item in $previewItems) {
    $summary += "- $($item.KPI): actual $($item.Actual), target $($item.Target)"
  }
  $summary += ""
}

$summary += "## Data Completeness Notes"
$summary += ""
$summary += "- KPI dengan nilai N/A umumnya membutuhkan data dari APM, incident platform, atau service desk."
$summary += "- Lengkapi kolom Status dan Action Plan pada scorecard sebelum review bulanan."
$summary += ""

$summary += "## Evidence Files"
$summary += ""
$files = Get-ChildItem -Path $periodDir -File | Sort-Object Name
foreach ($f in $files) {
  $summary += "- $($f.Name)"
}
$summary += ""

if ($metaLines.Count -gt 0) {
  $summary += "## Run Metadata"
  $summary += ""
  foreach ($line in $metaLines) {
    $summary += "- $line"
  }
  $summary += ""
}

$summary += "## Next Review Actions"
$summary += ""
$summary += "1. Validasi KPI yang masih N/A dengan owner terkait."
$summary += "2. Finalisasi dokumen laporan bulanan berdasarkan scorecard."
$summary += "3. Simpan summary ini sebagai lampiran review KPI bulanan."

$summary -join "`n" | Set-Content -Path $summaryFile -Encoding UTF8

Write-Host "[SIMPELAPPI] KPI monthly summary generated." -ForegroundColor Green
Write-Host "- Summary: $summaryFile" -ForegroundColor Green
