REVOKE ALL ON FUNCTION public.admin_list_user_roles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_user_roles() TO authenticated;
NOTIFY pgrst, 'reload schema';