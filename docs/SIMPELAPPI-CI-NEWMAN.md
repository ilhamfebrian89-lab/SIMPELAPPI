# SIMPELAPPI CI Newman Guide

## Tujuan

Panduan ini menjelaskan cara menjalankan koleksi Postman secara otomatis dengan Newman untuk quality gate API.

## File Terkait

- script runner: scripts/run-newman.ps1
- audit page validation: scripts/validate-audit-page.ps1
- env file: docs/postman/simpelappi-local.postman_environment.json
- positive tests: docs/postman/simpelappi-v1.postman_collection.json
- negative tests: docs/postman/simpelappi-v1-negative-tests.postman_collection.json
- own-unit RBAC tests: docs/postman/simpelappi-v1-own-unit-tests.postman_collection.json

## Prasyarat

- Node.js 18+
- npx tersedia
- API target aktif di baseUrl

## Menjalankan Lokal

```powershell
Set-Location "$PSScriptRoot\.."
.\scripts\run-newman.ps1 -BaseUrl "http://localhost:8080/api/v1"
```

Output:

- report CLI pada terminal
- file junit XML per collection di root proyek

## Integrasi CI (contoh langkah)

1. Install dependency runtime:

```bash
npm install -g newman
```

1. Jalankan script:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/run-newman.ps1 -BaseUrl "http://api:8080/api/v1"
```

1. Publish artefak junit XML ke test report CI.

1. Jalankan audit page validation sebagai quality gate UI statis:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/validate-audit-page.ps1
```

Pengecekan ini menutup gap non-API quality gate dengan memastikan halaman audit, state page, dan aset pendukung tetap konsisten.

## Exit Code

- 0: semua test lulus
- non-0: ada kegagalan test atau error runtime

## Catatan

- Token harus disuplai ke environment sebelum run.
- Untuk RBAC OWN-UNIT, pastikan data seed V005 sudah tersedia.
- Audit page check dapat dipanggil di release gate bersama SQL check dan Newman.
