-- 관리자: 모든 공고 조회 + 검수 필드 수정, 검수 로그 기록
-- 기존 DB에 적용 시 Supabase SQL Editor에서 실행

DROP POLICY IF EXISTS "job_postings_select_admin" ON public.job_postings;
CREATE POLICY "job_postings_select_admin"
  ON public.job_postings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS ad
      WHERE ad.id = auth.uid ()
        AND ad.role = 'admin'::public.user_role
    )
  );

DROP POLICY IF EXISTS "job_postings_update_admin" ON public.job_postings;
CREATE POLICY "job_postings_update_admin"
  ON public.job_postings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS ad
      WHERE ad.id = auth.uid ()
        AND ad.role = 'admin'::public.user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles AS ad
      WHERE ad.id = auth.uid ()
        AND ad.role = 'admin'::public.user_role
    )
  );

DROP POLICY IF EXISTS "moderation_logs_select_admin" ON public.job_moderation_logs;
CREATE POLICY "moderation_logs_select_admin"
  ON public.job_moderation_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS ad
      WHERE ad.id = auth.uid ()
        AND ad.role = 'admin'::public.user_role
    )
  );

DROP POLICY IF EXISTS "moderation_logs_insert_admin" ON public.job_moderation_logs;
CREATE POLICY "moderation_logs_insert_admin"
  ON public.job_moderation_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles AS ad
      WHERE ad.id = auth.uid ()
        AND ad.role = 'admin'::public.user_role
    )
  );
