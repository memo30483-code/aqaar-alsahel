-- Atomic, owner-scoped professional profile updates inside the legacy app_state row.
-- Keeps the stored value canonical (JSON array), applies optimistic concurrency,
-- and never trusts immutable ownership/moderation fields supplied by the browser.

create or replace function public.update_owned_professional(
  p_account_id text,
  p_record_id text,
  p_expected_version bigint,
  p_next_record jsonb,
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
  v_current jsonb;
  v_next jsonb;
  v_updated jsonb;
  v_version bigint;
  v_updated_at timestamptz;
begin
  if nullif(trim(p_account_id), '') is null or nullif(trim(p_record_id), '') is null then
    return jsonb_build_object('result', 'not_found');
  end if;

  select value into v_value
  from public.app_state
  where key = 'aqaar-professionals'
  for update;

  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;

  v_items := case
    when jsonb_typeof(v_value) = 'array' then v_value
    when jsonb_typeof(v_value->'items') = 'array' then v_value->'items'
    else '[]'::jsonb
  end;

  select item into v_current
  from jsonb_array_elements(v_items) item
  where item->>'id' = p_record_id
    and item->>'accountId' = p_account_id
  limit 1;

  if v_current is null then
    return jsonb_build_object('result', 'not_found');
  end if;

  v_version := case
    when (v_current->>'version') ~ '^[0-9]+$' then (v_current->>'version')::bigint
    else 1
  end;

  if v_version <> p_expected_version then
    return jsonb_build_object(
      'result', 'conflict',
      'record', v_current || jsonb_build_object('version', v_version)
    );
  end if;

  v_next := p_next_record || jsonb_build_object(
    'id', v_current->>'id',
    'kind', v_current->>'kind',
    'accountId', v_current->'accountId',
    'ownerToken', v_current->'ownerToken',
    'documents', coalesce(v_current->'documents', '[]'::jsonb),
    'licenses', coalesce(v_current->'licenses', '[]'::jsonb),
    'verified', coalesce(v_current->'verified', 'false'::jsonb),
    'featured', coalesce(v_current->'featured', 'false'::jsonb),
    'publishPolicy', coalesce(v_current->'publishPolicy', '"review"'::jsonb),
    'order', coalesce(v_current->'order', '1'::jsonb),
    'requestedAt', v_current->'requestedAt',
    'createdAt', v_current->'createdAt',
    'version', v_version + 1
  );

  select coalesce(jsonb_agg(
    case when item->>'id' = p_record_id then v_next else item end
    order by ord
  ), '[]'::jsonb)
  into v_updated
  from jsonb_array_elements(v_items) with ordinality rows(item, ord);

  update public.app_state
  set value = v_updated,
      is_public = true,
      updated_by = p_updated_by
  where key = 'aqaar-professionals'
  returning updated_at into v_updated_at;

  return jsonb_build_object(
    'result', 'updated',
    'record', v_next,
    'updated_at', v_updated_at
  );
end;
$$;

revoke all on function public.update_owned_professional(text, text, bigint, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.update_owned_professional(text, text, bigint, jsonb, text)
  to service_role;

-- Admin writes the full list, but every changed record must still carry the
-- version it was read with. One row lock prevents an owner save racing an admin save.
create or replace function public.update_professionals_admin(
  p_records jsonb,
  p_updated_by text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value jsonb;
  v_current jsonb;
  v_incoming jsonb;
  v_updated jsonb;
  v_updated_at timestamptz;
begin
  if jsonb_typeof(p_records) <> 'array' then
    return jsonb_build_object('result', 'not_found');
  end if;

  select value into v_value
  from public.app_state
  where key = 'aqaar-professionals'
  for update;

  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;

  v_current := case
    when jsonb_typeof(v_value) = 'array' then v_value
    when jsonb_typeof(v_value->'items') = 'array' then v_value->'items'
    else '[]'::jsonb
  end;
  v_incoming := p_records;

  if exists (
    select 1
    from jsonb_array_elements(v_incoming) as inc(incoming_item)
    join jsonb_array_elements(v_current) as cur(current_item)
      on current_item->>'id' = incoming_item->>'id'
    where (incoming_item - 'version') is distinct from (current_item - 'version')
      and (case when (incoming_item->>'version') ~ '^[0-9]+$'
            then (incoming_item->>'version')::bigint else 1 end)
          <> (case when (current_item->>'version') ~ '^[0-9]+$'
                then (current_item->>'version')::bigint else 1 end)
  ) then
    return jsonb_build_object('result', 'conflict');
  end if;

  select coalesce(jsonb_agg(
    case
      when current_item is null then incoming || jsonb_build_object('version', 1)
      when (incoming - 'version') is distinct from (current_item - 'version') then
        incoming || jsonb_build_object(
          'version', case when (current_item->>'version') ~ '^[0-9]+$'
            then (current_item->>'version')::bigint + 1 else 2 end
        )
      else current_item || jsonb_build_object(
        'version', case when (current_item->>'version') ~ '^[0-9]+$'
          then (current_item->>'version')::bigint else 1 end
      )
    end
    order by ord
  ), '[]'::jsonb)
  into v_updated
  from jsonb_array_elements(v_incoming) with ordinality as rows(incoming, ord)
  left join lateral (
    select item as current_item
    from jsonb_array_elements(v_current) as current_rows(item)
    where item->>'id' = incoming->>'id'
    limit 1
  ) found on true;

  update public.app_state
  set value = v_updated,
      is_public = true,
      updated_by = p_updated_by
  where key = 'aqaar-professionals'
  returning updated_at into v_updated_at;

  return jsonb_build_object(
    'result', 'updated',
    'records', v_updated,
    'updated_at', v_updated_at
  );
end;
$$;

revoke all on function public.update_professionals_admin(jsonb, text)
  from public, anon, authenticated;
grant execute on function public.update_professionals_admin(jsonb, text)
  to service_role;
