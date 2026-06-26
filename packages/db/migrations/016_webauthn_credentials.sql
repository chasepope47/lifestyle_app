-- WebAuthn passkey credentials (one row per registered device)
create table if not exists public.webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0,
  device_name text,
  transports text,
  backed_up boolean default false,
  created_at timestamptz default now(),
  last_used_at timestamptz
);

create index if not exists webauthn_credentials_user_id_idx on public.webauthn_credentials(user_id);
create index if not exists webauthn_credentials_credential_id_idx on public.webauthn_credentials(credential_id);

alter table public.webauthn_credentials enable row level security;

create policy "Users can view own credentials" on public.webauthn_credentials
  for select using (auth.uid() = user_id);

create policy "Users can delete own credentials" on public.webauthn_credentials
  for delete using (auth.uid() = user_id);

-- Temporary challenges for in-flight WebAuthn ceremonies (expire after 5 min)
create table if not exists public.webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  challenge text not null unique,
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  created_at timestamptz default now()
);

alter table public.webauthn_challenges enable row level security;
