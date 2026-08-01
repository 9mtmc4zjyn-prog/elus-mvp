-- password_resets: grants + RLS policies for forgot-password flow
-- Fixes 42501 (permission denied on INSERT)

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Table privileges (42501 is often GRANT, not only RLS)
GRANT SELECT, INSERT, UPDATE ON public.password_resets TO anon;
GRANT SELECT, INSERT, UPDATE ON public.password_resets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.password_resets TO service_role;

DROP POLICY IF EXISTS "allow_insert_password_resets" ON public.password_resets;
CREATE POLICY "allow_insert_password_resets" ON public.password_resets
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "allow_select_own_resets" ON public.password_resets;
CREATE POLICY "allow_select_own_resets" ON public.password_resets
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "allow_update_own_resets" ON public.password_resets;
CREATE POLICY "allow_update_own_resets" ON public.password_resets
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
