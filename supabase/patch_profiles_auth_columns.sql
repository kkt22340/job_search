-- 기존 DB에 이미 profiles 가 있을 때 실행 (신규는 schema.sql 전체 사용)
-- ⚠️ 최신 스키마·트리거는 supabase/patch_profiles_login_id.sql 를 쓰는 것을 권장합니다.
-- Supabase SQL Editor 에서 한 번 실행

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employer_without_business BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS birth_year INTEGER NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_birth_year_sane;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_birth_year_sane CHECK (
    birth_year IS NULL
    OR (birth_year >= 1900 AND birth_year <= 2100)
  );

COMMENT ON COLUMN public.profiles.employer_without_business IS 'role=employer 이고 사업자 없는 고용주일 때 true';
COMMENT ON COLUMN public.profiles.birth_year IS '시니어 통계용 (만 나이는 앱에서 계산, 기준 연령은 정책에 따라 조정)';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  r text := meta ->> 'role';
  resolved_role public.user_role;
  ewob boolean;
  byear integer;
BEGIN
  PERFORM set_config('row_security', 'off', true);

  IF r IN ('employer', 'senior', 'admin') THEN
    resolved_role := r::public.user_role;
  ELSIF (meta ->> 'account_kind') = 'employer_informal' THEN
    resolved_role := 'employer'::public.user_role;
  ELSE
    resolved_role := 'senior'::public.user_role;
  END IF;

  ewob := false;
  IF (meta ->> 'account_kind') = 'employer_informal' THEN
    ewob := true;
  ELSIF lower(COALESCE(meta ->> 'employer_without_business', '')) IN (
    'true',
    't',
    '1'
  ) THEN
    ewob := true;
  END IF;

  IF (meta ->> 'birth_year') ~ '^\d{4}$' THEN
    byear := (meta ->> 'birth_year')::integer;
  ELSE
    byear := NULL;
  END IF;

  INSERT INTO public.profiles (
    id,
    display_name,
    role,
    phone,
    employer_without_business,
    birth_year
  )
  VALUES (
    NEW.id,
    COALESCE(
      meta ->> 'display_name',
      meta ->> 'full_name',
      'User'
    ),
    resolved_role,
    NEW.phone,
    ewob,
    byear
  );
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
