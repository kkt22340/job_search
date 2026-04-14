-- 시니어가 본인 지원 행을 삭제(지원 취소)할 수 있도록 DELETE RLS 추가
-- 적용: Supabase SQL Editor

CREATE POLICY "applications_delete_senior_own"
  ON public.job_applications
  FOR DELETE
  TO authenticated
  USING (senior_id = auth.uid());
