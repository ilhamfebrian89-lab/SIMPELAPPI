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

- Node.js 20+
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

## Integrasi GitHub Actions

Workflow tersedia pada `.github/workflows/newman.yml` dan dijalankan melalui menu **Actions > Newman API Tests > Run workflow**.

Input wajib:

- `base_url`: URL API lengkap sampai prefix `/api/v1`

Workflow menggunakan Node.js 20, menjalankan ketiga koleksi melalui `scripts/run-newman.ps1`, dan menyimpan report JUnit sebagai artifact selama 14 hari.

Tambahkan repository secret `SIMPELAPPI_TEST_PASSWORD`. Password tersebut harus sudah diprovision ke akun uji IPCN, PPI_CHAIR, DIRECTOR, UNIT_HEAD, dan IPCLN. Collection login sendiri untuk memperoleh token berumur pendek; token tidak disimpan sebagai GitHub secret.

Newman juga dapat diaktifkan dari workflow `Release Gate` dengan mengisi:

- `run_newman`: `true`
- `base_url`: endpoint API pengujian yang dapat diakses oleh GitHub-hosted runner

Newman tidak dijalankan otomatis pada pull request karena pengujian end-to-end memerlukan environment API dengan database seed dan akun uji yang sudah diprovision. Type-check, unit/API injection test, SQL migration, dan UI statis tetap berjalan otomatis.

## Exit Code

- 0: semua test lulus
- non-0: ada kegagalan test atau error runtime

## Catatan

- Token harus disuplai ke environment sebelum run.
- Positive collection menjalankan login terlebih dahulu dan menyimpan access token. Isi `username` dan `password` melalui environment lokal/CI, bukan di file collection.
- Token role dibuat oleh request setup di setiap collection.
- Untuk RBAC OWN-UNIT, pastikan data seed V005 sudah tersedia.
- Jangan menggunakan endpoint produksi untuk pengujian Newman.
- Report `newman-*.xml` merupakan output sementara dan diabaikan oleh Git.
