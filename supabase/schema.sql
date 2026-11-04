-- ============================================================
-- عقار FAMILY — مخطط قاعدة البيانات (Supabase / PostgreSQL)
-- يُشغَّل مرة واحدة من: Supabase → SQL Editor → New query → Run
-- آمن للتشغيل أكثر من مرة (idempotent).
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1) مخزن حالة المنصة
--    كل إعدادات الموقع (الهوية، الأقسام، المدن، الشركات،
--    المهنيين، الصفحات، الإعلانات...) تُحفظ هنا كمستند JSON.
--    القراءة العامة تمر عبر /api/state على السيرفر فقط.
-- ------------------------------------------------------------
create table if not exists public.app_state (
  key        text primary key,
  value      jsonb not null,
  is_public  boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by text
);

comment on table public.app_state is 'حالة المنصة القابلة للتحرير من لوحة التحكم';

alter table public.app_state enable row level security;
-- لا سياسات RLS عن قصد: الوصول يتم حصرًا عبر السيرفر بمفتاح service_role،
-- وبعد التحقق من كوكي الأدمن الموقّع. هذا يمنع أي كتابة من المتصفح مباشرة.

create or replace function public.touch_app_state()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists app_state_touch on public.app_state;
create trigger app_state_touch
  before update on public.app_state
  for each row execute function public.touch_app_state();

-- ------------------------------------------------------------
-- 2) طلبات ورسائل الزوار
--    (نموذج الاهتمام بالتطبيق، طلبات إضافة عقار، تواصل مع الإدارة)
-- ------------------------------------------------------------
create table if not exists public.inquiries (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,
  name       text,
  phone      text,
  email      text,
  message    text,
  payload    jsonb not null default '{}'::jsonb,
  status     text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx
  on public.inquiries (created_at desc);
create index if not exists inquiries_kind_idx
  on public.inquiries (kind);

alter table public.inquiries enable row level security;
-- القراءة/الكتابة عبر السيرفر فقط.

-- ------------------------------------------------------------
-- 3) التخزين — صور المنصة والعقارات
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- مستندات الملكية خاصة تمامًا ولا تملك سياسة قراءة عامة
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- سياسة قراءة عامة للصور
drop policy if exists "media public read" on storage.objects;
create policy "media public read"
  on storage.objects for select
  using (bucket_id = 'media');

-- الرفع يتم من السيرفر بمفتاح service_role (يتجاوز RLS).
