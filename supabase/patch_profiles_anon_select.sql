-- =============================================================================
-- (선택) 지도에서 고용주 표시명을 쓰려면: anon 이 활성 공고가 있는 고용주의 profiles 만 읽도록 허용
-- fetch-job-pins.ts 에서 다시 `profiles ( display_name )` 를 넣은 뒤 사용하세요.
-- =============================================================================

CREATE POLICY "profiles_select_visible_job_employers_anon"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_postings AS j
      WHERE j.employer_id = profiles.id
        AND j.status = 'active'
        AND j.moderation_status = 'approved'
    )
  );
