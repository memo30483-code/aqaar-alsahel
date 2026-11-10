-- Aqaar FAMILY: shared rate limiting for public and authentication endpoints.
-- Safe to run more than once. No visitor identifier is stored in plaintext:
-- callers pass an already hashed or opaque key.

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0 check (hits >= 0)
);

create index if not exists rate_limits_window_idx
  on public.rate_limits (window_start);

/**
 * يزيد عدّاد المفتاح داخل نافذة زمنية ويعيد هل الطلب مسموح.
 * ذرّي بالكامل: upsert واحد مع إعادة تصفير النافذة عند انتهائها.
 */
create or replace function public.bump_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hits integer;
begin
  if p_key is null or length(p_key) = 0 or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.rate_limits as rl (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case
          when rl.window_start <= now() - make_interval(secs => p_window_seconds)
            then 1
          else rl.hits + 1
        end,
        window_start = case
          when rl.window_start <= now() - make_interval(secs => p_window_seconds)
            then now()
          else rl.window_start
        end
  returning rl.hits into v_hits;

  delete from public.rate_limits
  where window_start < now() - interval '1 day';

  return v_hits <= p_limit;
end;
$$;

alter table public.rate_limits enable row level security;

revoke all on table public.rate_limits from anon, authenticated;
grant all on table public.rate_limits to service_role;

revoke all on function public.bump_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.bump_rate_limit(text, integer, integer)
  to service_role;
