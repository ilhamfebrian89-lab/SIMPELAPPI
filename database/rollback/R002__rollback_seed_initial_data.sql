-- Rollback for V002__seed_initial_data.sql

delete from core_monitoring.monitoring_items
where monitoring_id = '33333333-3333-3333-3333-333333333331';

delete from core_monitoring.monitorings
where monitoring_id = '33333333-3333-3333-3333-333333333331';

delete from support_identity.users
where user_id in (
  '22222222-2222-2222-2222-222222222221',
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222223',
  '22222222-2222-2222-2222-222222222224',
  '22222222-2222-2222-2222-222222222225',
  '22222222-2222-2222-2222-222222222226'
);

delete from support_identity.roles
where role_code in ('DIRECTOR', 'PPI_CHAIR', 'IPCN', 'IPCLN', 'UNIT_HEAD', 'ADMIN');

delete from support_identity.units
where unit_id in (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111112',
  '11111111-1111-1111-1111-111111111113',
  '11111111-1111-1111-1111-111111111114',
  '11111111-1111-1111-1111-111111111115'
);
