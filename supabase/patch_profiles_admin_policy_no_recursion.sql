-- =============================================================================
-- RLS 무한 재귀 전면 수정 (profiles · job_postings · job_applications · moderation_logs)
--
-- 증상 예:
--   - infinite recursion detected in policy for relation "profiles"
--   - 지원 현황에서 job_applications 조회 실패 → "목록을 잠시 불러오지 못했어요"
--
-- 원인:
--   1) 정책에서 public.profiles 를 직접 서브쿼리 → profiles RLS 재평가
--   2) job_applications 정책이 OR 로 job_postings 를 읽을 때, job_postings 의 관리자
--      정책이 다시 profiles 를 읽어 재귀
--
-- 해결:
--   - 관리자 여부는 public.is_requester_admin() 만 사용 (SECURITY DEFINER)
--   - job_applications 는 시니어 본인 / 고용주 정책을 분리해 시니어 조회 시
--     job_postings 정책을 타지 않도록 함
--
-- 적용: Supabase SQL Editor에서 한 번에 실행
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_requester_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'::public.user_role
  );
$$;

ALTER FUNCTION public.is_requester_admin() OWNER TO postgres;

REVOKE ALL ON FUNCTION public.is_requester_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_requester_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;

CREATE POLICY "profiles_select_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_requester_admin());

-- ---------------------------------------------------------------------------
-- job_postings (관리자 정책에서 profiles 직접 서브쿼리 제거)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "job_postings_select_admin" ON public.job_postings;
DROP POLICY IF EXISTS "job_postings_update_admin" ON public.job_postings;

CREATE POLICY "job_postings_select_admin"
  ON public.job_postings
  FOR SELECT
  TO authenticated
  USING (public.is_requester_admin());

CREATE POLICY "job_postings_update_admin"
  ON public.job_postings
  FOR UPDATE
  TO authenticated
  USING (public.is_requester_admin())
  WITH CHECK (public.is_requester_admin());

-- ---------------------------------------------------------------------------
-- job_applications: 시니어 본인 행은 job_postings 를 읽지 않는 정책만 적용
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "applications_select_parties" ON public.job_applications;
DROP POLICY IF EXISTS "applications_update_parties" ON public.job_applications;

CREATE POLICY "applications_select_as_senior"
  ON public.job_applications
  FOR SELECT
  TO authenticated
  USING (senior_id = auth.uid());

CREATE POLICY "applications_select_as_employer"
  ON public.job_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_postings j
      WHERE j.id = job_applications.job_id
        AND j.employer_id = auth.uid()
    )
  );

CREATE POLICY "applications_update_senior_own"
  ON public.job_applications
  FOR UPDATE
  TO authenticated
  USING (senior_id = auth.uid())
  WITH CHECK (senior_id = auth.uid());

CREATE POLICY "applications_update_employer_for_own_jobs"
  ON public.job_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_postings j
      WHERE j.id = job_applications.job_id
        AND j.employer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.job_postings j
      WHERE j.id = job_applications.job_id
        AND j.employer_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- job_moderation_logs
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "moderation_logs_select_admin" ON public.job_moderation_logs;
DROP POLICY IF EXISTS "moderation_logs_insert_admin" ON public.job_moderation_logs;

CREATE POLICY "moderation_logs_select_admin"
  ON public.job_moderation_logs
  FOR SELECT
  TO authenticated
  USING (public.is_requester_admin());

CREATE POLICY "moderation_logs_insert_admin"
  ON public.job_moderation_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_requester_admin());

COMMENT ON FUNCTION public.is_requester_admin() IS
  'RLS 정책용: 요청자 admin 여부. profiles 직접 서브쿼리 시 재귀 방지.';
