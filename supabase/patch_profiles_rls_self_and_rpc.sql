-- =============================================================================
-- profiles RLS 강화 + 고용주 표시명 전용 RPC
-- 적용: Supabase SQL Editor에서 실행 (기존 DB에 patch_profiles_login_id 등 이후)
--
-- 목적:
-- 1) 타인 profiles.phone 등 민감정보를 클라이언트(anon key)에서 임의 조회 불가
-- 2) 시니어 지원 현황 등에서 고용주 display_name 만 필요할 때는 RPC로만 노출
-- 3) 관리자는 기존처럼 전체 프로필 조회 가능
-- =============================================================================

DROP POLICY IF EXISTS "profiles_select_own_or_public_minimal" ON public.profiles;

-- 본인 행만
CREATE POLICY "profiles_select_self"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 관리자: 검수 큐 등에서 고용주 표시명·전화 등 전체 조회
CREATE POLICY "profiles_select_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS ad
      WHERE ad.id = auth.uid()
        AND ad.role = 'admin'::public.user_role
    )
  );

-- ---------------------------------------------------------------------------
-- 로그인 사용자 전용: 고용주 id 목록에 대해 display_name 만 반환 (전화번호 없음)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.employer_profiles_public(p_ids uuid[])
RETURNS TABLE (id uuid, display_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  IF p_ids IS NULL OR array_length(p_ids, 1) IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT p.id, p.display_name
  FROM public.profiles AS p
  WHERE p.role = 'employer'::public.user_role
    AND p.id = ANY (p_ids);
END;
$$;

ALTER FUNCTION public.employer_profiles_public(uuid[]) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.employer_profiles_public(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.employer_profiles_public(uuid[]) TO authenticated;

COMMENT ON FUNCTION public.employer_profiles_public(uuid[]) IS
  '시니어 지원 현황 등: 고용주 표시명만 조회. 민감 컬럼(phone)은 포함하지 않음.';
