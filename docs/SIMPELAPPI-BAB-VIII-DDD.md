# BAB VIII
# DOMAIN DRIVEN DESIGN (DDD)

## 8.1 Mengapa Domain Driven Design?

SIMPELAPPI adalah platform enterprise yang mencakup monitoring, audit, surveilans, PPRA, edukasi, dan operasi manajemen RTL dalam satu ekosistem digital. Dengan cakupan sekitar 15 modul utama, 60 sub modul, 120 tabel, 250 endpoint API, dan lebih dari 1000 komponen layar, pendekatan pengembangan yang tidak terstruktur akan menghasilkan codebase yang sulit dikelola.

Oleh karena itu, SIMPELAPPI perlu dibangun dengan prinsip Domain Driven Design (DDD), yaitu membagi sistem berdasarkan domain bisnis nyata, bukan berdasarkan teknis layar atau tabel database semata.

## 8.2 Core Domain

SIMPELAPPI terdiri dari tiga kategori domain:

### Core Domain
- Monitoring
- Audit
- Surveilans
- PPRA
- Education
- ICRA

### Support Domain
- Notification
- Reporting
- Authentication
- Master Data
- Analytics
- Dashboard
- Document

### Generic Domain
- File
- Email
- WhatsApp
- API
- Scheduler
- Storage
- Audit Trail

## 8.3 Bounded Context

Setiap domain harus memiliki batas konteks yang jelas agar tidak terjadi ketergantungan silang yang mengganggu perubahan sistem.

### Monitoring Context
Berisi entitas dan proses:
- Monitoring
- Checklist
- Question
- Answer
- Photo
- Score
- Validation

### Audit Context
Berisi entitas dan proses:
- Audit
- Finding
- Recommendation
- RTL
- Approval

### Surveillance Context
Berisi entitas dan proses:
- Patient
- Case
- HAI
- Culture
- Microbiology
- Outcome

### PPRA Context
Berisi entitas dan proses:
- Antibiotic
- DDD
- DOT
- Resistance
- Sensitivity

### Training Context
Berisi entitas dan proses:
- Training
- Participant
- Certificate
- Exam

## 8.4 Domain Relationship

Hubungan antar domain dapat digambarkan sebagai berikut:

Monitoring -> Audit -> Finding -> RTL -> Dashboard

Patient -> HAI -> Culture -> Analytics

## 8.5 Aggregate

Aggregate adalah unit konsistensi dalam DDD. Contoh utama dalam SIMPELAPPI adalah Monitoring sebagai aggregate.

Monitoring Aggregate berisi:
- Monitoring
- Detail
- Photo
- Score
- Validation

Semua perubahan harus dilakukan melalui aggregate utama agar status dan konsistensi data tetap terjaga.

## 8.6 Entity

Entity adalah objek yang memiliki identitas unik.

Contoh entity utama:
- User
- Unit
- Patient
- Audit
- Monitoring
- RTL
- Training

## 8.7 Value Object

Value Object adalah objek yang tidak memiliki identitas, tetapi tetap penting dalam business rules.

Contoh:
- Alamat
- Nama
- Skor
- Target
- Persentase
- Email
- Nomor Telepon

## 8.8 Repository

Semua akses data harus melalui repository.

Contoh repository:
- MonitoringRepository
- AuditRepository
- PatientRepository
- UserRepository

Tujuannya agar frontend atau application service tidak mengakses data secara langsung.

## 8.9 Domain Service

Domain service berisi logika bisnis yang tidak cocok ditempatkan pada entity atau value object.

Contoh:
- HandHygieneService
- BundleService
- HAIService

## 8.10 Application Service

Application service berfungsi sebagai penghubung antara UI, domain layer, dan repository.

Contoh alur:

Create Monitoring -> Monitoring Service -> Monitoring Repository -> Database

## 8.11 Event Driven Architecture

SIMPELAPPI perlu menggunakan event-driven architecture agar proses update dashboard, notifikasi, dan laporan dapat berjalan secara real time.

Contoh:

Monitoring selesai -> Publish Event MonitoringCompleted -> Analytics -> Dashboard -> Notification -> Report

## 8.12 Domain Event

Contoh event yang perlu didefinisikan:
- AuditCompleted
- BundleCompleted
- HAICreated
- RTLCreated
- TrainingCompleted

## 8.13 Command

Command digunakan untuk mengubah state.

Contoh:
- CreateMonitoring
- SubmitAudit
- ApproveRTL
- ValidateHAI

## 8.14 Query

Query digunakan untuk membaca data.

Contoh:
- GetDashboard
- GetTrend
- GetAudit
- GetRTL
- GetMonitoring

## 8.15 CQRS

SIMPELAPPI perlu menerapkan CQRS, dengan pemisahan antara command dan query.

Tujuannya:
- dashboard tidak mengganggu proses input data
- performa query dapat dioptimalkan secara terpisah
- operasi read dan write dapat dikembangkan secara independen

## 8.16 Domain Model

Domain model SIMPELAPPI dapat dijabarkan sebagai:

Monitoring -> Checklist -> Question -> Answer -> Score -> Validation -> Dashboard

## 8.17 Ubiquitous Language

Istilah bisnis harus konsisten di seluruh tim. Contoh:

Gunakan satu istilah yang konsisten untuk semua modul, misalnya:
- Monitoring Form

Hindari penggunaan istilah yang bercampur seperti:
- Form
- Checklist
- Questionnaire

## 8.18 Domain Dictionary

Domain dictionary merupakan referensi istilah bersama seluruh developer, product owner, dan tester.

Contoh istilah:

- Monitoring: Proses observasi kepatuhan terhadap indikator PPI menggunakan formulir digital.
- Audit: Evaluasi sistematis terhadap kepatuhan standar PPI yang menghasilkan skor, temuan, dan rekomendasi.
- RTL: Rencana Tindak Lanjut atas temuan audit atau hasil analisis indikator.
- Bundle: Sekumpulan intervensi berbasis bukti yang harus dilakukan bersama untuk mencegah HAIs.
- Surveilans: Pengumpulan, analisis, interpretasi, dan pelaporan data kejadian infeksi terkait pelayanan kesehatan.

## 8.19 Domain Boundary

Setiap domain harus memiliki API yang terpisah agar mempertahankan clean boundary.

Contoh endpoint:
- /monitoring
- /audit
- /surveilans
- /ppra
- /training
- /icra

## 8.20 Enterprise Domain Map

SIMPELAPPI dapat dipetakan menjadi:

Core Domain:
- Monitoring
- Audit
- Surveilans
- PPRA
- Education
- ICRA

Support Domain:
- Dashboard
- Notification
- Reporting
- Analytics
- Authentication
- Master Data

Generic Domain:
- API
- File
- Email
- Storage
- Audit Trail

## Kesimpulan

BAB VIII menegaskan bahwa SIMPELAPPI harus dibangun sebagai platform enterprise yang terstruktur secara domain, bukan sekadar koleksi layar dan form. Dengan DDD, tim pengembang akan memiliki:

- pemisahan konteks yang jelas
- model bisnis yang konsisten
- arsitektur yang scalable
- proses pengembangan yang lebih terukur
- integrasi antar modul yang lebih aman dan efisien
