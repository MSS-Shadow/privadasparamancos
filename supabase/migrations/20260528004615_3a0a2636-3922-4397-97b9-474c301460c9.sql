DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_profile_created_assign_player_role'
  ) THEN
    CREATE TRIGGER on_profile_created_assign_player_role
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_first_profile_assign_admin_role'
  ) THEN
    CREATE TRIGGER on_first_profile_assign_admin_role
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.auto_admin_first_user();
  END IF;
END $$;

GRANT SELECT ON public.announcements TO anon;
GRANT SELECT ON public.bracket_matches TO anon;
GRANT SELECT ON public.clan_members TO anon;
GRANT SELECT ON public.clans TO anon;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.scrim_participants TO anon;
GRANT SELECT ON public.scrims TO anon;
GRANT SELECT ON public.site_config TO anon;
GRANT SELECT ON public.tournament_champions TO anon;
GRANT SELECT ON public.tournament_registrations TO anon;
GRANT SELECT ON public.tournament_results TO anon;
GRANT SELECT ON public.tournament_scoring_config TO anon;
GRANT SELECT ON public.tournament_waiting_list TO anon;
GRANT SELECT ON public.tournaments TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_toggle_role(uuid, public.app_role, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;