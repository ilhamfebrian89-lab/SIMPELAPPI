# BAB X: Data Model & Database Design

## 10.1 Tujuan

BAB ini mendefinisikan model data SIMPELAPPI sebagai turunan langsung dari bounded context pada BAB VIII dan service boundary pada BAB IX.

Tujuan utama:

- memastikan konsistensi istilah domain ke struktur tabel
- memisahkan ownership data per context
- menyiapkan fondasi CQRS, audit trail, dan integrasi

## 10.2 Prinsip Desain Data

- Satu bounded context memiliki ownership tabel yang jelas.
- Referensi lintas context menggunakan identifier, bukan join bebas antar schema.
- Semua perubahan data penting harus terekam pada audit trail.
- Tabel read model untuk dashboard/report dipisah dari tabel transactional.
- Soft delete digunakan pada entitas master kritikal.

## 10.3 Strategi Skema

Disarankan pemisahan schema per domain:

- core_monitoring
- core_audit
- core_surveillance
- core_ppra
- core_training
- support_identity
- support_reporting
- support_notification
- generic_audit

## 10.4 Master Data Utama

### Tabel: support_identity.users

Kolom inti:

- user_id (UUID, PK)
- employee_no (varchar, unique)
- full_name (varchar)
- email (varchar, unique)
- phone_number (varchar)
- role_code (varchar)
- unit_id (UUID)
- is_active (boolean)
- created_at, created_by
- updated_at, updated_by

### Tabel: support_identity.roles

Kolom inti:

- role_code (varchar, PK)
- role_name (varchar)
- role_scope (varchar)

### Tabel: support_identity.units

Kolom inti:

- unit_id (UUID, PK)
- unit_code (varchar, unique)
- unit_name (varchar)
- unit_type (varchar)
- is_clinical (boolean)

## 10.5 Monitoring Context Data Model

### Aggregate Root: monitoring

### Tabel: core_monitoring.monitorings

- monitoring_id (UUID, PK)
- monitoring_no (varchar, unique)
- monitoring_date (date)
- unit_id (UUID)
- observer_user_id (UUID)
- template_id (UUID)
- status (varchar: draft|submitted|validated|rejected)
- total_score (numeric)
- submitted_at (timestamp)
- validated_at (timestamp)
- created_at, created_by
- updated_at, updated_by

### Tabel: core_monitoring.monitoring_items

- monitoring_item_id (UUID, PK)
- monitoring_id (UUID, FK -> monitorings)
- question_code (varchar)
- answer_value (varchar)
- score_value (numeric)
- note (text)

### Tabel: core_monitoring.monitoring_photos

- photo_id (UUID, PK)
- monitoring_id (UUID, FK -> monitorings)
- file_key (varchar)
- file_url (varchar)
- captured_at (timestamp)

### Tabel: core_monitoring.monitoring_validations

- validation_id (UUID, PK)
- monitoring_id (UUID, FK -> monitorings)
- validator_user_id (UUID)
- validation_status (varchar)
- validation_note (text)
- validated_at (timestamp)

## 10.6 Audit Context Data Model

### Aggregate Root: audit

### Tabel: core_audit.audits

- audit_id (UUID, PK)
- audit_no (varchar, unique)
- audit_date (date)
- unit_id (UUID)
- auditor_user_id (UUID)
- status (varchar: draft|submitted|approved|need_revision|closed)
- final_score (numeric)
- created_at, created_by
- updated_at, updated_by

### Tabel: core_audit.audit_findings

- finding_id (UUID, PK)
- audit_id (UUID, FK -> audits)
- finding_category (varchar)
- finding_detail (text)
- severity_level (varchar)

### Tabel: core_audit.audit_recommendations

- recommendation_id (UUID, PK)
- audit_id (UUID, FK -> audits)
- recommendation_text (text)
- due_date (date)

### Tabel: core_audit.audit_approvals

- approval_id (UUID, PK)
- audit_id (UUID, FK -> audits)
- approver_user_id (UUID)
- approval_status (varchar)
- approval_note (text)
- approved_at (timestamp)

## 10.7 RTL Context Data Model

### Tabel: core_audit.rtls

- rtl_id (UUID, PK)
- rtl_no (varchar, unique)
- source_type (varchar: audit|monitoring|analytics)
- source_id (UUID)
- rtl_title (varchar)
- pic_user_id (UUID)
- unit_id (UUID)
- due_date (date)
- progress_percent (numeric)
- status (varchar: open|in_progress|need_review|closed)
- created_at, created_by
- updated_at, updated_by

### Tabel: core_audit.rtl_comments

- rtl_comment_id (UUID, PK)
- rtl_id (UUID, FK -> rtls)
- comment_by_user_id (UUID)
- comment_text (text)
- commented_at (timestamp)

### Tabel: core_audit.rtl_evidences

- evidence_id (UUID, PK)
- rtl_id (UUID, FK -> rtls)
- file_key (varchar)
- file_url (varchar)
- uploaded_by_user_id (UUID)
- uploaded_at (timestamp)

## 10.8 Surveillance Context Data Model

### Aggregate Root: surveillance_case

### Tabel: core_surveillance.patients

