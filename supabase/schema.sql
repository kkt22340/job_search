-- =============================================================================
-- 백구(Baekgu) — 초기 스키마 (Supabase SQL Editor에 붙여넣어 실행)
-- 실행 전: Authentication → Providers 설정, 필요 시 이메일/카카오 등 연동
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum 타입
-- ---------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('employer', 'senior', 'admin');

CREATE TYPE public.job_status AS ENUM (
  'draft',
  'active',
  'closed',
  'hidden',
  'flagged'
);

CREATE TYPE public.application_status AS ENUM (
  'applied',
  'withdrawn',
  'reviewing',
  'hired',
  'rejected'
);

CREATE TYPE public.moderation_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'needs_review'
);

-- ---------------------------------------------------------------------------
-- profiles — auth.users 1:1 (역할·표시명·연락처; 마스킹은 API 레이어)
-- employer_without_business: role=employer 이고 사업자 없는 고용주일 때 true
-- birth_year: 시니어 통계용(만 나이는 앱에서 계산)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'senior',
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  employer_without_business BOOLEAN NOT NULL DEFAULT FALSE,
  birth_year INTEGER NULL,
  -- PASS·휴대폰 등 본인인증 성공 시각(유료 인증은 필요한 액션 직전에만 사용)
  identity_verified_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_birth_year_sane CHECK (
    birth_year IS NULL
    OR (birth_year >= 1900 AND birth_year <= 2100)
  )
);

CREATE INDEX profiles_role_idx ON public.profiles (role);

-- ---------------------------------------------------------------------------
-- employer_business_verifications — 사업자 인증 결과 캐시 (최초 공고 시 1회 등)
-- ---------------------------------------------------------------------------
CREATE TABLE public.employer_business_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  employer_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  business_registration_number TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  provider TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employer_id)
);

CREATE INDEX employer_verifications_brn_idx ON public.employer_business_verifications (business_registration_number);

-- ---------------------------------------------------------------------------
-- categories — 계층형 (부모=대분류 PRD 4종, 자식=세부 직종)
-- ---------------------------------------------------------------------------
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  slug TEXT NOT NULL UNIQUE,
  name_ko TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories (id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX categories_parent_idx ON public.categories (parent_id);

-- ---------------------------------------------------------------------------
-- job_postings — 공고 (지도 핀, 태그 JSONB)
-- ---------------------------------------------------------------------------
CREATE TABLE public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  employer_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::JSONB,
  wage_hourly NUMERIC(12, 2),
  employment_type TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  address TEXT,
  status public.job_status NOT NULL DEFAULT 'draft',
  moderation_status public.moderation_status NOT NULL DEFAULT 'pending',
  moderation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX job_postings_employer_idx ON public.job_postings (employer_id);
CREATE INDEX job_postings_category_idx ON public.job_postings (category_id);
CREATE INDEX job_postings_status_idx ON public.job_postings (status);
CREATE INDEX job_postings_lat_lng_idx ON public.job_postings (lat, lng);
CREATE INDEX job_postings_tags_gin ON public.job_postings USING GIN (tags);

-- ---------------------------------------------------------------------------
-- senior_profiles — 간편 이력서 (아이콘/확장 필드는 JSONB)
-- ---------------------------------------------------------------------------
CREATE TABLE public.senior_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  profile JSONB NOT NULL DEFAULT '{}'::JSONB,
  badges JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- neighborhood_settings — 우리 동네 (행정동 등)
-- ---------------------------------------------------------------------------
CREATE TABLE public.neighborhood_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  admin_dong_code TEXT,
  label TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- applications — 지원 (채용 확정 전 연락처 마스킹은 API에서)
-- ---------------------------------------------------------------------------
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  job_id UUID NOT NULL REFERENCES public.job_postings (id) ON DELETE CASCADE,
  senior_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'applied',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, senior_id)
);

CREATE INDEX job_applications_job_idx ON public.job_applications (job_id);
CREATE INDEX job_applications_senior_idx ON public.job_applications (senior_id);

