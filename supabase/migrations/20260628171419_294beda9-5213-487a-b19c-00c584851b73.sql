REVOKE EXECUTE ON FUNCTION public.owns_patient(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_patient(uuid) TO authenticated, service_role;