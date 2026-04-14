import type { AccountKind } from "@/domain/account-kind";

/**
 * Supabase Auth `options.data` → `raw_user_meta_data` (handle_new_user 트리거와 정합)
 */
export function buildSignupUserMetadata(params: {
  displayName: string;
  accountKind: AccountKind;
  /** YYYY-MM-DD — 시니어 생년월일 */
  birthDate?: string | null;
  /** 출생연도만 (레거시·호환) */
  birthYear?: string | null;
  /** 시니어 거주지(시·군·구 등 자유 입력) */
  residence?: string | null;
  /** 국내 11자리(010…) — 로그인 식별자, profiles.phone 과 동기 */
  phone?: string | null;
  /** 레거시 영문 아이디 가입만 (마이그레이션·호환) */
  loginId?: string | null;
}): Record<string, unknown> {
  const { displayName, accountKind } = params;
  const meta: Record<string, unknown> = {
    display_name: displayName.trim(),
    account_kind: accountKind,
  };

  const lid = params.loginId?.trim();
  if (lid) {
    meta.login_id = lid.toLowerCase();
  }

  if (accountKind === "employer_business") {
    meta.role = "employer";
    meta.employer_without_business = false;
  } else if (accountKind === "employer_informal") {
    meta.role = "employer";
    meta.employer_without_business = true;
  } else {
    meta.role = "senior";
  }

  const bd = params.birthDate?.trim();
  if (bd && /^\d{4}-\d{2}-\d{2}$/.test(bd)) {
    meta.birth_date = bd;
    meta.birth_year = bd.slice(0, 4);
  } else {
    const y = params.birthYear?.trim();
    if (y && /^\d{4}$/.test(y)) {
      meta.birth_year = y;
    }
  }

  const res = params.residence?.trim();
  if (res) {
    meta.residence = res;
  }

  const ph = params.phone?.trim();
  if (ph) {
    meta.phone = ph;
  }

  return meta;
}