-- ---------------------------------------------------------------------------
-- job_moderation_logs — OpenAI/운영자 검수 이력
-- ---------------------------------------------------------------------------
CREATE TABLE public.job_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  job_id UUID NOT NULL REFERENCES public.job_postings (id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'batch',
  ai_score NUMERIC(5, 4),
  flags JSONB,
  raw_model_output JSONB,
  reviewed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX job_moderation_logs_job_idx ON public.job_moderation_logs (job_id);

-- ---------------------------------------------------------------------------
-- updated_at 자동 갱신
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER senior_profiles_updated_at
  BEFORE UPDATE ON public.senior_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER neighborhood_settings_updated_at
  BEFORE UPDATE ON public.neighborhood_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 회원가입 시 profiles 자동 생성
-- ---------------------------------------------------------------------------
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
  IF r IN ('employer', 'senior', 'admin') THEN
    resolved_role := r::public.user_role;
  ELSIF (meta ->> 'account_kind') = 'employer_informal' THEN
    resolved_role := 'employer'::public.user_role;
  ELSE
    resolved_role := 'senior'::public.user_role;
  END IF;

  ewob := COALESCE((meta ->> 'employer_without_business')::boolean, false);
  IF (meta ->> 'account_kind') = 'employer_informal' THEN
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS 활성화
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_business_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senior_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhood_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_moderation_logs ENABLE ROW LEVEL SECURITY;

-- profiles: 본인 행 읽기/수정
CREATE POLICY "profiles_select_own_or_public_minimal"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- employer_business_verifications: 본인 고용주만
CREATE POLICY "employer_verifications_select_own"
  ON public.employer_business_verifications
  FOR SELECT
  TO authenticated
  USING (employer_id = auth.uid());

CREATE POLICY "employer_verifications_insert_own"
  ON public.employer_business_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "employer_verifications_update_own"
  ON public.employer_business_verifications
  FOR UPDATE
  TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- categories: 누구나 읽기 (비로그인 지도/필터용)
CREATE POLICY "categories_select_all"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- job_postings: 활성 공고는 모두 조회, 본인 공고는 전체 상태 조회·쓰기
CREATE POLICY "job_postings_select_visible"
  ON public.job_postings
  FOR SELECT
  TO anon, authenticated
  USING (
    (status = 'active' AND moderation_status = 'approved')
    OR (auth.uid() IS NOT NULL AND employer_id = auth.uid())
  );

CREATE POLICY "job_postings_insert_employer"
  ON public.job_postings
  FOR INSERT
  TO authenticated
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "job_postings_update_own"
  ON public.job_postings
  FOR UPDATE
  TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "job_postings_delete_own"
  ON public.job_postings
  FOR DELETE
  TO authenticated
  USING (employer_id = auth.uid());

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

-- senior_profiles: 본인만 읽기/쓰기 (고용주 조회는 서비스 롤 또는 별도 API 권장)
CREATE POLICY "senior_profiles_select_own"
  ON public.senior_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "senior_profiles_insert_own"
  ON public.senior_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "senior_profiles_update_own"
  ON public.senior_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "senior_profiles_delete_own"
  ON public.senior_profiles
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- neighborhood_settings: 본인만
CREATE POLICY "neighborhood_select_own"
  ON public.neighborhood_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "neighborhood_upsert_own"
  ON public.neighborhood_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "neighborhood_update_own"
  ON public.neighborhood_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- job_applications: 지원자·해당 공고 고용주
CREATE POLICY "applications_select_parties"
  ON public.job_applications
  FOR SELECT
  TO authenticated
  USING (
    senior_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.job_postings j
      WHERE j.id = job_applications.job_id
        AND j.employer_id = auth.uid()
    )
  );

CREATE POLICY "applications_insert_senior"
  ON public.job_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (senior_id = auth.uid());

CREATE POLICY "applications_update_parties"
  ON public.job_applications
  FOR UPDATE
  TO authenticated
  USING (
    senior_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.job_postings j
      WHERE j.id = job_applications.job_id
        AND j.employer_id = auth.uid()
    )
  );

-- moderation_logs: 기본은 서비스 롤에서만 삽입 권장 — 여기서는 고용주 본인 공고에 한해 조회
CREATE POLICY "moderation_logs_select_employer_own_jobs"
  ON public.job_moderation_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_postings j
      WHERE j.id = job_moderation_logs.job_id
        AND j.employer_id = auth.uid()
    )
  );

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

-- ---------------------------------------------------------------------------
-- 시드: 대분류 4종 + 예시 소분류 (PRD §8.1)
-- ---------------------------------------------------------------------------
INSERT INTO public.categories (slug, name_ko, parent_id, sort_order)
VALUES
  ('life-service', '생활 서비스', NULL, 1),
  ('pro-edu', '전문/교육', NULL, 2),
  ('public-care', '공공/돌봄', NULL, 3),
  ('digital-new', '디지털/신규', NULL, 4);

-- 소분류 (부모 slug로 연결)
WITH parents AS (
  SELECT id, slug FROM public.categories WHERE parent_id IS NULL
)
INSERT INTO public.categories (slug, name_ko, parent_id, sort_order)
SELECT v.slug, v.name_ko, p.id, v.sort_order
FROM parents p
JOIN (
  VALUES
    ('life-service', 'convenience', '편의점', 1),
    ('life-service', 'parking', '주차 관리', 2),
    ('life-service', 'apartment-security', '아파트 경비', 3),
    ('life-service', 'delivery-support', '배달 지원', 4),
    ('pro-edu', 'exam-invigilator', '시험 감독관', 1),
    ('pro-edu', 'exhibition-docent', '전시 도슨트', 2),
    ('pro-edu', 'management-advisor', '경영 자문', 3),
    ('public-care', 'school-helper', '등하교 도우미', 1),
    ('public-care', 'public-admin-assist', '공공기관 행정 보조', 2),
    ('public-care', 'senior-cafe', '시니어 카페', 3),
    ('digital-new', 'ai-labeling', 'AI 데이터 라벨링', 1),
    ('digital-new', 'community-mod', '커뮤니티 관리', 2)
) AS v (parent_slug, slug, name_ko, sort_order)
ON p.slug = v.parent_slug;

-- =============================================================================
-- 끝. 오류 시: 이미 존재하는 객체명이면 DROP 후 재실행하거나 마이그레이션으로 분리하세요.
-- =============================================================================
