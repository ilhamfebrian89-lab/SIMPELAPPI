# BAB XVI: Compliance and Audit Readiness

## 16.1 Tujuan

BAB XVI mendefinisikan kerangka kesiapan compliance dan audit untuk memastikan SIMPELAPPI memenuhi tata kelola keamanan, privasi, dan akuntabilitas operasional.

## 16.2 Ruang Lingkup Kontrol

Kontrol minimum yang dicakup:

- akses pengguna dan pemisahan peran
- jejak audit untuk aksi kritikal
- perlindungan data sensitif
- proses perubahan dan deployment
- backup, restore, dan continuity plan
- evidence management untuk audit internal dan eksternal

## 16.3 Control Domains

### 1. Access Control

- RBAC endpoint-per-role diterapkan
- review akses admin berkala
- akun tidak aktif dinonaktifkan

### 2. Data Protection

- enkripsi in-transit dan at-rest
- masking data sensitif pada log
- kontrol ekspor laporan sensitif

### 3. Change Management

- seluruh perubahan melalui pull request
- release gate wajib lulus
- migration versi terdokumentasi

### 4. Operational Security

- monitoring anomali auth
- alert error rate dan availability
- incident response dan PIR

### 5. Business Continuity

- backup terjadwal
- uji restore periodik
- dokumentasi RPO/RTO aktual

## 16.4 Evidence Register

Setiap kontrol harus punya bukti:

- kebijakan atau prosedur
- log eksekusi
- screenshot atau dashboard monitoring
- hasil test atau pipeline
- daftar approval atau sign-off

Contoh evidence wajib:

- hasil workflow newman dan sql-check
- export audit trail untuk transaksi kritikal
- log perubahan role user
- laporan uji restore terakhir

## 16.5 Compliance Checklist

- [ ] RBAC matrix tersedia dan teruji
- [ ] API contract terpublikasi dan terversi
- [ ] migration + rollback script tersedia
- [ ] audit trail aktif untuk create/update/approve/close
- [ ] log retention policy diterapkan
- [ ] backup job sukses dan tervalidasi
- [ ] incident runbook tersedia dan dipraktikkan

## 16.6 Audit Preparation Cycle

Siklus bulanan:

1. Kumpulkan evidence dari CI/CD, monitoring, dan audit trail.
2. Lakukan self-assessment checklist compliance.
3. Catat gap dan action plan.
4. Review bersama IT dan Komite PPI.
5. Tutup action plan dan simpan bukti penutupan.

## 16.7 Non-Conformity Handling

Jika ditemukan ketidaksesuaian:

- catat sebagai finding
- tetapkan owner per finding
- tentukan due date perbaikan
- verifikasi corrective action
- dokumentasikan closure evidence

## 16.8 Roles and Responsibilities

- IT Security: kontrol keamanan teknis dan review akses
- Dev Team: perbaikan implementasi kontrol di aplikasi
- QA: validasi test case compliance
- Komite PPI: validasi dampak bisnis dan proses
- Auditor Internal: verifikasi independen evidence dan efektivitas kontrol

## 16.9 Kesimpulan

Dengan BAB XVI, SIMPELAPPI memiliki kerangka audit readiness yang terstruktur dan berkelanjutan, sehingga proses pemeriksaan dapat dilakukan lebih cepat, objektif, dan berbasis evidence.
