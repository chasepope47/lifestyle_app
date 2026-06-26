-- Add INSERT policy so authenticated users can save their own passkey credentials.
-- The challenges table is no longer used (challenges live in a signed HTTP-only cookie).

create policy if not exists "Users can insert own credentials" on public.webauthn_credentials
  for insert with check (auth.uid() = user_id);

-- Drop the challenges table — no longer needed
drop table if exists public.webauthn_challenges;
