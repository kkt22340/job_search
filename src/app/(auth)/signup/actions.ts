"use server";

import type { AccountKind } from "@/domain/account-kind";
import { buildSignupUserMetadata } from "@/lib/auth/signup-metadata";
import { phoneLocalDigitsToAuthEmail } from "@/lib/auth/login-id";
import { normalizeKoreanMobileLocalDigits } from "@/lib/auth/phone-normalize";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type SignUpActionResult = { ok: true } | { ok: false; error: string };

export type PhoneCheckResult =
  | { ok: true; available: boolean }
  | { ok: false; error: string };

function mapCreateUserError(raw: string): string {
  const m = raw.toLowerCase();
  if (
    m.includes("database error creating new user") ||
    m.includes("unexpected_failure")
  ) {
    return (
      "가입 중 DB 오류가 났어요. Supabase SQL Editor에서 supabase/patch_profiles_login_id.sql " +
        "전체를 실행한 뒤 다시 시도해 주세요. 계속되면 Database → Logs 의 Postgres 로그를 확인해 주세요."
    );
  }
  if (
    m.includes("already registered") ||
    m.includes("already been registered") ||
    m.includes("user already registered")
  ) {
    return "이미 가입된 휴대폰 번호예요.";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "휴대폰 번호 형식을 확인해 주세요.";
  }
  if (m.includes("password")) {
    return "비밀번호 조건을 확인해 주세요. (6자 이상)";
  }
  return raw;
}

/**
 * 가입 전 동일 번호가 profiles.phone 에 있는지 확인.
 */
export async function checkPhoneAvailableForSignup(
  rawPhone: string
): Promise<PhoneCheckResult> {
  const digits = normalizeKoreanMobileLocalDigits(rawPhone);
  if (!digits) {
    return { ok: false, error: "휴대폰 번호 형식을 확인해 주세요." };
  }
  const svc = createServiceRoleClient();
  if (!svc) {
    return {
      ok: false,
      error: "서버 설정을 확인해 주세요. (SUPABASE_SERVICE_ROLE_KEY)",
    };
  }
  const { data, error } = await svc
    .from("profiles")
    .select("id")
    .eq("phone", digits)
    .maybeSingle();
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, available: data == null };
}

async function createUserWithPhonePassword(params: {
  email: string;
  password: string;
  user_metadata: Record<string, unknown>;
}): Promise<SignUpActionResult> {
  const svc = createServiceRoleClient();
  if (!svc) {
    return {
      ok: false,
      error:
        "서버에 Supabase 서비스 키가 설정되지 않았어요. .env.local에 SUPABASE_SERVICE_ROLE_KEY를 넣어 주세요.",
    };
  }
  const { error } = await svc.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: params.user_metadata,
  });
  if (error) {
    return { ok: false, error: mapCreateUserError(error.message) };
  }
  return { ok: true };
}

/**
 * 고용주 가입 — 로그인 식별자는 휴대폰 번호(가상 이메일로 Auth 저장).
 */
export async function signUpEmployer(input: {
  phone: string;
  password: string;
  displayName: string;
  accountKind: Extract<AccountKind, "employer_business" | "employer_informal">;
}): Promise<SignUpActionResult> {
  const digits = normalizeKoreanMobileLocalDigits(input.phone);
  if (!digits) {
    return {
      ok: false,
      error: "휴대폰 번호를 확인해 주세요. (예: 01012345678)",
    };
  }
  if (input.password.length < 6) {
    return { ok: false, error: "비밀번호는 6자 이상으로 입력해 주세요." };
  }
  const name = input.displayName.trim();
  if (!name) {
    return { ok: false, error: "이름 또는 닉네임을 입력해 주세요." };
  }

  const dup = await checkPhoneAvailableForSignup(input.phone);
  if (!dup.ok) {
    return { ok: false, error: dup.error };
  }
  if (!dup.available) {
    return { ok: false, error: "이미 가입된 휴대폰 번호예요." };
  }

  const email = phoneLocalDigitsToAuthEmail(digits);
  const user_metadata = buildSignupUserMetadata({
    displayName: name,
    accountKind: input.accountKind,
    birthYear: null,
    phone: digits,
  });

  return createUserWithPhonePassword({
    email,
    password: input.password,
    user_metadata,
  });
}

/**
 * 시니어(구직자) 가입 — 고용주와 동일하게 휴대폰+비밀번호(가상 이메일).
 */
export async function signUpSenior(input: {
  phone: string;
  password: string;
  displayName: string;
  birthDate: string;
  residence: string;
}): Promise<SignUpActionResult> {
  const digits = normalizeKoreanMobileLocalDigits(input.phone);
  if (!digits) {
    return {
      ok: false,
      error: "휴대폰 번호를 확인해 주세요. (예: 01012345678)",
    };
  }
  if (input.password.length < 6) {
    return { ok: false, error: "비밀번호는 6자 이상으로 입력해 주세요." };
  }
  const name = input.displayName.trim();
  if (!name) {
    return { ok: false, error: "이름을 입력해 주세요." };
  }
  if (!input.birthDate.trim()) {
    return { ok: false, error: "생년월일을 선택해 주세요." };
  }
  if (!input.residence.trim()) {
    return { ok: false, error: "거주지를 입력해 주세요." };
  }

  const dup = await checkPhoneAvailableForSignup(input.phone);
  if (!dup.ok) {
    return { ok: false, error: dup.error };
  }
  if (!dup.available) {
    return { ok: false, error: "이미 가입된 휴대폰 번호예요." };
  }

  const email = phoneLocalDigitsToAuthEmail(digits);
  const user_metadata = buildSignupUserMetadata({
    displayName: name,
    accountKind: "senior",
    birthDate: input.birthDate.trim(),
    residence: input.residence.trim(),
    phone: digits,
  });

  return createUserWithPhonePassword({
    email,
    password: input.password,
    user_metadata,
  });
}
