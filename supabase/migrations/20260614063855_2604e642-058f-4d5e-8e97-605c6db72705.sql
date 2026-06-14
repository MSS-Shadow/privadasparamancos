
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, nickname, player_id, platform, country, clan, verified, created_at, updated_at, status, is_clan_leader) ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;
NOTIFY pgrst, 'reload schema';
