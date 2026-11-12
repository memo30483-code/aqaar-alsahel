-- Reliability primitives: atomic account/professional creation, idempotent
-- property submissions, and tracked temporary uploads.

create extension if not exists pgcrypto;

create table if not exists public.request_idempotency (
  scope text not null,
  actor_id text not null,
  idempotency_key text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (scope, actor_id, idempotency_key)
);

create index if not exists request_idempotency_created_idx
  on public.request_idempotency (created_at);

create table if not exists public.upload_staging (
  path text primary key,
  bucket text not null check (bucket in ('media', 'documents')),
  account_id text not null,
  submission_id text not null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists upload_staging_orphan_idx
  on public.upload_staging (created_at) where claimed_at is null;
create index if not exists upload_staging_submission_idx
  on public.upload_staging (account_id, submission_id);

alter table public.request_idempotency enable row level security;
alter table public.upload_staging enable row level security;
revoke all on table public.request_idempotency, public.upload_staging
  from anon, authenticated;
grant all on table public.request_idempotency, public.upload_staging
  to service_role;

create or replace function public.register_user_account(p_account jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value jsonb;
  v_accounts jsonb;
  v_email text := lower(trim(coalesce(p_account->>'emailNormalized', '')));
  v_id text := trim(coalesce(p_account->>'id', ''));
begin
  if v_email = '' or v_id = '' then
    return jsonb_build_object('result', 'invalid');
  end if;

  insert into public.app_state (key, value, is_public, updated_by)
  values (
    'aqaar-accounts',
    jsonb_build_object('version', 2, 'accounts', '[]'::jsonb),
    false,
    'registration'
  )
  on conflict (key) do nothing;

  select value into v_value
  from public.app_state
  where key = 'aqaar-accounts'
  for update;

  v_accounts := case
    when jsonb_typeof(v_value->'accounts') = 'array' then v_value->'accounts'
    else '[]'::jsonb
  end;

  if exists (
    select 1
    from jsonb_array_elements(v_accounts) as rows(account)
    where lower(trim(coalesce(account->>'emailNormalized', account->>'email', ''))) = v_email
       or account->>'id' = v_id
  ) then
    return jsonb_build_object('result', 'email_exists');
  end if;

  v_accounts := v_accounts || jsonb_build_array(p_account);
  update public.app_state
  set value = jsonb_build_object('version', 2, 'accounts', v_accounts),
      is_public = false,
      updated_by = 'registration'
  where key = 'aqaar-accounts';

  return jsonb_build_object('result', 'created', 'account', p_account);
end;
$$;

create or replace function public.create_professional_record(
  p_record jsonb,
  p_updated_by text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value jsonb;
  v_items jsonb;
  v_account_id text := trim(coalesce(p_record->>'accountId', ''));
  v_email text := lower(trim(coalesce(p_record->>'email', '')));
  v_existing jsonb;
begin
  if v_account_id = '' then
    return jsonb_build_object('result', 'invalid');
  end if;

  insert into public.app_state (key, value, is_public, updated_by)
  values ('aqaar-professionals', '[]'::jsonb, true, p_updated_by)
  on conflict (key) do nothing;

  select value into v_value
  from public.app_state
  where key = 'aqaar-professionals'
  for update;

  v_items := case
    when jsonb_typeof(v_value) = 'array' then v_value
    when jsonb_typeof(v_value->'items') = 'array' then v_value->'items'
    else '[]'::jsonb
  end;

  select item into v_existing
  from jsonb_array_elements(v_items) as rows(item)
  where item->>'accountId' = v_account_id
     or (v_email <> '' and lower(trim(coalesce(item->>'email', ''))) = v_email)
  limit 1;

  if v_existing is not null then
    return jsonb_build_object('result', 'existing', 'record', v_existing);
  end if;

  p_record := p_record || jsonb_build_object('version', 1);
  update public.app_state
  set value = v_items || jsonb_build_array(p_record),
      is_public = true,
      updated_by = p_updated_by
  where key = 'aqaar-professionals';

  return jsonb_build_object('result', 'created', 'record', p_record);
end;
$$;

create or replace function public.create_property_submission(
  p_account_id text,
  p_submission_id text,
  p_property jsonb,
  p_reference text,
  p_name text,
  p_phone text,
  p_message text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_receipt jsonb;
  v_inquiry_id uuid;
  v_value jsonb;
  v_properties jsonb;
  v_response jsonb;
  v_length integer;
begin
  if nullif(trim(p_account_id), '') is null
     or p_submission_id !~ '^[A-Za-z0-9-]{8,80}$'
     or nullif(trim(coalesce(p_property->>'id', '')), '') is null then
    return jsonb_build_object('result', 'invalid');
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('property_submission:' || p_account_id || ':' || p_submission_id, 0)
  );

  select response into v_receipt
  from public.request_idempotency
  where scope = 'property_submission'
    and actor_id = p_account_id
    and idempotency_key = p_submission_id;

  if v_receipt is not null then
    return v_receipt || jsonb_build_object('result', 'duplicate');
  end if;

  insert into public.inquiries (
    kind, name, phone, message, payload, status
  ) values (
    'property_submission',
    nullif(trim(p_name), ''),
    nullif(trim(p_phone), ''),
    nullif(trim(p_message), ''),
    jsonb_build_object(
      'property', p_property,
      'submissionId', p_submission_id,
      'accountId', p_account_id
    ),
    'new'
  ) returning id into v_inquiry_id;

  insert into public.app_state (key, value, is_public, updated_by)
  values ('aqaar-properties', '[]'::jsonb, true, 'public-property-form')
  on conflict (key) do nothing;

  select value into v_value
  from public.app_state
  where key = 'aqaar-properties'
  for update;

  v_properties := case
    when jsonb_typeof(v_value) = 'array' then v_value
    else '[]'::jsonb
  end;
  v_properties := v_properties || jsonb_build_array(p_property);
  v_length := jsonb_array_length(v_properties);

  if v_length > 5000 then
    select coalesce(jsonb_agg(item order by ord), '[]'::jsonb)
    into v_properties
    from jsonb_array_elements(v_properties) with ordinality as rows(item, ord)
    where ord > v_length - 5000;
  end if;

  update public.app_state
  set value = v_properties,
      is_public = true,
      updated_by = 'public-property-form'
  where key = 'aqaar-properties';

  update public.upload_staging
  set claimed_at = now()
  where account_id = p_account_id
    and submission_id = p_submission_id
    and (
      coalesce(p_property->>'image', '') like '%' || path
      or exists (
        select 1
        from jsonb_array_elements(coalesce(p_property->'documents', '[]'::jsonb)) as docs(document)
        where document->>'storagePath' = path
      )
    )
    and claimed_at is null;

  v_response := jsonb_build_object(
    'result', 'created',
    'inquiryId', v_inquiry_id,
    'reference', p_reference,
    'property', p_property
  );

  insert into public.request_idempotency (
    scope, actor_id, idempotency_key, response
  ) values (
    'property_submission', p_account_id, p_submission_id, v_response
  );

  return v_response;
end;
$$;

revoke all on function public.register_user_account(jsonb)
  from public, anon, authenticated;
revoke all on function public.create_professional_record(jsonb, text)
  from public, anon, authenticated;
revoke all on function public.create_property_submission(text, text, jsonb, text, text, text, text)
  from public, anon, authenticated;

grant execute on function public.register_user_account(jsonb) to service_role;
grant execute on function public.create_professional_record(jsonb, text) to service_role;
grant execute on function public.create_property_submission(text, text, jsonb, text, text, text, text)
  to service_role;
