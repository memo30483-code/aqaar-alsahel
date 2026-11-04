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

-- Aqaar FAMILY CRM: relational PostgreSQL storage
-- Safe to run more than once. Existing JSON data is backed up and migrated.

create extension if not exists pgcrypto;

create table if not exists public.crm_leads (
  id text primary key,
  name text not null,
  phone text not null default '',
  phone_normalized text not null default '',
  email text,
  email_normalized text not null default '',
  source text not null default 'manual'
    check (source in ('property', 'inquiry', 'professional', 'manual', 'app')),
  source_label text,
  source_ref text,
  property_id text,
  interest text,
  city text,
  budget numeric(16,2),
  stage text not null default 'new'
    check (stage in ('new', 'contacted', 'viewing', 'negotiation', 'won', 'lost')),
  assigned_to text,
  assigned_to_name text,
  tags text[] not null default '{}',
  notes text,
  reference text,
  archived boolean not null default false,
  priority text not null default 'warm'
    check (priority in ('hot', 'warm', 'cold')),
  deal_value numeric(16,2),
  commission numeric(16,2),
  won_at timestamptz,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_activities (
  id text primary key,
  lead_id text not null references public.crm_leads(id) on delete cascade,
  kind text not null
    check (kind in ('note', 'call', 'whatsapp', 'meeting', 'email', 'stage')),
  actor text not null,
  body text not null,
  from_stage text,
  to_stage text,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_tasks (
  id text primary key,
  lead_id text not null references public.crm_leads(id) on delete cascade,
  title text not null,
  due_at timestamptz not null,
  done boolean not null default false,
  created_by text not null,
  created_at timestamptz not null default now(),
  done_at timestamptz
);

create table if not exists public.crm_settings (
  id text primary key default 'main' check (id = 'main'),
  auto_assign boolean not null default false,
  default_assignee_id text,
  default_assignee_name text,
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into public.crm_settings (id)
values ('main')
on conflict (id) do nothing;

create table if not exists public.crm_legacy_backups (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  source_updated_at timestamptz,
  payload jsonb not null,
  backed_up_at timestamptz not null default now(),
  unique (source_key, source_updated_at)
);

create index if not exists crm_leads_stage_idx
  on public.crm_leads (stage) where archived = false;
create index if not exists crm_leads_assignee_idx
  on public.crm_leads (assigned_to) where archived = false;
create index if not exists crm_leads_phone_idx
  on public.crm_leads (phone_normalized) where phone_normalized <> '';
create index if not exists crm_leads_email_idx
  on public.crm_leads (email_normalized) where email_normalized <> '';
create unique index if not exists crm_leads_source_ref_uidx
  on public.crm_leads (source, source_ref) where source_ref is not null;
create index if not exists crm_leads_updated_idx
  on public.crm_leads (updated_at desc);
create index if not exists crm_activities_lead_idx
  on public.crm_activities (lead_id, created_at desc);
create index if not exists crm_tasks_lead_idx
  on public.crm_tasks (lead_id, due_at);
create index if not exists crm_tasks_open_due_idx
  on public.crm_tasks (due_at) where done = false;

create or replace function public.crm_prepare_lead()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.phone := coalesce(trim(new.phone), '');
  new.phone_normalized := right(regexp_replace(new.phone, '[^0-9]', '', 'g'), 10);
  new.email := nullif(lower(trim(coalesce(new.email, ''))), '');
  new.email_normalized := coalesce(new.email, '');
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.version := old.version + 1;
  end if;
  if new.stage = 'won' and new.won_at is null then
    new.won_at := now();
  elsif new.stage <> 'won' then
    new.won_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists crm_leads_prepare on public.crm_leads;
create trigger crm_leads_prepare
  before insert or update on public.crm_leads
  for each row execute function public.crm_prepare_lead();

create or replace function public.crm_create_lead(
  p_lead jsonb,
  p_actor text default 'الإدارة'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  v_existing text;
  v_source text := coalesce(nullif(p_lead->>'source', ''), 'manual');
  v_source_ref text := nullif(p_lead->>'sourceRef', '');
  v_phone_key text := right(regexp_replace(coalesce(p_lead->>'phone', ''), '[^0-9]', '', 'g'), 10);
  v_email_key text := lower(trim(coalesce(p_lead->>'email', '')));
  v_activity jsonb;
  v_task jsonb;
  v_activity_count integer := 0;
begin
  if nullif(trim(p_lead->>'name'), '') is null then
    raise exception 'CRM_NAME_REQUIRED';
  end if;

  if v_source_ref is not null then
    select id into v_existing
    from public.crm_leads
    where source = v_source and source_ref = v_source_ref
    limit 1;
  end if;

  if v_existing is null and (v_phone_key <> '' or v_email_key <> '') then
    select id into v_existing
    from public.crm_leads
    where archived = false
      and (
        (v_phone_key <> '' and phone_normalized = v_phone_key)
        or (v_email_key <> '' and email_normalized = v_email_key)
      )
    order by created_at asc
    limit 1;
  end if;

  if v_existing is not null then
    return jsonb_build_object('id', v_existing, 'duplicate', true);
  end if;

  v_id := coalesce(
    nullif(p_lead->>'id', ''),
    'lead-' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text || '-' || substr(gen_random_uuid()::text, 1, 8)
  );

  insert into public.crm_leads (
    id, name, phone, email, source, source_label, source_ref, property_id,
    interest, city, budget, stage, assigned_to, assigned_to_name, tags,
    notes, reference, archived, priority, deal_value, commission, won_at,
    created_at, updated_at
  ) values (
    v_id,
    trim(p_lead->>'name'),
    coalesce(p_lead->>'phone', ''),
    nullif(p_lead->>'email', ''),
    v_source,
    nullif(p_lead->>'sourceLabel', ''),
    v_source_ref,
    nullif(p_lead->>'propertyId', ''),
    nullif(p_lead->>'interest', ''),
    nullif(p_lead->>'city', ''),
    case when jsonb_typeof(p_lead->'budget') = 'number' then (p_lead->>'budget')::numeric else null end,
    coalesce(nullif(p_lead->>'stage', ''), 'new'),
    nullif(p_lead->>'assignedTo', ''),
    nullif(p_lead->>'assignedToName', ''),
    case when jsonb_typeof(p_lead->'tags') = 'array'
      then array(select jsonb_array_elements_text(p_lead->'tags'))
      else '{}'::text[] end,
    nullif(p_lead->>'notes', ''),
    nullif(p_lead->>'reference', ''),
    coalesce((p_lead->>'archived')::boolean, false),
    coalesce(nullif(p_lead->>'priority', ''), 'warm'),
    case when jsonb_typeof(p_lead->'dealValue') = 'number' then (p_lead->>'dealValue')::numeric else null end,
    case when jsonb_typeof(p_lead->'commission') = 'number' then (p_lead->>'commission')::numeric else null end,
    nullif(p_lead->>'wonAt', '')::timestamptz,
    coalesce(nullif(p_lead->>'createdAt', '')::timestamptz, now()),
    coalesce(nullif(p_lead->>'updatedAt', '')::timestamptz, now())
  );

  if jsonb_typeof(p_lead->'activities') = 'array' then
    for v_activity in select value from jsonb_array_elements(p_lead->'activities') loop
      if nullif(v_activity->>'text', '') is not null then
        insert into public.crm_activities (
          id, lead_id, kind, actor, body, from_stage, to_stage, created_at
        ) values (
          coalesce(nullif(v_activity->>'id', ''), 'act-' || gen_random_uuid()::text),
          v_id,
          coalesce(nullif(v_activity->>'kind', ''), 'note'),
          coalesce(nullif(v_activity->>'by', ''), p_actor),
          v_activity->>'text',
          nullif(v_activity->>'fromStage', ''),
          nullif(v_activity->>'toStage', ''),
          coalesce(nullif(v_activity->>'at', '')::timestamptz, now())
        ) on conflict (id) do nothing;
        v_activity_count := v_activity_count + 1;
      end if;
    end loop;
  end if;

  if v_activity_count = 0 then
    insert into public.crm_activities (id, lead_id, kind, actor, body)
    values ('act-' || gen_random_uuid()::text, v_id, 'note', p_actor, 'تمت إضافة العميل إلى نظام CRM.');
  end if;

  if jsonb_typeof(p_lead->'tasks') = 'array' then
    for v_task in select value from jsonb_array_elements(p_lead->'tasks') loop
      if nullif(v_task->>'title', '') is not null then
        insert into public.crm_tasks (
          id, lead_id, title, due_at, done, created_by, created_at, done_at
        ) values (
          coalesce(nullif(v_task->>'id', ''), 'task-' || gen_random_uuid()::text),
          v_id,
          v_task->>'title',
          coalesce(nullif(v_task->>'dueAt', '')::timestamptz, now()),
          coalesce((v_task->>'done')::boolean, false),
          coalesce(nullif(v_task->>'createdBy', ''), p_actor),
          coalesce(nullif(v_task->>'createdAt', '')::timestamptz, now()),
          nullif(v_task->>'doneAt', '')::timestamptz
        ) on conflict (id) do nothing;
      end if;
    end loop;
  end if;

  return jsonb_build_object('id', v_id, 'duplicate', false);
end;
$$;

create or replace function public.crm_set_stage(
  p_lead_id text,
  p_stage text,
  p_actor text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text;
begin
  if p_stage not in ('new', 'contacted', 'viewing', 'negotiation', 'won', 'lost') then
    raise exception 'CRM_INVALID_STAGE';
  end if;
  select stage into v_old from public.crm_leads where id = p_lead_id for update;
  if not found then return false; end if;
  if v_old = p_stage then return true; end if;
  update public.crm_leads set stage = p_stage where id = p_lead_id;
  insert into public.crm_activities (id, lead_id, kind, actor, body, from_stage, to_stage)
  values ('act-' || gen_random_uuid()::text, p_lead_id, 'stage', p_actor, 'تم تغيير مرحلة العميل.', v_old, p_stage);
  return true;
end;
$$;

create or replace function public.crm_assign_lead(
  p_lead_id text,
  p_assignee_id text,
  p_assignee_name text,
  p_actor text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.crm_leads
  set assigned_to = nullif(p_assignee_id, ''),
      assigned_to_name = nullif(p_assignee_name, '')
  where id = p_lead_id;
  if not found then return false; end if;
  insert into public.crm_activities (id, lead_id, kind, actor, body)
  values (
    'act-' || gen_random_uuid()::text,
    p_lead_id,
    'note',
    p_actor,
    case when nullif(p_assignee_name, '') is null
      then 'تم إلغاء إسناد العميل.'
      else 'تم إسناد العميل إلى ' || p_assignee_name || '.' end
  );
  return true;
end;
$$;

create or replace function public.crm_add_activity(
  p_lead_id text,
  p_kind text,
  p_body text,
  p_actor text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_id text := 'act-' || gen_random_uuid()::text;
begin
  if p_kind not in ('note', 'call', 'whatsapp', 'meeting', 'email') then
    raise exception 'CRM_INVALID_ACTIVITY';
  end if;
  if nullif(trim(p_body), '') is null then raise exception 'CRM_ACTIVITY_REQUIRED'; end if;
  insert into public.crm_activities (id, lead_id, kind, actor, body)
  values (v_id, p_lead_id, p_kind, p_actor, trim(p_body));
  update public.crm_leads set updated_at = now() where id = p_lead_id;
  return v_id;
end;
$$;

create or replace function public.crm_add_task(
  p_lead_id text,
  p_title text,
  p_due_at timestamptz,
  p_actor text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_id text := 'task-' || gen_random_uuid()::text;
begin
  if nullif(trim(p_title), '') is null then raise exception 'CRM_TASK_REQUIRED'; end if;
  insert into public.crm_tasks (id, lead_id, title, due_at, created_by)
  values (v_id, p_lead_id, trim(p_title), p_due_at, p_actor);
  update public.crm_leads set updated_at = now() where id = p_lead_id;
  return v_id;
end;
$$;

create or replace function public.crm_set_task_done(
  p_lead_id text,
  p_task_id text,
  p_done boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.crm_tasks
  set done = p_done, done_at = case when p_done then now() else null end
  where id = p_task_id and lead_id = p_lead_id;
  if not found then return false; end if;
  update public.crm_leads set updated_at = now() where id = p_lead_id;
  return true;
end;
$$;

create or replace function public.crm_delete_task(
  p_lead_id text,
  p_task_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.crm_tasks where id = p_task_id and lead_id = p_lead_id;
  if not found then return false; end if;
  update public.crm_leads set updated_at = now() where id = p_lead_id;
  return true;
end;
$$;

-- No browser role can read CRM tables directly. All access goes through the
-- authenticated server routes using the service role.
alter table public.crm_leads enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_tasks enable row level security;
alter table public.crm_settings enable row level security;
alter table public.crm_legacy_backups enable row level security;

revoke all on table public.crm_leads from anon, authenticated;
revoke all on table public.crm_activities from anon, authenticated;
revoke all on table public.crm_tasks from anon, authenticated;
revoke all on table public.crm_settings from anon, authenticated;
revoke all on table public.crm_legacy_backups from anon, authenticated;

grant all on table public.crm_leads to service_role;
grant all on table public.crm_activities to service_role;
grant all on table public.crm_tasks to service_role;
grant all on table public.crm_settings to service_role;
grant all on table public.crm_legacy_backups to service_role;

revoke all on function public.crm_create_lead(jsonb, text) from public, anon, authenticated;
revoke all on function public.crm_set_stage(text, text, text) from public, anon, authenticated;
revoke all on function public.crm_assign_lead(text, text, text, text) from public, anon, authenticated;
revoke all on function public.crm_add_activity(text, text, text, text) from public, anon, authenticated;
revoke all on function public.crm_add_task(text, text, timestamptz, text) from public, anon, authenticated;
revoke all on function public.crm_set_task_done(text, text, boolean) from public, anon, authenticated;
revoke all on function public.crm_delete_task(text, text) from public, anon, authenticated;

grant execute on function public.crm_create_lead(jsonb, text) to service_role;
grant execute on function public.crm_set_stage(text, text, text) to service_role;
grant execute on function public.crm_assign_lead(text, text, text, text) to service_role;
grant execute on function public.crm_add_activity(text, text, text, text) to service_role;
grant execute on function public.crm_add_task(text, text, timestamptz, text) to service_role;
grant execute on function public.crm_set_task_done(text, text, boolean) to service_role;
grant execute on function public.crm_delete_task(text, text) to service_role;

-- Back up the old private JSON row before migrating it.
insert into public.crm_legacy_backups (source_key, source_updated_at, payload)
select key, updated_at, value
from public.app_state
where key = 'aqaar-crm-v1'
on conflict (source_key, source_updated_at) do nothing;

-- Migrate leads from the old JSON envelope. IDs stay unchanged so activities
-- and tasks keep their relationships.
with legacy as (
  select jsonb_array_elements(
    case when jsonb_typeof(value->'items') = 'array' then value->'items' else '[]'::jsonb end
  ) as item
  from public.app_state
  where key = 'aqaar-crm-v1'
)
insert into public.crm_leads (
  id, name, phone, email, source, source_label, source_ref, property_id,
  interest, city, budget, stage, assigned_to, assigned_to_name, tags,
  notes, reference, archived, priority, deal_value, commission, won_at,
  created_at, updated_at
)
select
  item->>'id',
  coalesce(nullif(item->>'name', ''), 'عميل'),
  coalesce(item->>'phone', ''),
  nullif(item->>'email', ''),
  coalesce(nullif(item->>'source', ''), 'manual'),
  nullif(item->>'sourceLabel', ''),
  nullif(item->>'sourceRef', ''),
  nullif(item->>'propertyId', ''),
  nullif(item->>'interest', ''),
  nullif(item->>'city', ''),
  case when jsonb_typeof(item->'budget') = 'number' then (item->>'budget')::numeric else null end,
  coalesce(nullif(item->>'stage', ''), 'new'),
  nullif(item->>'assignedTo', ''),
  nullif(item->>'assignedToName', ''),
  case when jsonb_typeof(item->'tags') = 'array'
    then array(select jsonb_array_elements_text(item->'tags'))
    else '{}'::text[] end,
  nullif(item->>'notes', ''),
  nullif(item->>'reference', ''),
  coalesce((item->>'archived')::boolean, false),
  coalesce(nullif(item->>'priority', ''), 'warm'),
  case when jsonb_typeof(item->'dealValue') = 'number' then (item->>'dealValue')::numeric else null end,
  case when jsonb_typeof(item->'commission') = 'number' then (item->>'commission')::numeric else null end,
  nullif(item->>'wonAt', '')::timestamptz,
  coalesce(nullif(item->>'createdAt', '')::timestamptz, now()),
  coalesce(nullif(item->>'updatedAt', '')::timestamptz, now())
from legacy
where nullif(item->>'id', '') is not null
on conflict (id) do nothing;

with legacy as (
  select jsonb_array_elements(
    case when jsonb_typeof(value->'items') = 'array' then value->'items' else '[]'::jsonb end
  ) as lead
  from public.app_state
  where key = 'aqaar-crm-v1'
), activities as (
  select lead->>'id' as lead_id, activity
  from legacy
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(lead->'activities') = 'array' then lead->'activities' else '[]'::jsonb end
  ) as a(activity)
)
insert into public.crm_activities (
  id, lead_id, kind, actor, body, from_stage, to_stage, created_at
)
select
  activity->>'id', lead_id,
  coalesce(nullif(activity->>'kind', ''), 'note'),
  coalesce(nullif(activity->>'by', ''), 'الإدارة'),
  coalesce(nullif(activity->>'text', ''), 'سجل قديم'),
  nullif(activity->>'fromStage', ''),
  nullif(activity->>'toStage', ''),
  coalesce(nullif(activity->>'at', '')::timestamptz, now())
from activities
where nullif(activity->>'id', '') is not null
  and exists (select 1 from public.crm_leads where id = lead_id)
on conflict (id) do nothing;

with legacy as (
  select jsonb_array_elements(
    case when jsonb_typeof(value->'items') = 'array' then value->'items' else '[]'::jsonb end
  ) as lead
  from public.app_state
  where key = 'aqaar-crm-v1'
), tasks as (
  select lead->>'id' as lead_id, task
  from legacy
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(lead->'tasks') = 'array' then lead->'tasks' else '[]'::jsonb end
  ) as t(task)
)
insert into public.crm_tasks (
  id, lead_id, title, due_at, done, created_by, created_at, done_at
)
select
  task->>'id', lead_id,
  coalesce(nullif(task->>'title', ''), 'مهمة قديمة'),
  coalesce(nullif(task->>'dueAt', '')::timestamptz, now()),
  coalesce((task->>'done')::boolean, false),
  coalesce(nullif(task->>'createdBy', ''), 'الإدارة'),
  coalesce(nullif(task->>'createdAt', '')::timestamptz, now()),
  nullif(task->>'doneAt', '')::timestamptz
from tasks
where nullif(task->>'id', '') is not null
  and exists (select 1 from public.crm_leads where id = lead_id)
on conflict (id) do nothing;

-- Deliberately keep aqaar-crm-v1 private and unchanged as a rollback copy.
