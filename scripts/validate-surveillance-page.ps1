param(
  [string]$RootPath = (Join-Path $PSScriptRoot '..')
)

$ErrorActionPreference = 'Stop'
$resolvedRoot = (Resolve-Path $RootPath).Path
$html = Join-Path $resolvedRoot 'surveilans.html'
$script = Join-Path $resolvedRoot 'surveilans.js'
$login = Join-Path $resolvedRoot 'login.js'
$migration = Join-Path $resolvedRoot 'database/migrations/V007__extend_surveillance_case_data.sql'
$rollback = Join-Path $resolvedRoot 'database/rollback/R007__rollback_extend_surveillance_case_data.sql'

function Assert-Contains {
  param([string]$PathToCheck, [string]$Pattern, [string]$Description)
  if ((Get-Content -Raw $PathToCheck) -notmatch $Pattern) {
    throw "Missing required marker ($Description) in $PathToCheck"
  }
}

Write-Host '[SIMPELAPPI] Validating surveillance form...' -ForegroundColor Cyan

foreach ($requiredFile in @($html, $script, $login, $migration, $rollback)) {
  if (-not (Test-Path $requiredFile)) {
    throw "Missing required file: $requiredFile"
  }
}

Assert-Contains $html '<script src="surveilans\.js" defer></script>' 'surveillance form script'
Assert-Contains $html '<legend>A\. Identitas Pasien</legend>' 'patient identity section'
Assert-Contains $html '<legend>B\. Jenis Surveilans</legend>' 'surveillance type section'
Assert-Contains $html '<legend>C\. Data Klinis</legend>' 'clinical section'
Assert-Contains $html '<legend>D\. Pemeriksaan Penunjang</legend>' 'supporting examination section'
Assert-Contains $html '<legend>E\. Pencegahan dan Pengendalian Infeksi</legend>' 'infection control section'
Assert-Contains $html '<legend>F\. Pelaporan</legend>' 'reporting section'
Assert-Contains $html '<legend>G\. Outcome</legend>' 'outcome section'
Assert-Contains $html '<legend>H\. Verifikasi IPCN</legend>' 'IPCN verification section'
Assert-Contains $html 'data-surveillance-section="hais"' 'HAIs dynamic section'
Assert-Contains $html 'data-surveillance-section="tuberculosis"' 'TB dynamic section'
Assert-Contains $html 'data-surveillance-section="hiv_aids"' 'HIV dynamic section'
Assert-Contains $html 'data-surveillance-section="outbreak"' 'outbreak dynamic section'
Assert-Contains $html 'data-surveillance-section="other"' 'other infection dynamic section'
Assert-Contains $html '<option>Endophthalmitis</option>' 'final HAIs option'
Assert-Contains $html '<option>Marburg</option>' 'outbreak disease option'

Assert-Contains $script 'function updateDynamicSections\(\)' 'dynamic form controller'
Assert-Contains $script 'function buildApiPayload\(unitId\)' 'complete API payload builder'
Assert-Contains $script '/api/v1/surveilans/cases' 'database API submission'
Assert-Contains $script 'simpelappi\.surveillance\.draft\.v1' 'local draft persistence'
Assert-Contains $script 'belum tersimpan ke database' 'explicit offline database status'
Assert-Contains $login '/api/v1/auth/login' 'API login endpoint'
Assert-Contains $login 'simpelappi\.accessToken' 'access token persistence'

Assert-Contains $migration 'add column dynamic_data jsonb' 'dynamic surveillance database data'
Assert-Contains $migration 'add column verification_data jsonb' 'IPCN verification database data'
Assert-Contains $rollback 'drop column if exists dynamic_data' 'dynamic surveillance rollback'
Assert-Contains $rollback 'drop column if exists verification_data' 'verification rollback'

Write-Host '[SIMPELAPPI] Surveillance form validation completed successfully.' -ForegroundColor Green
