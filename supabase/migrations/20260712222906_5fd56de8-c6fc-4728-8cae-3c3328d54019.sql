create or replace function public.prek_merge_level_json(
  _level_id uuid,
  _column text,
  _patch jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if _column not in ('redub_audio_paths','redub_isolated_paths','music_audio_paths') then
    raise exception 'invalid column: %', _column;
  end if;
  execute format(
    'update public.prek_levels set %I = coalesce(%I, ''{}''::jsonb) || $1 where id = $2',
    _column, _column
  ) using _patch, _level_id;
end
$$;

revoke all on function public.prek_merge_level_json(uuid, text, jsonb) from public;
grant execute on function public.prek_merge_level_json(uuid, text, jsonb) to service_role;