-- SIMPELAPPI V007 extend surveillance case data

alter table core_surveillance.patients
  add column age_years smallint,
  add column updated_at timestamptz not null default now(),
  add constraint ck_surveillance_patient_age
    check (age_years is null or age_years between 0 and 150);

alter table core_surveillance.surveillance_cases
  add column unit_name varchar(200),
  add column room_name varchar(200),
  add column attending_physician varchar(200),
  add column surveillance_start_date date,
  add column surveillance_type varchar(30) not null default 'hais',
  add column surveillance_subtype varchar(100),
  add column dynamic_data jsonb not null default '{}'::jsonb,
  add column clinical_data jsonb not null default '{}'::jsonb,
  add column supporting_examinations jsonb not null default '{}'::jsonb,
  add column infection_control_data jsonb not null default '{}'::jsonb,
  add column reporting_data jsonb not null default '{}'::jsonb,
  add column outcome varchar(30),
  add column verification_data jsonb not null default '{}'::jsonb,
  add column updated_at timestamptz not null default now(),
  add constraint ck_surveillance_type
    check (surveillance_type in ('hais', 'tuberculosis', 'hiv_aids', 'outbreak', 'other')),
  add constraint ck_surveillance_outcome
    check (outcome is null or outcome in ('hospitalized', 'discharged', 'referred', 'deceased'));

create index ix_surveillance_cases_type
  on core_surveillance.surveillance_cases (surveillance_type);

create index ix_surveillance_cases_outcome
  on core_surveillance.surveillance_cases (outcome)
  where outcome is not null;

create index ix_surveillance_cases_dynamic_data
  on core_surveillance.surveillance_cases using gin (dynamic_data);
