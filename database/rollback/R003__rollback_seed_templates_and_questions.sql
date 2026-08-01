-- Rollback for V003__seed_templates_and_questions.sql

delete from core_monitoring.monitoring_questions
where question_id in (
  '44444444-4444-4444-4444-444444444411',
  '44444444-4444-4444-4444-444444444412',
  '44444444-4444-4444-4444-444444444413',
  '44444444-4444-4444-4444-444444444414'
);

delete from core_monitoring.monitoring_templates
where template_id in (
  '44444444-4444-4444-4444-444444444401',
  '44444444-4444-4444-4444-444444444402',
  '44444444-4444-4444-4444-444444444403'
);

delete from support_identity.master_enum_values
where enum_group in ('MONITORING_STATUS', 'AUDIT_STATUS', 'RTL_STATUS');
