DO $$
BEGIN
  ALTER TABLE public.profiles REPLICA IDENTITY FULL;
  ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
  ALTER TABLE public.clans REPLICA IDENTITY FULL;
  ALTER TABLE public.tournaments REPLICA IDENTITY FULL;
  ALTER TABLE public.scrims REPLICA IDENTITY FULL;
  ALTER TABLE public.tournament_registrations REPLICA IDENTITY FULL;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_roles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'clans') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clans;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tournaments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'scrims') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scrims;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tournament_registrations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_registrations;
  END IF;
END $$;