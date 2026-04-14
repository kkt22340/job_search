-- 오래된 public.profiles 에 없는 컬럼을 한 번에 추가합니다.
-- (employer_without_business / identity_verified_at 없으면 트리거·RLS·앱 쿼리가 실패합니다.)
-- Supabase SQL Editor 에서 실행 후 patch_profiles_login_id.sql 을 실행하세요.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employer_without_business BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_year INTEGER NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS login_id TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS residence TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_birth_year_sane;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_birth_year_sane CHECK (
    birth_year IS NULL
    OR (birth_year >= 1900 AND birth_year <= 2100)
  );

COMMENT ON COLUMN public.profiles.employer_without_business IS 'role=employer 이고 사업자 없는 고용주일 때 true';
COMMENT ON COLUMN public.profiles.birth_year IS '시니어 통계용';
COMMENT ON COLUMN public.profiles.identity_verified_at IS '본인인증 성공 시각';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_login_id_unique
  ON public.profiles (login_id)
  WHERE login_id IS NOT NULL;
