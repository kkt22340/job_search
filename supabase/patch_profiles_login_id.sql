-- 기존 DB에 적용: profiles.login_id + handle_new_user (고용주 아이디 가입)
-- Supabase SQL Editor 에서 아래 블록 전체를 한 번에 실행하세요.
--
-- 오래된 profiles 에 employer_without_business / identity_verified_at 등이 없으면
-- 트리거 INSERT 가 실패합니다. 아래 ADD COLUMN 이 먼저 맞춰 줍니다.

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

COMMENT ON COLUMN public.profiles.login_id IS '고용주 로그인 아이디(소문자). Auth email 은 {login_id}@NEXT_PUBLIC_LOGIN_ID_AUTH_DOMAIN 형태';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_login_id_unique
  ON public.profiles (login_id)
  WHERE login_id IS NOT NULL;

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
  lid text;
  res_text text;
  phone_val text;
BEGIN
  -- 트리거는 auth 세션 역할로 실행되어 RLS가 INSERT 를 막는 경우가 있음(호출자 기준).
  -- 이 함수는 postgres 소유 + SECURITY DEFINER 이므로 트랜잭션 로컬로만 RLS 끔.
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
  ELSIF (meta ->> 'birth_date') ~ '^\d{4}-\d{2}-\d{2}$' THEN
    byear := SUBSTRING(meta ->> 'birth_date', 1, 4)::integer;
  ELSE
    byear := NULL;
  END IF;

  lid := NULLIF(LOWER(TRIM(meta ->> 'login_id')), '');

  phone_val := COALESCE(
    NULLIF(TRIM(COALESCE(NEW.phone::text, '')), ''),
    NULLIF(TRIM(meta ->> 'phone'), '')
  );
  res_text := NULLIF(TRIM(meta ->> 'residence'), '');

  INSERT INTO public.profiles (
    id,
    display_name,
    role,
    phone,
    employer_without_business,
    birth_year,
    login_id,
    residence
  )
  VALUES (
    NEW.id,
    COALESCE(
      meta ->> 'display_name',
      meta ->> 'full_name',
      'User'
    ),
    resolved_role,
    phone_val,
    ewob,
    byear,
    lid,
    res_text
  );
  RETURN NEW;
END;
$$;

-- 함수 소유자 + 트리거 본문에서 row_security 끄기(위 set_config) 조합으로 RLS INSERT 막힘을 방지합니다.
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
