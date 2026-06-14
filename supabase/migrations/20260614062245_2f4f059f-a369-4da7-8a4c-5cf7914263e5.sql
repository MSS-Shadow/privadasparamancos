
-- 1) Profiles email: revoke column-level SELECT from anon and authenticated
REVOKE SELECT (email) ON public.profiles FROM anon, authenticated;

-- 2) Push subscriptions: use private.has_role
DROP POLICY IF EXISTS "Admins read all push subs" ON public.push_subscriptions;
CREATE POLICY "Admins read all push subs"
  ON public.push_subscriptions
  FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- 3) Storage uploads policies
DROP POLICY IF EXISTS "Public read scoped uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users update own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete uploads" ON storage.objects;

-- Public can only read non-sensitive folders
CREATE POLICY "Public read non-sensitive uploads"
  ON storage.objects FOR SELECT
  TO public
  USING (
    bucket_id = 'uploads'
    AND name IS NOT NULL
    AND (storage.foldername(name))[1] = ANY (ARRAY['announcements','avatars'])
  );

-- Authenticated users can read their own sensitive files
CREATE POLICY "Users read own sensitive uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND name IS NOT NULL
    AND (storage.foldername(name))[1] = ANY (ARRAY['verification','reports','evidence'])
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Admins can read everything in uploads
CREATE POLICY "Admins read all uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'uploads' AND private.has_role(auth.uid(), 'admin'::app_role));

-- INSERT: scoped per folder
CREATE POLICY "Users upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND name IS NOT NULL
    AND (
      (
        (storage.foldername(name))[1] = ANY (ARRAY['verification','reports','evidence','avatars'])
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
      OR (
        (storage.foldername(name))[1] = 'announcements'
        AND private.has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

-- UPDATE: same scoping
CREATE POLICY "Users update own folder"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (
      (
        (storage.foldername(name))[1] = ANY (ARRAY['verification','reports','evidence','avatars'])
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
      OR (
        (storage.foldername(name))[1] = 'announcements'
        AND private.has_role(auth.uid(), 'admin'::app_role)
      )
      OR private.has_role(auth.uid(), 'admin'::app_role)
    )
  )
  WITH CHECK (
    bucket_id = 'uploads'
    AND (
      (
        (storage.foldername(name))[1] = ANY (ARRAY['verification','reports','evidence','avatars'])
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
      OR (
        (storage.foldername(name))[1] = 'announcements'
        AND private.has_role(auth.uid(), 'admin'::app_role)
      )
      OR private.has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- DELETE: own folder or admin
CREATE POLICY "Users delete own or admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (
      ((storage.foldername(name))[2] = auth.uid()::text)
      OR private.has_role(auth.uid(), 'admin'::app_role)
    )
  );
