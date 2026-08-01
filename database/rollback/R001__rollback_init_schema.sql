-- Rollback for V001__init_schema.sql (DEV ONLY)
-- WARNING: this will remove all schema objects and data.

drop schema if exists support_reporting cascade;
drop schema if exists support_notification cascade;
drop schema if exists core_training cascade;
drop schema if exists core_ppra cascade;
drop schema if exists core_surveillance cascade;
drop schema if exists core_audit cascade;
drop schema if exists core_monitoring cascade;
drop schema if exists support_identity cascade;
drop schema if exists generic_audit cascade;
