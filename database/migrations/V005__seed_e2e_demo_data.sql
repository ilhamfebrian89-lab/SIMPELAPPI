-- SIMPELAPPI V005 seed end-to-end demo data for audit and RTL workflows

insert into core_audit.audits
  (audit_id, audit_no, audit_date, unit_id, auditor_user_id, status, final_score)
values
  ('66666666-6666-6666-6666-666666666601', 'AUD000001', current_date, '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222223', 'approved', 89.00),
  ('66666666-6666-6666-6666-666666666602', 'AUD000002', current_date, '11111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222223', 'approved', 86.00)
on conflict (audit_no) do nothing;

insert into core_audit.audit_findings
  (finding_id, audit_id, finding_category, finding_detail, severity_level)
values
  ('66666666-6666-6666-6666-666666666611', '66666666-6666-6666-6666-666666666601', 'Hand Hygiene', 'Kepatuhan saat transfer pasien belum stabil', 'medium'),
  ('66666666-6666-6666-6666-666666666612', '66666666-6666-6666-6666-666666666602', 'APD', 'Kepatuhan APD shift malam belum konsisten', 'high')
on conflict do nothing;

insert into core_audit.audit_recommendations
  (recommendation_id, audit_id, recommendation_text, due_date)
values
  ('66666666-6666-6666-6666-666666666621', '66666666-6666-6666-6666-666666666601', 'Lakukan edukasi hand hygiene lintas shift selama 7 hari.', current_date + interval '7 day'),
  ('66666666-6666-6666-6666-666666666622', '66666666-6666-6666-6666-666666666602', 'Lakukan supervisi APD pada shift malam selama 5 hari.', current_date + interval '5 day')
on conflict do nothing;

insert into core_audit.audit_approvals
  (approval_id, audit_id, approver_user_id, approval_status, approval_note)
values
  ('66666666-6666-6666-6666-666666666631', '66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222222', 'approved', 'Lanjutkan RTL unit ICU'),
  ('66666666-6666-6666-6666-666666666632', '66666666-6666-6666-6666-666666666602', '22222222-2222-2222-2222-222222222222', 'approved', 'Lanjutkan RTL unit ED')
on conflict do nothing;

insert into core_audit.rtls
  (rtl_id, rtl_no, source_type, source_id, rtl_title, pic_user_id, unit_id, due_date, progress_percent, status)
values
  ('77777777-7777-7777-7777-777777777701', 'RTL000001', 'audit', '66666666-6666-6666-6666-666666666601', 'Peningkatan kepatuhan hand hygiene ICU', '22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111111', current_date + interval '7 day', 68, 'in_progress'),
  ('77777777-7777-7777-7777-777777777702', 'RTL000002', 'audit', '66666666-6666-6666-6666-666666666602', 'Peningkatan kepatuhan APD ED', '22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111112', current_date + interval '5 day', 30, 'in_progress'),
  ('77777777-7777-7777-7777-777777777703', 'RTL000003', 'audit', '66666666-6666-6666-6666-666666666601', 'RTL closed untuk uji konflik', '22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111111', current_date - interval '1 day', 100, 'closed')
on conflict (rtl_no) do nothing;

insert into support_notification.notifications
  (notification_id, recipient_user_id, notification_type, title, body, source_type, source_id, is_read)
values
  ('88888888-8888-8888-8888-888888888801', '22222222-2222-2222-2222-222222222225', 'rtl', 'RTL ICU H-3', 'RTL ICU mendekati batas waktu', 'rtl', '77777777-7777-7777-7777-777777777701', false),
  ('88888888-8888-8888-8888-888888888802', '22222222-2222-2222-2222-222222222223', 'audit', 'Audit ED approved', 'Audit ED disetujui dan siap RTL', 'audit', '66666666-6666-6666-6666-666666666602', false)
on conflict do nothing;
