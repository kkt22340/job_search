-- =============================================================================
-- 가짜 공고 시드 (안산 단원구 일대) — Supabase SQL Editor
--
-- [처음부터 순서]
--   1) 이 프로젝트에서 아직 public 테이블을 안 만들었다면, 먼저 `schema.sql` 파일
--      전체를 SQL Editor에 붙여넣고 Run (한 번만). 두 번째부터는 "already exists"
--      가 나오면 스키마는 이미 있는 것 → 이 파일만 실행하면 됨.
--   2) 아래 "① 시드 본문"부터 끝까지 한 번에 선택해서 Run (중간만 실행하지 말 것).
--   3) 맨 아래 SELECT 가 demo_rows / visible_on_map 숫자를 보여주면 성공.
--
-- • auth.users 가 비어 있으면 테스트 계정 1명을 SQL 로 만든 뒤 공고를 넣습니다.
-- • 이미 사용자가 있으면 기존 계정에 맞춰 profiles 를 동기화만 합니다.
-- 참고: https://dev.to/paullaros/seeding-users-in-supabase-with-a-sql-seed-script-41mh
-- =============================================================================

-- (선택) 상태 확인만 하고 싶을 때 별도 쿼리 창에서 실행:
--   SELECT (SELECT count(*) FROM auth.users) AS auth_users,
--          (SELECT count(*) FROM public.profiles) AS profiles,
--          (SELECT to_regclass('public.job_postings')) AS job_postings_table;

-- ========================= ① 시드 본문 (여기부터 끝까지 Run) =========================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ① 기존 로그인 사용자 → profiles 동기화 (누락분 보강)
INSERT INTO public.profiles (id, display_name)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    u.raw_user_meta_data ->> 'display_name',
    '데모 사용자'
  )
FROM auth.users AS u
ON CONFLICT (id) DO UPDATE
SET
  display_name = COALESCE(
    EXCLUDED.display_name,
    public.profiles.display_name
  );

-- ② 로그인 사용자가 한 명도 없으면: 테스트 유저 + identity + profile 생성
DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_instance_id uuid;
  v_email text := 'seed-demo-baekgu@invalid.local';
  v_pw text := crypt('BaekguDemo123!', gen_salt('bf'));
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    RETURN;
  END IF;

  SELECT id INTO v_instance_id FROM auth.instances ORDER BY id LIMIT 1;
  IF v_instance_id IS NULL THEN
    v_instance_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_instance_id,
    'authenticated',
    'authenticated',
    v_email,
    v_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"시드 데모"}'::jsonb,
    now(),
    now()
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid (),
    v_user_id,
    jsonb_build_object(
      'sub',
      v_user_id::text,
      'email',
      v_email
    ),
    'email',
    v_email,
    now(),
    now(),
    now()
  );

  -- profiles 는 schema 의 on_auth_user_created 트리거(handle_new_user)가
  -- raw_user_meta_data.display_name 으로 이미 삽입함. 여기서 또 INSERT 하면 23505.
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION
      '시드용 auth 유저 생성 실패: % (SQLSTATE %). schema.sql 적용 여부·Supabase Auth 스키마를 확인하세요.',
      SQLERRM,
      SQLSTATE;
END
$$;

-- ③ 다시 동기화 (②에서 만든 사용자 반영)
INSERT INTO public.profiles (id, display_name)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    u.raw_user_meta_data ->> 'display_name',
    '데모 사용자'
  )
FROM auth.users AS u
ON CONFLICT (id) DO UPDATE
SET
  display_name = COALESCE(
    EXCLUDED.display_name,
    public.profiles.display_name
  );

-- ④ 고용주 없으면 여기서 중단 (이론상 발생하지 않음)
DO $$
DECLARE
  eid uuid;
BEGIN
  SELECT id
  INTO eid
  FROM public.profiles
  ORDER BY created_at
  LIMIT 1;

  IF eid IS NULL THEN
    RAISE EXCEPTION
      'public.profiles 를 채우지 못했습니다. 위 DO 블록 오류 메시지를 확인하거나 '
      'Dashboard → Authentication 에서 사용자를 만든 뒤 다시 실행하세요.';
  END IF;
END
$$;

DELETE FROM public.job_postings
WHERE title LIKE '[데모]%';

INSERT INTO public.job_postings (
  employer_id,
  category_id,
  title,
  description,
  tags,
  wage_hourly,
  employment_type,
  lat,
  lng,
  address,
  status,
  moderation_status
)
SELECT
  e.id,
  NULL::uuid,
  v.title,
  v.description,
  v.tags::jsonb,
  v.wage_hourly,
  v.employment_type,
  v.lat,
  v.lng,
  v.address,
  'active'::public.job_status,
  'approved'::public.moderation_status
FROM (
  SELECT id
  FROM public.profiles
  ORDER BY created_at
  LIMIT 1
) AS e
CROSS JOIN (
  VALUES
    (
      '[데모] 편의점 야간 계산·진열',
      '시간대 협의 가능합니다.',
      '["#야간", "#서서하는"]',
      12000.00::numeric,
      '파트',
      37.3221::double precision,
      126.8150::double precision,
      '경기 안산시 단원구 고잔로 123'
    ),
    (
      '[데모] 아파트 단지 순찰 (주간)',
      '순찰 및 경비실 안내.',
      '["#주간", "#체력이필요한"]',
      11800.00::numeric,
      '정규',
      37.3180::double precision,
      126.8280::double precision,
      '경기 안산시 단원구 원곡동 일대'
    ),
    (
      '[데모] 공영주차장 요금 안내',
      '고령자 우대 지원.',
      '["#앉아서하는"]',
      10500.00::numeric,
      '파트',
      37.3155::double precision,
      126.8195::double precision,
      '경기 안산시 단원구 중앙대로 45'
    ),
    (
      '[데모] 등하교 안전 도우미',
      '학교 협력 프로그램.',
      '["#오전", "#공공"]',
      11500.00::numeric,
      '파트',
      37.3260::double precision,
      126.8080::double precision,
      '경기 안산시 단원구 선부동 인근'
    ),
    (
      '[데모] AI 학습 데이터 라벨링',
      '재택 가능 여부 별도 문의.',
      '["#재택", "#디지털"]',
      11000.00::numeric,
      '계약',
      37.3120::double precision,
      126.8350::double precision,
      '경기 안산시 단원구 산업로 200'
    ),
    (
      '[데모] 시니어 카페 홀·설거지',
      '친절 응대 위주.',
      '["#주말"]',
      11200.00::numeric,
      '파트',
      37.3205::double precision,
      126.8210::double precision,
      '경기 안산시 단원구 호수로 78'
    )
) AS v (
  title,
  description,
  tags,
  wage_hourly,
  employment_type,
  lat,
  lng,
  address
);

SELECT
  (SELECT count(*) FROM public.job_postings WHERE title LIKE '[데모]%') AS demo_rows,
  (
    SELECT count(*)
    FROM public.job_postings
    WHERE status = 'active'
      AND moderation_status = 'approved'
      AND lat IS NOT NULL
      AND lng IS NOT NULL
  ) AS visible_on_map;

-- 로그인 테스트(선택): 이메일 seed-demo-baekgu@invalid.local / 비밀번호 BaekguDemo123!
