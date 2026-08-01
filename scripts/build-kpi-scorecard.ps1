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
$queryOutput = Join-Path $periodDir "kpi-monthly-query-output.txt"
$scorecardMd = Join-Path $periodDir "kpi-scorecard-draft.md"
$scorecardCsv = Join-Path $periodDir "kpi-scorecard-draft.csv"

if (-not (Test-Path $queryOutput)) {
  throw "File hasil query tidak ditemukan: $queryOutput. Jalankan scripts/export-kpi-monthly.ps1 terlebih dahulu."
}

$content = Get-Content $queryOutput -Raw

function Get-ValueFromLine {
  param(
    [string]$Text,
    [string]$Pattern
  )
  $m = [regex]::Match($Text, $Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if ($m.Success) { return $m.Groups[1].Value.Trim() }
  return ""
}

# Heuristic extraction for psql table output (best effort)
$deploymentCount = Get-ValueFromLine -Text $content -Pattern "deployment_count\s*\|\s*([0-9\.]+)"
$changeFailureRate = Get-ValueFromLine -Text $content -Pattern "change_failure_rate_percent\s*\|\s*([0-9\.]+)"
$rtlClosureRate = Get-ValueFromLine -Text $content -Pattern "rtl_closure_rate_percent\s*\|\s*([0-9\.]+)"
$notificationReadRate = Get-ValueFromLine -Text $content -Pattern "notification_read_rate_percent\s*\|\s*([0-9\.]+)"

# Fields not available from current SQL extraction are marked N/A for manual completion
$rows = @(
  [pscustomobject]@{ KPI = "Availability (%)"; Target = "99.5"; Actual = "N/A"; Gap = "N/A"; Status = "N/A"; Owner = "IT/DevOps"; Action = "Isi dari monitoring platform" },
  [pscustomobject]@{ KPI = "API 5xx Rate (%)"; Target = "1.0"; Actual = "N/A"; Gap = "N/A"; Status = "N/A"; Owner = "IT/DevOps"; Action = "Isi dari observability/API gateway" },
  [pscustomobject]@{ KPI = "P95 Dashboard (s)"; Target = "3.0"; Actual = "N/A"; Gap = "N/A"; Status = "N/A"; Owner = "Backend"; Action = "Isi dari APM" },
  [pscustomobject]@{ KPI = "P95 Write Endpoint (s)"; Target = "2.0"; Actual = "N/A"; Gap = "N/A"; Status = "N/A"; Owner = "Backend"; Action = "Isi dari APM" },
  [pscustomobject]@{ KPI = "Deployment Frequency"; Target = "2"; Actual = $(if ($deploymentCount) { $deploymentCount } else { "N/A" }); Gap = "N/A"; Status = "N/A"; Owner = "Engineering Lead"; Action = "Review cadence release" },
  [pscustomobject]@{ KPI = "Change Failure Rate (%)"; Target = "10"; Actual = $(if ($changeFailureRate) { $changeFailureRate } else { "N/A" }); Gap = "N/A"; Status = "N/A"; Owner = "Engineering Lead"; Action = "Review rollback/deploy_failed" },
  [pscustomobject]@{ KPI = "RTL Closure Rate (%)"; Target = "N/A"; Actual = $(if ($rtlClosureRate) { $rtlClosureRate } else { "N/A" }); Gap = "N/A"; Status = "N/A"; Owner = "L2/L3"; Action = "Validasi efektivitas RTL" },
  [pscustomobject]@{ KPI = "Notification Read Rate (%)"; Target = "N/A"; Actual = $(if ($notificationReadRate) { $notificationReadRate } else { "N/A" }); Gap = "N/A"; Status = "N/A"; Owner = "Application Support"; Action = "Evaluasi engagement notifikasi" },
  [pscustomobject]@{ KPI = "MTTA SEV-1 (minutes)"; Target = "10"; Actual = "N/A"; Gap = "N/A"; Status = "N/A"; Owner = "L1/L2"; Action = "Isi dari incident platform" },
  [pscustomobject]@{ KPI = "MTTR SEV-1 (minutes)"; Target = "120"; Actual = "N/A"; Gap = "N/A"; Status = "N/A"; Owner = "L2/L3"; Action = "Isi dari incident platform" },
  [pscustomobject]@{ KPI = "Privileged Access Review (%)"; Target = "100"; Actual = "N/A"; Gap = "N/A"; Status = "N/A"; Owner = "IT Security"; Action = "Isi dari evidence access review" },
  [pscustomobject]@{ KPI = "Ticket SLA Adherence (%)"; Target = "95"; Actual = "N/A"; Gap = "N/A"; Status = "N/A"; Owner = "Service Desk"; Action = "Isi dari service desk" },
  [pscustomobject]@{ KPI = "CSAT"; Target = "4.2"; Actual = "N/A"; Gap = "N/A"; Status = "N/A"; Owner = "Service Desk"; Action = "Isi dari survey" }
)

$rows | Export-Csv -Path $scorecardCsv -NoTypeInformation -Encoding UTF8

$md = @()
$md += "# SIMPELAPPI KPI Scorecard Draft"
$md += ""
$md += "Periode: $PeriodMonth"
$md += "Sumber data: $queryOutput"
$md += ""
$md += "| KPI | Target | Aktual | Gap | Status | Owner | Action Plan |"
$md += "|---|---:|---:|---:|---|---|---|"

foreach ($r in $rows) {
  $md += "| $($r.KPI) | $($r.Target) | $($r.Actual) | $($r.Gap) | $($r.Status) | $($r.Owner) | $($r.Action) |"
}

$md += ""
$md += "Catatan: Kolom N/A perlu dilengkapi dari observability, incident platform, dan service desk."

$md -join "`n" | Set-Content -Path $scorecardMd -Encoding UTF8

Write-Host "[SIMPELAPPI] Scorecard draft generated." -ForegroundColor Green
Write-Host "- Markdown: $scorecardMd" -ForegroundColor Green
Write-Host "- CSV: $scorecardCsv" -ForegroundColor Green
