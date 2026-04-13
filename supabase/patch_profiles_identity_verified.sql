-- 본인인증 완료 시각 (인증 성공당 과금을 줄이기 위해 가입 단계와 분리)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.profiles.identity_verified_at IS 'PASS/SMS 등 본인인증 성공 시각. NULL이면 미인증.';
