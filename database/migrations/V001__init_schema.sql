-- SIMPELAPPI V001 baseline schema migration
-- Generated from BAB XI Physical Database Schema

create extension if not exists pgcrypto;

create schema if not exists support_identity;
create schema if not exists core_monitoring;
create schema if not exists core_audit;
create schema if not exists core_surveillance;
create schema if not exists core_ppra;
create schema if not exists core_training;
create schema if not exists support_notification;
create schema if not exists support_reporting;
create schema if not exists generic_audit;

create table if not exists support_identity.units (
  unit_id uuid primary key default gen_random_uuid(),
  unit_code varchar(30) not null unique,
  unit_name varchar(150) not null,
  unit_type varchar(50) not null,
  is_clinical boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists support_identity.roles (
  role_code varchar(50) primary key,
  role_name varchar(120) not null,
  role_scope varchar(50) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists support_identity.users (
  user_id uuid primary key default gen_random_uuid(),
  employee_no varchar(50) not null unique,
  full_name varchar(180) not null,
  email varchar(180) not null unique,
  phone_number varchar(30),
  role_code varchar(50) not null references support_identity.roles(role_code),
  unit_id uuid not null references support_identity.units(unit_id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table if not exists core_monitoring.monitorings (
  monitoring_id uuid primary key default gen_random_uuid(),
  monitoring_no varchar(40) not null unique,
  monitoring_date date not null,
  unit_id uuid not null references support_identity.units(unit_id),
  observer_user_id uuid not null references support_identity.users(user_id),
  template_id uuid,
  status varchar(20) not null,
  total_score numeric(7,2) not null default 0,
  submitted_at timestamptz,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  deleted_at timestamptz,
  constraint ck_monitoring_status
    check (status in ('draft', 'submitted', 'validated', 'rejected'))
);

create table if not exists core_monitoring.monitoring_items (
  monitoring_item_id uuid primary key default gen_random_uuid(),
  monitoring_id uuid not null references core_monitoring.monitorings(monitoring_id) on delete cascade,
  question_code varchar(60) not null,
  answer_value varchar(40) not null,
  score_value numeric(6,2) not null default 0,
  note text
);

create table if not exists core_monitoring.monitoring_photos (
  photo_id uuid primary key default gen_random_uuid(),
  monitoring_id uuid not null references core_monitoring.monitorings(monitoring_id) on delete cascade,
  file_key varchar(300) not null,
  file_url varchar(500) not null,
  captured_at timestamptz not null default now()
);

create table if not exists core_monitoring.monitoring_validations (
  validation_id uuid primary key default gen_random_uuid(),
  monitoring_id uuid not null references core_monitoring.monitorings(monitoring_id) on delete cascade,
  validator_user_id uuid not null references support_identity.users(user_id),
  validation_status varchar(20) not null,
  validation_note text,
  validated_at timestamptz not null default now(),
  constraint ck_monitoring_validation_status
    check (validation_status in ('approved', 'rejected', 'need_revision'))
);

create table if not exists core_audit.audits (
  audit_id uuid primary key default gen_random_uuid(),
  audit_no varchar(40) not null unique,
  audit_date date not null,
  unit_id uuid not null references support_identity.units(unit_id),
  auditor_user_id uuid not null references support_identity.users(user_id),
  status varchar(20) not null,
  final_score numeric(7,2) not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  deleted_at timestamptz,
  constraint ck_audit_status
    check (status in ('draft', 'submitted', 'approved', 'need_revision', 'closed'))
);

create table if not exists core_audit.audit_findings (
  finding_id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references core_audit.audits(audit_id) on delete cascade,
  finding_category varchar(80) not null,
  finding_detail text not null,
  severity_level varchar(20) not null
);

create table if not exists core_audit.audit_recommendations (
  recommendation_id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references core_audit.audits(audit_id) on delete cascade,
  recommendation_text text not null,
  due_date date
);

create table if not exists core_audit.audit_approvals (
  approval_id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references core_audit.audits(audit_id) on delete cascade,
  approver_user_id uuid not null references support_identity.users(user_id),
  approval_status varchar(20) not null,
  approval_note text,
  approved_at timestamptz not null default now(),
  constraint ck_audit_approval_status
    check (approval_status in ('approved', 'rejected', 'need_revision'))
);

create table if not exists core_audit.rtls (
  rtl_id uuid primary key default gen_random_uuid(),
  rtl_no varchar(40) not null unique,
  source_type varchar(20) not null,
  source_id uuid not null,
  rtl_title varchar(220) not null,
  pic_user_id uuid not null references support_identity.users(user_id),
  unit_id uuid not null references support_identity.units(unit_id),
  due_date date not null,
  progress_percent numeric(5,2) not null default 0,
  status varchar(20) not null,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  constraint ck_rtl_source_type
    check (source_type in ('audit', 'monitoring', 'analytics')),
  constraint ck_rtl_status
    check (status in ('open', 'in_progress', 'need_review', 'closed')),
  constraint ck_rtl_progress
    check (progress_percent >= 0 and progress_percent <= 100)
);

create table if not exists core_audit.rtl_comments (
  rtl_comment_id uuid primary key default gen_random_uuid(),
  rtl_id uuid not null references core_audit.rtls(rtl_id) on delete cascade,
  comment_by_user_id uuid not null references support_identity.users(user_id),
  comment_text text not null,
  commented_at timestamptz not null default now()
);

create table if not exists core_audit.rtl_evidences (
  evidence_id uuid primary key default gen_random_uuid(),
  rtl_id uuid not null references core_audit.rtls(rtl_id) on delete cascade,
  file_key varchar(300) not null,
  file_url varchar(500) not null,
  uploaded_by_user_id uuid not null references support_identity.users(user_id),
  uploaded_at timestamptz not null default now()
);

create table if not exists core_surveillance.patients (
  patient_id uuid primary key default gen_random_uuid(),
  mrn varchar(50) not null unique,
  full_name varchar(200) not null,
  birth_date date,
  sex varchar(10)
);

create table if not exists core_surveillance.surveillance_cases (
  case_id uuid primary key default gen_random_uuid(),
  case_no varchar(40) not null unique,
  patient_id uuid not null references core_surveillance.patients(patient_id),
  unit_id uuid not null references support_identity.units(unit_id),
  admission_date date,
  diagnosis_text text,
  status varchar(20) not null,
  created_at timestamptz not null default now(),
  created_by uuid,
  constraint ck_surveillance_case_status
    check (status in ('open', 'under_review', 'closed'))
);

create table if not exists core_surveillance.hai_events (
  hai_event_id uuid primary key default gen_random_uuid(),
  case_id uuid not null references core_surveillance.surveillance_cases(case_id) on delete cascade,
  hai_type_code varchar(30) not null,
  onset_date date,
  confirmation_status varchar(20) not null
);

create table if not exists core_surveillance.culture_results (
  culture_id uuid primary key default gen_random_uuid(),
  case_id uuid not null references core_surveillance.surveillance_cases(case_id) on delete cascade,
  specimen_type varchar(80),
  organism_name varchar(160),
  sensitivity_summary text,
  result_date date
);

create table if not exists core_ppra.antibiotic_usages (
  usage_id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references support_identity.units(unit_id),
  antibiotic_code varchar(40) not null,
  period_month varchar(7) not null,
  ddd_value numeric(12,2) not null default 0,
  dot_value numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid
);

create table if not exists core_ppra.resistance_profiles (
  profile_id uuid primary key default gen_random_uuid(),
  organism_name varchar(160) not null,
  antibiotic_code varchar(40) not null,
  sensitivity_status varchar(20) not null,
  period_month varchar(7) not null
);

create table if not exists core_training.trainings (
  training_id uuid primary key default gen_random_uuid(),
  training_no varchar(40) not null unique,
  topic varchar(200) not null,
  training_date date not null,
  organizer_unit_id uuid not null references support_identity.units(unit_id)
);

create table if not exists core_training.training_participants (
  participant_id uuid primary key default gen_random_uuid(),
  training_id uuid not null references core_training.trainings(training_id) on delete cascade,
  user_id uuid not null references support_identity.users(user_id),
  attendance_status varchar(20) not null,
  score_post_test numeric(6,2)
);

create table if not exists core_training.certificates (
  certificate_id uuid primary key default gen_random_uuid(),
  training_id uuid not null references core_training.trainings(training_id) on delete cascade,
  user_id uuid not null references support_identity.users(user_id),
  certificate_no varchar(60) not null unique,
  issued_at timestamptz not null default now()
);

create table if not exists support_notification.notifications (
  notification_id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references support_identity.users(user_id),
  notification_type varchar(40) not null,
  title varchar(180) not null,
  body text not null,
  source_type varchar(40) not null,
  source_id uuid not null,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists generic_audit.audit_trails (
  trail_id uuid primary key default gen_random_uuid(),
  module_name varchar(80) not null,
  entity_name varchar(80) not null,
  entity_id uuid not null,
  action_type varchar(20) not null,
  old_value_json jsonb,
  new_value_json jsonb,
  action_by_user_id uuid,
  action_at timestamptz not null default now(),
  ip_address varchar(64)
);

create table if not exists support_reporting.dashboard_kpi_daily (
  kpi_date date not null,
  unit_id uuid not null references support_identity.units(unit_id),
  hand_hygiene_rate numeric(7,2),
  bundle_compliance_rate numeric(7,2),
  active_hai_count int,
  open_rtl_count int,
  updated_at timestamptz not null default now(),
  primary key (kpi_date, unit_id)
);

create table if not exists support_reporting.audit_summary_monthly (
  period_month varchar(7) not null,
  unit_id uuid not null references support_identity.units(unit_id),
  total_audit int not null default 0,
  avg_audit_score numeric(7,2),
  total_findings int not null default 0,
  total_closed_rtl int not null default 0,
  primary key (period_month, unit_id)
);

create index if not exists idx_monitorings_unit_date
  on core_monitoring.monitorings(unit_id, monitoring_date);

create index if not exists idx_audits_unit_date
  on core_audit.audits(unit_id, audit_date);

create index if not exists idx_rtls_status_due_date
  on core_audit.rtls(status, due_date);

create index if not exists idx_notifications_recipient_read_created
  on support_notification.notifications(recipient_user_id, is_read, created_at desc);

create index if not exists idx_audit_trails_module_entity_action
  on generic_audit.audit_trails(module_name, entity_name, action_at desc);
