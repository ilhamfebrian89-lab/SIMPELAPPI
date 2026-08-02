# SIMPELAPPI Local Development Runbook

## Tujuan

Runbook ini memberikan langkah cepat menjalankan lingkungan lokal SIMPELAPPI untuk developer, QA, dan analyst.

## Prasyarat

- Docker Desktop aktif
- Node.js 20+ untuk backend, validasi JavaScript, dan Newman
- Port berikut tersedia:
  - 8080 (SIMPELAPPI API)
  - 5432 (PostgreSQL)
  - 5050 (pgAdmin)
  - 8025 (MailHog UI)
- Postman (opsional, untuk uji API)

## Struktur File Penting

- docker stack: docker/docker-compose.dev.yml
- migration baseline: database/migrations/V001__init_schema.sql
- seed data: database/migrations/V002__seed_initial_data.sql
- seed templates: database/migrations/V003__seed_templates_and_questions.sql
- seed audit baseline: database/migrations/V004__seed_audit_templates.sql
- seed e2e demo data: database/migrations/V005__seed_e2e_demo_data.sql
- credential schema: database/migrations/V006__add_user_credentials.sql
- rollback scripts: database/rollback/R001__rollback_init_schema.sql s.d. R005__rollback_seed_e2e_demo_data.sql
- openapi: docs/openapi/simpelappi-v1.yaml
- postman positive: docs/postman/simpelappi-v1.postman_collection.json
- postman negative: docs/postman/simpelappi-v1-negative-tests.postman_collection.json
- postman own-unit: docs/postman/simpelappi-v1-own-unit-tests.postman_collection.json
- postman env local: docs/postman/simpelappi-local.postman_environment.json
- newman runner: scripts/run-newman.ps1
- audit page validation: scripts/validate-audit-page.ps1

## Langkah Menjalankan Stack

1. Buka terminal di root proyek.
1. Buat secret JWT lokal:

```powershell
$env:JWT_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

1. Jalankan:

```bash
docker compose -f docker/docker-compose.dev.yml up -d
```

1. Verifikasi container:

```bash
docker compose -f docker/docker-compose.dev.yml ps
```

Expected:

- postgres status healthy
- api status healthy
- pgadmin running
- mailhog running

## Akses Service

- PostgreSQL: localhost:5432
  - db: simpelappi
  - user: simpelappi
  - password: simpelappi_dev
- pgAdmin: `http://localhost:5050`
  - email: `admin@simpelappi.local`
  - password: admin123
- MailHog: `http://localhost:8025`

- SIMPELAPPI API: `http://localhost:8080`
  - health: `http://localhost:8080/health`
  - readiness: `http://localhost:8080/ready`

Setelah container sehat, buat kredensial untuk user seed:

```powershell
$env:DATABASE_URL = "postgresql://simpelappi:simpelappi_dev@localhost:5432/simpelappi"
$env:SIMPELAPPI_USER_PASSWORD = "<password-kuat-minimal-12-karakter>"
$env:SIMPELAPPI_TEST_PASSWORD = $env:SIMPELAPPI_USER_PASSWORD
npm install
npm run user:set-password -- --user ipcn@simpelappi.local --username ipcn_admin
npm run user:set-password -- --user ketua.ppi@simpelappi.local --username ppi_chair_test
npm run user:set-password -- --user direktur@simpelappi.local --username director_test
npm run user:set-password -- --user kepala.icu@simpelappi.local --username unit_head_test
npm run user:set-password -- --user ipcln@simpelappi.local --username ipcln_test
```

Password tidak disimpan pada migration atau file environment contoh.

## Catatan Migrasi

Pada mode sekarang, file SQL di database/migrations dipasang sebagai init script PostgreSQL saat inisialisasi volume baru.

Urutan yang dijalankan:

1. V001__init_schema.sql
1. V002__seed_initial_data.sql
1. V003__seed_templates_and_questions.sql
1. V004__seed_audit_templates.sql
1. V005__seed_e2e_demo_data.sql
1. V006__add_user_credentials.sql

Jika ingin rerun dari nol:

```bash
docker compose -f docker/docker-compose.dev.yml down -v
docker compose -f docker/docker-compose.dev.yml up -d
```

## Import Postman Collection

1. Import docs/postman/simpelappi-v1.postman_collection.json
1. Import docs/postman/simpelappi-v1-negative-tests.postman_collection.json
1. Set variable:

- baseUrl = `http://localhost:8080/api/v1`
- username dan password
- monitoringId
- auditId
- closedRtlId

## Jalankan Newman Otomatis

```powershell
Set-Location "$PSScriptRoot\.."
$env:SIMPELAPPI_TEST_PASSWORD = "<password-akun-uji>"
.\scripts\run-newman.ps1 -BaseUrl "http://localhost:8080/api/v1"
```

Runner akan mengeksekusi:

- collection positif
- collection negatif
- collection OWN-UNIT RBAC

## Validasi Audit Page Lokal

Gunakan skrip ini untuk mengecek integritas [audit.html](../audit.html), [audit.js](../audit.js), [styles.css](../styles.css), dan halaman state yang dirujuknya:

```powershell
Set-Location "$PSScriptRoot\.."
powershell -ExecutionPolicy Bypass -File .\scripts\validate-audit-page.ps1
```

Skrip ini memverifikasi:

- include `audit.js` pada `audit.html`
- marker autosave dan reset/undo snapshot
- state page `success-state.html`, `error-state.html`, dan `empty-state.html`
- elemen styling penting untuk autosave dan reduced motion

## Rollback Data Seed

Gunakan file rollback pada folder database/rollback sesuai versi seed yang ingin dibatalkan.
Urutan yang direkomendasikan untuk rollback data:

1. R005__rollback_seed_e2e_demo_data.sql
1. R004__rollback_seed_audit_templates.sql
1. R003__rollback_seed_templates_and_questions.sql
1. R002__rollback_seed_initial_data.sql

R001 digunakan hanya untuk reset total schema pada lingkungan development.

## Smoke Check SQL

Gunakan pgAdmin query tool:

```sql
select count(*) as total_units from support_identity.units;
select count(*) as total_roles from support_identity.roles;
select count(*) as total_users from support_identity.users;
select count(*) as total_templates from core_monitoring.monitoring_templates;
select count(*) as total_audit_templates from core_audit.audit_templates;
```

## Troubleshooting Ringkas

- Port conflict: ubah mapping port di docker/docker-compose.dev.yml
- Seed tidak jalan: hapus volume dan start ulang stack
- pgAdmin tidak bisa login: cek environment PGADMIN_DEFAULT_* pada compose
- Koneksi DB gagal: tunggu postgres healthy lalu retry
- Perubahan UI audit/UX state: jalankan `powershell -ExecutionPolicy Bypass -File .\scripts\validate-audit-page.ps1`

## Checklist Selesai Setup

- [ ] Container postgres healthy
- [ ] pgAdmin dapat login
- [ ] MailHog UI terbuka
- [ ] Data seed terbaca di tabel support_identity
- [ ] Template monitoring dan audit tersedia
- [ ] Postman collection terimport
- [ ] Audit page validation lulus
- [ ] Audit page validation dijalankan setelah perubahan audit.html atau state page
