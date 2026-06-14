ALTER TABLE public.scrims ADD COLUMN IF NOT EXISTS creator_nickname text;
NOTIFY pgrst, 'reload schema';