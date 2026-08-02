param(
  [string]$RootPath = (Join-Path $PSScriptRoot '..')
)

$ErrorActionPreference = 'Stop'

$resolvedRoot = (Resolve-Path $RootPath).Path
$auditHtml = Join-Path $resolvedRoot 'audit.html'
$auditJs = Join-Path $resolvedRoot 'audit.js'
$bundlesHtml = Join-Path $resolvedRoot 'bundles-hais.html'
$monitoringHtml = Join-Path $resolvedRoot 'monitoring.html'
$monitoringJs = Join-Path $resolvedRoot 'monitoring.js'
$isolationCategoriesJs = Join-Path $resolvedRoot 'isolation-categories.js'
$shellJs = Join-Path $resolvedRoot 'shell.js'
$stylesCss = Join-Path $resolvedRoot 'styles.css'

function Assert-FileExists {
  param([string]$PathToCheck)

  if (-not (Test-Path $PathToCheck)) {
    throw "Missing required file: $PathToCheck"
  }
}

function Assert-Contains {
  param(
    [string]$PathToCheck,
    [string]$Pattern,
    [string]$Description
  )

  $content = Get-Content -Path $PathToCheck -Raw
  if ($content -notmatch $Pattern) {
    throw "Missing required marker ($Description) in $PathToCheck"
  }
}

Write-Host '[SIMPELAPPI] Validating audit page files...' -ForegroundColor Cyan

Assert-FileExists -PathToCheck $auditHtml
Assert-FileExists -PathToCheck $auditJs
Assert-FileExists -PathToCheck $bundlesHtml
Assert-FileExists -PathToCheck $monitoringHtml
Assert-FileExists -PathToCheck $monitoringJs
Assert-FileExists -PathToCheck $isolationCategoriesJs
Assert-FileExists -PathToCheck $shellJs
Assert-FileExists -PathToCheck $stylesCss

Assert-Contains -PathToCheck $auditHtml -Pattern '<script src="audit\.js"></script>' -Description 'external audit.js include'
Assert-Contains -PathToCheck $auditHtml -Pattern 'id="autosaveActivityInfo"' -Description 'autosave live region'
Assert-Contains -PathToCheck $auditHtml -Pattern 'id="saveShortcutHint"' -Description 'save shortcut hint'
Assert-Contains -PathToCheck $auditHtml -Pattern 'href="index\.html"' -Description 'dashboard navigation link'
Assert-Contains -PathToCheck $auditHtml -Pattern 'href="monitoring\.html"' -Description 'monitoring navigation link'
Assert-Contains -PathToCheck $auditHtml -Pattern 'href="rtl\.html"' -Description 'rtl navigation link'
Assert-Contains -PathToCheck $auditHtml -Pattern 'href="error-state\.html"' -Description 'error state link'

Assert-Contains -PathToCheck $auditJs -Pattern 'canInitializeAuditPage' -Description 'audit initialization guard'
Assert-Contains -PathToCheck $auditJs -Pattern 'debug-audit' -Description 'opt-in debug flag'
Assert-Contains -PathToCheck $auditJs -Pattern 'restoreResetSnapshotFromSession\(\);' -Description 'reset snapshot restore'
Assert-Contains -PathToCheck $auditJs -Pattern 'window\.addEventListener\(\x27pagehide\x27, handlePageHide\)' -Description 'pagehide flush handler'
Assert-Contains -PathToCheck $auditJs -Pattern 'success-state\.html' -Description 'success redirect target'

Assert-Contains -PathToCheck $bundlesHtml -Pattern 'const DEFAULT_BUNDLES = \[' -Description 'Bundles HAIs configuration'
Assert-Contains -PathToCheck $bundlesHtml -Pattern 'all-or-none' -Description 'all-or-none compliance calculation'
Assert-Contains -PathToCheck $bundlesHtml -Pattern 'const MENU=\[\["dashboard","Dashboard"\],\["input","Input Audit"\],\["riwayat","Riwayat"\],\["laporan","Laporan"\],\["pengaturan","Pengaturan"\]\]' -Description 'five Bundles HAIs views'
Assert-Contains -PathToCheck $bundlesHtml -Pattern 'localStorage\.setItem' -Description 'local audit persistence'
Assert-Contains -PathToCheck $bundlesHtml -Pattern 'href="index\.html"' -Description 'SIMPELAPPI return link'
Assert-Contains -PathToCheck $shellJs -Pattern "href: 'bundles-hais\.html'.*label: 'Bundles HAIs'" -Description 'Bundles HAIs menu destination'

