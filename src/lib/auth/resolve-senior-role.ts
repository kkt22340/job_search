import type { User } from "@supabase/supabase-js";

type ProfileRow = { role: string | null } | null;

/**
 * 시니어(구직) 화면 노출 여부.
 * - DB `profiles.role` 우선
 * - 행이 없거나 role 이 비어 있으면 가입 메타(`role` / `account_kind`)로 보조 (프로필 트리거 지연·구 스키마 대비)
 */
export function isSeniorRoleForClient(profile: ProfileRow, user: User): boolean {
  if (profile?.role === "senior") return true;
  if (profile?.role && profile.role !== "senior") return false;

  const m = user.user_metadata as {
    role?: string;
    account_kind?: string;
  } | null;
  if (m?.role === "senior") return true;
  if (m?.account_kind === "senior") return true;
  return false;
}
