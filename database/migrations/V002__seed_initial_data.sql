-- SIMPELAPPI V002 seed initial data
-- Baseline seed for units, roles, and sample users

insert into support_identity.units (unit_id, unit_code, unit_name, unit_type, is_clinical)
values
  ('11111111-1111-1111-1111-111111111111', 'ICU', 'Intensive Care Unit', 'critical-care', true),
  ('11111111-1111-1111-1111-111111111112', 'ED', 'Emergency Department', 'emergency', true),
  ('11111111-1111-1111-1111-111111111113', 'PPI', 'Komite PPI', 'management', false),
  ('11111111-1111-1111-1111-111111111114', 'LAB', 'Laboratorium', 'diagnostic', true),
  ('11111111-1111-1111-1111-111111111115', 'IT', 'Instalasi Teknologi Informasi', 'support', false)
on conflict (unit_code) do nothing;

insert into support_identity.roles (role_code, role_name, role_scope)
values
  ('DIRECTOR', 'Direktur', 'executive'),
  ('PPI_CHAIR', 'Ketua Komite PPI', 'committee'),
  ('IPCN', 'Infection Prevention and Control Nurse', 'operational'),
  ('IPCLN', 'Infection Prevention and Control Link Nurse', 'operational'),
  ('UNIT_HEAD', 'Kepala Ruangan', 'unit'),
  ('ADMIN', 'Administrator Sistem', 'platform')
on conflict (role_code) do nothing;

insert into support_identity.users
  (user_id, employee_no, full_name, email, phone_number, role_code, unit_id, is_active)
values
  ('22222222-2222-2222-2222-222222222221', 'EMP-DIR-001', 'Direktur Utama', 'direktur@simpelappi.local', '081100000001', 'DIRECTOR', '11111111-1111-1111-1111-111111111113', true),
  ('22222222-2222-2222-2222-222222222222', 'EMP-PPI-001', 'Ketua Komite PPI', 'ketua.ppi@simpelappi.local', '081100000002', 'PPI_CHAIR', '11111111-1111-1111-1111-111111111113', true),
  ('22222222-2222-2222-2222-222222222223', 'EMP-IPCN-001', 'Indah Permata', 'ipcn@simpelappi.local', '081100000003', 'IPCN', '11111111-1111-1111-1111-111111111111', true),
  ('22222222-2222-2222-2222-222222222224', 'EMP-IPCLN-001', 'Sari Melati', 'ipcln@simpelappi.local', '081100000004', 'IPCLN', '11111111-1111-1111-1111-111111111111', true),
  ('22222222-2222-2222-2222-222222222225', 'EMP-UNIT-001', 'Kepala Ruangan ICU', 'kepala.icu@simpelappi.local', '081100000005', 'UNIT_HEAD', '11111111-1111-1111-1111-111111111111', true),
  ('22222222-2222-2222-2222-222222222226', 'EMP-ADMIN-001', 'Admin SIMPELAPPI', 'admin@simpelappi.local', '081100000006', 'ADMIN', '11111111-1111-1111-1111-111111111115', true)
on conflict (email) do nothing;

-- Optional sample monitoring to validate end-to-end query and dashboard rendering
insert into core_monitoring.monitorings
  (monitoring_id, monitoring_no, monitoring_date, unit_id, observer_user_id, status, total_score)
values
  ('33333333-3333-3333-3333-333333333331', 'MTR000001', current_date, '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222223', 'submitted', 89.00)
on conflict (monitoring_no) do nothing;

insert into core_monitoring.monitoring_items
  (monitoring_item_id, monitoring_id, question_code, answer_value, score_value, note)
values
  ('33333333-3333-3333-3333-333333333341', '33333333-3333-3333-3333-333333333331', 'HH-01', 'yes', 1, 'Patuh'),
  ('33333333-3333-3333-3333-333333333342', '33333333-3333-3333-3333-333333333331', 'APD-01', 'yes', 1, 'Patuh'),
  ('33333333-3333-3333-3333-333333333343', '33333333-3333-3333-3333-333333333331', 'LINEN-01', 'no', 0, 'Perlu perbaikan')
on conflict do nothing;
