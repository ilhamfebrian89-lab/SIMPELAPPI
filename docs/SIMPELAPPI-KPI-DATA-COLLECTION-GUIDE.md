# SIMPELAPPI KPI Data Collection Guide

## Tujuan

Panduan ini menjelaskan cara mengekstrak data KPI bulanan dari database untuk mengisi:

- docs/SIMPELAPPI-KPI-BASELINE-2026-Q3.md
- docs/SIMPELAPPI-KPI-MONTHLY-REPORT-TEMPLATE.md

## File Query

- scripts/kpi-monthly-report.sql
- scripts/export-kpi-monthly.ps1
- scripts/build-kpi-scorecard.ps1

## Prasyarat

- PostgreSQL client (`psql`) tersedia
- Database SIMPELAPPI sudah terisi data operasional
- User memiliki hak baca pada schema terkait

## Cara Menjalankan

Contoh untuk periode Agustus 2026:

```bash
psql -h localhost -U simpelappi -d simpelappi -v period_month='2026-08' -f scripts/kpi-monthly-report.sql
```

Atau gunakan automasi PowerShell yang direkomendasikan:

```powershell
$env:PGPASSWORD = "your-database-password"
.\scripts\export-kpi-monthly.ps1 -PeriodMonth "2026-08" -DbHost "localhost" -DbPort "5432" -DbName "simpelappi" -DbUser "simpelappi"
```

Output otomatis:

- evidence/kpi/2026-08/kpi-monthly-query-output.txt
- evidence/kpi/2026-08/kpi-monthly-run-meta.txt

## Generate Draft Scorecard

Setelah query output tersedia, jalankan:

```powershell
.\scripts\build-kpi-scorecard.ps1 -PeriodMonth "2026-08"
```

Output:

- evidence/kpi/2026-08/kpi-scorecard-draft.md
- evidence/kpi/2026-08/kpi-scorecard-draft.csv

Catatan:

- Beberapa KPI seperti MTTA, MTTR, dan CSAT biasanya perlu dilengkapi dari sistem insiden dan service desk.

## One-Click Pipeline

Untuk menjalankan seluruh proses sekaligus:

```powershell
$env:PGPASSWORD = "your-database-password"
.\scripts\run-kpi-monthly-pipeline.ps1 -PeriodMonth "2026-08" -DbHost "localhost" -DbPort "5432" -DbName "simpelappi" -DbUser "simpelappi"
```

Pipeline akan menghasilkan:

- kpi-monthly-query-output.txt
- kpi-monthly-run-meta.txt
- kpi-scorecard-draft.md
- kpi-scorecard-draft.csv
- kpi-monthly-summary.md
- kpi-evidence-index.md
- simpelappi-kpi-evidence-YYYY-MM.zip
- kpi-evidence-manifest.txt

## Mapping Query ke KPI

- Deployment Frequency dan Change Failure Rate bersumber dari `generic_audit.audit_trails` dengan aksi release.
- Operational workload berasal dari jumlah data monitoring, audit, RTL, dan surveilans per bulan.
- RTL Closure Rate dihitung dari persentase RTL status `closed`.
- Notification Read Rate menjadi indikator engagement notifikasi.
- Monitoring Score Trend memakai rata-rata skor monitoring harian.

## Catatan Penting

- Untuk KPI seperti MTTA, MTTR, CSAT, dan Ticket SLA, data umumnya berasal dari sistem ticketing atau incident yang terpisah.
- Jika data release belum tercatat di audit_trails, gunakan sumber CI/CD log sebagai interim.
- Simpan output query bulanan sebagai evidence audit.

## Format Evidence

Simpan hasil query dalam folder evidence internal, contoh naming:

- evidence/kpi/2026-08/kpi-monthly-query-output.txt
- evidence/kpi/2026-08/kpi-scorecard-approved.pdf
