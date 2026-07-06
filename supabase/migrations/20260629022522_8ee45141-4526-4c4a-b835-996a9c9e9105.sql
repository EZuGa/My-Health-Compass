GRANT EXECUTE ON FUNCTION public.owns_patient(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;