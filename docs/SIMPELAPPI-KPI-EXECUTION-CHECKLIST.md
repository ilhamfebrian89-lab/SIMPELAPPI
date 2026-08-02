# SIMPELAPPI KPI Execution Checklist

## Tujuan

Checklist operasional ini memastikan proses laporan KPI bulanan berjalan konsisten dan dapat diaudit.

## Pre-Run Checklist

- [ ] Data operasional bulan target sudah lengkap
- [ ] Akses DB tersedia (host, user, password)
- [ ] Variable PGPASSWORD sudah di-set
- [ ] Script terbaru tersedia di folder scripts

## Run Pipeline

Jalankan perintah berikut dari root project:

```powershell
$env:PGPASSWORD = "your-database-password"
.\scripts\run-kpi-monthly-pipeline.ps1 -PeriodMonth "2026-08" -DbHost "localhost" -DbPort "5432" -DbName "simpelappi" -DbUser "simpelappi"
```

## Expected Output

Folder output:

- evidence/kpi/2026-08/

File minimum:

- kpi-monthly-query-output.txt
- kpi-monthly-run-meta.txt
- kpi-scorecard-draft.md
- kpi-scorecard-draft.csv
- kpi-monthly-summary.md
- kpi-evidence-index.md
- simpelappi-kpi-evidence-period-YYYY-MM.zip
- kpi-evidence-manifest.txt

## Post-Run Checklist

- [ ] Draft scorecard di-review owner KPI
- [ ] KPI yang masih N/A dilengkapi dari sumber eksternal (APM, incident, service desk)
- [ ] Laporan final diisi pada template bulanan
- [ ] Evidence folder diarsipkan
- [ ] Ringkasan KPI dipresentasikan pada review bulanan

## Audit Evidence

Simpan artefak berikut:

- output query mentah
- metadata run
- draft scorecard
- laporan bulanan final
- approval atau notulen review

## CI Scheduled Run

Workflow tersedia:

- .github/workflows/kpi-monthly.yml

Jadwal default:

- tanggal 2 setiap bulan, pukul 01:00 UTC

Secret minimum yang harus diisi di GitHub repository:

- SIMPELAPPI_DB_HOST
- SIMPELAPPI_DB_PORT
- SIMPELAPPI_DB_NAME
- SIMPELAPPI_DB_USER
- SIMPELAPPI_DB_PASSWORD

Workflow juga dapat dijalankan manual melalui `workflow_dispatch` dengan input `period_month` (format YYYY-MM). Jika dikosongkan, workflow menggunakan bulan sebelumnya dalam UTC.
