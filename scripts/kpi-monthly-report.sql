-- SIMPELAPPI KPI monthly extraction queries
-- Usage example (psql):
-- psql -h <host> -U <user> -d <db> -v period_month='2026-08' -f scripts/kpi-monthly-report.sql

\echo '=== PARAMETER ==='
\echo 'period_month = :period_month'

-- 1) Deployment Frequency (proxy via audit trail release actions if available)
\echo '=== Deployment Frequency ==='
select
  :'period_month' as period_month,
  count(*) as deployment_count
from generic_audit.audit_trails
where module_name = 'release'
  and action_type in ('deploy_success')
  and to_char(action_at, 'YYYY-MM') = :'period_month';

-- 2) Change Failure Rate (proxy via rollback records)
\echo '=== Change Failure Rate (%) ==='
with deploy as (
  select count(*)::numeric as total_deploy
  from generic_audit.audit_trails
  where module_name = 'release'
    and action_type = 'deploy_success'
    and to_char(action_at, 'YYYY-MM') = :'period_month'
), fail as (
  select count(*)::numeric as failed_deploy
  from generic_audit.audit_trails
  where module_name = 'release'
    and action_type in ('deploy_rollback','deploy_failed')
    and to_char(action_at, 'YYYY-MM') = :'period_month'
)
select
  :'period_month' as period_month,
  coalesce(failed_deploy, 0) as failed_deploy,
  coalesce(total_deploy, 0) as total_deploy,
  case
    when coalesce(total_deploy,0) = 0 then null
    else round((failed_deploy / total_deploy) * 100, 2)
  end as change_failure_rate_percent
from deploy, fail;

-- 3) Operational Workload Snapshot
\echo '=== Operational Workload ==='
select
  :'period_month' as period_month,
  (select count(*) from core_monitoring.monitorings where to_char(created_at,'YYYY-MM') = :'period_month') as monitoring_created,
  (select count(*) from core_audit.audits where to_char(created_at,'YYYY-MM') = :'period_month') as audit_created,
  (select count(*) from core_audit.rtls where to_char(created_at,'YYYY-MM') = :'period_month') as rtl_created,
  (select count(*) from core_surveillance.surveillance_cases where to_char(created_at,'YYYY-MM') = :'period_month') as surveillance_cases_created;

-- 4) RTL Closure Performance
\echo '=== RTL Closure Performance ==='
select
  :'period_month' as period_month,
  count(*) filter (where status = 'closed') as rtl_closed,
  count(*) as rtl_total,
  case
    when count(*) = 0 then null
    else round((count(*) filter (where status = 'closed')::numeric / count(*)::numeric) * 100, 2)
  end as rtl_closure_rate_percent
from core_audit.rtls
where to_char(created_at, 'YYYY-MM') = :'period_month';

-- 5) Notification Read Rate
\echo '=== Notification Read Rate ==='
select
  :'period_month' as period_month,
  count(*) filter (where is_read = true) as read_count,
  count(*) as total_count,
  case
    when count(*) = 0 then null
    else round((count(*) filter (where is_read = true)::numeric / count(*)::numeric) * 100, 2)
  end as notification_read_rate_percent
from support_notification.notifications
where to_char(created_at,'YYYY-MM') = :'period_month';

-- 6) Monitoring Score Trend
\echo '=== Monitoring Score Trend ==='
select
  to_char(monitoring_date, 'YYYY-MM-DD') as monitoring_day,
  round(avg(total_score),2) as avg_monitoring_score,
  count(*) as total_monitoring
from core_monitoring.monitorings
where to_char(monitoring_date,'YYYY-MM') = :'period_month'
group by to_char(monitoring_date, 'YYYY-MM-DD')
order by monitoring_day;
