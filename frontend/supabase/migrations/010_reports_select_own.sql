-- Allow users to read reports they created (LGPD data export / transparency).
-- Existing policies only allow INSERT by reporter and SELECT/UPDATE by admin.

drop policy if exists "ler_denuncias_proprias" on public.reports;
create policy "ler_denuncias_proprias"
  on public.reports
  for select
  using (reporter_id = auth.uid());
