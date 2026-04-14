"use server";

import { createClient } from "@/lib/supabase/server";

export type WithdrawApplicationResult =
  | { ok: true }
  | { ok: false; error: string };

const CANCELLABLE: Set<string> = new Set(["applied", "reviewing"]);

/**
 * 시니어가 본인 지원을 취소 — `job_applications` 행 삭제(목록에서 제거).
 */
export async function withdrawApplicationAction(
  applicationId: string
): Promise<WithdrawApplicationResult> {
  const id = applicationId.trim();
  if (!id) {
    return { ok: false, error: "지원 정보가 없습니다." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "로그인한 뒤 지원을 취소할 수 있어요." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, error: "프로필을 확인할 수 없어요." };
  }

  if (profile.role !== "senior") {
    return { ok: false, error: "시니어(구직) 회원만 지원을 취소할 수 있어요." };
  }

  const { data: app, error: fetchError } = await supabase
    .from("job_applications")
    .select("id, status, senior_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !app) {
    return { ok: false, error: "지원 내역을 찾을 수 없어요." };
  }

  if (app.senior_id !== user.id) {
    return { ok: false, error: "본인 지원만 취소할 수 있어요." };
  }

  if (!CANCELLABLE.has(app.status as string)) {
    return {
      ok: false,
      error: "지금 상태에서는 지원을 취소할 수 없어요.",
    };
  }

  const { error: deleteError } = await supabase
    .from("job_applications")
    .delete()
    .eq("id", id)
    .eq("senior_id", user.id);

  if (deleteError) {
    return {
      ok: false,
      error: deleteError.message ?? "지원 취소에 실패했어요.",
    };
  }

  return { ok: true };
}
