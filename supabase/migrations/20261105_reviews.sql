-- Aqaar FAMILY: reviews for properties, developers and professionals.
-- Safe to run more than once.

create extension if not exists pgcrypto;

create table if not exists public.review_settings (
  id text primary key default 'main' check (id = 'main'),
  policy text not null default 'open_verified'
    check (policy in ('open_verified', 'verified_only', 'open')),
  moderation boolean not null default true,
  sub_ratings jsonb not null default '{
    "property": {"enabled": true, "items": [
      {"key": "accuracy", "label": "دقة الوصف"},
      {"key": "value", "label": "السعر مقابل القيمة"},
      {"key": "location", "label": "الموقع والحي"},
      {"key": "condition", "label": "حالة العقار"}
    ]},
    "developer": {"enabled": true, "items": [
      {"key": "quality", "label": "جودة المشروعات"},
      {"key": "delivery", "label": "الالتزام بالمواعيد"},
      {"key": "service", "label": "خدمة العملاء"}
    ]},
    "professional": {"enabled": true, "items": [
      {"key": "professionalism", "label": "الاحترافية"},
      {"key": "response", "label": "سرعة الاستجابة"},
      {"key": "clarity", "label": "وضوح التعامل"}
    ]}
  }'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into public.review_settings (id)
values ('main')
on conflict (id) do nothing;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null
    check (entity_type in ('property', 'developer', 'professional')),
  entity_id text not null check (length(trim(entity_id)) between 1 and 180),
  reviewer_device text not null check (length(reviewer_device) between 8 and 80),
  reviewer_name text not null default '',
  reviewer_phone text,
  reviewer_email text,
  rating smallint not null check (rating between 1 and 5),
  sub_ratings jsonb not null default '{}'::jsonb,
  comment text check (comment is null or length(comment) <= 1200),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  verified boolean not null default false,
  admin_reply text check (admin_reply is null or length(admin_reply) <= 1200),
  reported_count integer not null default 0 check (reported_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id, reviewer_device)
);

create index if not exists reviews_entity_idx
  on public.reviews (entity_type, entity_id, status);
create index if not exists reviews_status_idx
  on public.reviews (status, created_at desc);
create index if not exists reviews_reported_idx
  on public.reviews (reported_count desc) where reported_count > 0;

create or replace function public.review_touch()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists reviews_touch on public.reviews;
create trigger reviews_touch
  before update on public.reviews
  for each row execute function public.review_touch();

-- Atomic report increment so concurrent reports never overwrite each other.
create or replace function public.review_report(p_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.reviews
  set reported_count = reported_count + 1
  where id = p_id
  returning reported_count into v_count;
  return coalesce(v_count, -1);
end;
$$;

alter table public.reviews enable row level security;
alter table public.review_settings enable row level security;

revoke all on table public.reviews from anon, authenticated;
revoke all on table public.review_settings from anon, authenticated;

grant all on table public.reviews to service_role;
grant all on table public.review_settings to service_role;

revoke all on function public.review_report(uuid) from public, anon, authenticated;
grant execute on function public.review_report(uuid) to service_role;
