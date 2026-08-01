-- SIMPELAPPI V003 seed templates and checklist questions
-- Seed for monitoring templates, question bank, and allowed enum-like master values

create table if not exists core_monitoring.monitoring_templates (
  template_id uuid primary key default gen_random_uuid(),
  template_code varchar(40) not null unique,
  template_name varchar(150) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists core_monitoring.monitoring_questions (
  question_id uuid primary key default gen_random_uuid(),
  template_id uuid not null references core_monitoring.monitoring_templates(template_id) on delete cascade,
  question_code varchar(60) not null unique,
  question_text text not null,
  answer_type varchar(20) not null,
  weight numeric(6,2) not null default 1,
  is_mandatory boolean not null default true,
  display_order int not null,
  created_at timestamptz not null default now(),
  constraint ck_monitoring_answer_type check (answer_type in ('boolean', 'text', 'number', 'option'))
);

create table if not exists support_identity.master_enum_values (
  enum_group varchar(60) not null,
  enum_code varchar(60) not null,
  enum_label varchar(160) not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  primary key (enum_group, enum_code)
);

insert into core_monitoring.monitoring_templates (template_id, template_code, template_name, is_active)
values
  ('44444444-4444-4444-4444-444444444401', 'TPL-HH-ICU', 'Template Hand Hygiene ICU', true),
  ('44444444-4444-4444-4444-444444444402', 'TPL-APD-ED', 'Template APD Emergency Department', true),
  ('44444444-4444-4444-4444-444444444403', 'TPL-LINEN-GEN', 'Template Linen General Unit', true)
on conflict (template_code) do nothing;

insert into core_monitoring.monitoring_questions
  (question_id, template_id, question_code, question_text, answer_type, weight, is_mandatory, display_order)
values
  ('44444444-4444-4444-4444-444444444411', '44444444-4444-4444-4444-444444444401', 'HH-01', 'Petugas melakukan hand hygiene sebelum kontak pasien', 'boolean', 1, true, 1),
  ('44444444-4444-4444-4444-444444444412', '44444444-4444-4444-4444-444444444401', 'HH-02', 'Petugas melakukan hand hygiene setelah kontak pasien', 'boolean', 1, true, 2),
  ('44444444-4444-4444-4444-444444444413', '44444444-4444-4444-4444-444444444402', 'APD-01', 'Petugas menggunakan APD sesuai prosedur', 'boolean', 1, true, 1),
  ('44444444-4444-4444-4444-444444444414', '44444444-4444-4444-4444-444444444403', 'LINEN-01', 'Linen infeksius dipisahkan sesuai standar', 'boolean', 1, true, 1)
on conflict (question_code) do nothing;

insert into support_identity.master_enum_values (enum_group, enum_code, enum_label, is_active, sort_order)
values
  ('MONITORING_STATUS', 'draft', 'Draft', true, 1),
  ('MONITORING_STATUS', 'submitted', 'Submitted', true, 2),
  ('MONITORING_STATUS', 'validated', 'Validated', true, 3),
  ('MONITORING_STATUS', 'rejected', 'Rejected', true, 4),
  ('AUDIT_STATUS', 'draft', 'Draft', true, 1),
  ('AUDIT_STATUS', 'submitted', 'Submitted', true, 2),
  ('AUDIT_STATUS', 'approved', 'Approved', true, 3),
  ('AUDIT_STATUS', 'need_revision', 'Need Revision', true, 4),
  ('AUDIT_STATUS', 'closed', 'Closed', true, 5),
  ('RTL_STATUS', 'open', 'Open', true, 1),
  ('RTL_STATUS', 'in_progress', 'In Progress', true, 2),
  ('RTL_STATUS', 'need_review', 'Need Review', true, 3),
  ('RTL_STATUS', 'closed', 'Closed', true, 4)
on conflict (enum_group, enum_code) do nothing;
