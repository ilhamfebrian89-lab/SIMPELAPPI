-- SIMPELAPPI V006 persistent credentials for internal JWT authentication

create table if not exists support_identity.user_credentials (
  user_id uuid primary key references support_identity.users(user_id) on delete cascade,
  username varchar(100) not null unique,
  password_hash text not null,
  token_version int not null default 0,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_user_credentials_failed_attempts check (failed_attempts >= 0),
  constraint ck_user_credentials_token_version check (token_version >= 0)
);

create unique index if not exists idx_user_credentials_username_lower
  on support_identity.user_credentials(lower(username));
