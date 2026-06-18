ALTER TABLE public.scrims RENAME COLUMN title TO name;
ALTER TABLE public.scrims RENAME COLUMN date TO scheduled_at;

ALTER TABLE public.scrims ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.scrims ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.scrims ADD COLUMN IF NOT EXISTS room_id text;
ALTER TABLE public.scrims ADD COLUMN IF NOT EXISTS room_password text;
ALTER TABLE public.scrims ADD COLUMN IF NOT EXISTS current_players integer NOT NULL DEFAULT 0;
ALTER TABLE public.scrims ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

UPDATE public.scrims
SET slug = lower(regexp_replace(coalesce(name, id::text), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 8)
WHERE slug IS NULL;

UPDATE public.scrims
SET room_id = 'PENDIENTE'
WHERE room_id IS NULL;

ALTER TABLE public.scrims ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.scrims ALTER COLUMN room_id SET NOT NULL;
ALTER TABLE public.scrims ALTER COLUMN mode DROP NOT NULL;

ALTER TABLE public.scrims DROP COLUMN IF EXISTS creator_nickname;

CREATE UNIQUE INDEX IF NOT EXISTS scrims_slug_key ON public.scrims (slug);
CREATE INDEX IF NOT EXISTS scrims_scheduled_at_idx ON public.scrims (scheduled_at DESC);
CREATE INDEX IF NOT EXISTS scrims_created_by_idx ON public.scrims (created_by);

CREATE TRIGGER update_scrims_updated_at
BEFORE UPDATE ON public.scrims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();