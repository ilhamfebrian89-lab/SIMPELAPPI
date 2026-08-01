-- SIMPELAPPI V004 seed audit templates and baseline recommendations

create table if not exists core_audit.audit_templates (
  template_id uuid primary key default gen_random_uuid(),
  template_code varchar(40) not null unique,
  template_name varchar(160) not null,
  applicable_unit_type varchar(60),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists core_audit.audit_check_items (
  check_item_id uuid primary key default gen_random_uuid(),
  template_id uuid not null references core_audit.audit_templates(template_id) on delete cascade,
  item_code varchar(60) not null unique,
  item_text text not null,
  score_weight numeric(6,2) not null default 1,
  severity_default varchar(20) not null default 'medium',
  display_order int not null,
  created_at timestamptz not null default now(),
  constraint ck_audit_severity_default check (severity_default in ('low','medium','high','critical'))
);

create table if not exists core_audit.recommendation_library (
  recommendation_id uuid primary key default gen_random_uuid(),
  recommendation_code varchar(60) not null unique,
  category varchar(80) not null,
  recommendation_text text not null,
  due_days_default int not null default 7,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into core_audit.audit_templates (template_id, template_code, template_name, applicable_unit_type, is_active)
values
  ('55555555-5555-5555-5555-555555555501', 'AUD-HH-ICU', 'Audit Hand Hygiene ICU', 'critical-care', true),
  ('55555555-5555-5555-5555-555555555502', 'AUD-APD-ED', 'Audit APD Emergency Department', 'emergency', true),
  ('55555555-5555-5555-5555-555555555503', 'AUD-LINEN-GEN', 'Audit Linen General Unit', 'general', true)
on conflict (template_code) do nothing;

insert into core_audit.audit_check_items
  (check_item_id, template_id, item_code, item_text, score_weight, severity_default, display_order)
values
  ('55555555-5555-5555-5555-555555555511', '55555555-5555-5555-5555-555555555501', 'AHH-01', 'Petugas melakukan hand hygiene sebelum kontak pasien', 1, 'high', 1),
  ('55555555-5555-5555-5555-555555555512', '55555555-5555-5555-5555-555555555501', 'AHH-02', 'Petugas melakukan hand hygiene setelah kontak pasien', 1, 'high', 2),
  ('55555555-5555-5555-5555-555555555513', '55555555-5555-5555-5555-555555555502', 'AAPD-01', 'Petugas menggunakan APD sesuai level risiko', 1, 'medium', 1),
  ('55555555-5555-5555-5555-555555555514', '55555555-5555-5555-5555-555555555503', 'ALIN-01', 'Pengelolaan linen infeksius sesuai alur', 1, 'medium', 1)
on conflict (item_code) do nothing;

insert into core_audit.recommendation_library
  (recommendation_id, recommendation_code, category, recommendation_text, due_days_default, is_active)
values
  ('55555555-5555-5555-5555-555555555521', 'REC-HH-EDU', 'Hand Hygiene', 'Lakukan edukasi hand hygiene lintas shift selama 7 hari.', 7, true),
  ('55555555-5555-5555-5555-555555555522', 'REC-APD-SUP', 'APD', 'Lakukan supervisi penggunaan APD setiap awal shift.', 5, true),
  ('55555555-5555-5555-5555-555555555523', 'REC-LINEN-REVIEW', 'Linen', 'Review ulang SOP pemisahan linen infeksius dan non-infeksius.', 10, true)
on conflict (recommendation_code) do nothing;
