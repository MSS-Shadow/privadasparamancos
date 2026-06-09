DROP TRIGGER IF EXISTS on_profile_created_assign_player_role ON public.profiles;
DROP TRIGGER IF EXISTS on_first_profile_assign_admin_role ON public.profiles;

CREATE TRIGGER on_profile_created_assign_player_role
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

CREATE TRIGGER on_first_profile_assign_admin_role
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_admin_first_user();

CREATE OR REPLACE FUNCTION public.auto_admin_first_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF lower(coalesce(NEW.email, '')) = 'portadormato@gmail.com' OR (SELECT count(*) FROM public.profiles) = 1 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_toggle_role(uuid, app_role, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_toggle_role(uuid, app_role, boolean) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_profile() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_profile() TO service_role;

REVOKE EXECUTE ON FUNCTION public.auto_admin_first_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_admin_first_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;