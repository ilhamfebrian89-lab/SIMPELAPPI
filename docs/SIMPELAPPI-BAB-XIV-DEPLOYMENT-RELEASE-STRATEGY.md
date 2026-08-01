# BAB XIV: Deployment and Release Strategy

## 14.1 Tujuan

BAB XIV mendefinisikan strategi deployment dan release SIMPELAPPI agar transisi dari development ke production berjalan aman, terukur, dan minim gangguan layanan.

## 14.2 Environment Strategy

SIMPELAPPI menggunakan lingkungan bertingkat:

- local: pengembangan individu
- dev: integrasi internal tim
- sit/qa: system integration testing
- uat: validasi pengguna bisnis
- prod: layanan operasional rumah sakit

Setiap environment memiliki:

- endpoint terpisah
- database terpisah
- secret terpisah
- audit log terpisah

## 14.3 Release Branching

Pola branch yang direkomendasikan:

- main/master: branch stabil
- develop: branch integrasi
- feature/*: pengembangan fitur
- hotfix/*: perbaikan production cepat

Aturan minimum:

- pull request wajib review minimal 1 reviewer
- merge ke main wajib lulus pipeline CI
- perubahan skema database wajib melalui migration versioned

## 14.4 CI/CD Pipeline Baseline

Tahapan pipeline:

1. lint and static checks
2. unit tests
3. API contract tests (Newman)
4. build artifact
5. deploy ke dev
6. smoke test
7. promote ke sit/uat
8. approval gate
9. deploy production

## 14.5 Deployment Model

Model rollout yang direkomendasikan:

- blue/green untuk release besar
- rolling update untuk patch kecil
- canary untuk fitur berisiko tinggi

Prinsip:

- zero/near-zero downtime
- health check wajib sebelum traffic shift
- otomatis rollback saat health check gagal

## 14.6 Database Migration Strategy

- migration bersifat immutable (V001, V002, dst)
- rollback script tersedia untuk DEV/UAT
- production rollback fokus ke forward-fix + backup restore plan
- dry-run migration wajib di SIT sebelum UAT/PROD

Checklist migration:

- backup snapshot sebelum deploy
- validasi waktu eksekusi migration
- verifikasi index creation impact
- verifikasi data seed tidak duplikat

## 14.7 Release Gate

Sebuah release boleh naik ke environment berikutnya jika:

- tidak ada critical bug open
- Newman positive/negative/own-unit lulus
- smoke test UI utama lulus
- migration berhasil tanpa error
- approval owner domain (PPI/IT) tersedia

## 14.8 Operational Monitoring

Metrik minimum pasca deploy:

- API success rate
- error rate 4xx/5xx
- response time P95
- queue lag (jika event-driven)
- failed login anomaly

Alert threshold contoh:

- 5xx > 2% selama 5 menit
- P95 > 3 detik untuk endpoint dashboard
- error auth melonjak > 50% baseline

## 14.9 Incident and Rollback Procedure

Langkah saat insiden release:

1. deteksi alarm dan triase
2. freeze deployment
3. identifikasi komponen terdampak
4. rollback aplikasi (blue/green switch atau rollback deployment)
5. validasi health check dan smoke test
6. RCA (root cause analysis)
7. action items pencegahan

## 14.10 Secrets and Configuration Management

- secret dikelola pada vault/secret store
- dilarang hardcode credential dalam repository
- rotasi secret berkala
- audit akses secret wajib aktif

## 14.11 Release Calendar

Disarankan:

- release mayor: bulanan
- release minor: 2 mingguan
- emergency patch: sesuai kebutuhan insiden

Waktu deploy production dipilih di luar jam puncak operasional klinis.

## 14.12 Go-Live Checklist

- [ ] backup database final berhasil
- [ ] seluruh service health check hijau
- [ ] migration terpasang sukses
- [ ] QA sign-off tersedia
- [ ] PPI sign-off tersedia
- [ ] runbook incident telah disiapkan
- [ ] kontak on-call aktif

## 14.13 Kesimpulan

Dengan strategi deployment dan release pada BAB XIV, SIMPELAPPI dapat dikembangkan secara berkelanjutan tanpa mengorbankan stabilitas layanan klinis dan keselamatan operasional.
