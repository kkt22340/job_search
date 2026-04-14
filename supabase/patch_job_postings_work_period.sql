-- Add job_postings.work_period (one_off / short / long)
-- 목적: 단기 알바 강조를 위해 공고 등록 시 기간 성격을 명시

ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS work_period TEXT;

ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS work_start_date DATE;

ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS work_end_date DATE;

UPDATE public.job_postings
  SET work_period = COALESCE(work_period, 'short')
  WHERE work_period IS NULL;

ALTER TABLE public.job_postings
  ALTER COLUMN work_period SET NOT NULL,
  ALTER COLUMN work_period SET DEFAULT 'short';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_postings_work_period_check'
  ) THEN
    ALTER TABLE public.job_postings
      ADD CONSTRAINT job_postings_work_period_check
      CHECK (work_period IN ('one_off', 'short', 'long'));
  END IF;
END $$;

