DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

CREATE POLICY "Users can read their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.admin_list_user_roles()
RETURNS TABLE(user_id uuid, role public.app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT ur.user_id, ur.role
  FROM public.user_roles ur
  WHERE private.has_role(auth.uid(), 'admin'::public.app_role)
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_user_roles() TO authenticated;

GRANT SELECT ON public.scrims TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.scrims TO authenticated;
GRANT ALL ON public.scrims TO service_role;

GRANT SELECT ON public.tournaments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tournaments TO authenticated;
GRANT ALL ON public.tournaments TO service_role;

GRANT SELECT ON public.tournament_champions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tournament_champions TO authenticated;
GRANT ALL ON public.tournament_champions TO service_role;

REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, nickname, player_id, platform, country, clan, verified, created_at, updated_at, status, is_clan_leader) ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

NOTIFY pgrst, 'reload schema';