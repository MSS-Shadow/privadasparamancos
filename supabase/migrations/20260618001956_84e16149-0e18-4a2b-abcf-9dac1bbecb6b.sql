DROP POLICY IF EXISTS "Admins and creators can manage scrims" ON public.scrims;

CREATE POLICY "Admins and creators can view scrims"
ON public.scrims
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'content_creator'::app_role));

CREATE POLICY "Admins and creators can create scrims"
ON public.scrims
FOR INSERT
TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'content_creator'::app_role));

CREATE POLICY "Admins and creators can update scrims"
ON public.scrims
FOR UPDATE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'content_creator'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'content_creator'::app_role));

CREATE POLICY "Admins and creators can delete scrims"
ON public.scrims
FOR DELETE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'content_creator'::app_role));