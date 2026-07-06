-- Lock down SECURITY DEFINER functions: revoke EXECUTE from API roles.
-- RLS policies and triggers still invoke these internally; signed-in users
-- should not be able to call them directly via the Data API.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.owns_patient(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- set_updated_at is a trigger helper and does not need elevated privileges.
ALTER FUNCTION public.set_updated_at() SECURITY INVOKER;