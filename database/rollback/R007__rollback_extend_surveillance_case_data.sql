-- SIMPELAPPI R007 rollback surveillance case extension

drop index if exists core_surveillance.ix_surveillance_cases_dynamic_data;
drop index if exists core_surveillance.ix_surveillance_cases_outcome;
drop index if exists core_surveillance.ix_surveillance_cases_type;

alter table core_surveillance.surveillance_cases
  drop constraint if exists ck_surveillance_outcome,
  drop constraint if exists ck_surveillance_type,
  drop column if exists updated_at,
  drop column if exists verification_data,
  drop column if exists outcome,
  drop column if exists reporting_data,
  drop column if exists infection_control_data,
  drop column if exists supporting_examinations,
  drop column if exists clinical_data,
  drop column if exists dynamic_data,
  drop column if exists surveillance_subtype,
  drop column if exists surveillance_type,
  drop column if exists surveillance_start_date,
  drop column if exists attending_physician,
  drop column if exists room_name,
  drop column if exists unit_name;

alter table core_surveillance.patients
  drop constraint if exists ck_surveillance_patient_age,
  drop column if exists updated_at,
  drop column if exists age_years;
