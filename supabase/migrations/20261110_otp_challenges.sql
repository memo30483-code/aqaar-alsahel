-- Aqaar FAMILY: server-side OTP challenges for email, SMS and WhatsApp.
-- Safe to run more than once. No plaintext OTP or contact value is stored.

create extension if not exists pgcrypto;

create table if not exists public.otp_challenges (
  id uuid primary key default gen_random_uuid(),
  target_hash text not null check (length(target_hash) = 64),
  target_hint text not null default '' check (length(target_hint) <= 180),
  channel text not null check (channel in ('email', 'sms', 'whatsapp')),
  purpose text not null check (purpose in ('registration', 'login', 'recovery')),
  code_hash text not null check (length(code_hash) = 64),
  ip_hash text not null check (length(ip_hash) = 64),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  proof_used_at timestamptz,
  attempts smallint not null default 0 check (attempts >= 0),
  max_attempts smallint not null default 5 check (max_attempts between 3 and 10),
  created_at timestamptz not null default now()
);

create index if not exists otp_challenges_target_idx
  on public.otp_challenges (target_hash, purpose, channel, created_at desc);
create index if not exists otp_challenges_ip_idx
  on public.otp_challenges (ip_hash, created_at desc);
create index if not exists otp_challenges_cleanup_idx
  on public.otp_challenges (expires_at);

-- Atomic verification: one row lock, one attempt increment and one-time consume.
create or replace function public.verify_otp_challenge(
  p_id uuid,
  p_code_hash text,
  p_target_hash text
)
returns table (
  result text,
  verified_channel text,
  verified_purpose text,
  verified_target_hash text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_challenge public.otp_challenges%rowtype;
begin
  select * into v_challenge
  from public.otp_challenges
  where id = p_id
  for update;

  if not found then
    return query select 'not_found'::text, null::text, null::text, null::text;
    return;
  end if;

  if v_challenge.consumed_at is not null then
    return query select 'already_used'::text, null::text, null::text, null::text;
    return;
  end if;

  if v_challenge.expires_at <= now() then
    return query select 'expired'::text, null::text, null::text, null::text;
    return;
  end if;

  if v_challenge.attempts >= v_challenge.max_attempts then
    return query select 'locked'::text, null::text, null::text, null::text;
    return;
  end if;

  update public.otp_challenges
  set attempts = attempts + 1
  where id = p_id;

  if v_challenge.code_hash <> p_code_hash
    or v_challenge.target_hash <> p_target_hash then
    return query select 'invalid'::text, null::text, null::text, null::text;
    return;
  end if;

  update public.otp_challenges
  set consumed_at = now()
  where id = p_id;

  return query
    select
      'verified'::text,
      v_challenge.channel,
      v_challenge.purpose,
      v_challenge.target_hash;
end;
$$;

-- A verified challenge can authorize exactly one registration request.
create or replace function public.consume_otp_registration_proof(
  p_id uuid,
  p_target_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used uuid;
begin
  update public.otp_challenges
  set proof_used_at = now()
  where id = p_id
    and purpose = 'registration'
    and target_hash = p_target_hash
    and consumed_at is not null
    and consumed_at > now() - interval '10 minutes'
    and proof_used_at is null
  returning id into v_used;

  return v_used is not null;
end;
$$;

alter table public.otp_challenges enable row level security;

revoke all on table public.otp_challenges from anon, authenticated;
grant all on table public.otp_challenges to service_role;

revoke all on function public.verify_otp_challenge(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.verify_otp_challenge(uuid, text, text)
  to service_role;

revoke all on function public.consume_otp_registration_proof(uuid, text)
  from public, anon, authenticated;
grant execute on function public.consume_otp_registration_proof(uuid, text)
  to service_role;