- patient_id (UUID, PK)
- mrn (varchar, unique)
- full_name (varchar)
- birth_date (date)
- sex (varchar)

### Tabel: core_surveillance.surveillance_cases

- case_id (UUID, PK)
- case_no (varchar, unique)
- patient_id (UUID, FK -> patients)
- unit_id (UUID)
- admission_date (date)
- diagnosis_text (text)
- status (varchar: open|under_review|closed)
- created_at, created_by

### Tabel: core_surveillance.hai_events

- hai_event_id (UUID, PK)
- case_id (UUID, FK -> surveillance_cases)
- hai_type_code (varchar)
- onset_date (date)
- confirmation_status (varchar)

### Tabel: core_surveillance.culture_results

- culture_id (UUID, PK)
- case_id (UUID, FK -> surveillance_cases)
- specimen_type (varchar)
- organism_name (varchar)
- sensitivity_summary (text)
- result_date (date)

## 10.9 PPRA Context Data Model

### Tabel: core_ppra.antibiotic_usages

- usage_id (UUID, PK)
- unit_id (UUID)
- antibiotic_code (varchar)
- period_month (varchar)
- ddd_value (numeric)
- dot_value (numeric)
- created_at, created_by

### Tabel: core_ppra.resistance_profiles

- profile_id (UUID, PK)
- organism_name (varchar)
- antibiotic_code (varchar)
- sensitivity_status (varchar)
- period_month (varchar)

## 10.10 Training Context Data Model

### Tabel: core_training.trainings

- training_id (UUID, PK)
- training_no (varchar, unique)
- topic (varchar)
- training_date (date)
- organizer_unit_id (UUID)

### Tabel: core_training.training_participants

- participant_id (UUID, PK)
- training_id (UUID, FK -> trainings)
- user_id (UUID)
- attendance_status (varchar)
- score_post_test (numeric)

### Tabel: core_training.certificates

- certificate_id (UUID, PK)
- training_id (UUID, FK -> trainings)
- user_id (UUID)
- certificate_no (varchar, unique)
- issued_at (timestamp)

## 10.11 Notification & Audit Trail Model

### Tabel: support_notification.notifications

- notification_id (UUID, PK)
- recipient_user_id (UUID)
- notification_type (varchar)
- title (varchar)
- body (text)
- source_type (varchar)
- source_id (UUID)
- is_read (boolean)
- read_at (timestamp)
- created_at (timestamp)

### Tabel: generic_audit.audit_trails

- trail_id (UUID, PK)
- module_name (varchar)
- entity_name (varchar)
- entity_id (UUID)
- action_type (varchar: create|update|delete|submit|approve|close)
- old_value_json (jsonb)
- new_value_json (jsonb)
- action_by_user_id (UUID)
- action_at (timestamp)
- ip_address (varchar)

## 10.12 Read Model untuk Dashboard & Report

Untuk kebutuhan performa, read model dipisah:

### Tabel: support_reporting.dashboard_kpi_daily

- kpi_date (date, PK)
- unit_id (UUID, PK)
- hand_hygiene_rate (numeric)
- bundle_compliance_rate (numeric)
- active_hai_count (int)
- open_rtl_count (int)
- updated_at (timestamp)

### Tabel: support_reporting.audit_summary_monthly

- period_month (varchar, PK)
- unit_id (UUID, PK)
- total_audit (int)
- avg_audit_score (numeric)
- total_findings (int)
- total_closed_rtl (int)

## 10.13 Relasi Kunci Antar Context

Aturan referensi:

- Monitoring, Audit, Surveillance, PPRA, Training mereferensi user_id dan unit_id dari support_identity.
- RTL dapat berasal dari audit atau monitoring melalui source_type + source_id.
- Notification menggunakan source_type + source_id untuk deep-link ke modul asal.
- Reporting membaca dari read model, bukan query langsung ke tabel transaksi berat.

## 10.14 Indexing & Performance Baseline

Index minimum yang direkomendasikan:

- unique index untuk nomor dokumen (monitoring_no, audit_no, rtl_no, case_no)
- composite index (unit_id, monitoring_date) pada monitorings
- composite index (unit_id, audit_date) pada audits
- index (status, due_date) pada rtls
- index (recipient_user_id, is_read, created_at) pada notifications
- index gin jsonb pada audit_trails.old_value_json/new_value_json bila diperlukan forensic query

## 10.15 Data Retention & Archiving

- data transaksi operasional: online minimal 5 tahun
- audit trail: online minimal 7 tahun
- arsip lama dipindahkan ke cold storage tanpa mengubah identifier
- restore process wajib terdokumentasi dan diuji berkala

## 10.16 Standar Naming Convention

- nama tabel: snake_case plural
- primary key: {entity}_id
- foreign key: {referenced_entity}_id
- timestamp wajib: created_at, updated_at
- user stamp wajib: created_by, updated_by untuk transaksi kritikal

## 10.17 Kesimpulan

Model data SIMPELAPPI harus menjaga boundary domain sekaligus siap untuk analitik real-time. Dengan desain pada BAB X ini, tim dapat melanjutkan ke:

- pembuatan physical schema
- migrasi database
- contract API detail per context
- implementasi repository dan query model
