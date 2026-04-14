/**
 * 로그인 식별자 → Supabase Auth `email`(가상). 실제 메일 발송 없음.
 * 고용주·시니어 공통: 휴대폰 번호를 아이디 대신 사용 (010… → 가상 이메일).
 * 레거시: 예전 영문 아이디·실제 이메일 가입 계정 호환.
 */

import { normalizeKoreanMobileLocalDigits } from "@/lib/auth/phone-normalize";

/** Auth `email` 필드용 도메인 (프로젝트당 고정) */
export const LOGIN_ID_AUTH_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_LOGIN_ID_AUTH_DOMAIN ?? "employer.id.local";

const LEGACY_LOGIN_ID_RE = /^[a-z0-9][a-z0-9_-]{2,19}$/;

/** 레거시 영문 아이디 (기존 고용주만) */
export function normalizeLegacyLoginId(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (!LEGACY_LOGIN_ID_RE.test(s)) return null;
  return s;
}

export function legacyLoginIdToAuthEmail(normalizedLoginId: string): string {
  return `${normalizedLoginId}@${LOGIN_ID_AUTH_EMAIL_DOMAIN}`;
}

/** 휴대폰 11자리(010…) → Auth 가상 이메일 */
export function phoneLocalDigitsToAuthEmail(digits: string): string {
  return `${digits}@${LOGIN_ID_AUTH_EMAIL_DOMAIN}`;
}

/**
 * 로그인 입력 해석:
 * - `@` 포함 → 그대로 이메일(레거시 실제 이메일 가입)
 * - 그 외 → 휴대폰 번호(숫자만) 또는 레거시 영문 아이디
 */
export function resolveAuthEmailForPasswordLogin(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (t.includes("@")) {
    return t.toLowerCase();
  }
  const local = normalizeKoreanMobileLocalDigits(t);
  if (local) {
    return phoneLocalDigitsToAuthEmail(local);
  }
  const legacy = normalizeLegacyLoginId(t);
  if (legacy) {
    return legacyLoginIdToAuthEmail(legacy);
  }
  return null;
}
