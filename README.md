# SIMPELAPPI Prototype

Proyek ini berisi prototype statis awal untuk SIMPELAPPI berdasarkan spesifikasi UX/UI dan domain-driven design.

## CI Status

[![SQL Migration Check](https://github.com/ilhamfebrian89-lab/SIMPELAPPI/actions/workflows/sql-check.yml/badge.svg)](https://github.com/ilhamfebrian89-lab/SIMPELAPPI/actions/workflows/sql-check.yml)
[![Audit Page Check](https://github.com/ilhamfebrian89-lab/SIMPELAPPI/actions/workflows/audit-page-check.yml/badge.svg)](https://github.com/ilhamfebrian89-lab/SIMPELAPPI/actions/workflows/audit-page-check.yml)
[![Backend Check](https://github.com/ilhamfebrian89-lab/SIMPELAPPI/actions/workflows/backend-check.yml/badge.svg)](https://github.com/ilhamfebrian89-lab/SIMPELAPPI/actions/workflows/backend-check.yml)

Quality gate otomatis pada pull request:

- `SQL Migration Check` menjalankan migrasi, rollback, dan migrasi ulang pada PostgreSQL 16.
- `Audit Page Check` memeriksa sintaks JavaScript dan integritas halaman audit.
- `Backend Check` menjalankan type-check, test, dan build API Fastify.

Ketiga workflow dijalankan pada setiap pull request agar required check tidak tertahan ketika perubahan berada di luar path tertentu.

Workflow yang memerlukan layanan eksternal dijalankan terpisah:

- `Newman API Tests` dijalankan manual dengan input URL API yang aktif.
- `Release Gate` menggabungkan pemeriksaan SQL dan UI, dengan Newman opsional ketika API tersedia.
- `KPI Monthly Pipeline` berjalan tanggal 2 setiap bulan atau secara manual menggunakan GitHub Actions secrets database.

> **Catatan:** frontend masih berupa prototipe statis. Backend Fastify menyediakan kontrak API awal dan perlu dihubungkan ke halaman HTML pada tahap berikutnya.

## Struktur File

- `index.html` — dashboard command center utama
- `login.html` — halaman login
- `monitoring.html` — form monitoring digital
- `monitoring.js` — formulir audit dan supervisi 29 jenis kewaspadaan isolasi
- `isolation-categories.js` — 284 item penilaian untuk 29 jenis kewaspadaan isolasi
- `bundles-hais.html` — aplikasi audit Bundles HAIs dengan dashboard, riwayat, laporan, dan pengaturan
- `audit.html` — form audit digital
- `surveilans.html` — form surveilans HAI
- `rtl.html` — task management RTL
- `report.html` — halaman laporan
- `notification.html` — notifikasi terpusat
- `profile.html` — pengaturan akun
- `admin.html` — panel administrasi
- `component-library.html` — contoh komponen UI
- `empty-state.html` — standar empty state
- `success-state.html` — standar success state
- `error-state.html` — standar error state
- `styles.css` — design token dan style system
- `ui-design-spec.md` — ringkasan spesifikasi UI
- `docs/SIMPELAPPI-BAB-VIII-DDD.md` — BAB VIII Domain Driven Design
- `docs/SIMPELAPPI-BAB-IX-API-ARCHITECTURE.md` — BAB IX API & System Architecture
- `docs/SIMPELAPPI-BAB-X-DATA-MODEL.md` — BAB X Data Model & Database Design
- `docs/SIMPELAPPI-BAB-XI-PHYSICAL-DATABASE-SCHEMA.md` — BAB XI Physical Database Schema (Initial DDL)
- `docs/SIMPELAPPI-BAB-XII-API-CONTRACT-DETAIL.md` — BAB XII API Contract Detail
- `docs/SIMPELAPPI-BAB-XIII-INTEGRATION-SECURITY.md` — BAB XIII Integration & Security Architecture
- `docs/openapi/simpelappi-v1.yaml` — Draft OpenAPI 3.1
- `docs/postman/simpelappi-v1.postman_collection.json` — Postman collection v1
- `docs/postman/simpelappi-v1-negative-tests.postman_collection.json` — Postman negative test collection
- `docs/postman/simpelappi-v1-own-unit-tests.postman_collection.json` — Postman OWN-UNIT RBAC tests
- `docs/postman/simpelappi-local.postman_environment.json` — environment variable untuk local API testing
- `docs/postman/simpelappi-token-claims-examples.json` — contoh payload claims token untuk uji RBAC
- `docs/SIMPELAPPI-RBAC-MATRIX.md` — RBAC endpoint-per-role matrix
- `docs/SIMPELAPPI-LOCAL-DEV-RUNBOOK.md` — runbook setup lokal developer dan QA
- `docs/SIMPELAPPI-CI-NEWMAN.md` — panduan automasi Newman untuk CI
- `docs/SIMPELAPPI-BAB-XIV-DEPLOYMENT-RELEASE-STRATEGY.md` — BAB XIV deployment dan release strategy
- `docs/SIMPELAPPI-BAB-XV-OPERATIONS-RUNBOOK.md` — BAB XV operations runbook
- `docs/SIMPELAPPI-BAB-XVI-COMPLIANCE-AUDIT-READINESS.md` — BAB XVI compliance dan audit readiness
- `docs/SIMPELAPPI-BAB-XVII-OPERATIONAL-KPI.md` — BAB XVII KPI operasional dan performa layanan
- `docs/SIMPELAPPI-KPI-BASELINE-2026-Q3.md` — baseline numerik KPI operasional (Q3 2026)
- `docs/SIMPELAPPI-KPI-MONTHLY-REPORT-TEMPLATE.md` — template laporan KPI bulanan
- `docs/SIMPELAPPI-KPI-DATA-COLLECTION-GUIDE.md` — panduan ekstraksi data KPI dari database
- `docs/SIMPELAPPI-KPI-EXECUTION-CHECKLIST.md` — checklist eksekusi KPI bulanan end-to-end
- `docs/SIMPELAPPI-BRANCH-PROTECTION-CHECKLIST.md` — checklist konfigurasi branch protection
- `database/migrations/V001__init_schema.sql` — baseline migration SQL
- `database/migrations/V002__seed_initial_data.sql` — baseline seed data (unit, role, user)
- `database/migrations/V003__seed_templates_and_questions.sql` — seed template monitoring, question bank, dan master enum
- `database/migrations/V004__seed_audit_templates.sql` — seed audit template, check item, dan recommendation library
- `database/migrations/V005__seed_e2e_demo_data.sql` — seed data demo end-to-end audit dan RTL
- `database/migrations/V006__add_user_credentials.sql` — tabel kredensial internal tanpa default password
- `database/rollback/*.sql` — rollback script per versi migrasi (R001-R006)
- `scripts/run-newman.ps1` — runner koleksi Postman via Newman
- `scripts/kpi-monthly-report.sql` — query SQL untuk ekstraksi KPI bulanan
- `scripts/export-kpi-monthly.ps1` — automasi export KPI bulanan ke folder evidence
- `scripts/build-kpi-scorecard.ps1` — generator draft scorecard KPI (Markdown + CSV)
- `scripts/build-kpi-monthly-summary.ps1` — generator ringkasan KPI bulanan untuk stakeholder
- `scripts/package-kpi-evidence.ps1` — pembuat paket evidence KPI bulanan (ZIP + manifest)
- `scripts/run-kpi-monthly-pipeline.ps1` — one-click pipeline export + scorecard + evidence index
- `evidence/kpi/<YYYY-MM>/` — output bukti KPI bulanan (generated)
- `.github/workflows/newman.yml` — workflow GitHub Actions untuk Newman test
- `.github/workflows/sql-check.yml` — workflow validasi SQL migration dan rollback
- `.github/workflows/audit-page-check.yml` — workflow validasi audit page, audit.js, dan state page
- `.github/workflows/backend-check.yml` — workflow type-check, test, dan build backend
- `.github/workflows/release-gate.yml` — workflow release gate SQL, UI, backend, dan Newman opsional
- `.github/workflows/kpi-monthly.yml` — workflow terjadwal bulanan untuk KPI pipeline dan evidence artifact
- `.github/branch-protection-ruleset-example.json` — template ruleset branch protection
- `.github/ISSUE_TEMPLATE/incident-report.yml` — template issue untuk pelaporan insiden
- `.github/ISSUE_TEMPLATE/post-incident-review.yml` — template issue untuk PIR (root cause analysis)
- `.github/ISSUE_TEMPLATE/config.yml` — konfigurasi template issue GitHub
- `.env.ci.example` — template variabel secret untuk setup CI
- `.env.example` — template konfigurasi backend lokal tanpa kredensial nyata
- `.gitignore` — pengecualian report Newman, evidence KPI, dan environment lokal
- `docker/docker-compose.dev.yml` — local dev stack (PostgreSQL, pgAdmin, MailHog)
- `src/` — source code backend Fastify TypeScript
- `package.json` — perintah development, build, test, dan provisioning password
- `Dockerfile` — image production backend API

## Cara Menjalankan

Buka file `index.html` langsung di browser, atau gunakan server lokal sederhana untuk frontend.

Backend API dapat dijalankan dengan:

```powershell
Copy-Item .env.example .env
# Ganti JWT_SECRET di .env dengan secret acak minimal 32 karakter.
npm install
npm run dev
```

Endpoint pemeriksaan:

- `GET http://localhost:8080/health`
- `GET http://localhost:8080/ready`

Setelah migrasi database dijalankan, buat kredensial pengguna tanpa menyimpan password di repository:

```powershell
$env:DATABASE_URL = "postgresql://simpelappi:simpelappi_dev@localhost:5432/simpelappi"
$env:SIMPELAPPI_USER_PASSWORD = "<password-kuat-minimal-12-karakter>"
npm run user:set-password -- --user ipcn@simpelappi.local --username ipcn_admin
```

Ulangi perintah tersebut untuk akun role lain yang digunakan dalam pengujian RBAC.

## Deployment Vercel

Vercel digunakan untuk frontend statis. File `vercel.json` menjalankan `npm run build:vercel` dan memublikasikan folder `public`.

```powershell
npm run build:vercel
```

Backend Fastify tidak ikut dipublikasikan sebagai aset statis dan harus dijalankan pada layanan Node.js dengan PostgreSQL.

Untuk verifikasi cepat halaman audit dan state page terkait, jalankan:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\validate-audit-page.ps1
```

Jalankan validasi ini setiap kali mengubah `audit.html`, `audit.js`, `styles.css`, atau halaman state terkait.

## Konfigurasi Repository

1. Salin nama variabel dari `.env.ci.example` ke GitHub Actions secrets. Jangan mengunggah nilai secret ke repository.
1. Terapkan `.github/branch-protection-ruleset-example.json` melalui GitHub Rulesets dan sesuaikan reviewer dengan tim.
1. Jalankan `Release Gate` secara manual sebelum rilis. Aktifkan input Newman hanya jika endpoint API pengujian dapat diakses dari GitHub-hosted runner.
