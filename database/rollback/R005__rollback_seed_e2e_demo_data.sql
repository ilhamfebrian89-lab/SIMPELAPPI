-- Rollback for V005__seed_e2e_demo_data.sql

delete from support_notification.notifications
where notification_id in (
  '88888888-8888-8888-8888-888888888801',
  '88888888-8888-8888-8888-888888888802'
);

delete from core_audit.rtl_comments
where rtl_id in (
  '77777777-7777-7777-7777-777777777701',
  '77777777-7777-7777-7777-777777777702',
  '77777777-7777-7777-7777-777777777703'
);

delete from core_audit.rtl_evidences
where rtl_id in (
  '77777777-7777-7777-7777-777777777701',
  '77777777-7777-7777-7777-777777777702',
  '77777777-7777-7777-7777-777777777703'
);

delete from core_audit.rtls
where rtl_id in (
  '77777777-7777-7777-7777-777777777701',
  '77777777-7777-7777-7777-777777777702',
  '77777777-7777-7777-7777-777777777703'
);

delete from core_audit.audit_findings
where audit_id in (
  '66666666-6666-6666-6666-666666666601',
  '66666666-6666-6666-6666-666666666602'
);

delete from core_audit.audit_recommendations
where audit_id in (
  '66666666-6666-6666-6666-666666666601',
  '66666666-6666-6666-6666-666666666602'
);

delete from core_audit.audit_approvals
where audit_id in (
  '66666666-6666-6666-6666-666666666601',
  '66666666-6666-6666-6666-666666666602'
);

delete from core_audit.audits
where audit_id in (
  '66666666-6666-6666-6666-666666666601',
  '66666666-6666-6666-6666-666666666602'
);
