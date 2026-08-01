# BAB XV: Operations Runbook

## 15.1 Tujuan

BAB XV menyediakan panduan operasional harian SIMPELAPPI untuk tim IT, support aplikasi, dan on-call engineer.

Fokus:

- monitoring rutin
- manajemen insiden
- escalation path
- prosedur pemulihan layanan
- pelaporan pasca insiden

## 15.2 Peran Operasional

- L1 Support: verifikasi tiket awal, klasifikasi, workaround sederhana
- L2 Application Support: analisis aplikasi/API, validasi data operasional
- L3 Engineering: perbaikan kode, database, deployment hotfix
- Incident Commander: koordinasi saat insiden major
- Product/Business PIC (PPI): validasi dampak bisnis klinis

## 15.3 Daily Operations Checklist

Pemeriksaan harian minimum:

- status service API dan database
- error rate endpoint utama
- antrean notifikasi/event
- kapasitas storage evidence foto
- backup job semalam (success/fail)
- anomali login / percobaan auth gagal

Checklist shift:

- [ ] dashboard operasional normal
- [ ] tidak ada alert critical terbuka
- [ ] latency endpoint utama < SLA
- [ ] retry queue dalam batas aman
- [ ] kapasitas disk > threshold minimum

## 15.4 Monitoring Dashboard Minimum

Panel yang wajib tersedia:

- API availability (uptime)
- Response time P50/P95
- Error 4xx/5xx
- DB CPU, memory, connection pool
- Queue lag / message backlog
- Notification delivery success rate

SLA baseline (contoh):

- availability bulanan >= 99.5%
- P95 dashboard query <= 3 detik
- critical incident response <= 15 menit

## 15.5 Incident Classification

- SEV-1: layanan inti tidak dapat digunakan, dampak luas
- SEV-2: fungsi kritikal terganggu sebagian, workaround terbatas
- SEV-3: gangguan minor, dampak terbatas
- SEV-4: permintaan perubahan/non-urgent

## 15.6 Incident Response Flow

1. Alert masuk dari monitoring atau user report.
2. L1 melakukan triase dan klasifikasi severity.
3. Jika SEV-1 atau SEV-2, aktifkan Incident Commander.
4. L2/L3 melakukan diagnosis teknis.
5. Jalankan mitigasi: rollback, restart terkontrol, failover, atau hotfix.
6. Verifikasi pemulihan layanan dengan smoke test.
7. Tutup insiden dan buat post-incident review.

## 15.7 Escalation Matrix

Contoh aturan eskalasi:

- SEV-1: eskalasi langsung ke L3 + Incident Commander + PPI PIC
- SEV-2: eskalasi ke L2, naik ke L3 bila lebih dari 30 menit belum pulih
- SEV-3: ditangani L1/L2, update status harian

Komunikasi minimum saat insiden:

- ringkasan dampak
- layanan terdampak
- mitigasi sementara
- estimasi waktu pemulihan (ETA)

## 15.8 Standard Recovery Procedures

### API service down

- cek health endpoint
- cek container/pod status
- cek dependency DB/queue
- restart terkontrol
- verifikasi smoke test API prioritas

### Database connection saturation

- cek long-running query
- cek connection pool limit
- throttling sementara endpoint berat
- scale resource sesuai kebijakan

### Notification backlog

- cek broker availability
- cek consumer lag
- reprocess queue secara bertahap
- monitor duplicate-delivery risk

## 15.9 Backup and Restore Procedure

- backup full harian + incremental periodik
- simpan backup terenkripsi
- uji restore berkala di environment non-prod
- dokumentasikan RPO/RTO aktual hasil uji

Langkah restore ringkas:

1. konfirmasi kebutuhan restore dan rentang waktu
2. isolasi akses write jika perlu
3. restore dari snapshot valid
4. verifikasi integritas data
5. buka layanan bertahap

## 15.10 Change and Release Operations

Setiap release produksi wajib:

- terjadwal dan terdokumentasi
- memiliki rollback plan
- memiliki owner teknis dan owner bisnis
- dipantau minimal 60 menit pasca deploy

## 15.11 Security Operations

- monitor failed login dan aktivitas anomali
- rotasi secret berkala
- review akses role admin secara periodik
- audit trail review untuk aksi sensitif

## 15.12 Post-Incident Review

Template PIR minimum:

- ringkasan kejadian
- timeline detail
- root cause
- dampak pengguna/bisnis
- tindakan mitigasi
- tindakan pencegahan jangka panjang
- owner dan target date per action item

## 15.13 On-Call Schedule Guidance

- jadwal on-call mingguan
- minimal 1 primary + 1 backup
- handover wajib setiap pergantian jadwal
- dokumentasi kontak darurat diperbarui berkala

## 15.14 Kesimpulan

Dengan runbook operasi pada BAB XV, SIMPELAPPI dapat dijaga stabilitasnya secara berkelanjutan, merespons insiden lebih cepat, dan mempertahankan kualitas layanan klinis digital.
