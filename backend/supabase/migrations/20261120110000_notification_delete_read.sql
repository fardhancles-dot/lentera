-- Lentera · Delete read notifications
-- Players may delete only their own notifications, and only ones already read.
-- Unread notifications stay until the player marks them read, so the bulk action
-- can never remove unread items. Direct table writes remain revoked; deletion
-- goes through these SECURITY DEFINER functions with an explicit user filter.

create or replace function public.delete_my_notification(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_deleted integer := 0;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_id is not null then
    delete from public.notifications
     where id = p_id
       and user_id = v_user
       and read_at is not null;
    get diagnostics v_deleted = row_count;
  end if;

  return jsonb_build_object('deleted', v_deleted > 0, 'id', p_id);
end;
$$;

create or replace function public.delete_my_read_notifications()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_deleted integer := 0;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  delete from public.notifications
   where user_id = v_user
     and read_at is not null;
  get diagnostics v_deleted = row_count;

  return jsonb_build_object('deleted', v_deleted);
end;
$$;

revoke all on function public.delete_my_notification(uuid) from public, anon;
revoke all on function public.delete_my_read_notifications() from public, anon;

grant execute on function public.delete_my_notification(uuid) to authenticated;
grant execute on function public.delete_my_read_notifications() to authenticated;
