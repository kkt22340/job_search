import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminSessionResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

/**
 * Supabase 세션 + profiles.role === 'admin' 확인.
 */
export async function requireAdmin(): Promise<AdminSessionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "로그인이 필요합니다." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, error: "프로필을 확인할 수 없습니다." };
  }

  if (profile.role !== "admin") {
    return { ok: false, error: "관리자만 이 기능을 사용할 수 있습니다." };
  }

  return { ok: true, userId: user.id };
}
