# BAB XVII: Operational KPI and Service Performance

## 17.1 Tujuan

BAB XVII mendefinisikan metrik operasional inti untuk mengukur kesehatan layanan, kualitas rilis, dan efektivitas respons insiden SIMPELAPPI.

## 17.2 KPI Framework

KPI dibagi dalam 4 domain:

- Reliability KPI
- Delivery KPI
- Security KPI
- Support KPI

## 17.3 Reliability KPI

### 1. Availability

Definisi: persentase waktu layanan tersedia.

Rumus:

Availability (%) = (Total waktu layanan - Downtime) / Total waktu layanan x 100

Target awal:

- Production >= 99.5% per bulan

### 2. API Error Rate

Definisi: persentase respons error (5xx) terhadap total request.

Target awal:

- 5xx rate <= 1.0%

### 3. API Latency (P95)

Definisi: waktu respons 95th percentile untuk endpoint prioritas.

Target awal:

- Dashboard KPI P95 <= 3 detik
- Write endpoint utama P95 <= 2 detik

## 17.4 Delivery KPI

### 1. Deployment Frequency

Definisi: jumlah deployment sukses ke production per periode.

Target awal:

- Minimal 2 release minor per bulan

### 2. Change Failure Rate

Definisi: persentase deployment yang menyebabkan insiden atau rollback.

Target awal:

- <= 10%

### 3. Lead Time for Change

Definisi: waktu dari merge PR hingga fitur tersedia di production.

Target awal:

- <= 7 hari untuk perubahan non-emergency

## 17.5 Incident and Recovery KPI

### 1. MTTA (Mean Time to Acknowledge)

Target awal:

- SEV-1 <= 10 menit
- SEV-2 <= 20 menit

### 2. MTTR (Mean Time to Restore)

Target awal:

- SEV-1 <= 120 menit
- SEV-2 <= 240 menit

### 3. Incident Recurrence Rate

Definisi: persentase insiden berulang dengan root cause sama dalam 30 hari.

Target awal:

- <= 5%

## 17.6 Security KPI

### 1. Failed Login Spike Handling

Target awal:

- Deteksi anomali <= 5 menit
- Tindakan mitigasi <= 30 menit

### 2. Privileged Access Review Compliance

Target awal:

- 100% review akses admin bulanan selesai

### 3. Critical Vulnerability Remediation Time

Target awal:

- Critical: <= 7 hari
- High: <= 14 hari

## 17.7 Support and Service KPI

### 1. Ticket SLA Adherence

Target awal:

- >= 95% tiket selesai sesuai SLA

### 2. First Response Time

Target awal:

- L1 response <= 15 menit untuk insiden SEV-1/SEV-2

### 3. User Satisfaction (CSAT)

Target awal:

- >= 4.2/5 untuk tiket operasional

## 17.8 Data Sources

Sumber data KPI:

- API gateway logs
- application logs
- monitoring platform
- incident issue template
- CI/CD workflow history
- service desk ticket system

## 17.9 KPI Review Cadence

- Harian: reliability dan incident dashboard
- Mingguan: delivery dan open issue trend
- Bulanan: laporan eksekutif KPI + action plan per gap

## 17.10 KPI Reporting Format

Ringkasan bulanan minimum:

- nilai KPI aktual vs target
- tren 3 bulan terakhir
- top 3 deviasi terbesar
- root cause ringkas
- action plan bulan berikutnya

## 17.11 Governance

- Owner Reliability KPI: Tim IT/DevOps
- Owner Delivery KPI: Engineering Lead
- Owner Security KPI: IT Security
- Owner Support KPI: Service Desk / Application Support
- Reviewer bisnis: Komite PPI

## 17.12 Kesimpulan

Dengan BAB XVII, SIMPELAPPI memiliki standar pengukuran performa operasional yang objektif untuk mendorong peningkatan layanan berkelanjutan dan pengambilan keputusan berbasis data.

## 17.13 Dokumen Baseline KPI

Untuk target numerik baseline per bulan, gunakan dokumen:

- docs/SIMPELAPPI-KPI-BASELINE-2026-Q3.md
