"use server";

import { createClient } from "@/lib/supabase/server";

export type ApplyToJobResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * 시니어가 공고 1건에 지원 (`job_applications` INSERT).
 * 활성·승인 공고만 허용.
 */
export async function applyToJobAction(jobId: string): Promise<ApplyToJobResult> {
  const id = jobId.trim();
  if (!id) {
    return { ok: false, error: "공고 정보가 없습니다." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "로그인한 뒤 지원할 수 있어요." };
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
    return {
      ok: false,
      error: "시니어(구직) 회원만 지원할 수 있어요.",
    };
  }

  const { data: job, error: jobError } = await supabase
    .from("job_postings")
    .select("id")
    .eq("id", id)
    .eq("status", "active")
    .eq("moderation_status", "approved")
    .maybeSingle();

  if (jobError || !job) {
    return {
      ok: false,
      error: "지원할 수 없는 공고예요. 모집이 종료됐거나 아직 공개되지 않았을 수 있어요.",
    };
  }

  const { error: insertError } = await supabase.from("job_applications").insert({
    job_id: id,
    senior_id: user.id,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "이미 지원한 공고예요." };
    }
    return {
      ok: false,
      error: insertError.message ?? "지원 처리에 실패했어요.",
    };
  }

  return { ok: true };
}
