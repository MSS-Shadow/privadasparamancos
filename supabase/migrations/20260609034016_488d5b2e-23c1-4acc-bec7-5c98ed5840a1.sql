DROP TRIGGER IF EXISTS on_first_profile_auto_admin ON public.profiles;
DROP TRIGGER IF EXISTS on_first_user_admin ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

DROP TRIGGER IF EXISTS on_profile_created_assign_player_role ON public.profiles;
DROP TRIGGER IF EXISTS on_first_profile_assign_admin_role ON public.profiles;

CREATE TRIGGER on_profile_created_assign_player_role
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

CREATE TRIGGER on_first_profile_assign_admin_role
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_admin_first_user();