# BAB XIII: Integration and Security Architecture

## 13.1 Tujuan

BAB XIII mendefinisikan pola integrasi dan kontrol keamanan SIMPELAPPI agar interoperabilitas antar sistem rumah sakit dapat berjalan aman, terukur, dan ter-audit.

Fokus:

- integrasi SIMRS, LIS, HRIS, SSO
- keamanan API dan data
- kontrol akses berbasis role
- observability, logging, dan audit compliance

## 13.2 Integrasi Sistem Eksternal

### 13.2.1 Daftar Integrasi Prioritas

- SIMRS: data pasien, unit, kunjungan
- LIS: hasil kultur dan mikrobiologi
- HRIS: data pegawai, unit kerja, status aktif
- SSO/LDAP: autentikasi terpusat
- Email Gateway: notifikasi email
- WhatsApp Gateway: notifikasi operasional

### 13.2.2 Pola Integrasi

- Sinkronisasi near real-time melalui API atau event untuk data kritikal
- Sinkronisasi batch terjadwal untuk data master besar
- Retry policy dan dead-letter queue untuk kegagalan integrasi
- Idempotency key untuk endpoint create agar tidak duplikat data

### 13.2.3 Kontrak Data Minimal

Setiap payload integrasi wajib memiliki:

- externalSource, misalnya SIMRS atau LIS
- externalRefId
- occurredAt dalam ISO-8601 UTC
- checksum atau signature bila channel tidak private

## 13.3 Security Principles

- Zero Trust: semua request dianggap tidak tepercaya sampai tervalidasi
- Least Privilege: akses minimum sesuai peran
- Defense in Depth: proteksi berlapis di gateway, service, dan data
- Secure by Default: endpoint default deny, role explicit allow
- Full Traceability: semua aksi penting tercatat pada audit trail

## 13.4 Authentication and Session

### 13.4.1 Mekanisme

- OAuth2/OIDC sebagai pilihan utama, atau JWT internal terstandar
- Access token berdurasi pendek, misalnya 60 menit
- Refresh token dengan rotasi dan revocation
- MFA direkomendasikan untuk role kritikal seperti Direktur, Ketua PPI, dan Admin

### 13.4.2 Klaim Token Minimum

- sub, yaitu user_id
- role_code
- unit_id
- scope
- exp, iat, jti

## 13.5 Authorization Model

### 13.5.1 Role Utama

- DIRECTOR: read dashboard eksekutif dan laporan
- PPI_CHAIR: approve audit, monitor KPI, kelola RTL strategis
- IPCN: create dan validate monitoring, audit operasional, surveilans
- IPCLN: input monitoring unit
- UNIT_HEAD: tindak lanjut RTL unit
- ADMIN: konfigurasi master data dan workflow

### 13.5.2 Policy Baseline

- Endpoint write hanya untuk role operasional terkait
- Approval endpoint dibatasi role approver
- Data unit-level difilter berdasarkan unit_id user
- Access cross-unit harus melalui privilege khusus

## 13.6 API Security Controls

- TLS 1.2+ wajib di semua channel
- API gateway: rate limit, IP allowlist opsional, WAF rule
- Header keamanan minimum:

- Authorization
- X-Correlation-Id
- X-Request-Timestamp

- Input validation ketat pada enum, UUID, date, dan numeric range
- Output sanitization untuk mencegah leakage

## 13.7 Data Protection

### 13.7.1 Data in Transit

- HTTPS mandatory
- Mutual TLS untuk service-to-service kritikal, opsional phase-2

### 13.7.2 Data at Rest

- Enkripsi volume atau database sesuai standar RS
- Enkripsi object storage untuk bukti foto atau evidence
- Key management terpusat, KMS atau HSM bila tersedia

### 13.7.3 Sensitive Data Handling

- Masking data identitas pada log aplikasi
- Principle need-to-know untuk data pasien
- Export laporan sensitif wajib watermark dan jejak unduh

## 13.8 Audit, Logging, and Monitoring

### 13.8.1 Audit Trail Wajib

Aksi berikut wajib tercatat:

- login/logout
- create, update, delete data kritikal
- submit, approve, reject
- perubahan role atau permission
- ekspor laporan sensitif

### 13.8.2 Logging Standard

- level: INFO, WARN, ERROR
- format terstruktur JSON
- korelasi lintas service via X-Correlation-Id
- retensi log operasional minimal 90 hari hot

### 13.8.3 Security Monitoring

- alert untuk brute force login
- alert untuk anomali akses lintas unit
- alert untuk lonjakan error 5xx
- dashboard keamanan sederhana untuk SOC internal atau IT

## 13.9 Backup, DR, dan Business Continuity

- Backup harian full dan incremental periodik
- Uji restore minimal per kuartal
- RPO dan RTO ditetapkan dan disetujui manajemen
- DR drill terjadwal untuk skenario gangguan data center

## 13.10 Compliance Baseline

SIMPELAPPI harus mengikuti kebijakan internal RS dan regulasi yang berlaku terkait:

- kerahasiaan rekam medis
- keamanan informasi
- tata kelola akses pengguna
- jejak audit untuk pemeriksaan internal atau eksternal

## 13.11 Integration Sequence

1. Data pasien masuk dari SIMRS
2. Kasus HAI dikirim atau ditarik dari LIS
3. SIMPELAPPI memproses monitoring, audit, dan surveilans
4. Event diterbitkan ke notification dan reporting
5. Dashboard read model diperbarui

## 13.12 Hardening Checklist

- endpoint tanpa auth dinonaktifkan di production
- default credential dilarang
- CORS dibatasi origin terdaftar
- dependency scanning aktif di CI
- secret tidak boleh hardcoded
- backup terenkripsi dan diuji restore

## 13.13 Kesimpulan

Arsitektur integrasi dan keamanan pada BAB XIII memastikan SIMPELAPPI dapat terhubung dengan ekosistem rumah sakit tanpa mengorbankan confidentiality, integrity, availability, dan accountability.