Assert-Contains -PathToCheck $monitoringHtml -Pattern '<script src="monitoring\.js" defer></script>' -Description 'monitoring form script'
Assert-Contains -PathToCheck $monitoringHtml -Pattern '<script src="isolation-categories\.js" defer></script>' -Description 'isolation category configuration script'
Assert-Contains -PathToCheck $monitoringHtml -Pattern 'id="isolationAssessmentForm"' -Description 'isolation assessment form'
Assert-Contains -PathToCheck $monitoringHtml -Pattern 'id="auditorSignature"' -Description 'digital signature canvas'
Assert-Contains -PathToCheck $monitoringHtml -Pattern 'id="signatureLocationDate"' -Description 'signature location and date'
Assert-Contains -PathToCheck $monitoringHtml -Pattern 'id="signatureAuditorName".*readonly' -Description 'automatic read-only auditor signature name'
Assert-Contains -PathToCheck $monitoringHtml -Pattern 'id="findingPhotoCamera".*capture="environment"' -Description 'finding photo camera input'
Assert-Contains -PathToCheck $monitoringHtml -Pattern 'id="findingPhotoUpload".*multiple' -Description 'finding photo upload input'
Assert-Contains -PathToCheck $monitoringHtml -Pattern 'id="findingPhotoCount">0 foto' -Description 'finding photo counter'
Assert-Contains -PathToCheck $monitoringHtml -Pattern '<option>Instalasi Gawat Darurat</option>' -Description 'first hospital unit'
Assert-Contains -PathToCheck $monitoringHtml -Pattern '<option>Bank Mata</option>' -Description 'final hospital unit'
Assert-Contains -PathToCheck $monitoringJs -Pattern 'window\.simpelappiIsolationCategories' -Description 'isolation category configuration'
Assert-Contains -PathToCheck $isolationCategoriesJs -Pattern 'parsedIsolationCategories\.length !== 29' -Description '29 isolation category integrity check'
Assert-Contains -PathToCheck $isolationCategoriesJs -Pattern 'isolationAssessmentItemCount !== 284' -Description '284 assessment item integrity check'
Assert-Contains -PathToCheck $isolationCategoriesJs -Pattern 'Transportasi Limbah Medis ke Pihak Ketiga' -Description 'final isolation category'
Assert-Contains -PathToCheck $monitoringJs -Pattern 'signatureCanvas\.toDataURL' -Description 'digital signature capture'
Assert-Contains -PathToCheck $monitoringJs -Pattern 'signatureLocationDate\.textContent = `Bandung, \$\{formattedDate\}`' -Description 'dynamic Bandung signature date'
Assert-Contains -PathToCheck $monitoringJs -Pattern 'signatureNameInput\.value = auditorInput\.value' -Description 'automatic auditor signature name'
Assert-Contains -PathToCheck $monitoringJs -Pattern "canvas\.toDataURL\('image/jpeg', 0\.6\)" -Description 'automatic finding photo compression'
Assert-Contains -PathToCheck $monitoringJs -Pattern 'photos: findingPhotos\.slice\(\)' -Description 'finding photos persisted with observation'

Assert-Contains -PathToCheck $stylesCss -Pattern '\.autosave-activity\.is-active::after' -Description 'autosave animation'
Assert-Contains -PathToCheck $stylesCss -Pattern 'prefers-reduced-motion: reduce' -Description 'reduced motion support'

Assert-FileExists -PathToCheck (Join-Path $resolvedRoot 'index.html')
Assert-FileExists -PathToCheck (Join-Path $resolvedRoot 'rtl.html')
Assert-FileExists -PathToCheck (Join-Path $resolvedRoot 'error-state.html')
Assert-FileExists -PathToCheck (Join-Path $resolvedRoot 'success-state.html')
Assert-FileExists -PathToCheck (Join-Path $resolvedRoot 'empty-state.html')

$successState = Join-Path $resolvedRoot 'success-state.html'
$errorState = Join-Path $resolvedRoot 'error-state.html'
$emptyState = Join-Path $resolvedRoot 'empty-state.html'

Assert-Contains -PathToCheck $successState -Pattern 'Success State Standard' -Description 'success state heading'
Assert-Contains -PathToCheck $successState -Pattern 'href="index\.html"' -Description 'success state dashboard link'
Assert-Contains -PathToCheck $successState -Pattern 'href="monitoring\.html"' -Description 'success state monitoring link'

Assert-Contains -PathToCheck $errorState -Pattern 'Error State Standard' -Description 'error state heading'
Assert-Contains -PathToCheck $errorState -Pattern 'href="monitoring\.html"' -Description 'error state monitoring link'
Assert-Contains -PathToCheck $errorState -Pattern 'href="index\.html"' -Description 'error state dashboard link'

Assert-Contains -PathToCheck $emptyState -Pattern 'Empty State Standard' -Description 'empty state heading'
Assert-Contains -PathToCheck $emptyState -Pattern 'href="audit\.html"' -Description 'empty state audit link'
Assert-Contains -PathToCheck $emptyState -Pattern 'href="index\.html"' -Description 'empty state dashboard link'

Write-Host '[SIMPELAPPI] Audit page validation completed successfully.' -ForegroundColor Green