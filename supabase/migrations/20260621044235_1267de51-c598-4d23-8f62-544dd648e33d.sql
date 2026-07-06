-- has_role: only signed-in users (used by RLS policies)
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- handle_new_user: only fires from the auth trigger, no external callers
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- set_updated_at: trigger-only, no external callers
revoke execute on function public.set_updated_at() from public, anon, authenticated;